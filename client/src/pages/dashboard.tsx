import { ContextPanel } from "@/components/ContextPanel";
import { DateFilter } from "@/components/DateFilter";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkItemCard } from "@/components/WorkItemCard";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import type { WorkItem } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, LogOut, Mail, Menu, MessageSquare, RefreshCw, RotateCcw, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function Dashboard() {
  console.log('🏠 Dashboard component rendering');

  const { state, logout, dispatch } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ classification: "", sourceType: "" });
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'cleaned'>('active');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateLoading, setIsDateLoading] = useState(false);

  // 🔧 UTILITY FUNCTIONS FOR SAFE DATE HANDLING
  const isValidDate = (date: any): date is Date => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const convertToUTCStartOfDay = (date: Date): Date => {
    if (!isValidDate(date)) {
      console.warn('⚠️ Invalid date provided to convertToUTCStartOfDay:', date);
      return new Date();
    }

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  };

  const buildSafeDateParams = (date: Date | undefined): URLSearchParams => {
    const params = new URLSearchParams();

    if (date && isValidDate(date)) {
      const startOfDay = convertToUTCStartOfDay(date);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      console.log('📅 Building date parameters:', {
        originalDate: date.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      });

      params.append('start', startOfDay.toISOString());
      params.append('end', endOfDay.toISOString());
    } else {
      console.log('📅 No valid date provided, skipping date parameters');
    }

    return params;
  };

  // Debounced date change handler
  const debouncedDateChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (date: Date | undefined) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          console.log('📅 Debounced date change executing:', {
            date: date?.toISOString(),
            dateString: date?.toDateString(),
            isUndefined: date === undefined,
            isValid: date ? isValidDate(date) : true
          });
          setSelectedDate(date);
          setIsDateLoading(false);
        }, 300); // 300ms debounce
      };
    })(),
    []
  );

  const handleDateChange = (date: Date | undefined) => {
    console.log('📅 Date change requested:', {
      date: date?.toISOString(),
      dateString: date?.toDateString(),
      isUndefined: date === undefined,
      isValid: date ? isValidDate(date) : true
    });
    setIsDateLoading(true);
    debouncedDateChange(date);
  };

  // Authentication check - MUST be first, before any other hooks
  if (!state.isAuthenticated) {
    console.log('❌ Dashboard: User not authenticated, redirecting to auth');
    // Use hash routing for redirect
    window.location.hash = '#/auth';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Redirecting to login...</h3>
          <p className="text-gray-400">Please wait while we redirect you to the authentication page.</p>
        </div>
      </div>
    );
  }

  // WebSocket connection for real-time updates
  const { isConnected: wsConnected } = useWebSocket((message) => {
    console.log('📨 WebSocket message received in dashboard:', message.type);

    switch (message.type) {
      case 'work_item_created':
        // Invalidate all work item queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: ['/api/work-items'],
          exact: false
        });
        toast({
          title: 'New item added',
          description: 'A new work item has been processed',
          duration: 2000
        });
        break;

      case 'work_item_updated':
        // Invalidate all work item queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: ['/api/work-items'],
          exact: false
        });
        toast({
          title: 'Item updated',
          description: 'A work item has been updated',
          duration: 2000
        });
        break;

      case 'sync_progress':
        console.log('📊 Sync progress:', message.data);
        if (message.data?.status === 'created') {
          // Invalidate all work item queries to ensure fresh data
          queryClient.invalidateQueries({
            queryKey: ['/api/work-items'],
            exact: false
          });
          toast({
            title: 'Email processed',
            description: message.data.message || 'Email analyzed and added to dashboard',
            duration: 2000
          });
        } else if (message.data?.status === 'skipped') {
          console.log('⏭️ Email skipped:', message.data.message);
        } else if (message.data?.status === 'error') {
          console.warn('❌ Email processing error:', message.data.message);
          toast({
            title: 'Processing error',
            description: message.data.message || 'Failed to process email',
            variant: 'destructive',
            duration: 3000
          });
        } else if (message.data?.status === 'processing') {
          console.log('🔄 Email processing:', message.data.message);
        }
        break;

      case 'sync_complete':
        console.log('✅ Sync completed');
        // Invalidate all work item queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: ['/api/work-items'],
          exact: false
        });
        toast({
          title: 'Sync completed',
          description: 'All emails have been processed',
          duration: 2000
        });
        break;
    }
  });

  // Optimistic updates for better UX
  const addOptimisticWorkItem = (newItem: WorkItem) => {
    queryClient.setQueryData(['/api/work-items'], (oldData: WorkItem[] | undefined) => {
      if (!oldData) return [newItem];
      return [newItem, ...oldData];
    });
  };

  const updateOptimisticWorkItem = (updatedItem: WorkItem) => {
    queryClient.setQueryData(['/api/work-items'], (oldData: WorkItem[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(item => item.id === updatedItem.id ? updatedItem : item);
    });
  };

  // Debug logging
  useEffect(() => {
    console.log('🏠 Dashboard mounted');
    console.log('🔐 Auth state:', {
      isAuthenticated: state.isAuthenticated,
      user: state.user?.email,
      connectedServices: state.connectedServices
    });
    console.log('🔌 WebSocket connected:', wsConnected);
  }, [state, wsConnected]);

  // 🔧 ENHANCED API REQUEST WITH SAFE DATE HANDLING
  const { data: workItemsResponse, isLoading, error } = useQuery<WorkItem[]>({
    queryKey: ['/api/work-items', selectedDate ? selectedDate.toDateString() : 'all'],
    queryFn: async () => {
      try {
        console.log('📊 Starting API request with date:', selectedDate?.toISOString());

        // 🔧 SAFE DATE PARAMETER CONSTRUCTION
        const params = buildSafeDateParams(selectedDate);
        const url = `/api/work-items${params.toString() ? `?${params.toString()}` : ''}`;

        console.log('📊 Fetching work items with URL:', url);
        console.log('📊 Date parameters:', {
          selectedDate: selectedDate?.toISOString(),
          hasStartParam: params.has('start'),
          hasEndParam: params.has('end'),
          startValue: params.get('start'),
          endValue: params.get('end')
        });

        const data = await apiRequest(url, { on401: 'returnNull' });

        console.log('📊 API Response received:', {
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'not array',
          sampleData: Array.isArray(data) && data.length > 0 ? data[0] : null
        });

        // 🔧 SAFE ARRAY VALIDATION
        if (!Array.isArray(data)) {
          console.warn('⚠️ API returned non-array data:', data);
          return [];
        }

        // 🔧 VALIDATE WORK ITEMS
        const validItems = data.filter(item => {
          if (!item || typeof item !== 'object') {
            console.warn('⚠️ Invalid work item in response:', item);
            return false;
          }
          return true;
        });

        console.log('📊 Validated work items:', {
          total: data.length,
          valid: validItems.length,
          invalid: data.length - validItems.length
        });

        return validItems;
      } catch (error) {
        console.error('❌ API request failed:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        return [];
      }
    },
    enabled: state.isAuthenticated, // Only fetch when authenticated
    refetchInterval: false, // No polling - rely only on WebSocket events
    refetchIntervalInBackground: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: (failureCount, error) => {
      console.log('🔄 API request retry attempt:', failureCount);
      return failureCount < 3; // Retry up to 3 times
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Ensure workItems is always an array
  const workItems = Array.isArray(workItemsResponse) ? workItemsResponse : [];

  // Improved date filtering with proper timezone handling
  const filteredItems = workItems.filter(item => {
    // Skip invalid items
    if (!item || !item.id) {
      console.warn('⚠️ Skipping invalid work item:', item);
      return false;
    }

    // Apply view mode filter
    if (viewMode === 'cleaned' && !item.isCompleted) {
      return false;
    }

    if (viewMode === 'active' && item.isCompleted) {
      return false;
    }

    // Apply classification filter
    if (filters.classification && item.classification !== filters.classification) {
      return false;
    }

    // Apply source type filter
    if (filters.sourceType && item.sourceType !== filters.sourceType) {
      return false;
    }

    // Server-side date filtering is now handled by the API
    // No need for client-side date filtering anymore

    return true;
  });

  // Debug log for filtering
  useEffect(() => {
    console.log('🔍 Dashboard filtering debug:', {
      totalItems: workItems.length,
      filteredItems: filteredItems.length,
      selectedDate: selectedDate?.toISOString(),
      selectedDateString: selectedDate?.toDateString(),
      viewMode,
      filters,
      hasSelectedDate: !!selectedDate,
      sampleItems: workItems.slice(0, 3).map(item => ({
        id: item.id,
        sourceDate: item.sourceDate,
        createdAt: item.createdAt,
        classification: item.classification,
        isCompleted: item.isCompleted,
        summary: item.summary?.substring(0, 50) + '...'
      }))
    });

    // If we have items but none are showing, provide helpful debug info
    if (workItems.length > 0 && filteredItems.length === 0) {
      console.warn('⚠️ No items match current filters:');
      console.log('  - Try clicking "Show All" to see all items');
      console.log('  - Check if items have valid sourceDate values');
      console.log('  - Verify current filters are not too restrictive');

      if (selectedDate) {
        console.log(`  - Selected date: ${selectedDate.toDateString()}`);
        console.log('  - Try selecting a different date or clearing the filter');
      }
    }
  }, [workItems, filteredItems, selectedDate, viewMode, filters]);

  // Handle OAuth callback parameters
  useEffect(() => {
    // Check both search parameters and hash parameters for OAuth callbacks
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

    const gmailConnected = urlParams.get('gmail');
    const slackConnected = urlParams.get('slack');
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    console.log('🔍 Dashboard: Checking URL parameters:', {
      gmailConnected,
      slackConnected,
      hasToken: !!token,
      hasUser: !!userParam,
      currentUrl: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    });

    if (gmailConnected === 'connected' && token && userParam) {
      console.log('📧 Dashboard: Gmail OAuth callback detected');
      try {
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store the token and user data
        localStorage.setItem('workos_token', token);
        localStorage.setItem('workos_user', JSON.stringify(user));

        // Update authentication state
        dispatch({ type: 'SET_AUTH', payload: { user, token } });

        // Update the connected services state
        dispatch({
          type: 'SET_SERVICE_CONNECTION',
          payload: { service: 'gmail', connected: true }
        });

        toast({
          title: 'Gmail connected successfully!',
          description: 'Your Gmail messages are being processed'
        });

        // Clean up URL and force refresh work items
        window.history.replaceState({}, document.title, '#/dashboard');

        // Force refresh work items immediately
        setTimeout(() => {
          console.log('🔄 Dashboard: Forcing work items refresh after Gmail OAuth');
          queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
        }, 1000);

      } catch (error) {
        console.error('❌ Dashboard: Failed to parse Gmail callback data:', error);
        toast({
          title: 'Gmail connection failed',
          description: 'There was an error processing the Gmail connection',
          variant: 'destructive'
        });
      }
    }

    if (slackConnected === 'connected' && token && userParam) {
      console.log('💬 Dashboard: Slack OAuth callback detected');
      try {
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store the token and user data
        localStorage.setItem('workos_token', token);
        localStorage.setItem('workos_user', JSON.stringify(user));

        // Update authentication state
        dispatch({ type: 'SET_AUTH', payload: { user, token } });

        // Update the connected services state
        dispatch({
          type: 'SET_SERVICE_CONNECTION',
          payload: { service: 'slack', connected: true }
        });

        toast({
          title: 'Slack connected successfully!',
          description: 'Your Slack messages are being processed'
        });

        // Clean up URL and force refresh work items
        window.history.replaceState({}, document.title, '#/dashboard');

        // Force refresh work items immediately
        setTimeout(() => {
          console.log('🔄 Dashboard: Forcing work items refresh after Slack OAuth');
          queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
        }, 1000);

      } catch (error) {
        console.error('❌ Dashboard: Failed to parse Slack callback data:', error);
        toast({
          title: 'Slack connection failed',
          description: 'There was an error processing the Slack connection',
          variant: 'destructive'
        });
      }
    }
  }, [dispatch, toast, queryClient]);

  // Mark work item as complete
  const markCompleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/work-items/${id}`, {
      method: 'PATCH',
      body: { isCompleted: true }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
      toast({ title: 'Item marked as completed!' });
    },
    onError: (error) => {
      console.error('❌ Failed to mark item as complete:', error);
      toast({
        title: 'Failed to mark item as complete',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  });

  // Connect Gmail
  const connectGmailMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/gmail/init'),
    onSuccess: (data: { authUrl: string }) => {
      window.open(data.authUrl, '_blank');
    },
    onError: (error) => {
      console.error('❌ Failed to initiate Gmail connection:', error);
      toast({
        title: 'Gmail connection failed',
        description: 'Unable to start Gmail authentication',
        variant: 'destructive'
      });
    }
  });

  // Connect Slack
  const connectSlackMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/slack/init'),
    onSuccess: (data: { authUrl: string }) => {
      window.open(data.authUrl, '_blank');
    },
    onError: (error) => {
      console.error('❌ Failed to initiate Slack connection:', error);
      toast({
        title: 'Slack connection failed',
        description: 'Unable to start Slack authentication',
        variant: 'destructive'
      });
    }
  });

  // Group by classification with safety checks
  const urgentItems = filteredItems.filter(item => item && item.classification === 'urgent');
  const fyiItems = filteredItems.filter(item => item && item.classification === 'fyi');
  const ignoreItems = filteredItems.filter(item => item && item.classification === 'ignore');

  const handleMarkComplete = (id: number) => {
    markCompleteMutation.mutate(id);
  };

  const handleViewSource = (url: string) => {
    window.open(url, '_blank');
  };

  const handleViewContext = (item: WorkItem) => {
    setSelectedItem(item);
    setContextPanelOpen(true);
  };

  const handleViewCleanedMails = () => {
    setViewMode('cleaned');
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    console.log('🚪 Dashboard: Logout initiated');

    // Clear React Query cache
    queryClient.clear();

    // Clear any pending mutations
    queryClient.cancelQueries();

    // Clear any optimistic updates
    queryClient.resetQueries();

    // Call the main logout function
    logout();
  };

  if (isLoading) {
    console.log('⏳ Dashboard: Loading work items');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading your dashboard</h3>
          <p className="text-gray-400">Preparing your cognitive offload workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Dashboard error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">Failed to load work items</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/work-items'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  console.log('✅ Dashboard: Rendering main content');

  // Debug info (remove this later)
  const debugInfo = {
    isAuthenticated: state.isAuthenticated,
    user: state.user?.email,
    connectedServices: state.connectedServices,
    workItemsCount: workItems.length,
    filteredItemsCount: filteredItems.length,
    selectedDate: selectedDate?.toISOString()
  };



  // Reusable header component to avoid duplication
  const renderHeader = () => (
    <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-6">
            {/* Menu Button */}
            <Button
              onClick={() => setSidebarOpen(true)}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CO</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-white">Cognitive Offload</h1>
                <p className="text-sm text-gray-400">AI-powered unified dashboard</p>
              </div>
            </div>

            {/* Desktop Date Filter */}
            <div className="hidden md:block">
              <DateFilter
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                isLoading={isDateLoading}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Real-time Status */}
            <div className="hidden md:flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className={`${wsConnected ? 'text-green-400' : 'text-gray-400'}`}>
                {wsConnected ? 'Live' : 'Offline'}
              </span>
              {isDateLoading && (
                <>
                  <div className="w-px h-4 bg-white/20"></div>
                  <div className="flex items-center space-x-1 text-blue-400">
                    <div className="w-2 h-2 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                </>
              )}
            </div>

            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="w-4 h-4" />
                <span>{state.user?.name || state.user?.email?.split('@')[0] || 'User'}</span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg p-1">
              <Button
                onClick={() => setViewMode('active')}
                variant={viewMode === 'active' ? 'default' : 'ghost'}
                size="sm"
                className={`text-xs h-8 px-3 ${viewMode === 'active'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
                  }`}
              >
                Active
              </Button>
              <Button
                onClick={() => setViewMode('cleaned')}
                variant={viewMode === 'cleaned' ? 'default' : 'ghost'}
                size="sm"
                className={`text-xs h-8 px-3 ${viewMode === 'cleaned'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
                  }`}
              >
                Completed
              </Button>
            </div>

            {/* Essential Action Buttons Only */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
                  toast({ title: 'Refreshing...', description: 'Checking for new items' });
                }}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                disabled={isLoading}
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>



              <Button
                onClick={async () => {
                  try {
                    console.log('🔄 Manual sync triggered');

                    // Show loading state
                    toast({
                      title: 'Syncing...',
                      description: selectedDate
                        ? `Processing messages for ${selectedDate.toLocaleDateString()}`
                        : 'Processing your messages',
                      duration: 3000
                    });

                    // Sync Gmail if connected
                    if (state.connectedServices.gmail) {
                      console.log('📧 Syncing Gmail...', selectedDate ? `for date: ${selectedDate.toISOString()}` : 'for all dates');

                      const gmailResult = await apiRequest('/api/sync/gmail', {
                        method: 'POST',
                        body: selectedDate ? { targetDate: selectedDate.toISOString() } : {}
                      });

                      console.log('✅ Gmail sync completed:', gmailResult);

                      toast({
                        title: 'Sync completed!',
                        description: selectedDate
                          ? `Processed messages for ${selectedDate.toLocaleDateString()}`
                          : 'Successfully synced Gmail',
                        duration: 5000
                      });

                      // Force refresh work items
                      queryClient.invalidateQueries({
                        queryKey: ['/api/work-items'],
                        exact: false
                      });

                    } else {
                      console.log('⚠️ Gmail not connected');
                      toast({
                        title: 'No services connected',
                        description: 'Please connect Gmail first',
                        variant: 'destructive'
                      });
                    }
                  } catch (error) {
                    console.error('❌ Sync failed:', error);
                    toast({
                      title: 'Sync failed',
                      description: 'Please try again or check your connection',
                      variant: 'destructive',
                      duration: 5000
                    });
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                disabled={isLoading}
                title={selectedDate ? `Sync for ${selectedDate.toLocaleDateString()}` : "Sync"}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  // Show "No items" message when date filtering returns empty results
  if (selectedDate && filteredItems.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Use same header as main dashboard */}
        {renderHeader()}

        {/* No Items Message */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No items for this date</h2>
            <p className="text-gray-400 mb-6">
              No work items found for {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-gray-500 text-sm">
              Try syncing your services or selecting a different date.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Use shared header component */}
      {renderHeader()}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {workItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Welcome to Your Dashboard</h2>
              <p className="text-gray-400 mb-8 text-lg">
                {state.connectedServices.gmail || state.connectedServices.slack
                  ? 'Your messages are being processed. Check back soon!'
                  : 'Connect your services to start organizing your communications'
                }
              </p>

              {!state.connectedServices.gmail || !state.connectedServices.slack ? (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Get Started</h3>
                  <div className="space-y-4">
                    <Button
                      onClick={() => connectGmailMutation.mutate()}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200"
                      disabled={state.connectedServices.gmail}
                    >
                      <Mail className="w-5 h-5 mr-3" />
                      {state.connectedServices.gmail ? 'Gmail Connected ✓' : 'Connect Gmail'}
                    </Button>
                    <Button
                      onClick={() => connectSlackMutation.mutate()}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium transition-all duration-200"
                      disabled={state.connectedServices.slack}
                    >
                      <MessageSquare className="w-5 h-5 mr-3" />
                      {state.connectedServices.slack ? 'Slack Connected ✓' : 'Connect Slack'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">All Set!</h3>
                  <p className="text-gray-400 mb-4">
                    Your services are connected and messages are being processed.
                  </p>
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/work-items'] })}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">No Items for Selected Date</h2>
              <p className="text-gray-400 mb-8 text-lg">
                {selectedDate
                  ? `No work items found for ${selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}`
                  : 'No items match your current filters'
                }
              </p>
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                  You have {workItems.length} total items. Try selecting a different date or syncing your services.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Page Header */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                {viewMode === 'active' ? 'Your Work Items' : 'Completed Items'}
              </h2>
              <p className="text-gray-400 text-lg">
                {viewMode === 'active'
                  ? `${filteredItems.length} items to review`
                  : `${filteredItems.length} completed items`
                }
              </p>

              {/* Mobile Date Filter */}
              <div className="md:hidden mt-6">
                <DateFilter
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  isLoading={isDateLoading}
                />
              </div>
            </div>

            {/* Work Items Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Urgent Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-bold text-white">🔥 Urgent</h3>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1">
                    {urgentItems.length}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {urgentItems.map((item) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      onMarkComplete={handleMarkComplete}
                      onViewSource={handleViewSource}
                      onViewContext={handleViewContext}
                    />
                  ))}

                  {urgentItems.length === 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🎉</span>
                      </div>
                      <p className="text-gray-300 font-medium mb-2">No urgent items</p>
                      <p className="text-sm text-gray-500">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* FYI Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-white">💡 FYI</h3>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
                    {fyiItems.length}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {fyiItems.map((item) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      onMarkComplete={handleMarkComplete}
                      onViewSource={handleViewSource}
                      onViewContext={handleViewContext}
                    />
                  ))}

                  {fyiItems.length === 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📚</span>
                      </div>
                      <p className="text-gray-300 font-medium mb-2">No FYI items</p>
                      <p className="text-sm text-gray-500">Stay informed and organized</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ignore Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-xl p-4 border border-gray-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-white">🗑️ Ignore</h3>
                  </div>
                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 px-3 py-1">
                    {ignoreItems.length}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {ignoreItems.map((item) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      onMarkComplete={handleMarkComplete}
                      onViewSource={handleViewSource}
                      onViewContext={handleViewContext}
                    />
                  ))}

                  {ignoreItems.length === 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10">
                      <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🧹</span>
                      </div>
                      <p className="text-gray-300 font-medium mb-2">No items to ignore</p>
                      <p className="text-sm text-gray-500">Clean slate, focused mind</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onConnectGmail={() => connectGmailMutation.mutate()}
        onConnectSlack={() => connectSlackMutation.mutate()}
        onViewCleanedMails={handleViewCleanedMails}
      />

      {/* Context Panel */}
      <ContextPanel
        item={selectedItem}
        isOpen={contextPanelOpen}
        onClose={() => setContextPanelOpen(false)}
      />
    </div>
  );
}