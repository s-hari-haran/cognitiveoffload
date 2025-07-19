import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Info, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  currentFilter: 'all' | 'urgent' | 'fyi' | 'ignore';
  onFilterChange: (filter: 'all' | 'urgent' | 'fyi' | 'ignore') => void;
  counts: {
    all: number;
    urgent: number;
    fyi: number;
    ignore: number;
  };
  lastSync?: string;
}

export default function FilterBar({ currentFilter, onFilterChange, counts, lastSync }: FilterBarProps) {
  const filters = [
    {
      key: 'all' as const,
      label: 'All Items',
      icon: null,
      count: counts.all,
      color: 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
      activeColor: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
    },
    {
      key: 'urgent' as const,
      label: 'Urgent',
      icon: Flame,
      count: counts.urgent,
      color: 'border-orange-300 bg-white hover:bg-orange-50 text-orange-700',
      activeColor: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
    },
    {
      key: 'fyi' as const,
      label: 'FYI',
      icon: Info,
      count: counts.fyi,
      color: 'border-blue-300 bg-white hover:bg-blue-50 text-blue-700',
      activeColor: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
    },
    {
      key: 'ignore' as const,
      label: 'Ignore',
      icon: Trash2,
      count: counts.ignore,
      color: 'border-gray-300 bg-white hover:bg-gray-50 text-gray-600',
      activeColor: 'border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-800/20 dark:text-gray-300'
    }
  ];

  return (
    <div className="mb-8">
      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Work Items Dashboard
          </h2>
          {lastSync && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              Last sync: {lastSync}
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = currentFilter === filter.key;
            
            return (
              <Button
                key={filter.key}
                onClick={() => onFilterChange(filter.key)}
                variant="outline"
                className={cn(
                  "h-20 flex flex-col items-center justify-center space-y-2 border-2 transition-all duration-300 hover:scale-105",
                  isActive ? filter.activeColor : filter.color
                )}
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-5 h-5" />}
                  <span className="font-medium">{filter.label}</span>
                </div>
                <Badge 
                  variant={isActive ? "default" : "secondary"} 
                  className={cn(
                    "text-sm font-bold px-3 py-1",
                    isActive && "bg-white/90 text-gray-800 dark:bg-gray-800 dark:text-white"
                  )}
                >
                  {filter.count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Active Filter Info */}
        {currentFilter !== 'all' && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {counts[currentFilter]} {currentFilter} items
            </p>
          </div>
        )}
      </div>
    </div>
  );
}