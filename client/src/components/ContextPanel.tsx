import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, MessageSquare, Users, Calendar, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkItem } from "@shared/schema";

interface ContextPanelProps {
  item: WorkItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContextPanel({ item, isOpen, onClose }: ContextPanelProps) {
  if (!item) return null;

  const getSourceIcon = () => {
    switch (item.sourceType) {
      case 'gmail':
        return <Mail className="w-5 h-5 source-gmail" />;
      case 'slack':
        return <MessageSquare className="w-5 h-5 source-slack" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
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

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-96 glass-effect border-l border-white/20 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 glass-effect border-b border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getSourceIcon()}
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                    {item.sourceType}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <h2 className="mt-4 text-lg font-bold text-white leading-relaxed">
                {item.summary}
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Classification & Priority */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Classification
                </h3>
                <div className="flex items-center space-x-3">
                  <Badge
                    className={
                      item.classification === 'urgent'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : item.classification === 'fyi'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }
                  >
                    {item.classification === 'urgent' && '🔥 '}
                    {item.classification === 'fyi' && '💡 '}
                    {item.classification === 'ignore' && '🗑️ '}
                    {item.classification.toUpperCase()}
                  </Badge>
                  
                  {item.urgencyScore && (
                    <Badge variant="outline" className="text-gray-300">
                      Priority: {item.urgencyScore}/5
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Items */}
              {item.actionItems && item.actionItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Action Items
                  </h3>
                  <ul className="space-y-2">
                    {item.actionItems.map((action, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-300">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stakeholders */}
              {item.stakeholders && item.stakeholders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center space-x-2 text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    <Users className="w-4 h-4" />
                    <span>Stakeholders</span>
                  </h3>
                  <div className="space-y-2">
                    {item.stakeholders.map((stakeholder, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-400">
                            {stakeholder.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-gray-300">{stakeholder}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline & Metadata */}
              <div className="space-y-3">
                <h3 className="flex items-center space-x-2 text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  <Calendar className="w-4 h-4" />
                  <span>Timeline</span>
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {item.deadline && item.deadline !== 'no_deadline' && (
                    <div className="flex justify-between">
                      <span>Deadline:</span>
                      <span className="capitalize font-medium">
                        {item.deadline.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  
                  {item.effortEstimate && (
                    <div className="flex justify-between">
                      <span>Effort:</span>
                      <span className="capitalize font-medium">{item.effortEstimate}</span>
                    </div>
                  )}
                  
                  {item.businessImpact && (
                    <div className="flex justify-between">
                      <span>Business Impact:</span>
                      <span className="capitalize font-medium">{item.businessImpact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Insights */}
              <div className="space-y-3">
                <h3 className="flex items-center space-x-2 text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  <Lightbulb className="w-4 h-4" />
                  <span>AI Insights</span>
                </h3>
                <div className="glass-effect rounded-lg p-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {item.sentiment && (
                      <span className="block mb-2">
                        <strong>Sentiment:</strong> {item.sentiment}
                      </span>
                    )}
                    
                    {item.followUpNeeded ? (
                      <span className="text-yellow-400">
                        💡 <strong>Suggested Action:</strong> This item requires follow-up. 
                        Consider reaching out to stakeholders about next steps.
                      </span>
                    ) : (
                      <span className="text-green-400">
                        ✅ <strong>Status:</strong> This item appears to be informational 
                        and may not require immediate action.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Context Tags */}
              {item.contextTags && item.contextTags.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.contextTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-gray-400">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}