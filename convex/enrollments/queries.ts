import { query } from "../_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"

// getEnrollmentsByStudent - returns all enrollments for the currently authenticated student,
// enriched with course, instructor, and real progress data
export const getEnrollmentsByStudent = query({
  args: {},
  handler: async (ctx) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) {
      // Client queries can briefly run before auth rehydrates; return empty state instead of hard error.
      return []
    }

    // 2. get all enrollments for this student
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect()

    // 3. enrich each enrollment with course, instructor, and progress data
    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        // get the course
        const course = await ctx.db.get(enrollment.courseId)
        if (!course) return null

        // get the instructor (course owner)
        const instructor = await ctx.db.get(course.userId)

        // --- compute real progress ---
        // step 1: get all chapters for this course
        const chapters = await ctx.db
          .query("chapters")
          .withIndex("courseId", (q) => q.eq("courseId", enrollment.courseId))
          .collect()

        // step 2: get all lessons across every chapter (run in parallel)
        const lessonsByChapter = await Promise.all(
          chapters.map((chapter) =>
            ctx.db
              .query("lessons")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .collect()
          )
        )

        // flatten into one list of lesson IDs
        const allLessons = lessonsByChapter.flat()
        const totalLessons = allLessons.length

        // step 3: count how many of those lessons this student has completed
        // run all completion lookups in parallel
        const completionChecks = await Promise.all(
          allLessons.map((lesson) =>
            ctx.db
              .query("lesson_completions")
              .withIndex("userId_lessonId", (q) =>
                q.eq("userId", authUserId).eq("lessonId", lesson._id)
              )
              .first()
          )
        )

        const completedLessons = completionChecks.filter(Boolean).length

        // step 4: calculate percent (guard against divide-by-zero for empty courses)
        const progressPercent =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0

        return {
          id: enrollment._id,
          courseId: enrollment.courseId,
          courseTitle: course.title,
          difficultyLevel: course.difficultyLevel,
          enrollmentStatus: enrollment.status,
          instructorName: instructor
            ? `${instructor.fName ?? ""} ${instructor.lName ?? ""}`.trim()
            : "Unknown",
          progressPercent,
          completedLessons,
          totalLessons,
        }
      })
    )

    // filter out any null results (courses that were deleted)
    return enriched.filter(Boolean)
  },
})

// getEnrollmentStatus — checks if current user is enrolled in a course
export const getEnrollmentStatus = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx)
    // not logged in — return null, not an error
    // public page needs to handle unauthenticated users gracefully
    if (!authUserId) return null

    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("userId_courseId", (q) =>
        q.eq("userId", authUserId).eq("courseId", args.courseId)
      )
      .first()

    return enrollment ?? null
  },
})