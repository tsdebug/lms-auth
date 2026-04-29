// imports — v, mutation, getAuthUserId, requireCourseRole
import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole } from "../lib/authorization"

// createChapter — adds a new chapter to a course
export const createChapter = mutation({
    // args: courseId, title
    args: {
        courseId: v.id("courses"),
        title: v.string(),
    },
    // handler:
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. course exists check
        const course = await ctx.db.get(args.courseId)
        if (!course) throw new Error("Course not found")

        // 3. role check — must be instructor on this course
        await requireCourseRole(ctx.db, authUserId, args.courseId)

        // 4. get current chapter count to set the index
        // index determines display order — new chapter goes at the end
        const existing = await ctx.db
            .query("chapters")
            .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
            .collect()

        const index = existing.length // 0-based, new chapter gets next position

        // 5. insert chapter
        return await ctx.db.insert("chapters", {
            title: args.title,
            courseId: args.courseId,
            index,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })
    },
})

// updateChapter — updates chapter title
export const updateChapter = mutation({
    // args: chapterId, title
    args: {
        chapterId: v.id("chapters"),
        title: v.string(),
    },
    // handler:
    handler: async (ctx, args) => {
        //  1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        //  2. get chapter — need it to find courseId
        const chapter = await ctx.db.get(args.chapterId)
        if (!chapter) throw new Error("Chapter not found")

        //   3. requireCourseRole using chapter.courseId
        await requireCourseRole(ctx.db, authUserId, chapter.courseId)

        //   4. patch chapter with new title + updatedAt
        await ctx.db.patch(args.chapterId, {
            title: args.title,
            updatedAt: Date.now(),
        })
    },
})

// deleteChapter — removes a chapter and all its lessons
export const deleteChapter = mutation({
    // args: chapterId
    args: {
        chapterId: v.id("chapters"),
    },

    // handler:
    handler: async (ctx, args) => {
        //   1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        //   2. get chapter
        const chapter = await ctx.db.get(args.chapterId)
        if (!chapter) throw new Error("Chapter not found")

        //   3. requireCourseRole
        await requireCourseRole(ctx.db, authUserId, chapter.courseId)

        //   4. get all lessons in this chapter and delete each one
        //      delete all lessons in this chapter first
        const lessons = await ctx.db
            .query("lessons")
            .withIndex("chapterId", (q) => q.eq("chapterId", args.chapterId))
            .collect()

        for (const lesson of lessons) {
            await ctx.db.delete(lesson._id)
        }

        //   5. delete the chapter itself
        await ctx.db.delete(args.chapterId)
    },
})