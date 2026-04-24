"use client"

import { Button } from "@/components/ui/button"
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
              >
                <CirclePlusIcon />
                <span>Quick Create</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}