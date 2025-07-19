import { motion } from "framer-motion";
import { Mail, MessageSquare, Clock, Users, CheckCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WorkItem } from "@shared/schema";

interface WorkItemCardProps {
  item: WorkItem;
  onMarkComplete?: (id: number) => void;
  onViewSource?: (url: string) => void;
}

export function WorkItemCard({ item, onMarkComplete, onViewSource }: WorkItemCardProps) {
  const getSourceIcon = () => {
    switch (item.sourceType) {
      case 'gmail':
        return <Mail className="w-4 h-4 source-gmail" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 source-slack" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getUrgencyBadge = () => {
    const urgency = item.urgencyScore || 1;
    if (urgency >= 4) {
      return <Badge className="urgency-high">🔥 High Impact</Badge>;
    } else if (urgency >= 2) {
      return <Badge className="urgency-medium">💡 Medium</Badge>;
    } else {
      return <Badge className="urgency-low">📋 Low</Badge>;
    }
  };

  const getClassificationClass = () => {
    switch (item.classification) {
      case 'urgent':
        return 'urgent';
      case 'fyi':
        return 'fyi';
      case 'ignore':
        return 'ignore';
      default:
        return 'fyi';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className={`work-item-card ${getClassificationClass()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {getSourceIcon()}
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {item.sourceType}
              </span>
            </div>
            {getUrgencyBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Summary */}
          <div>
            <p className="font-bold text-white leading-relaxed">
              {item.summary}
            </p>
          </div>

          {/* Action Items */}
          {item.actionItems && item.actionItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Action Items:</h4>
              <ul className="space-y-1">
                {item.actionItems.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
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
                  <span className="text-xs text-gray-400 capitalize">
                    {item.deadline.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!item.isCompleted && onMarkComplete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkComplete(item.id)}
                  className="h-8 px-2 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
              
              {item.sourceUrl && onViewSource && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewSource(item.sourceUrl!)}
                  className="h-8 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}