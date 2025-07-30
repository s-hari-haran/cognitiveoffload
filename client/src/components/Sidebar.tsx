import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Mail, 
  MessageSquare, 
  LogOut, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectGmail: () => void;
  onConnectSlack: () => void;
  onViewCleanedMails: () => void;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  onConnectGmail, 
  onConnectSlack, 
  onViewCleanedMails 
}: SidebarProps) {
  const { state, logout } = useAppContext();
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-80 glass-effect border-r border-white/20 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 glass-effect border-b border-white/20 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="glass-effect rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-400">
                      {state.user?.name?.charAt(0) || state.user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{state.user?.name || 'User'}</p>
                    <p className="text-gray-400 text-sm">{state.user?.email || 'user@example.com'}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-2">
                {/* Cleaned Mails */}
                <Button
                  onClick={onViewCleanedMails}
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <CheckCircle className="w-5 h-5 mr-3" />
                  Cleaned Mails
                </Button>

                {/* Connect Apps Dropdown */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setIsConnectOpen(!isConnectOpen)}
                    variant="ghost"
                    className="w-full justify-between text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    <div className="flex items-center">
                      <Settings className="w-5 h-5 mr-3" />
                      Connect Apps
                    </div>
                    {isConnectOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>

                  <AnimatePresence>
                    {isConnectOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 space-y-2 overflow-hidden"
                      >
                        <Button
                          onClick={onConnectGmail}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10"
                          disabled={state.connectedServices.gmail}
                        >
                          <Mail className="w-4 h-4 mr-3" />
                          {state.connectedServices.gmail ? 'Gmail Connected' : 'Connect Gmail'}
                          {state.connectedServices.gmail && (
                            <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
                          )}
                        </Button>

                        <Button
                          onClick={onConnectSlack}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10"
                          disabled={state.connectedServices.slack}
                        >
                          <MessageSquare className="w-4 h-4 mr-3" />
                          {state.connectedServices.slack ? 'Slack Connected' : 'Connect Slack'}
                          {state.connectedServices.slack && (
                            <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Logout */}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              </div>

              {/* Service Status */}
              <div className="glass-effect rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Service Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Gmail</span>
                    <div className={`w-2 h-2 rounded-full ${state.connectedServices.gmail ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Slack</span>
                    <div className={`w-2 h-2 rounded-full ${state.connectedServices.slack ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 