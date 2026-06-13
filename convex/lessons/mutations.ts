import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole, requireEnrollment } from "../lib/authorization"

// createLesson — adds a new lesson to a chapter
export const createLesson = mutation({
  args: {
    chapterId: v.id("chapters"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // get chapter to find the courseId for role check
    const chapter = await ctx.db.get(args.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    await requireCourseRole(ctx.db, authUserId, chapter.courseId)

    // get current lesson count for index
    const existing = await ctx.db
      .query("lessons")
      .withIndex("chapterId", (q) => q.eq("chapterId", args.chapterId))
      .collect()

    const index = existing.length

    return await ctx.db.insert("lessons", {
      title: args.title,
      description: args.description,
      chapterId: args.chapterId,
      index,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// updateLesson — updates lesson title or description
export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson) throw new Error("Lesson not found")

    const chapter = await ctx.db.get(lesson.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    await requireCourseRole(ctx.db, authUserId, chapter.courseId)

    const { lessonId, ...fields } = args
    await ctx.db.patch(args.lessonId, {
      ...fields,
      updatedAt: Date.now(),
    })
  },
})

// deleteLesson — removes a lesson
export const deleteLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson) throw new Error("Lesson not found")

    const chapter = await ctx.db.get(lesson.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    await requireCourseRole(ctx.db, authUserId, chapter.courseId)

    await ctx.db.delete(args.lessonId)
  },
})


// markLessonComplete — called when student finishes a lesson
// UPDATED: after marking complete, checks if ALL lessons in the course are done
// if yes -> issues certificate + marks enrollment as completed
export const markLessonComplete = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    // step 1: auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // step 2: get lesson -> chapter -> courseId chain
    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson) throw new Error("Lesson not found")

    const chapter = await ctx.db.get(lesson.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    const courseId = chapter.courseId

    // step 3: enrollment check
    await requireEnrollment(ctx.db, authUserId, courseId)

    // step 4: idempotent check — if already completed return early
    // WHY: student might click "mark complete" twice, we don't want duplicates
    const existing = await ctx.db
      .query("lesson_completions")
      .withIndex("userId_lessonId", (q) =>
        q.eq("userId", authUserId).eq("lessonId", args.lessonId)
      )
      .first()
    if (existing) return { alreadyComplete: true, certificateIssued: false }

    // step 5: insert lesson completion record
    await ctx.db.insert("lesson_completions", {
      userId: authUserId,
      lessonId: args.lessonId,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    })

    // step 6: check if this was the last lesson in the entire course
    // get all chapters -> all lessons -> count completions
    const allChapters = await ctx.db
      .query("chapters")
      .withIndex("courseId", (q) => q.eq("courseId", courseId))
      .collect()

    const allLessonArrays = await Promise.all(
      allChapters.map((c) =>
        ctx.db
          .query("lessons")
          .withIndex("chapterId", (q) => q.eq("chapterId", c._id))
          .collect()
      )
    )
    const allLessons = allLessonArrays.flat()
    const totalLessons = allLessons.length

    // step 7: count how many lessons this student has completed
    // includes the one we just inserted above
    const completionChecks = await Promise.all(
      allLessons.map((l) =>
        ctx.db
          .query("lesson_completions")
          .withIndex("userId_lessonId", (q) =>
            q.eq("userId", authUserId).eq("lessonId", l._id)
          )
          .first()
      )
    )
    const completedCount = completionChecks.filter(Boolean).length

    // step 8: not all done yet — return early without certificate
    if (completedCount < totalLessons) {
      return { alreadyComplete: false, certificateIssued: false }
    }

    // step 9: all lessons done — check if certificate already issued
    // WHY: prevents duplicate certificates if somehow called twice
    const existingCert = await ctx.db
      .query("certificates")
      .withIndex("userId_courseId", (q) =>
        q.eq("userId", authUserId).eq("courseId", courseId)
      )
      .first()

    if (existingCert) {
      return { alreadyComplete: false, certificateIssued: false }
    }

    // step 10: generate unique 16-char verification code
    const verificationCode = crypto
      .randomUUID()
      .replace(/-/g, "")
      .toUpperCase()
      .slice(0, 16)

    // step 11: insert certificate
    await ctx.db.insert("certificates", {
      userId: authUserId,
      courseId,
      verificationCode,
      completedAt: Date.now(),
      issuedAt: Date.now(),
      status: "issued",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // step 12: update enrollment status to completed
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("userId_courseId", (q) =>
        q.eq("userId", authUserId).eq("courseId", courseId)
      )
      .first()

    if (enrollment) {
      await ctx.db.patch(enrollment._id, {
        status: "completed",
        updatedAt: Date.now(),
      })
    }

    // step 13: return result to frontend so it can show the certificate toast
    return { alreadyComplete: false, certificateIssued: true, verificationCode }
  },
})