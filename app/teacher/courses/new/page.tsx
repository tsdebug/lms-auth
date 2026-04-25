"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { CourseCreateForm } from "@/components/course-create-form"

export default function NewCoursePage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-6">
          <div className="mb-5 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Create New Course</h1>
            <p className="text-sm text-muted-foreground">
              Start in draft mode, then continue editing chapters and lessons.
            </p>
          </div>
          <CourseCreateForm />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
