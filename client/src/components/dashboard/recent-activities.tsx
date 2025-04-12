import { ClockIcon, ChevronRightIcon } from "lucide-react";

interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
}

export function RecentActivities() {
  const activities: Activity[] = [
    {
      id: 1,
      title: "New student registered",
      description: "in Computer Science department",
      time: "10 minutes ago"
    },
    {
      id: 2,
      title: "Grade uploaded",
      description: "for Introduction to Programming course",
      time: "1 hour ago"
    },
    {
      id: 3,
      title: "New course added",
      description: "Advanced Machine Learning",
      time: "3 hours ago"
    },
    {
      id: 4,
      title: "System update completed",
      description: "Version 2.4.0",
      time: "5 hours ago"
    }
  ];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
        Recent Activities
      </h2>
      <div className="bg-white dark:bg-slate-900 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {activities.map((activity) => (
            <li key={activity.id}>
              <div className="px-4 py-4 flex items-center sm:px-6">
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <div className="flex text-sm">
                      <p className="font-medium text-primary-600 dark:text-primary-400 truncate">
                        {activity.title}
                      </p>
                      <p className="ml-1 flex-shrink-0 font-normal text-slate-500 dark:text-slate-400">
                        {activity.description}
                      </p>
                    </div>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <p>{activity.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-5 flex-shrink-0">
                  <ChevronRightIcon className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
