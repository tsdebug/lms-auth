"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { FileQuestionIcon, ClipboardListIcon, AwardIcon, TrendingUpIcon } from "lucide-react"

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
  SearchIcon,
} from "lucide-react"

const teacherNav = [
  { title: "Dashboard", url: "/teacher/dashboard", icon: <LayoutDashboard /> },
  { title: "My Courses", url: "/teacher/courses", icon: <BookOpen /> },
  { title: "Quizzes", url: "/teacher/quizzes", icon: <FileQuestionIcon /> },
  { title: "Assignments", url: "/teacher/assignments", icon: <ClipboardListIcon /> },
  { title: "Students", url: "/teacher/students", icon: <Users /> },
]

const studentNav = [
  { title: "Dashboard", url: "/student/dashboard", icon: <LayoutDashboard /> },
  { title: "Browse Courses", url: "/courses", icon: <SearchIcon /> },
  { title: "My Courses", url: "/student/courses", icon: <BookOpen /> },
  { title: "Quizzes", url: "/student/quizzes", icon: <FileQuestionIcon /> },
  { title: "Assignments", url: "/student/assignments", icon: <ClipboardListIcon /> },
  { title: "Progress", url: "/student/progress", icon: <TrendingUpIcon /> },
  { title: "Certificates", url: "/student/certificates", icon: <AwardIcon /> },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> { }

export function AppSidebar({ ...props }: AppSidebarProps) {
  const currentUser = useQuery(api.users.queries.getCurrentUser)
  const isTeacher = currentUser?.roles?.some(r => r?.name === "teacher")
  const navItems = isTeacher ? teacherNav : studentNav

  // the real user object to pass to NavUser
  const userForNav = {
    name: currentUser ? `${currentUser.fName ?? ""} ${currentUser.lName ?? ""}`.trim() : "Loading...",
    email: currentUser?.email ?? "",
    avatar: currentUser?.pfpUrl ?? "",
  }

  // to handle the loading state of the current user, we can check if it's undefined (still loading) or null (not logged in)
  if (currentUser === undefined) {
    return null // or a skeleton/spinner
  }

  if (currentUser === null) {
    return null // sidebar won't show if not logged in anyway
  }

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
        <NavMain items={navItems} role={isTeacher ? "teacher" : "student"} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userForNav} />
      </SidebarFooter>
    </Sidebar>
  )
}