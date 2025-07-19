import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkItemCard } from '@/components/WorkItemCard';
import FilterBar from '@/components/FilterBar';
import { Brain, RefreshCw, Wifi, WifiOff, Mail, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import type { WorkItem } from '@shared/schema';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { state, logout } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentFilter, setCurrentFilter] = useState<'all' | 'urgent' | 'fyi' | 'ignore'>('all');

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!state.isAuthenticated) {
      setLocation('/auth');
    }
  }, [state.isAuthenticated, setLocation]);

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'work_item_created' || message.type === 'work_item_updated' || message.type === 'work_item_deleted') {
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
    }
  });

  // Fetch work items
  const { data: workItems = [], isLoading, error } = useQuery<WorkItem[]>({
    queryKey: ['/api/work-items', currentFilter === 'all' ? undefined : `?classification=${currentFilter}`],
    enabled: state.isAuthenticated,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      });
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
      toast({ title: 'Sync completed successfully' });
    },
    onError: () => {
      toast({ title: 'Sync failed', variant: 'destructive' });
    }
  });

  // Filter work items
  const filteredItems = workItems.filter(item => {
    if (currentFilter === 'all') return true;
    return item.classification === currentFilter;
  });

  const urgentItems = workItems.filter(item => item.classification === 'urgent');
  const fyiItems = workItems.filter(item => item.classification === 'fyi');
  const ignoreItems = workItems.filter(item => item.classification === 'ignore');

  const handleRefresh = () => {
    syncMutation.mutate();
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">Failed to load dashboard</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">WorkOS Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Real-time indicator */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span>Offline</span>
                  </>
                )}
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <Badge variant={state.connectedServices.gmail ? "default" : "secondary"}>
                  <Mail className="w-3 h-3 mr-1" />
                  Gmail
                </Badge>
                <Badge variant={state.connectedServices.slack ? "default" : "secondary"}>
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Slack
                </Badge>
              </div>
              
              {/* Refresh Button */}
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRefresh}
                disabled={syncMutation.isPending}
                className="hover-lift"
              >
                <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* User Menu */}
              <Button 
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {state.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filter Bar */}
        <FilterBar
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          counts={{
            all: workItems.length,
            urgent: urgentItems.length,
            fyi: fyiItems.length,
            ignore: ignoreItems.length
          }}
          lastSync="2 minutes ago"
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading your work items...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentFilter === 'all' ? 'No work items yet' : `No ${currentFilter} items`}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {currentFilter === 'all' 
                ? 'Connect your accounts and sync to see your communications processed by AI.'
                : `There are currently no items classified as ${currentFilter}.`}
            </p>
            {currentFilter === 'all' && (
              <Button onClick={handleRefresh} disabled={syncMutation.isPending} className="gradient-primary text-white hover-lift">
                {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}
          </motion.div>
        )}

        {/* Work Items Display */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="space-y-6">
            {currentFilter === 'all' ? (
              // 3-Column Layout for All Items
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Urgent Column */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <h2 className="text-lg font-semibold text-red-700">🔥 Urgent</h2>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {urgentItems.length}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {urgentItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <WorkItemCard item={item} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* FYI Column */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <h2 className="text-lg font-semibold text-blue-700">💡 FYI</h2>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {fyiItems.length}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {fyiItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <WorkItemCard item={item} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Ignore Column */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <h2 className="text-lg font-semibold text-gray-600">🗑 Ignore</h2>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600">
                      {ignoreItems.length}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {ignoreItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <WorkItemCard item={item} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Single Column Layout for Filtered Items
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <WorkItemCard item={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
