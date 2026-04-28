"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { DataTable } from "@/components/data-table"
import { teacherColumns, type TeacherCourseRow } from "./columns"

export function TeacherCoursesTable() {
  const courses = useQuery(api.courses.queries.getCoursesByTeacher)

  if (courses === undefined) {
    return (
      <div className="px-4 lg:px-6 text-sm text-muted-foreground">
        Loading courses...
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="px-4 lg:px-6 text-sm text-muted-foreground">
        No courses yet. Create your first course to get started.
      </div>
    )
  }

  const tableData: TeacherCourseRow[] = courses.map((course, index) => ({
    id: index + 1,
    courseId: String(course._id),
    convexId: course._id,
    title: course.title,
    status: course.status,
    myRole: course.myRole ?? "owner",
    studentCount: course.studentCount ?? 0,
    difficultyLevel: course.difficultyLevel ?? "unknown",
  }))

  return <DataTable data={tableData} columns={teacherColumns} />
}