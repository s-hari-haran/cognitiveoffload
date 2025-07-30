import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Mail, MessageSquare, CheckCircle, Loader2, Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { state, login, connectService, dispatch } = useAppContext();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [isConnectingSlack, setIsConnectingSlack] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Debug logging
  useEffect(() => {
    console.log('🔐 AuthPage mounted');
    console.log('🔐 Auth state:', {
      isAuthenticated: state.isAuthenticated,
      user: state.user?.email,
      connectedServices: state.connectedServices
    });
  }, [state]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      console.log('✅ AuthPage: User already authenticated, redirecting to dashboard');
      setLocation('/dashboard');
    }
  }, [state.isAuthenticated, setLocation]);

  const handleGoogleAuth = async () => {
    console.log('🔐 AuthPage: Google OAuth attempt');
    setIsLoading(true);
    try {
      // Use real Google OAuth
      const response = await fetch('/api/auth/gmail/init', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get Google OAuth URL: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔐 Redirecting to Google OAuth:', data.authUrl);
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('❌ AuthPage: Google OAuth failed:', error);
      toast({ 
        title: 'Google authentication failed', 
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    console.log('🔐 AuthPage: Email auth attempt for:', email);
    setIsLoading(true);
    try {
      await login(email, name || 'User', password, authMode === 'register');
      console.log('✅ AuthPage: Email auth successful');
      
      // Automatically redirect to dashboard after successful authentication
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('❌ AuthPage: Email auth failed:', error);
    }
    setIsLoading(false);
  };

  const handleConnectGmail = async () => {
    console.log('📧 AuthPage: Connecting Gmail');
    setIsConnectingGmail(true);
    try {
      // For now, simulate Gmail connection
      // In production, this would redirect to Gmail OAuth
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Update the connected services state
      dispatch({ 
        type: 'SET_SERVICE_CONNECTION', 
        payload: { service: 'gmail', connected: true } 
      });
      
      toast({ 
        title: 'Gmail connected successfully!', 
        description: 'You can now view Gmail messages in your dashboard'
      });
    } catch (error) {
      console.error('❌ AuthPage: Gmail connection failed:', error);
      toast({ 
        title: 'Gmail connection failed', 
        description: 'Please try again',
        variant: 'destructive'
      });
    }
      setIsConnectingGmail(false);
  };

  const handleConnectSlack = async () => {
    console.log('💬 AuthPage: Connecting Slack');
    setIsConnectingSlack(true);
    try {
      // For now, simulate Slack connection
      // In production, this would redirect to Slack OAuth
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Update the connected services state
      dispatch({ 
        type: 'SET_SERVICE_CONNECTION', 
        payload: { service: 'slack', connected: true } 
      });
      
      toast({ 
        title: 'Slack connected successfully!', 
        description: 'You can now view Slack messages in your dashboard'
      });
    } catch (error) {
      console.error('❌ AuthPage: Slack connection failed:', error);
      toast({ 
        title: 'Slack connection failed', 
        description: 'Please try again',
        variant: 'destructive'
      });
    }
      setIsConnectingSlack(false);
  };

  const handleContinueToDashboard = () => {
    console.log('🚀 AuthPage: Continuing to dashboard');
    setLocation('/dashboard');
  };

  const canContinue = state.connectedServices.gmail && state.connectedServices.slack;

  // If already authenticated, show loading while redirecting
  if (state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="w-full max-w-md glassmorphism">
            <CardHeader className="text-center">
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Cognitive Offload
              </CardTitle>
              <p className="text-gray-600">Sign in to get started</p>
            </CardHeader>
            <CardContent>
              {/* Google OAuth Button */}
              <Button 
                onClick={handleGoogleAuth}
                className="w-full mb-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium"
                disabled={isLoading}
              >
                <Chrome className="w-5 h-5 mr-2 text-red-500" />
                Continue with Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              {/* Auth Mode Toggle */}
              <div className="flex mb-4">
                <Button
                  variant={authMode === 'login' ? 'default' : 'outline'}
                  onClick={() => setAuthMode('login')}
                  className="flex-1"
                >
                  Sign In
                </Button>
                <Button
                  variant={authMode === 'register' ? 'default' : 'outline'}
                  onClick={() => setAuthMode('register')}
                  className="flex-1"
                >
                  Sign Up
                </Button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={authMode === 'register'}
                      className="text-blue-600 placeholder-blue-300"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-blue-600 placeholder-blue-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-blue-600 placeholder-blue-300"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-white font-semibold hover-lift"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="w-full max-w-md glassmorphism">
          <CardHeader className="text-center">
            <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-gray-900">
              Connect Your Accounts
            </CardTitle>
            <p className="text-gray-600">Connect Gmail and Slack to get started</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gmail Connection */}
            <Button
              onClick={handleConnectGmail}
              disabled={isConnectingGmail || state.connectedServices.gmail}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover-lift bg-white text-gray-700 hover:bg-gray-50"
            >
              <Mail className="text-red-500 mr-3 h-5 w-5" />
              <span className="font-medium">Connect Gmail</span>
              {isConnectingGmail && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              {state.connectedServices.gmail && <CheckCircle className="ml-auto h-5 w-5 text-green-500" />}
            </Button>

            {/* Slack Connection */}
            <Button
              onClick={handleConnectSlack}
              disabled={isConnectingSlack || state.connectedServices.slack}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover-lift bg-white text-gray-700 hover:bg-gray-50"
            >
              <MessageSquare className="text-purple-500 mr-3 h-5 w-5" />
              <span className="font-medium">Connect Slack</span>
              {isConnectingSlack && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              {state.connectedServices.slack && <CheckCircle className="ml-auto h-5 w-5 text-green-500" />}
            </Button>

            {/* Continue Button */}
            <Button
              onClick={handleContinueToDashboard}
              disabled={!canContinue}
              className="w-full px-4 py-3 gradient-primary text-white font-semibold rounded-xl hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Dashboard
            </Button>

            {!canContinue && (
              <p className="text-sm text-gray-500 text-center">
                Please connect both Gmail and Slack to continue
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
