import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronDownIcon,
  GaugeIcon,
  BookIcon,
  GraduationCapIcon,
  PresentationIcon as Presentation,
  FileTextIcon,
  UsersIcon,
  SettingsIcon,
  XIcon,
  CreditCardIcon,
  HistoryIcon,
  PhoneIcon,
  MapPinIcon,
  BarChartIcon,
  CalendarIcon,
  icons
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface MenuItem {
  name: string;
  icon?: React.FC<{ className?: string }>;
  path?: string;
  roles?: string[];
  children?: MenuItem[];
  isDivider?: boolean;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});


  const getMenuItemsByRole = () => {
    const role = user?.role || "";

    if (role === "parent") {
      return [
        {
          name: "Home",
          icon: GaugeIcon,
          path: "/",
        },
        {
          name: "Students",
          icon: GraduationCapIcon,
          path: "/students",
        },
        {
          name: "Payment Info",
          icon: FileTextIcon,
          path: "/payment-info",
        },
        // {
        //   name: "Programs",
        //   icon: BookIcon,
        //   path: "/programs",
        // },
        {
          name: "divider-1",
          isDivider: true,
        },
        {
          name: "Transaction History",
          icon: HistoryIcon,
          path: "/transaction-history",
        },
        {
          name: "My Account Info",
          icon: UsersIcon,
          path: "/account-info",
        },
        // {
        //   name: "Contact Us",
        //   icon: PhoneIcon,
        //   path: "/contact",
        // },
        {
          name: "Sign Out",
          icon: XIcon,
          path: "/logout",
        }
      ];
    }

    if (role === "student") {
      return [
        {
          name: "Home",
          icon: GaugeIcon,
          path: "/",
        },
        {
          name: "My Progress",
          icon: BarChartIcon,
          path: "/progress",
        },
        {
          name: "My Classes",
          icon: BookIcon,
          path: "/classes",
        },
        {
          name: "divider-1",
          isDivider: true,
        },
        {
          name: "Sign Out",
          icon: XIcon,
          path: "/logout",
        }
      ];
    }
    if (role === "teacher") {
      return [
        {
          name: "Home",
          icon: GaugeIcon,
          path: "/",
        },
        {
          name: "My Classes",
          icon: BookIcon,
          path: "/classes",
        },
        {
          name: "Students",
          icon: GraduationCapIcon,
          path: "/students",
        },
        {
          name: "divider-1",
          isDivider: true,
        },
        {
          name: "Calendar",
          icon: CalendarIcon,
          path: "/calendar",
        },
        {
          name: "Assignments",
          icon: FileTextIcon,
          path: "/assignments",
        },
        {
          name: "divider-2",
          isDivider: true,
        },
        {
          name: "My Account Info",
          icon: UsersIcon,
          path: "/account-info",
        },
        {
          name: "Contact Admin",
          icon: PhoneIcon,
          path: "/contact",
        },
        {
          name: "Sign Out",
          icon: XIcon,
          path: "/logout",
        }
      ];
    }


    if (role === "owner") {
      return [
        {
          name: "Home",
          icon: GaugeIcon,
          path: "/",
        },
        {
          name: "Teachers",
          icon: Presentation,
          path: "/teachers",
        },
        {
          name: "Students",
          icon: GraduationCapIcon,
          path: "/students",
        },
        {
          name: "Discounts Codes",
          icon: FileTextIcon,
          path: "/discount-codes",
        },
        {
          name: "Manage Sessions",
          icon: BookIcon,
          path: "/class-sessions",
        },
        {
          name: "Parents",
          icon: UsersIcon,
          path: "/parents",
        },
        {
          name: "divider-1",
          isDivider: true,
        },
        {
          name: "Programs",
          icon: BookIcon,
          path: "/programs",
        },
        {
          name: "Locations",
          icon: MapPinIcon,
          path: "/locations",
        },
        {
          name: "Financial Reports",
          icon: BarChartIcon,
          path: "/reports",
        },
        {
          name: "Settings",
          icon: SettingsIcon,
          path: "/settings",
        },
        {
          name: "My Account Info",
          icon: UsersIcon,
          path: "/account-info",
        },
        {
          name: "Sign Out",
          icon: XIcon,
          path: "/logout",
        }
      ];
    }


    return [
      {
        name: "Home",
        icon: GaugeIcon,
        path: "/",
      },
      {
        name: "Students",
        icon: GraduationCapIcon,
        path: "/students",
      },
      {
        name: "Add Location",
        icon: MapPinIcon,
        path: "/add-location",
      },
      {
        name: "My Account Info",
        icon: UsersIcon,
        path: "/account-info",
      },
      {
        name: "Sign Out",
        icon: XIcon,
        path: "/logout",
      }
    ];
  };

  const menuItems: MenuItem[] = getMenuItemsByRole();

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const hasAccess = (item: MenuItem) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return item.roles.includes(user?.role || "");
  };


  const isMenuActive = (item: MenuItem): boolean => {
    if (item.path && location === item.path) {
      return true;
    }

    if (item.children) {
      return item.children.some(child => isMenuActive(child));
    }

    return false;
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(hasAccess)
      .map(item => {
        if (item.children) {
          const filteredChildren = filterMenuItems(item.children);
          return {
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : undefined
          };
        }
        return item;
      })
      .filter(item => !item.children || item.children.length > 0);
  };

  const renderMenuItem = (item: MenuItem, index: number, isSubMenu = false, level = 0) => {
    if (item.isDivider) {
      return (
        <Separator
          key={`divider-${index}`}
          className="my-2 mx-3"
        />
      );
    }

    const isActive = isMenuActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.name];

    if (hasChildren) {
      return (
        <div key={`${item.name}-${index}`} className="sidebar-item">
          <button
            onClick={() => toggleMenu(item.name)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium rounded-md relative",
              isActive
                ? "bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400 font-semibold"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
              isSubMenu && level > 0 ? "pl-8" : "",
              isActive && "border-l-4 border-primary pl-3" // Added left border for active items
            )}
          >
            <div className="flex items-center">
              {item.icon && <item.icon className={cn("w-5 h-5 mr-3", isActive && "text-primary")} />}
              <span>{item.name}</span>
            </div>
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded ? "rotate-180" : ""
              )}
            />
          </button>
          {isExpanded && (
            <div className={cn("pl-12 mt-1 space-y-1", isSubMenu ? "pl-16" : "")}>
              {item.children?.map((subItem, subIndex) =>
                renderMenuItem(subItem, subIndex, true, level + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <TooltipProvider key={`${item.name}-${index}`}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div>
              <Link
                href={item.path || "#"}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsOpen(false);
                  }
                }}
              >
                <div
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-colors relative",
                    isActive
                      ? "bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400 font-semibold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                    isSubMenu && level > 0 ? "pl-8" : "",
                    level > 1 ? "pl-12" : "",
                    isActive && "border-l-4 border-primary pl-3" // Added left border for active items
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 inset-y-0 w-1 bg-primary-600 rounded-r-full" aria-hidden="true" />
                  )}
                  {item.icon && (
                    <item.icon className={cn("w-5 h-5 mr-3", isActive && "text-primary")} />
                  )}
                  <span>{item.name}</span>
                </div>
              </Link>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-hidden md:block",
          "fixed inset-y-0 left-0 z-20 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 pt-16 transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        <div className="flex justify-between items-center p-4 md:hidden">
          <h2 className="font-semibold text-xl">Menu</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="px-3 py-4">
            <nav className="space-y-1 font-medium">
              {filteredMenuItems.map((item, index) => renderMenuItem(item, index))}
            </nav>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}