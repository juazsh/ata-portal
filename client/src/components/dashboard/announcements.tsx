import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  isNew?: boolean;
}

export function Announcements() {
  const announcements: Announcement[] = [
    {
      id: 1,
      title: "Academic Calendar 2023-2024 Released",
      content: "The academic calendar for the next year has been finalized and is available for download.",
      date: "May 15, 2023",
      isNew: true
    },
    {
      id: 2,
      title: "Faculty Development Program",
      content: "Registration for the annual faculty development program is now open. The program will focus on innovative teaching methods.",
      date: "May 10, 2023"
    },
    {
      id: 3,
      title: "System Maintenance Notice",
      content: "The academic portal will be unavailable on Sunday, May 21 from 2:00 AM to 5:00 AM for scheduled maintenance.",
      date: "May 8, 2023"
    }
  ];

  return (
    <>
      <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
        Announcements
      </h2>
      <Card>
        <CardContent className="p-0 divide-y divide-slate-200 dark:divide-slate-800">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {announcement.title}
                </h3>
                {announcement.isNew && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800">
                    New
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {announcement.content}
              </p>
              <div className="mt-3 flex items-center text-sm text-slate-500 dark:text-slate-400">
                <CalendarIcon className="mr-1.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <p>Posted on {announcement.date}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
