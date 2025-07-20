"use client"

import type React from "react"

import { useState } from "react"
import { useLocation, Link } from "wouter"
import { useAuth } from "@/hooks/use-auth"
import {
  ChevronDownIcon,
  HomeIcon,
  BookOpenIcon,
  GraduationCapIcon,
  PresentationIcon,
  UsersIcon,
  SettingsIcon,
  XIcon,
  CreditCardIcon,
  HistoryIcon,
  PhoneIcon,
  MapPinIcon,
  BarChart3Icon,
  CalendarIcon,
  ClipboardListIcon,
  TagIcon,
  UserIcon,
  CalendarDaysIcon,
  BuildingIcon,
  PackageIcon,
  PercentIcon,
  LogOutIcon,
  UserCheckIcon,
  BookIcon,
  ClockIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

interface MenuItem {
  name: string
  icon?: React.FC<{ className?: string }>
  path?: string
  roles?: string[]
  children?: MenuItem[]
  isDivider?: boolean
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location] = useLocation()
  const { user } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const getMenuItemsByRole = () => {
    const role = user?.role || ""

    if (role === "parent") {
      return [
        {
          name: "Home",
          icon: HomeIcon,
          path: "/",
        },
        {
          name: "Students",
          icon: GraduationCapIcon,
          path: "/students",
        },
        {
          name: "Payment Info",
          icon: CreditCardIcon,
          path: "/payment-info",
        },
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
          icon: UserIcon,
          path: "/account-info",
        },
        {
          name: "Sign Out",
          icon: LogOutIcon,
          path: "/logout",
        },
      ]
    }

    if (role === "student") {
      return [
        {
          name: "Home",
          icon: HomeIcon,
          path: "/",
        },
        {
          name: "My Progress",
          icon: BarChart3Icon,
          path: "/progress",
        },
        {
          name: "My Classes",
          icon: BookOpenIcon,
          path: "/classes",
        },
        {
          name: "divider-1",
          isDivider: true,
        },
        {
          name: "Sign Out",
          icon: LogOutIcon,
          path: "/logout",
        },
      ]
    }

    if (role === "teacher") {
      return [
        {
          name: "Home",
          icon: HomeIcon,
          path: "/",
        },
        {
          name: "My Classes",
          icon: BookOpenIcon,
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
          icon: ClipboardListIcon,
          path: "/assignments",
        },
        {
          name: "divider-2",
          isDivider: true,
        },
        {
          name: "My Account Info",
          icon: UserIcon,
          path: "/account-info",
        },
        {
          name: "Contact Admin",
          icon: PhoneIcon,
          path: "/contact",
        },
        {
          name: "Sign Out",
          icon: LogOutIcon,
          path: "/logout",
        },
      ]
    }

    if (role === "owner") {
      return [
        {
          name: "Home",
          icon: HomeIcon,
          path: "/",
        },
        {
          name: "Teachers",
          icon: PresentationIcon,
          path: "/teachers",
        },
        {
          name: "Students",
          icon: GraduationCapIcon,
          path: "/students",
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
          name: "Locations",
          icon: BuildingIcon,
          path: "/locations",
        },
        {
          name: "Offerings",
          icon: PackageIcon,
          path: "/offerings",
        },
        {
          name: "Plans",
          icon: TagIcon,
          path: "/plans",
        },
        {
          name: "Programs",
          icon: BookIcon,
          path: "/programs",
        },
        {
          name: "Sessions",
          icon: ClockIcon,
          path: "/sessions",
        },
        {
          name: "Discount Codes",
          icon: PercentIcon,
          path: "/discount-codes",
        },
        {
          name: "Users",
          icon: UserCheckIcon,
          path: "/users",
        },
        {
          name: "Schedules",
          icon: CalendarDaysIcon,
          path: "/schedules",
        },
        {
          name: "Settings",
          icon: SettingsIcon,
          path: "/settings",
        },
        {
          name: "My Account Info",
          icon: UserIcon,
          path: "/account-info",
        },
        {
          name: "Sign Out",
          icon: LogOutIcon,
          path: "/logout",
        },
      ]
    }

    return [
      {
        name: "Home",
        icon: HomeIcon,
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
        icon: UserIcon,
        path: "/account-info",
      },
      {
        name: "Sign Out",
        icon: LogOutIcon,
        path: "/logout",
      },
    ]
  }

  const menuItems: MenuItem[] = getMenuItemsByRole()

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }))
  }

  const hasAccess = (item: MenuItem) => {
    if (!item.roles || item.roles.length === 0) {
      return true
    }
    return item.roles.includes(user?.role || "")
  }

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.path && location === item.path) {
      return true
    }

    if (item.children) {
      return item.children.some((child) => isMenuActive(child))
    }

    return false
  }

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(hasAccess)
      .map((item) => {
        if (item.children) {
          const filteredChildren = filterMenuItems(item.children)
          return {
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : undefined,
          }
        }
        return item
      })
      .filter((item) => !item.children || item.children.length > 0)
  }

  const renderMenuItem = (item: MenuItem, index: number, isSubMenu = false, level = 0) => {
    if (item.isDivider) {
      return <Separator key={`divider-${index}`} className="my-3 mx-4 bg-slate-200 dark:bg-slate-700" />
    }

    const isActive = isMenuActive(item)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedMenus[item.name]

    if (hasChildren) {
      return (
        <div key={`${item.name}-${index}`} className="sidebar-item">
          <button
            onClick={() => toggleMenu(item.name)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg relative group transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 text-blue-700 dark:text-blue-400 font-semibold shadow-sm"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100",
              isSubMenu && level > 0 ? "pl-8" : "",
              "mx-2",
            )}
          >
            <div className="flex items-center">
              {item.icon && (
                <item.icon
                  className={cn(
                    "w-5 h-5 mr-3 transition-colors duration-200",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300",
                  )}
                />
              )}
              <span className="font-medium">{item.name}</span>
            </div>
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 transition-all duration-200 text-slate-400",
                isExpanded ? "rotate-180 text-slate-600" : "",
                "group-hover:text-slate-600 dark:group-hover:text-slate-300",
              )}
            />
          </button>
          {isExpanded && (
            <div
              className={cn("mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200", isSubMenu ? "pl-4" : "pl-2")}
            >
              {item.children?.map((subItem, subIndex) => renderMenuItem(subItem, subIndex, true, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <TooltipProvider key={`${item.name}-${index}`}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="mx-2">
              <Link
                href={item.path || "#"}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsOpen(false)
                  }
                }}
              >
                <div
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 relative group",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border-l-4 border-blue-500"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm",
                    isSubMenu && level > 0 ? "pl-8" : "",
                    level > 1 ? "pl-12" : "",
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "w-5 h-5 mr-3 transition-colors duration-200",
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300",
                      )}
                    />
                  )}
                  <span className="font-medium">{item.name}</span>

                  {/* Active indicator dot */}
                  {isActive && <div className="absolute right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                </div>
              </Link>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium bg-slate-900 text-white border-slate-700">
            {item.name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const filteredMenuItems = filterMenuItems(menuItems)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10 md:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside style={{paddingTop: "0px"}}
        className={cn(
          "md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-hidden md:block",
          "fixed inset-y-0 left-0 z-20 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 pt-16 transition-all duration-300 ease-out shadow-xl md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:w-64 md:bg-white md:dark:bg-slate-900",
        )}
      >
        <div className="flex justify-between items-center p-4 md:hidden border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">Navigation</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] px-2">
          <div className="py-6">
            {/* User info section */}
            {user && (
              <div className="px-4 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.firstName + " " +user.lastName || "User"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role || "Member"}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="space-y-1">{filteredMenuItems.map((item, index) => renderMenuItem(item, index))}</nav>
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}
