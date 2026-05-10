import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// createEnrollment — enrolls a student in a course
export const createEnrollment = mutation({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // 2. does course exist and is it published?
    const course = await ctx.db.get(args.courseId)
    if (!course) throw new Error("Course not found")
    if (course.status !== "published") {
      throw new Error("Cannot enroll in an unpublished course")
    }

    // 3. check not already enrolled
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("userId_courseId", (q) =>
        q.eq("userId", authUserId).eq("courseId", args.courseId)
      )
      .first()
    if (existing) throw new Error("Already enrolled in this course")

    // 4. create enrollment
    return await ctx.db.insert("enrollments", {
      userId: authUserId,
      courseId: args.courseId,
      enrolledAt: Date.now(),
      status: "active",
      updatedAt: Date.now(),
    })
  },
})