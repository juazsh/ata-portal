import { Bell, Grid, LayoutGrid, MessageSquare, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  return (
    <header className="w-full fixed top-0 z-10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-200 p-2 rounded-xl">
          <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 7.8L12 3L21 7.8V16.2L12 21L3 16.2V7.8Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-white font-semibold text-xl">EduView</h1>
      </div>

      <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
        <LayoutGrid size={18} className="text-purple-400" />
        <span className="text-white text-sm">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800">
          <Grid size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800">
          <MessageSquare size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800">
          <Settings size={20} />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-white text-sm">Hello, Jacob</p>
          <div className="flex items-center gap-1">
            <span className="text-zinc-400 text-xs">Progress:</span>
            <span className="text-zinc-400 text-xs">74%</span>
          </div>
        </div>
        <Avatar className="h-10 w-10 border-2 border-zinc-700">
          <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 relative"
        >
          <Bell size={20} />
          <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />
        </Button>
      </div>
    </header>
  )
}
