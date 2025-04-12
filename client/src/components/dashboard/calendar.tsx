import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarDay {
  day: number;
  isPreviousMonth?: boolean;
  isCurrentMonth: boolean;
  isToday?: boolean;
  hasEvent?: boolean;
  eventType?: "blue" | "amber" | "default";
}

interface Event {
  date: string;
  title: string;
  type: "blue" | "amber" | "default";
}

export function Calendar() {
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Sample calendar data for May 2023
  const calendarDays: CalendarDay[] = [
    { day: 30, isPreviousMonth: true, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true, isToday: true, hasEvent: true, eventType: "default" },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true, hasEvent: true, eventType: "amber" },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true, hasEvent: true, eventType: "blue" },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 31, isCurrentMonth: true },
    { day: 1, isPreviousMonth: true, isCurrentMonth: false },
    { day: 2, isPreviousMonth: true, isCurrentMonth: false },
    { day: 3, isPreviousMonth: true, isCurrentMonth: false },
  ];

  const events: Event[] = [
    { date: "May 24", title: "Department Meeting", type: "blue" },
    { date: "May 21", title: "System Maintenance", type: "amber" },
    { date: "May 15", title: "Academic Calendar Release", type: "default" },
  ];

  return (
    <>
      <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
        Upcoming Events
      </h2>
      <Card>
        <CardContent className="pt-5">
          <div className="text-center mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              May 2023
            </h3>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center">
            {days.map((day, i) => (
              <div key={i} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {day}
              </div>
            ))}
            
            {calendarDays.map((day, i) => (
              <div 
                key={i} 
                className={`py-1.5 text-sm ${
                  !day.isCurrentMonth 
                    ? "text-slate-400 dark:text-slate-600" 
                    : day.isToday
                    ? "font-medium bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300"
                    : "text-slate-700 dark:text-slate-300"
                } ${
                  day.hasEvent && day.eventType === "blue" 
                    ? "bg-blue-100 dark:bg-blue-900 rounded-full" 
                    : day.hasEvent && day.eventType === "amber"
                    ? "bg-amber-100 dark:bg-amber-900 rounded-full"
                    : ""
                }`}
              >
                {day.day}
              </div>
            ))}
          </div>
          
          <div className="mt-6 space-y-3">
            {events.map((event, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  event.type === "blue" 
                    ? "bg-blue-500" 
                    : event.type === "amber" 
                    ? "bg-amber-500" 
                    : "bg-slate-300 dark:bg-slate-700"
                }`} />
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {event.date} - {event.title}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
