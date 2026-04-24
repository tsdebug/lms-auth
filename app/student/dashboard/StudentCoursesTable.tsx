"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { DataTable } from "@/components/data-table"
import { studentColumns, type StudentCourseRow } from "./columns"

export function StudentCoursesTable() {
  const enrollments = useQuery(api.enrollments.queries.getEnrollmentsByStudent)

  if (enrollments === undefined) {
    return (
      <div className="px-4 lg:px-6 text-sm text-muted-foreground">
        Loading courses...
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="px-4 lg:px-6 text-sm text-muted-foreground">
        You are not enrolled in any courses yet.
      </div>
    )
  }

  const tableData: StudentCourseRow[] = enrollments
    .filter(
      (
        enrollment
      ): enrollment is Exclude<(typeof enrollments)[number], null> =>
        enrollment !== null
    )
    .map((enrollment) => ({
      id: enrollment.id,
      courseTitle: enrollment.courseTitle,
      enrollmentStatus: enrollment.enrollmentStatus,
      instructorName: enrollment.instructorName,
      difficultyLevel: enrollment.difficultyLevel,
    }))

  return <DataTable data={tableData} columns={studentColumns} />
}