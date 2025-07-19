import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  connectedServices: {
    gmail: boolean;
    slack: boolean;
  };
}

type AppAction = 
  | { type: 'SET_AUTH'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_SERVICE_CONNECTION'; payload: { service: 'gmail' | 'slack'; connected: boolean } };

const initialState: AppState = {
  user: null,
  token: null,
  isAuthenticated: false,
  connectedServices: {
    gmail: false,
    slack: false
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true
      };
    case 'LOGOUT':
      return {
        ...initialState
      };
    case 'SET_SERVICE_CONNECTION':
      return {
        ...state,
        connectedServices: {
          ...state.connectedServices,
          [action.payload.service]: action.payload.connected
        }
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => void;
  connectService: (service: 'gmail' | 'slack') => Promise<void>;
} | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('workos_token');
    const userStr = localStorage.getItem('workos_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ type: 'SET_AUTH', payload: { user, token } });
        
        // Check URL for service connection callbacks
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('gmail') === 'connected') {
          dispatch({ type: 'SET_SERVICE_CONNECTION', payload: { service: 'gmail', connected: true } });
          toast({ title: 'Gmail connected successfully!' });
        }
        if (urlParams.get('slack') === 'connected') {
          dispatch({ type: 'SET_SERVICE_CONNECTION', payload: { service: 'slack', connected: true } });
          toast({ title: 'Slack connected successfully!' });
        }
      } catch (error) {
        console.error('Failed to parse stored auth data');
        localStorage.removeItem('workos_token');
        localStorage.removeItem('workos_user');
      }
    }
  }, []);

  const login = async (email: string, name: string = 'User') => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        // Try to register if login fails
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, name }),
        });

        if (!registerResponse.ok) {
          throw new Error('Failed to authenticate');
        }

        const data = await registerResponse.json();
        localStorage.setItem('workos_token', data.token);
        localStorage.setItem('workos_user', JSON.stringify(data.user));
        dispatch({ type: 'SET_AUTH', payload: { user: data.user, token: data.token } });
        return;
      }

      const data = await response.json();
      localStorage.setItem('workos_token', data.token);
      localStorage.setItem('workos_user', JSON.stringify(data.user));
      dispatch({ type: 'SET_AUTH', payload: { user: data.user, token: data.token } });
    } catch (error) {
      console.error('Authentication failed:', error);
      toast({ 
        title: 'Authentication failed', 
        description: 'Please try again',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('workos_token');
    localStorage.removeItem('workos_user');
    dispatch({ type: 'LOGOUT' });
  };

  const connectService = async (service: 'gmail' | 'slack') => {
    try {
      const response = await fetch(`/api/auth/${service}`, {
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error(`Failed to connect ${service}:`, error);
      toast({
        title: `Failed to connect ${service}`,
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout, connectService }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}
