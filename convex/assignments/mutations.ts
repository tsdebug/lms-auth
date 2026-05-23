import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole, requireEnrollment } from "../lib/authorization"


// helper - resolves courseId from lessonId or chapterId
// needed because assignments can be attached to either a lesson or a chapter
// if both are provided, lessonId takes precedence
async function resolveCourseId(
    db: any,
    lessonId?: string,
    chapterId?: string
): Promise<string> { // promise is used as its function is to fetch data from the database in parallel with other operations in the mutation
    if (lessonId) {
        const lesson = await db.get(lessonId)
        if (!lesson) {
            throw new Error("Lesson not found")
        }
        const chapter = await db.get(lesson.chapterId)
        if (!chapter) {
            throw new Error("Chapter not found")
        }
        return chapter.courseId
    }
    if (chapterId) {
        const chapter = await db.get(chapterId)
        if (!chapter) {
            throw new Error("Chapter not found")
        }
        return chapter.courseId;
    }
    throw new Error("Either lessonId or chapterId must be provided")
}

// --- createAssignment ---
// teacher attaches an assignment to a lesson or chapter
// at least one of lessonId or chapterId must be set
export const createAssignment = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        lessonId: v.optional(v.id("lessons")),
        chapterId: v.optional(v.id("chapters")),
        dueDate: v.string(),
        maxScore: v.number(),
        allowLateSubmission: v.boolean(), // is submission after dueDate allowed?
        allowResubmission: v.boolean(), // is re submission allowed?
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. must have at least one anchor - either lessonId or chapterId
        if (!args.lessonId && !args.chapterId) {
            throw new Error("Assignment must be attached to a lesson or a chapter") // throw error if neither is provided
        }

        // 3. resolve courseId and role check
        const courseId = await resolveCourseId(ctx.db, args.lessonId, args.chapterId)
        await requireCourseRole(ctx.db, authUserId, courseId as any)

        // 4. insert
        return await ctx.db.insert("assignments", {
            title: args.title,
            description: args.description,
            lessonId: args.lessonId,
            chapterId: args.chapterId,
            createdBy: authUserId,
            dueDate: args.dueDate,
            maxScore: args.maxScore,
            allowLateSubmission: args.allowLateSubmission,
            allowResubmission: args.allowResubmission,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })
    }
})

// --- updateAssignment ---
// teacher updates assignment metadata
export const updateAssignment = mutation({
    args: {
        assignmentId: v.id("assignments"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        dueDate: v.optional(v.string()),
        maxScore: v.optional(v.number()),
        allowLateSubmission: v.optional(v.boolean()),
        allowResubmission: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // 1. auth check 
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. get assignment
        const assignment = await ctx.db.get(args.assignmentId)
        if (!assignment) throw new Error("Assignment not found")

        // 3. role check
        const courseId = await resolveCourseId(ctx.db, assignment.lessonId, assignment.chapterId)
        await requireCourseRole(ctx.db, authUserId, courseId as any)

        // 4. patch the updated fields - only those that were provided in the args
        const { assignmentId, ...fields } = args
        await ctx.db.patch(args.assignmentId, {
            ...fields,
            updatedAt: Date.now(),
        })
    }
})

// --- deleteAssignment ---
// teacher deletes an assignment — only if no submissions exist
export const deleteAssignment = mutation({
    args: {
        assignmentId: v.id("assignments"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")
 
        // 2. get assignment
        const assignment = await ctx.db.get(args.assignmentId)
        if (!assignment) throw new Error("Assignment not found")

        // 3. role check
        const courseId = await resolveCourseId(ctx.db, assignment.lessonId, assignment.chapterId)
        await requireCourseRole(ctx.db, authUserId, courseId as any)

        // 4. check for existing submissions
        const submissions = await ctx.db
        .query("submissions")
        .withIndex("assignmentId", (q)=> q.eq("assignmentId", args.assignmentId))
        .first()

        if(submissions){
            throw new Error("Cannot delete assignment with existing submissions")
        }

        // 5. delete
        await ctx.db.delete(args.assignmentId)
    }
})

