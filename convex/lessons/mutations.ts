import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole } from "../lib/authorization"

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