"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  CommandIcon,
  Award,
  BookOpen,
  DollarSign,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react"

const teacherNav = [
  { title: "Dashboard", url: "/teacher/dashboard", icon: <LayoutDashboard /> },
  { title: "My Courses", url: "/teacher/courses", icon: <BookOpen /> },
  { title: "Students", url: "/teacher/students", icon: <Users /> },
  { title: "Earnings", url: "/teacher/earnings", icon: <DollarSign /> },
  { title: "Settings", url: "/teacher/settings", icon: <Settings /> },
]

const studentNav = [
  { title: "Dashboard", url: "/student/dashboard", icon: <LayoutDashboard /> },
  { title: "My Courses", url: "/student/courses", icon: <BookOpen /> },
  { title: "Progress", url: "/student/progress", icon: <TrendingUp /> },
  { title: "Certificates", url: "/student/certificates", icon: <Award /> },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: "teacher" | "student"
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({
  role = "student",
  user = { name: "User", email: "user@example.com", avatar: "" },
  ...props
}: AppSidebarProps) {
  const navItems = role === "teacher" ? teacherNav : studentNav

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">My LMS</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}