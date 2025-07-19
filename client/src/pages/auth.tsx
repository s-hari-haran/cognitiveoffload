import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Mail, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { state, login, connectService } = useAppContext();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [isConnectingSlack, setIsConnectingSlack] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await login(email, name || 'User');
    } catch (error) {
      console.error('Login failed:', error);
    }
    setIsLoading(false);
  };

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    try {
      await connectService('gmail');
    } catch (error) {
      setIsConnectingGmail(false);
    }
  };

  const handleConnectSlack = async () => {
    setIsConnectingSlack(true);
    try {
      await connectService('slack');
    } catch (error) {
      setIsConnectingSlack(false);
    }
  };

  const handleContinueToDashboard = () => {
    setLocation('/dashboard');
  };

  const canContinue = state.connectedServices.gmail && state.connectedServices.slack;

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
                Welcome to WorkOS
              </CardTitle>
              <p className="text-gray-600">Enter your email to get started</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-white font-semibold hover-lift"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Continue
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
