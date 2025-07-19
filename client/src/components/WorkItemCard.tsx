import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, ExternalLink, Flame, Info, Trash2, Mail, MessageSquare } from "lucide-react";
import { WorkItem } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WorkItemCardProps {
  item: WorkItem;
}

export function WorkItemCard({ item }: WorkItemCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<WorkItem>) => 
      apiRequest(`/api/work-items/${item.id}`, "PATCH", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-items"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update work item",
        variant: "destructive",
      });
    },
  });

  const handleMarkComplete = () => {
    updateMutation.mutate({ isCompleted: true });
    toast({
      title: "Marked as complete",
      description: "Work item has been completed",
    });
  };

  const handleSnooze = () => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + 4); // Snooze for 4 hours
    updateMutation.mutate({ 
      isSnoozed: true, 
      snoozeUntil: snoozeUntil.toISOString() 
    });
    toast({
      title: "Snoozed",
      description: "Work item snoozed for 4 hours",
    });
  };

  const handleViewSource = () => {
    if (item.sourceUrl) {
      window.open(item.sourceUrl, '_blank');
    } else {
      toast({
        title: "No source available",
        description: "This item doesn't have a source link",
        variant: "destructive",
      });
    }
  };

  const getClassificationIcon = () => {
    switch (item.classification) {
      case 'urgent':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'fyi':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'ignore':
        return <Trash2 className="w-4 h-4 text-gray-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSourceIcon = () => {
    switch (item.sourceType) {
      case 'gmail':
        return <Mail className="w-4 h-4" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getClassificationColor = () => {
    switch (item.classification) {
      case 'urgent':
        return 'border-l-orange-500 bg-gradient-to-r from-orange-50/40 to-pink-50/40 dark:from-orange-900/20 dark:to-pink-900/20';
      case 'fyi':
        return 'border-l-blue-500 bg-gradient-to-r from-blue-50/40 to-purple-50/40 dark:from-blue-900/20 dark:to-purple-900/20';
      case 'ignore':
        return 'border-l-gray-400 bg-gradient-to-r from-gray-50/40 to-gray-100/40 dark:from-gray-800/20 dark:to-gray-700/20 opacity-75';
      default:
        return 'border-l-gray-300 bg-white/80 dark:bg-gray-800/80';
    }
  };

  const getUrgencyBadgeColor = () => {
    if (!item.urgencyScore) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    
    if (item.urgencyScore >= 4) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
    if (item.urgencyScore >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
    if (item.urgencyScore >= 2) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  if (item.isCompleted || item.isSnoozed) {
    return null; // Don't show completed or snoozed items
  }

  return (
    <Card className={cn(
      "work-item-card border-l-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cyber-border",
      getClassificationColor()
    )}>
      <CardContent className="p-6">
        {/* Header with source and classification */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getSourceIcon()}
            <Badge variant="outline" className="text-xs">
              {item.sourceType.toUpperCase()}
            </Badge>
            {getClassificationIcon()}
          </div>
          <div className="flex items-center gap-2">
            {item.urgencyScore && (
              <Badge className={cn("text-xs font-medium", getUrgencyBadgeColor())}>
                Priority {item.urgencyScore}/5
              </Badge>
            )}
            {item.deadline && item.deadline !== 'no_deadline' && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.deadline.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Summary */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
          {item.summary}
        </h3>

        {/* Action Items */}
        {item.actionItems && item.actionItems.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action Items:
            </h4>
            <ul className="space-y-1">
              {item.actionItems.slice(0, 3).map((action, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-xs text-purple-500 mt-1">•</span>
                  {action}
                </li>
              ))}
              {item.actionItems.length > 3 && (
                <li className="text-xs text-gray-500 dark:text-gray-500 italic">
                  +{item.actionItems.length - 3} more actions...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Context Tags */}
        {item.contextTags && item.contextTags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {item.contextTags.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.contextTags.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{item.contextTags.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <Button
            size="sm"
            variant="default"
            onClick={handleMarkComplete}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleSnooze}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            Snooze
          </Button>

          {item.sourceUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewSource}
              className="flex items-center gap-1.5 ml-auto"
            >
              <ExternalLink className="w-4 h-4" />
              View Source
            </Button>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="mt-3 pt-2 border-t border-gray-100/50 dark:border-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {item.sentiment && (
                <span className="capitalize">{item.sentiment} • </span>
              )}
              {item.effortEstimate && (
                <span>{item.effortEstimate}</span>
              )}
            </span>
            <span>
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}