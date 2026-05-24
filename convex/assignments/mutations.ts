import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole, requireEnrollment, requireGradingPermission } from "../lib/authorization"


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
            .withIndex("assignmentId", (q) => q.eq("assignmentId", args.assignmentId))
            .first()

        if (submissions) {
            throw new Error("Cannot delete assignment with existing submissions")
        }

        // 5. delete
        await ctx.db.delete(args.assignmentId)
    }
})


// --- submitAssignment ---
// student submits their work for an assignment
// supports text, URL, and file references simultaneously
// checks allowResubmission flag before accepting a second attempt
export const submitAssignment = mutation({
    args: {
        assignmentId: v.id("assignments"),
        textSubmission: v.optional(v.string()),
        linkUrl: v.optional(v.string()),
        // file uploads are stored in submission_files after the action completes
        // fileUrls here are the R2 URLs returned from the uploadMedia action
        files: v.optional(v.array(v.object({
            fileUrl: v.string(),
            fileName: v.string(),
            fileSize: v.number(),
            fileType: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. get assignment
        const assignment = await ctx.db.get(args.assignmentId)
        if (!assignment) throw new Error("Assignment not found")

        // 3. enrollment check — must be enrolled in the course
        const courseId = await resolveCourseId(ctx.db, assignment.lessonId, assignment.chapterId)
        await requireEnrollment(ctx.db, authUserId, courseId as any)

        // 4. must provide at least one form of submission
        const hasContent =
            (args.textSubmission && args.textSubmission.trim().length > 0) ||
            (args.linkUrl && args.linkUrl.trim().length > 0) ||
            (args.files && args.files.length > 0)

        if (!hasContent) {
            throw new Error("Submission must include text, a link, or at least one file")
        }

        // 5. check for existing submission and handle resubmission rules
        // check allowResubmission flag
        const existingSubmissions = await ctx.db
            .query("submissions")
            .withIndex("assignmentId_userId", (q) =>
                q.eq("assignmentId", args.assignmentId).eq("userId", authUserId)
            )
            .collect()

        const latestSubmission = existingSubmissions
            .sort((a, b) => b.attemptNumber - a.attemptNumber)[0] // this sorts submissions in descending order by attemptNumber and takes the first one, which is the latest submission

        if (latestSubmission) {
            // already submitted — check if resubmission is allowed
            if (!assignment.allowResubmission) {
                throw new Error("This assignment does not allow resubmission")
            }
            // submitted status submissions block resubmission too if already graded and no resubmission
            if (latestSubmission.status === "graded" && !assignment.allowResubmission) {
                throw new Error("This assignment does not allow resubmission after grading")
            }
        }

        // 6. calculate attempt number 
        const attemptNumber = latestSubmission ? latestSubmission.attemptNumber + 1 : 1

        // 7. insert submission row
        const submissionId = await ctx.db.insert("submissions", {
            assignmentId: args.assignmentId,
            userId: authUserId,
            textSubmission: args.textSubmission,
            linkUrl: args.linkUrl,
            status: attemptNumber > 1 ? "resubmitted" : "submitted",
            attemptNumber,
            submittedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })

        // 8. insert submission_files rows if files were provided
        // one submissions row + one submission_files row per file
        if (args.files && args.files.length > 0) {
            for (const file of args.files) {
                await ctx.db.insert("submission_files", {
                    submissionId,
                    fileUrl: file.fileUrl,
                    fileName: file.fileName,
                    fileSize: file.fileSize,
                    fileType: file.fileType,
                    createdAt: Date.now(),
                })
            }
        }

        return submissionId
    }
})

// --- gradeSubmission ---
// teacher or evaluator grades a student submission
// only teacher or evaluator role may call this
export const gradeSubmission = mutation({
    args: {
        submissionId: v.id("submissions"),
        score: v.number(),
        feedback: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. get submission
        const submission = await ctx.db.get(args.submissionId)
        if (!submission) throw new Error("Submission not found")

        // 3. get assignment to find course context
        const assignment = await ctx.db.get(submission.assignmentId)
        if (!assignment) throw new Error("Assignment not found")

        // 4. must be teacher (course instructor) or evaluator role
        // check course instructor first (teacher path)
        const courseId = await resolveCourseId(ctx.db, assignment.lessonId, assignment.chapterId)

        // authorization: must be course instructor or platform evaluator
        await requireGradingPermission(ctx.db, authUserId, courseId as any)

        // 5. validate score does not exceed maxScore
        if (args.score > assignment.maxScore) {
            throw new Error(`Score cannot exceed max score of ${assignment.maxScore}`)
        }
        if (args.score < 0) {
            throw new Error("Score cannot be negative")
        }

        // 6. patch submission with grade
        await ctx.db.patch(args.submissionId, {
            score: args.score,
            feedback: args.feedback,
            status: "graded",
            gradedAt: Date.now(),
            gradedBy: authUserId,   // only teacher or evaluator role may call this
            updatedAt: Date.now(),
        })
    },
})