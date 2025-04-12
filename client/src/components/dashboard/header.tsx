import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, MenuIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, toggle } = useTheme();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm h-16 w-full fixed top-0 z-10 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden mr-3"
        >
          <MenuIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </Button>
        <div className="flex items-center">
          <img
            src="/src/assets/images/logo_fusionmind.png"
            alt="FusionMind Logo"
            className="h-8 w-auto mr-2 object-contain rounded-md drop-shadow-lg"
          />
          <span className="text-xl font-semibold text-slate-800 dark:text-white">
            FusionMind
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="rounded-full"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5 text-slate-400" />
          ) : theme === "system" ? (
            <span className="flex items-center justify-center h-5 w-5 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 3v18"></path>
                <path d="M3 12h18"></path>
                <path d="M12 7l5 5-5 5-5-5 5-5z"></path>
              </svg>
            </span>
          ) : (
            <MoonIcon className="h-5 w-5 text-slate-500" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-auto flex items-center space-x-3 rounded-full focus:ring-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {user?.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                </p>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profilePicture} alt={user?.fullName} />
                <AvatarFallback className="bg-primary-500 text-white">
                  {user?.fullName ? getInitials(user.fullName) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-2">
            <DropdownMenuItem>Your Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
