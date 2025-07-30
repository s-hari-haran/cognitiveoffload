import { motion } from "framer-motion";
import { Mail, MessageSquare, Clock, Users, CheckCircle, ExternalLink, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkItem } from "@shared/schema";

interface WorkItemCardProps {
  item: WorkItem;
  onMarkComplete?: (id: number) => void;
  onViewSource?: (url: string) => void;
  onViewContext?: (item: WorkItem) => void;
}

export function WorkItemCard({ item, onMarkComplete, onViewSource, onViewContext }: WorkItemCardProps) {
  const getSourceIcon = () => {
    switch (item.sourceType) {
      case 'gmail':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const getUrgencyBadge = () => {
    const urgency = item.urgencyScore || 1;
    if (urgency >= 4) {
      return (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 px-2 py-1 text-xs font-medium">
          🔥 High Priority
        </Badge>
      );
    } else if (urgency >= 2) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-2 py-1 text-xs font-medium">
          ⚡ Medium Priority
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 px-2 py-1 text-xs font-medium">
          📋 Low Priority
        </Badge>
      );
    }
  };

  const getClassificationClass = () => {
    switch (item.classification) {
      case 'urgent':
        return 'border-l-red-500 bg-gradient-to-r from-red-500/5 to-red-500/10';
      case 'fyi':
        return 'border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-blue-500/10';
      case 'ignore':
        return 'border-l-gray-500 bg-gradient-to-r from-gray-500/5 to-gray-500/10 opacity-75';
      default:
        return 'border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-blue-500/10';
    }
  };

  const getDeadlineColor = () => {
    if (!item.deadline || item.deadline === 'no_deadline') return 'text-gray-400';
    
    switch (item.deadline) {
      case 'today':
        return 'text-red-400';
      case 'this_week':
        return 'text-yellow-400';
      case 'next_week':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div className={`relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${getClassificationClass()} transition-all duration-300 hover:bg-white/8 hover:border-white/20`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg">
              {getSourceIcon()}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {item.sourceType}
              </span>
              {item.sourceDate ? (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(item.sourceDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              ) : item.createdAt && (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          </div>
          {getUrgencyBadge()}
        </div>
        
          {/* Summary */}
        <div className="mb-4">
          <h3 className="text-white font-semibold leading-relaxed text-sm">
              {item.summary}
          </h3>
          </div>

          {/* Action Items */}
          {item.actionItems && item.actionItems.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Action Items
            </h4>
              <ul className="space-y-1">
              {item.actionItems.slice(0, 2).map((action, index) => (
                <li key={index} className="flex items-start space-x-2 text-xs text-gray-300">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              {item.actionItems.length > 2 && (
                <li className="text-xs text-gray-500 ml-3">
                  +{item.actionItems.length - 2} more items
                </li>
              )}
              </ul>
            </div>
          )}

          {/* Metadata Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-4">
              {/* Stakeholders */}
              {item.stakeholders && item.stakeholders.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {item.stakeholders.length} stakeholder{item.stakeholders.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Deadline */}
              {item.deadline && item.deadline !== 'no_deadline' && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                <span className={`text-xs font-medium capitalize ${getDeadlineColor()}`}>
                    {item.deadline.replace('_', ' ')}
                  </span>
                </div>
              )}

            {/* Business Impact */}
            {item.businessImpact && (
              <div className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${
                  item.businessImpact === 'high' ? 'bg-red-400' :
                  item.businessImpact === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-gray-400 capitalize">
                  {item.businessImpact} impact
                </span>
              </div>
            )}
            </div>

            {/* Quick Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!item.isCompleted && onMarkComplete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkComplete(item.id)}
                className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                title="Mark as complete"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            
            {onViewContext && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewContext(item)}
                className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                title="View context"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
              
              {item.sourceUrl && onViewSource && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewSource(item.sourceUrl!)}
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                title="View source"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

        {/* Context Tags */}
        {item.contextTags && item.contextTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.contextTags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-white/5 text-xs text-gray-400 rounded-md border border-white/10">
                #{tag}
              </span>
            ))}
            {item.contextTags.length > 3 && (
              <span className="px-2 py-1 bg-white/5 text-xs text-gray-500 rounded-md border border-white/10">
                +{item.contextTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}