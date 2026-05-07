"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TeacherCoursesTable } from "../dashboard/TeacherCoursesTable"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TeacherCoursesPage() {
  const router = useRouter()

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">My Courses</h1>
              <p className="text-sm text-muted-foreground">
                Manage your courses here
              </p>
            </div>
            <Button onClick={() => router.push("/teacher/courses/new")}>
              <PlusIcon className="size-4 mr-1" />
              New Course
            </Button>
          </div>
          <TeacherCoursesTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}