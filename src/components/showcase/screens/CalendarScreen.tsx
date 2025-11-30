import { ChevronLeft, ChevronRight } from "lucide-react";

export const CalendarScreen = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = [
    [29, 30, 31, 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25],
    [26, 27, 28, 29, 30, 1, 2],
  ];
  
  return (
    <div className="h-full w-full p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white text-sm font-semibold">June 2024</h3>
        <div className="flex gap-2">
          <button className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => (
          <div key={day} className="text-white/50 text-[10px] text-center font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col gap-1">
        {dates.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 flex-1">
            {week.map((date, dateIndex) => {
              const isCurrentMonth = !(weekIndex === 0 && date > 20) && !(weekIndex === 4 && date < 10);
              const isSelected = date === 15;
              const hasEvent = [8, 15, 22, 24].includes(date) && isCurrentMonth;
              
              return (
                <div
                  key={dateIndex}
                  className={`
                    flex flex-col items-center justify-center rounded-lg text-xs
                    ${!isCurrentMonth ? 'text-white/20' : 'text-white'}
                    ${isSelected ? 'bg-gradient-to-br from-app-blue to-app-light-blue text-white font-semibold' : ''}
                    ${hasEvent && !isSelected ? 'relative' : ''}
                  `}
                >
                  {date}
                  {hasEvent && !isSelected && (
                    <div className="w-1 h-1 rounded-full bg-mesh-cyan mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Events */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
        <p className="text-white text-xs font-medium mb-2">Upcoming Events</p>
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <div className="w-1 h-8 bg-app-light-blue rounded-full" />
            <div className="flex-1">
              <p className="text-white text-xs font-medium">Team Meeting</p>
              <p className="text-white/50 text-[10px]">10:00 AM - 11:00 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
