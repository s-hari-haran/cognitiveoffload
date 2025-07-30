import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

interface DateFilterProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
  isLoading?: boolean;
}

// 🔧 UTILITY FUNCTIONS FOR SAFE DATE HANDLING
const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

const convertToUTCStartOfDay = (date: Date): Date => {
  if (!isValidDate(date)) {
    console.warn('⚠️ Invalid date provided to convertToUTCStartOfDay:', date);
    return new Date();
  }

  // Create a new date representing the same calendar date in the user's timezone
  // but normalized to UTC start of day for consistent API calls
  const userDate = new Date(date);
  const utcDate = new Date(Date.UTC(
    userDate.getFullYear(),
    userDate.getMonth(),
    userDate.getDate()
  ));

  console.log('📅 UTC conversion:', {
    original: date.toISOString(),
    originalLocal: date.toLocaleDateString(),
    utcStartOfDay: utcDate.toISOString(),
    utcYear: utcDate.getUTCFullYear(),
    utcMonth: utcDate.getUTCMonth(),
    utcDate: utcDate.getUTCDate()
  });

  return utcDate;
};

const safeDateChange = (date: Date | undefined, onDateChange: (date: Date | undefined) => void) => {
  if (date === undefined) {
    console.log('📅 Clearing date filter');
    onDateChange(undefined);
    return;
  }

  if (!isValidDate(date)) {
    console.warn('⚠️ Invalid date received in safeDateChange:', date);
    onDateChange(undefined);
    return;
  }

  const utcDate = convertToUTCStartOfDay(date);
  console.log('📅 Safe date change:', {
    original: date.toISOString(),
    utcConverted: utcDate.toISOString(),
    isValid: isValidDate(utcDate)
  });

  onDateChange(utcDate);
};

export function DateFilter({ selectedDate, onDateChange, className, isLoading }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 🔧 ENHANCED DATE HANDLERS WITH VALIDATION
  const handleToday = () => {
    console.log('📅 Today button clicked');
    const today = new Date();
    console.log('📅 Setting today date:', {
      today: today.toISOString(),
      todayString: today.toDateString(),
      todayUTC: today.toUTCString()
    });

    // Trigger Gmail sync for today's emails
    const syncTodayEmails = async () => {
      try {
        console.log('📧 Triggering Gmail sync for today...');
        const response = await fetch('/api/sync/gmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('workos_token')}`
          },
          body: JSON.stringify({
            targetDate: today.toISOString()
          })
        });

        if (response.ok) {
          console.log('✅ Gmail sync for today completed');
        } else {
          console.error('❌ Gmail sync for today failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Error syncing Gmail for today:', error);
      }
    };

    // Set the date first, then trigger sync
    safeDateChange(today, onDateChange);
    setIsOpen(false);

    // Trigger sync after a short delay to let the date change take effect
    setTimeout(syncTodayEmails, 500);
  };

  const handleYesterday = () => {
    console.log('📅 Yesterday button clicked');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    console.log('📅 Setting yesterday date:', {
      yesterday: yesterday.toISOString(),
      yesterdayString: yesterday.toDateString(),
      yesterdayUTC: yesterday.toUTCString()
    });
    safeDateChange(yesterday, onDateChange);
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    if (!isValidDate(date)) {
      console.warn('⚠️ Invalid date in formatDate:', date);
      return 'Invalid Date';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // 🔧 VALIDATE SELECTED DATE ON RENDER
  const validSelectedDate = selectedDate && isValidDate(selectedDate) ? selectedDate : undefined;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Today Button */}
      <Button
        onClick={handleToday}
        variant="outline"
        size="sm"
        disabled={isLoading}
        className={cn(
          "h-9 px-3 text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          validSelectedDate && validSelectedDate.toDateString() === new Date().toDateString()
            ? "bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
            : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
        )}
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-2" />
        ) : null}
        Today
      </Button>

      {/* Yesterday Button */}
      <Button
        onClick={handleYesterday}
        variant="outline"
        size="sm"
        disabled={isLoading}
        className={cn(
          "h-9 px-3 text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          validSelectedDate && validSelectedDate.toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
            ? "bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
            : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
        )}
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-2" />
        ) : null}
        Yesterday
      </Button>

      {/* Calendar Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className={cn(
              "h-9 px-3 text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              validSelectedDate && !validSelectedDate.toDateString().includes(new Date().toDateString().split(' ')[1]) && !validSelectedDate.toDateString().includes(new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString().split(' ')[1])
                ? "bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
                : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            )}
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Calendar className="w-3 h-3 mr-2" />
            )}
            {validSelectedDate ? formatDate(validSelectedDate) : "Custom"}
            <ChevronDown className="w-3 h-3 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="end">
          <div className="p-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Select Date</h4>
              {validSelectedDate && (
                <Button
                  onClick={() => {
                    console.log('📅 Clearing date filter from calendar');
                    onDateChange(undefined);
                    setIsOpen(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <CalendarComponent
            mode="single"
            selected={validSelectedDate}
            onSelect={(date) => {
              console.log('📅 Calendar date selected:', {
                date: date?.toISOString(),
                dateString: date?.toDateString(),
                isUndefined: date === undefined,
                isValid: date ? isValidDate(date) : true
              });

              // 🔧 SAFE DATE HANDLING FOR CALENDAR SELECTION
              safeDateChange(date, onDateChange);
              setIsOpen(false);
            }}
            className="bg-gray-900 text-white"
            classNames={{
              months: "flex space-x-1 sm:space-x-2",
              month: "space-y-2",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-white",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-400 rounded-md w-8 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: cn(
                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-800",
                "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
              ),
              day: "h-8 w-8 p-0 font-normal text-white aria-selected:opacity-100 hover:bg-gray-700 rounded-md",
              day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
              day_today: "bg-gray-700 text-white",
              day_outside: "text-gray-500 opacity-50",
              day_disabled: "text-gray-500 opacity-50",
              day_range_middle: "aria-selected:bg-gray-800 aria-selected:text-white",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 