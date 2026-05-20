"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { StudentCoursesTable } from "../dashboard/StudentCoursesTable"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

export default function StudentCoursesPage() {
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
                Courses you are enrolled in
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/courses")}
            >
              <SearchIcon className="size-4 mr-1" />
              Browse Courses
            </Button>
          </div>
          <StudentCoursesTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}