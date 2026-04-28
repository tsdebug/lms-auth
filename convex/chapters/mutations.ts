// imports — v, mutation, getAuthUserId, requireCourseRole
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireCourseRole } from "../lib/authorization"

// createChapter - Mutation to create a new chapter
export const createChapter = mutation({
    // args: courseId, title
    args: {
        courseId: v.id("courses"),
        title: v.string()
    },
    // handler:
    handler: async (ctx, args) => {
        //  1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            throw new Error("User must be authenticated");
        }

        //   2. does course exist?
        const course = await ctx.db.get(args.courseId);
        if (!course) {
            throw new Error("Course not found");
        }

        //   3. requireCourseRole check - course level role check — must be instructor on this course
        await requireCourseRole(ctx.db, authUserId, args.courseId);

        // 4. get current chapter count to set the index
        // index determines display order — new chapter goes at the end
        const existingChapters = await ctx.db
        .query("chapters")
        .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
        .collect();

        const index = existingChapters.length // 0-based, new chapter gets next position

        //   5. insert chapter with title, courseId, index, timestamps
        return await ctx.db.insert("chapters",{
            title: args.title,
            courseId: args.courseId,
            index,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })
    }
});

// updateChapter
// args: chapterId, title
// handler:
//   1. auth check
//   2. get chapter — need it to find courseId
//   3. requireCourseRole using chapter.courseId
//   4. patch chapter with new title + updatedAt

// deleteChapter
// args: chapterId
// handler:
//   1. auth check
//   2. get chapter
//   3. requireCourseRole
//   4. get all lessons in this chapter and delete each one
//   5. delete the chapter itself