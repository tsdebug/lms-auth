"use client"

import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CirclePlusIcon, SearchIcon } from "lucide-react"
import Link from "next/link"

export function NavMain({
  items,
  role,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
  role?: "teacher" | "student"
}) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {role === "student" ? (
              // students browse courses instead of creating
              <SidebarMenuButton
                tooltip="Browse Courses"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground"
                asChild
              >
                <Link href="/courses">
                  <SearchIcon />
                  <span>Browse Courses</span>
                </Link>
              </SidebarMenuButton>
            ) : (
              // teachers create courses
              <SidebarMenuButton
                tooltip="Quick Create"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground"
                asChild
              >
                <Link href="/teacher/courses/new">
                  <CirclePlusIcon />
                  <span>Quick Create</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname?.startsWith(`${item.url}/`) // ADDED
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} isActive={isActive} asChild>
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}