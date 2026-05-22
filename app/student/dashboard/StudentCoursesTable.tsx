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
      // some fields are added on the server but the generated TS types may lag
      // cast to any and provide safe defaults to keep changes minimal
      courseId: (enrollment as any).courseId ?? "",
      courseTitle: enrollment.courseTitle,
      enrollmentStatus: enrollment.enrollmentStatus,
      instructorName: enrollment.instructorName,
      difficultyLevel: enrollment.difficultyLevel,
      progressPercent: (enrollment as any).progressPercent ?? 0,
      completedLessons: (enrollment as any).completedLessons ?? 0,
      totalLessons: (enrollment as any).totalLessons ?? 0,
    }))

  return <DataTable data={tableData} columns={studentColumns} />
}