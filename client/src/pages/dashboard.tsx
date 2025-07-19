import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Mail, MessageSquare, Filter } from "lucide-react";
import { WorkItemCard } from "@/components/WorkItemCard";
import { ContextPanel } from "@/components/ContextPanel";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";
import { apiRequest } from "@/lib/queryClient";
import type { WorkItem } from "@shared/schema";

export default function Dashboard() {
  const { logout } = useAppContext();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ classification: "", sourceType: "" });
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);

  // Fetch work items
  const { data: workItems = [], isLoading } = useQuery<WorkItem[]>({
    queryKey: ['/api/work-items'],
  });

  // Mark work item as complete
  const markCompleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/work-items/${id}`, {
      method: 'PATCH',
      body: { isCompleted: true }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
    }
  });

  // Connect Gmail
  const connectGmailMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/gmail'),
    onSuccess: (data: { authUrl: string }) => {
      window.open(data.authUrl, '_blank');
    }
  });

  // Connect Slack
  const connectSlackMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/slack'),
    onSuccess: (data: { authUrl: string }) => {
      window.open(data.authUrl, '_blank');
    }
  });

  // Filter work items
  const filteredItems = workItems.filter(item => {
    if (filters.classification && item.classification !== filters.classification) return false;
    if (filters.sourceType && item.sourceType !== filters.sourceType) return false;
    return true;
  });

  // Group by classification
  const urgentItems = filteredItems.filter(item => item.classification === 'urgent');
  const fyiItems = filteredItems.filter(item => item.classification === 'fyi');
  const ignoreItems = filteredItems.filter(item => item.classification === 'ignore');

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

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect border-b border-white/10 sticky top-0 z-30"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Cognitive Offload WorkOS</h1>
              <p className="text-gray-400 text-sm">Your AI-powered unified dashboard</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Integration buttons */}
              <Button
                onClick={() => connectGmailMutation.mutate()}
                variant="outline"
                size="sm"
                className="glass-effect border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                disabled={connectGmailMutation.isPending}
              >
                <Mail className="w-4 h-4 mr-2" />
                Connect Gmail
              </Button>
              
              <Button
                onClick={() => connectSlackMutation.mutate()}
                variant="outline"
                size="sm"
                className="glass-effect border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                disabled={connectSlackMutation.isPending}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Connect Slack
              </Button>
              
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-6 py-6"
      >
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Urgent Column */}
          <motion.div variants={staggerItem}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-white">🔥 URGENT</h2>
                  <Badge variant="outline" className="text-red-400 border-red-500/30">
                    {urgentItems.length}
                  </Badge>
                </div>
              </div>
              
              <motion.div 
                className="space-y-4 stagger-children"
                variants={staggerContainer}
              >
                {urgentItems.map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    onMarkComplete={handleMarkComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
                
                {urgentItems.length === 0 && (
                  <div className="glass-effect rounded-xl p-8 text-center">
                    <p className="text-gray-400">No urgent items</p>
                    <p className="text-sm text-gray-500 mt-1">All caught up! 🎉</p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* FYI Column */}
          <motion.div variants={staggerItem}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-white">💡 FYI</h2>
                  <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                    {fyiItems.length}
                  </Badge>
                </div>
              </div>
              
              <motion.div 
                className="space-y-4 stagger-children"
                variants={staggerContainer}
              >
                {fyiItems.map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    onMarkComplete={handleMarkComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
                
                {fyiItems.length === 0 && (
                  <div className="glass-effect rounded-xl p-8 text-center">
                    <p className="text-gray-400">No FYI items</p>
                    <p className="text-sm text-gray-500 mt-1">Stay informed 📚</p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Ignore Column */}
          <motion.div variants={staggerItem}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-white">🗑️ IGNORE</h2>
                  <Badge variant="outline" className="text-gray-400 border-gray-500/30">
                    {ignoreItems.length}
                  </Badge>
                </div>
              </div>
              
              <motion.div 
                className="space-y-4 stagger-children"
                variants={staggerContainer}
              >
                {ignoreItems.map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    onMarkComplete={handleMarkComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
                
                {ignoreItems.length === 0 && (
                  <div className="glass-effect rounded-xl p-8 text-center">
                    <p className="text-gray-400">No items to ignore</p>
                    <p className="text-sm text-gray-500 mt-1">Clean slate 🧹</p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Context Panel */}
      <ContextPanel
        item={selectedItem}
        isOpen={contextPanelOpen}
        onClose={() => setContextPanelOpen(false)}
      />
    </div>
  );
}