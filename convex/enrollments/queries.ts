import { query } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// getEnrollmentsByStudent - returns all enrollments for the currently authenticated student, enriched with course and instructor data
export const getEnrollmentsByStudent = query({
  args: {},
  handler: async (ctx) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) {
      throw new Error("Unauthorized")
    }

    // 2. get all enrollments for this student
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect()

    // 3. enrich each enrollment with course and instructor data
    const enriched = await Promise.all( // Promise.all because each enrichment is async - we want to do them in parallel
      enrollments.map(async (enrollment) => {
        // get the course
        const course = await ctx.db.get(enrollment.courseId)
        if (!course) return null

        // get the instructor (course owner)
        const instructor = await ctx.db.get(course.userId)

        return {
          id: enrollment._id,
          courseTitle: course.title,
          difficultyLevel: course.difficultyLevel,
          enrollmentStatus: enrollment.status,
          instructorName: instructor
            ? `${instructor.fName ?? ""} ${instructor.lName ?? ""}`.trim()
            : "Unknown",
        }
      })
    )

    // filter out any null results (courses that were deleted)
    return enriched.filter(Boolean)
  },
})