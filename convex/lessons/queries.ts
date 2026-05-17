import { v } from "convex/values"
import { query } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole } from "../lib/authorization"

// getLessonsByChapter — teacher facing
// used in course editor to list lessons per chapter
export const getLessonsByChapter = query({
  args: {
    chapterId: v.id("chapters"),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // teacher must be instructor on this course
    await requireCourseRole(ctx.db, authUserId, chapter.courseId)

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("chapterId", (q) => q.eq("chapterId", args.chapterId))
      .collect()

    return lessons.sort((a, b) => a.index - b.index)
  },
})

// getLessonById — teacher facing
// no enrollment check — uses requireCourseRole instead
// used by lesson editor page
export const getLessonById = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // 2. get lesson
    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson) throw new Error("Lesson not found")

    // 3. get chapter to find courseId
    const chapter = await ctx.db.get(lesson.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    // 4. role check — must be instructor on this course
    await requireCourseRole(ctx.db, authUserId, chapter.courseId)

    return lesson
  },
})

// getLessonContent — student facing
// returns lesson + completion status for the lesson viewer
// uses enrollment check instead of requireCourseRole
// because students are in enrollments table, not course_instructors
export const getLessonContent = query({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // 2. enrollment check — student must be enrolled
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("userId_courseId", (q) =>
        q.eq("userId", authUserId).eq("courseId", args.courseId)
      )
      .first()
    if (!enrollment) throw new Error("Not enrolled in this course")

    // 3. get lesson
    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson) throw new Error("Lesson not found")

    // 4. get chapter for context
    const chapter = await ctx.db.get(lesson.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    // 5. check if this student has already completed this lesson
    const completion = await ctx.db
      .query("lesson_completions")
      .withIndex("userId_lessonId", (q) =>
        q.eq("userId", authUserId).eq("lessonId", args.lessonId)
      )
      .first()

    return {
      ...lesson,
      chapterTitle: chapter.title,
      chapterIndex: chapter.index,
      isCompleted: !!completion,
    }
  },
})

// getCourseProgressForStudent — student facing
// returns all chapters with lessons + completion status
// used for lesson viewer sidebar and progress tracking
export const getCourseProgressForStudent = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // 2. enrollment check
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("userId_courseId", (q) =>
        q.eq("userId", authUserId).eq("courseId", args.courseId)
      )
      .first()
    if (!enrollment) throw new Error("Not enrolled")

    // 3. get chapters sorted by index
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect()
    chapters.sort((a, b) => a.index - b.index)

    // 4. for each chapter get lessons with completion status
    const chaptersWithProgress = await Promise.all(
      chapters.map(async (chapter) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
          .collect()
        lessons.sort((a, b) => a.index - b.index)

        const lessonsWithCompletion = await Promise.all(
          lessons.map(async (lesson) => {
            const completion = await ctx.db
              .query("lesson_completions")
              .withIndex("userId_lessonId", (q) =>
                q.eq("userId", authUserId).eq("lessonId", lesson._id)
              )
              .first()
            return { ...lesson, isCompleted: !!completion }
          })
        )

        return { ...chapter, lessons: lessonsWithCompletion }
      })
    )

    // 5. calculate progress percentage
    const allLessons = chaptersWithProgress.flatMap((c) => c.lessons)
    const completedCount = allLessons.filter((l) => l.isCompleted).length
    const totalCount = allLessons.length
    const progressPercent = totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0

    return {
      chapters: chaptersWithProgress,
      completedCount,
      totalCount,
      progressPercent,
    }
  },
})