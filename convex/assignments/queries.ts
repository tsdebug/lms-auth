import { v } from "convex/values"
import { query } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole } from "../lib/authorization"

// --- getAssignmentsByLesson ---
// returns all assignments attached to a lesson
// accessible to: enrolled students + course instructors
export const getAssignmentsByLesson = query({
    args: {
        lessonId: v.id("lessons"),
        courseId: v.id("courses"),  // passed explicitly to avoid re-resolving the chain
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. access check — enrolled student or instructor
        // check enrollment first (student path)
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("userId_courseId", (q) =>
                q.eq("userId", authUserId).eq("courseId", args.courseId)
            )
            .first()

        if (!enrollment) {
            // not a student — must be a course instructor
            await requireCourseRole(ctx.db, authUserId, args.courseId)
        }

        // 3. get assignments for this lesson
        const assignments = await ctx.db
            .query("assignments")
            .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
            .collect()

        // filter out soft-deleted
        return assignments.filter((a) => !a.deletedAt)
    },
})

// --- getAssignmentsByChapter ---
// returns all assignments attached to a chapter
// accessible to: enrolled students + course instructors
export const getAssignmentsByChapter = query({
    args: {
        chapterId: v.id("chapters"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. access check
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("userId_courseId", (q) =>
                q.eq("userId", authUserId).eq("courseId", args.courseId)
            )
            .first()

        if (!enrollment) {
            await requireCourseRole(ctx.db, authUserId, args.courseId)
        }

        // 3. get assignments for this chapter
        const assignments = await ctx.db
            .query("assignments")
            .withIndex("chapterId", (q) => q.eq("chapterId", args.chapterId))
            .collect()

        return assignments.filter((a) => !a.deletedAt)
    },
})

// --- getAssignmentById ---
// returns a single assignment with submission stats for instructors
// accessible to: enrolled students + course instructors
export const getAssignmentById = query({
    args: {
        assignmentId: v.id("assignments"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. access check
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("userId_courseId", (q) =>
                q.eq("userId", authUserId).eq("courseId", args.courseId)
            )
            .first()

        const isInstructor = !enrollment
            ? await ctx.db
                .query("course_instructors")
                .withIndex("courseId_userId", (q) =>
                    q.eq("courseId", args.courseId).eq("userId", authUserId)
                )
                .first()
            : null

        if (!enrollment && !isInstructor) {
            throw new Error("Unauthorized")
        }

        // 3. get assignment
        const assignment = await ctx.db.get(args.assignmentId)
        if (!assignment || assignment.deletedAt) throw new Error("Assignment not found")

        return assignment
    },
})

// --- getMySubmission ---
// student fetches their own submission for an assignment
// returns the latest attempt + all uploaded files
export const getMySubmission = query({
    args: {
        assignmentId: v.id("assignments"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. get all submissions for this student on this assignment
        const submissions = await ctx.db
            .query("submissions")
            .withIndex("assignmentId_userId", (q) =>
                q.eq("assignmentId", args.assignmentId).eq("userId", authUserId)
            )
            .collect()

        if (submissions.length === 0) return null

        // 3. sort by attemptNumber descending to get the latest
        submissions.sort((a, b) => b.attemptNumber - a.attemptNumber)
        const latest = submissions[0]

        // 4. enrich with files
        const files = await ctx.db
            .query("submission_files")
            .withIndex("submissionId", (q) => q.eq("submissionId", latest._id))
            .collect()

        return {
            ...latest,
            files: files.filter((f) => !f.deletedAt),
            allAttempts: submissions,   // student can see their history
        }
    },
})

// --- getSubmissionsByAssignment ---
// teacher/evaluator view — all student submissions for one assignment
// enriched with student name and file count
// REQ-ENR-002 pattern: restricted to course owner or co-instructor
export const getSubmissionsByAssignment = query({
    args: {
        assignmentId: v.id("assignments"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. must be course instructor
        await requireCourseRole(ctx.db, authUserId, args.courseId)

        // 3. get all submissions for this assignment
        const submissions = await ctx.db
            .query("submissions")
            .withIndex("assignmentId", (q) => q.eq("assignmentId", args.assignmentId))
            .collect()

        // 4. enrich each submission with student name and files
        const enriched = await Promise.all(
            submissions.map(async (submission) => {
                const student = await ctx.db.get(submission.userId)

                const files = await ctx.db
                    .query("submission_files")
                    .withIndex("submissionId", (q) => q.eq("submissionId", submission._id))
                    .collect()

                return {
                    ...submission,
                    studentName: student
                        ? `${student.fName ?? ""} ${student.lName ?? ""}`.trim()
                        : "Unknown",
                    studentEmail: student?.email ?? null,
                    fileCount: files.filter((f) => !f.deletedAt).length,
                    files: files.filter((f) => !f.deletedAt),
                }
            })
        )

        // sort: ungraded first, then by submission time descending
        return enriched.sort((a, b) => {
            if (a.status === "graded" && b.status !== "graded") return 1
            if (a.status !== "graded" && b.status === "graded") return -1
            return (b.submittedAt ?? 0) - (a.submittedAt ?? 0)
        })
    },
})

// getAllAssignmentsForTeacher — lists all assignments across teacher's courses
export const getAllAssignmentsForTeacher = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    const courses = await ctx.db
      .query("courses")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect()

    const result = await Promise.all(
      courses.map(async (course) => {
        const chapters = await ctx.db
          .query("chapters")
          .withIndex("courseId", (q) => q.eq("courseId", course._id))
          .collect()

        const assignments = await Promise.all(
          chapters.map(async (chapter) => {
            const items: any[] = []

            // chapter-level assignments
            const chapterAssignments = await ctx.db
              .query("assignments")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .collect()
            for (const a of chapterAssignments.filter((a) => !a.deletedAt)) {
              // count submissions for this assignment
              const subs = await ctx.db
                .query("submissions")
                .withIndex("assignmentId", (q) => q.eq("assignmentId", a._id))
                .collect()
              items.push({
                ...a,
                lessonId: null,
                belongsTo: `Chapter: ${chapter.title}`,
                chapterTitle: chapter.title,
                courseTitle: course.title,
                courseId: course._id,
                submissionCount: subs.length,
              })
            }

            // lesson-level assignments
            const lessons = await ctx.db
              .query("lessons")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .collect()
            for (const lesson of lessons) {
              const lessonAssignments = await ctx.db
                .query("assignments")
                .withIndex("lessonId", (q) => q.eq("lessonId", lesson._id))
                .collect()
              for (const a of lessonAssignments.filter((a) => !a.deletedAt)) {
                const subs = await ctx.db
                  .query("submissions")
                  .withIndex("assignmentId", (q) => q.eq("assignmentId", a._id))
                  .collect()
                items.push({
                  ...a,
                  lessonId: a.lessonId ?? null,
                  belongsTo: `Lesson: ${lesson.title}`,
                  chapterTitle: chapter.title,
                  courseTitle: course.title,
                  courseId: course._id,
                  submissionCount: subs.length,
                })
              }
            }
            return items
          })
        )
        return assignments.flat()
      })
    )
    return result.flat()
  },
})

// --- getAllAssignmentsForStudent --- 
// all assignments grouped by course
export const getAllAssignmentsForStudent = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect()

    const grouped = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId)
        if (!course) return null

        const chapters = await ctx.db
          .query("chapters")
          .withIndex("courseId", (q) => q.eq("courseId", enrollment.courseId))
          .collect()
        chapters.sort((a, b) => a.index - b.index)

        const assignments = await Promise.all(
          chapters.map(async (chapter) => {
            const items: any[] = []

            const lessons = await ctx.db
              .query("lessons")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .collect()
            lessons.sort((a, b) => a.index - b.index)
            const firstLessonId = lessons[0]?._id

            const chapterAssignments = await ctx.db
              .query("assignments")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .collect()
            for (const a of chapterAssignments.filter((x) => !x.deletedAt)) {
              const sub = await ctx.db
                .query("submissions")
                .withIndex("assignmentId_userId", (q) =>
                  q.eq("assignmentId", a._id).eq("userId", authUserId)
                )
                .first()
              items.push({
                ...a,
                belongsTo: `Chapter: ${chapter.title}`,
                chapterTitle: chapter.title,
                navigationLessonId: firstLessonId,
                submitted: !!sub,
                submissionStatus: sub?.status ?? null,
                score: sub?.score ?? null,
              })
            }

            for (const lesson of lessons) {
              const lessonAssignments = await ctx.db
                .query("assignments")
                .withIndex("lessonId", (q) => q.eq("lessonId", lesson._id))
                .collect()
              for (const a of lessonAssignments.filter((x) => !x.deletedAt)) {
                const sub = await ctx.db
                  .query("submissions")
                  .withIndex("assignmentId_userId", (q) =>
                    q.eq("assignmentId", a._id).eq("userId", authUserId)
                  )
                  .first()
                items.push({
                  ...a,
                  belongsTo: `Lesson: ${lesson.title}`,
                  chapterTitle: chapter.title,
                  lessonId: lesson._id,
                  navigationLessonId: lesson._id,
                  submitted: !!sub,
                  submissionStatus: sub?.status ?? null,
                  score: sub?.score ?? null,
                })
              }
            }
            return items
          })
        )

        return {
          courseId: enrollment.courseId,
          courseTitle: course.title,
          assignments: assignments.flat(),
        }
      })
    )
    return grouped.filter(Boolean)
  },
})

// getAssignmentWithCourse — fetches assignment + resolves courseId
// needed on the standalone assignment editor page where we only have assignmentId
export const getAssignmentWithCourse = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    const assignment = await ctx.db.get(args.assignmentId)
    if (!assignment || assignment.deletedAt) throw new Error("Not found")

    // resolve courseId from lesson or chapter chain
    let courseId
    if (assignment.lessonId) {
      const lesson = await ctx.db.get(assignment.lessonId)
      const chapter = await ctx.db.get(lesson!.chapterId)
      courseId = chapter!.courseId
    } else {
      const chapter = await ctx.db.get(assignment.chapterId!)
      courseId = chapter!.courseId
    }

    await requireCourseRole(ctx.db, authUserId as any, courseId as any)

    return { assignment, courseId }
  },
})