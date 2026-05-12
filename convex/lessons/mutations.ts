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
export const markLessonComplete = mutation({
  args: {
    lessonId: v.id("lessons"), // the lesson that was completed
  },
  handler: async (ctx, args) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthenticated");

    // 2. get lesson to find courseId
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    // 3. get chapter to find courseId
    const chapter = await ctx.db.get(lesson.chapterId);
    if (!chapter) throw new Error("Chapter not found");

    // 4. enrollment check — must be enrolled to complete lessons
    await requireEnrollment(ctx.db, authUserId, chapter.courseId);

    // 5. check not already completed — userId_lessonId prevents duplicates
    const existing = await ctx.db
      .query("lesson_completions")
      .withIndex("userId_lessonId", (q) => q.eq("userId", authUserId).eq("lessonId", args.lessonId))
      .first();
    if (existing) return existing._id // already done, silently return

    // 6. insert completion record
    return await ctx.db.insert("lesson_completions", {
      userId: authUserId,
      lessonId: args.lessonId,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
})