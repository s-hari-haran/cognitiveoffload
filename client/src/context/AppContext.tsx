import { toast } from '@/hooks/use-toast';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

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
  console.log('🔄 AppReducer - Action:', action.type, 'Payload:', action);

  switch (action.type) {
    case 'SET_AUTH':
      console.log('✅ SET_AUTH - Setting user:', action.payload.user.email);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true
      };
    case 'LOGOUT':
      console.log('🚪 LOGOUT - Clearing auth state');
      return {
        ...initialState
      };
    case 'SET_SERVICE_CONNECTION':
      console.log('🔗 SET_SERVICE_CONNECTION - Service:', action.payload.service, 'Connected:', action.payload.connected);
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
  login: (email: string, name?: string, password?: string, isRegister?: boolean) => Promise<void>;
  logout: () => void;
  connectService: (service: 'gmail' | 'slack') => Promise<void>;
} | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load auth state from localStorage on mount and handle OAuth redirects
  useEffect(() => {
    console.log('🚀 AppContextProvider - useEffect running');
    console.log('📍 Current URL:', window.location.href);

    // Check for token/user in URL (after OAuth) - handle both search params and hash
    let urlParams: URLSearchParams;

    // First check if we have search parameters (direct OAuth redirect)
    if (window.location.search) {
      urlParams = new URLSearchParams(window.location.search);
    } else {
      // Check if we have hash with query parameters (hash-based routing)
      const hash = window.location.hash;
      const hashQuery = hash.split('?')[1];
      if (hashQuery) {
        urlParams = new URLSearchParams(hashQuery);
      } else {
        urlParams = new URLSearchParams();
      }
    }

    const token = urlParams.get('token');
    const userStr = urlParams.get('user');
    const gmailConnected = urlParams.get('gmail');
    const slackConnected = urlParams.get('slack');

    console.log('🔍 URL Parameters:', {
      token: token ? 'Present' : 'Not found',
      userStr: userStr ? 'Present' : 'Not found',
      gmailConnected,
      slackConnected,
      search: window.location.search,
      hash: window.location.hash
    });

    if (token && userStr) {
      console.log('🎯 Found token and user in URL - Processing OAuth redirect');
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        console.log('👤 Parsed user:', user);

        localStorage.setItem('workos_token', token);
        localStorage.setItem('workos_user', JSON.stringify(user));
        dispatch({ type: 'SET_AUTH', payload: { user, token } });

        // Handle service connections
        if (gmailConnected === 'connected') {
          console.log('📧 Gmail connected - updating service state');
          dispatch({ type: 'SET_SERVICE_CONNECTION', payload: { service: 'gmail', connected: true } });
          localStorage.setItem('gmail_connected', 'true');
          toast({ title: 'Gmail connected successfully!' });
        }
        if (slackConnected === 'connected') {
          console.log('💬 Slack connected - updating service state');
          dispatch({ type: 'SET_SERVICE_CONNECTION', payload: { service: 'slack', connected: true } });
          localStorage.setItem('slack_connected', 'true');
          toast({ title: 'Slack connected successfully!' });
        }

        // Clean up the URL and navigate to dashboard
        window.history.replaceState({}, document.title, '#/dashboard');
        console.log('🧹 URL cleaned up and navigating to dashboard');
      } catch (error) {
        console.error('❌ Error parsing user from URL:', error);
      }
    } else {
      console.log('🔍 No OAuth redirect detected - checking localStorage');

      // Load existing auth state from localStorage
      const storedToken = localStorage.getItem('workos_token');
      const storedUserStr = localStorage.getItem('workos_user');

      console.log('💾 localStorage check:', {
        storedToken: storedToken ? 'Present' : 'Not found',
        storedUserStr: storedUserStr ? 'Present' : 'Not found'
      });

      if (storedToken && storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          console.log('👤 Loading stored user:', storedUser);
          dispatch({ type: 'SET_AUTH', payload: { user: storedUser, token: storedToken } });

          // Also check if services were previously connected
          const gmailConnected = localStorage.getItem('gmail_connected') === 'true';
          const slackConnected = localStorage.getItem('slack_connected') === 'true';

          if (gmailConnected) {
            dispatch({ type: 'SET_SERVICE_CONNECTION', payload: { service: 'gmail', connected: true } });
          }
          if (slackConnected) {
            dispatch({ type: 'SET_SERVICE_CONNECTION', payload: { service: 'slack', connected: true } });
          }

          console.log('✅ Auth state restored successfully');
        } catch (error) {
          console.error('❌ Error parsing stored user:', error);
          localStorage.removeItem('workos_token');
          localStorage.removeItem('workos_user');
        }
      } else {
        console.log('❌ No stored auth state found');
      }
    }
  }, []);

  // Debug log state changes
  useEffect(() => {
    console.log('📊 AppState updated:', {
      isAuthenticated: state.isAuthenticated,
      user: state.user?.email,
      connectedServices: state.connectedServices
    });
  }, [state]);

  const login = async (email: string, name: string = 'User', password?: string, isRegister: boolean = false) => {
    console.log('🔐 Login attempt for:', email, isRegister ? '(register)' : '(login)');
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { email, name, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await response.json();
      console.log('✅ Authentication successful:', data);
      localStorage.setItem('workos_token', data.token);
      localStorage.setItem('workos_user', JSON.stringify(data.user));
      dispatch({ type: 'SET_AUTH', payload: { user: data.user, token: data.token } });
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      toast({
        title: 'Authentication failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logout triggered - clearing all data');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear all sessionStorage
      sessionStorage.clear();
      
      // Clear any service worker caches if they exist
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }
      
      // Clear any indexedDB if it exists
      if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
    }
    
    // Reset app state to initial values
    dispatch({ type: 'LOGOUT' });
    
    // Force a complete page reload to ensure everything is fresh
    window.location.href = '/';
    
    console.log('✅ Logout completed - all data cleared');
  };

  const connectService = async (service: 'gmail' | 'slack') => {
    console.log('🔗 Connecting service:', service);
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
      console.log('🔗 Redirecting to:', service, 'auth URL');
      window.location.href = data.authUrl;
    } catch (error) {
      console.error(`❌ Failed to connect ${service}:`, error);
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
