import { 
  UserIcon, 
  BookIcon, 
  GraduationCapIcon, 
  FileTextIcon
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  link: string;
}

export function StatsCards() {
  const stats: StatCard[] = [
    {
      title: "Total Students",
      value: 3245,
      icon: <GraduationCapIcon className="h-5 w-5 text-white" />,
      color: "bg-indigo-500",
      link: "/students"
    },
    {
      title: "Active Courses",
      value: 125,
      icon: <BookIcon className="h-5 w-5 text-white" />,
      color: "bg-blue-500",
      link: "/courses"
    },
    {
      title: "Faculty Members",
      value: 78,
      icon: <UserIcon className="h-5 w-5 text-white" />,
      color: "bg-amber-500",
      link: "/faculty"
    },
    {
      title: "Upcoming Exams",
      value: 12,
      icon: <FileTextIcon className="h-5 w-5 text-white" />,
      color: "bg-emerald-500",
      link: "/exams"
    }
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                {stat.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                    {stat.title}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-slate-900 dark:text-white">
                      {stat.value.toLocaleString()}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-800 px-5 py-3">
            <div className="text-sm">
              <Link href={stat.link}>
                <a className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                  View all
                </a>
              </Link>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
