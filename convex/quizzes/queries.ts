import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireCourseRole } from "../lib/authorization";

// --- getQuizForTeacher ---
// fetch quiz with all questions and answers INCLUDING isCorrect
// USED BY: QuizBuilder only
// ACCESS: course instructor only
export const getQuizForTeacher = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthenticated");

    // 2. follow chain to verify instructor role: lesson → chapter → courseId
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const chapter = await ctx.db.get(lesson.chapterId);
    if (!chapter) throw new Error("Chapter not found");

    await requireCourseRole(ctx.db, authUserId, chapter.courseId);

    // 3. find quiz attached to this lesson
    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();

    if (!quiz) return null;

    // 4. get questions sorted by index
    const questions = await ctx.db
      .query("q_questions")
      .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
      .collect();
    questions.sort((a, b) => a.index - b.index);

    // 5. enrich with answers — isCorrect included for teacher
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await ctx.db
          .query("q_answers")
          .withIndex("questionId", (q) => q.eq("questionId", question._id))
          .collect();
        return { ...question, answers };
      })
    );

    return { ...quiz, questions: questionsWithAnswers };
  },
});

// --- getQuizForStudent ---
// fetch quiz with questions and answers WITHOUT isCorrect
// isCorrect is stripped server-side — not just hidden in the frontend
// USED BY: QuizPlayer only
// ACCESS: enrolled students only
export const getQuizForStudent = query({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthenticated");

    // 2. enrollment check — must be enrolled to see quiz
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("userId_courseId", (q) =>
        q.eq("userId", authUserId).eq("courseId", args.courseId)
      )
      .first();
    if (!enrollment) throw new Error("Not enrolled in this course");

    // 3. find quiz
    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();

    if (!quiz) return null;

    // 4. get questions sorted by index
    const questions = await ctx.db
      .query("q_questions")
      .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
      .collect();
    questions.sort((a, b) => a.index - b.index);

    // 5. enrich with answers — isCorrect STRIPPED for students
    // student should not know the answer before submitting
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await ctx.db
          .query("q_answers")
          .withIndex("questionId", (q) => q.eq("questionId", question._id))
          .collect();

        // strip isCorrect from every answer before returning
        const safeAnswers = answers.map(({ isCorrect: _removed, ...rest }) => rest);

        return { ...question, answers: safeAnswers };
      })
    );

    return { ...quiz, questions: questionsWithAnswers };
  },
});

// --- getQuizAttempt ---
// fetch a student's completed attempt for a quiz
// USED BY: QuizPlayer — to show results if already attempted
// ACCESS: the student who made the attempt only
export const getQuizAttempt = query({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    // 1. auth check
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthenticated");

    // 2. find attempt for this user
    const attempt = await ctx.db
      .query("quiz_attempts")
      .withIndex("userId_quizId", (q) =>
        q.eq("userId", authUserId).eq("quizId", args.quizId)
      )
      .first();

    if (!attempt) return null;

    // 3. get user answers for this attempt
    const userAnswers = await ctx.db
      .query("user_answers")
      .withIndex("attemptId", (q) => q.eq("attemptId", attempt._id))
      .collect();

    return { ...attempt, userAnswers };
  },
});

// --- getQuizByLesson ---
// KEPT for backward compatibility — used internally by submitQuiz mutation chain
// This is the original query, still used by the mutations file to resolve quiz._id
// DO NOT use this in frontend components — use getQuizForTeacher or getQuizForStudent
export const getQuizByLesson = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthenticated");

    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();

    if (!quiz) return null;

    const questions = await ctx.db
      .query("q_questions")
      .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
      .collect();
    questions.sort((a, b) => a.index - b.index);

    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await ctx.db
          .query("q_answers")
          .withIndex("questionId", (q) => q.eq("questionId", question._id))
          .collect();
        return { ...question, answers };
      })
    );

    return { ...quiz, questions: questionsWithAnswers };
  },
});


// --- getQuizByChapterForTeacher ---
// same as getQuizForTeacher but for chapter-level quizzes
export const getQuizByChapterForTeacher = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    const chapter = await ctx.db.get(args.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    await requireCourseRole(ctx.db, authUserId, chapter.courseId)

    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("chapterId", (q) => q.eq("chapterId", args.chapterId))
      .first()
    if (!quiz) return null

    const questions = await ctx.db
      .query("q_questions")
      .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
      .collect()
    questions.sort((a, b) => a.index - b.index)

    const questionsWithAnswers = await Promise.all(
      questions.map(async (q) => {
        const answers = await ctx.db
          .query("q_answers")
          .withIndex("questionId", (qa) => qa.eq("questionId", q._id))
          .collect()
        return { ...q, answers }
      })
    )
    return { ...quiz, questions: questionsWithAnswers }
  },
})

// --- getAllQuizzesForTeacher --- 
// lists all quizzes across all teacher's courses
// used on /teacher/quizzes list page
export const getAllQuizzesForTeacher = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // get all courses this teacher owns
    const courses = await ctx.db
      .query("courses")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect()

    // for each course get chapters → lessons → quizzes
    const result = await Promise.all(
      courses.map(async (course) => {
        const chapters = await ctx.db
          .query("chapters")
          .withIndex("courseId", (q) => q.eq("courseId", course._id))
          .collect()

        const quizzes = await Promise.all(
          chapters.map(async (chapter) => {
            const chapterQuiz = await ctx.db
              .query("quizzes")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .first()

            const lessons = await ctx.db
              .query("lessons")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .collect()

            const lessonQuizzes = await Promise.all(
              lessons.map(async (lesson) => {
                const quiz = await ctx.db
                  .query("quizzes")
                  .withIndex("lessonId", (q) => q.eq("lessonId", lesson._id))
                  .first()
                if (!quiz) return null
                return {
                  ...quiz,
                  lessonId: quiz.lessonId ?? null,
                  // label for display: "Lesson: intro to python"
                  belongsTo: `Lesson: ${lesson.title}`,
                  chapterTitle: chapter.title,
                  courseTitle: course.title,
                  courseId: course._id,
                }
              })
            )

            const results = lessonQuizzes.filter(Boolean) as any[]
            if (chapterQuiz) {
              results.unshift({
                ...chapterQuiz,
                lessonId: null,
                belongsTo: `Chapter: ${chapter.title}`,
                chapterTitle: chapter.title,
                courseTitle: course.title,
                courseId: course._id,
              })
            }
            return results
          })
        )
        return quizzes.flat()
      })
    )
    return result.flat()
  },
})

// --- getAllQuizzesForStudent --- 
// all quizzes in courses the student is enrolled in
// grouped by course for the student quizzes page
export const getAllQuizzesForStudent = query({
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

        const quizzes = await Promise.all(
          chapters.map(async (chapter) => {
            const items: any[] = []

            // chapter-level quiz
            const chapterQuiz = await ctx.db
              .query("quizzes")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .first()
            if (chapterQuiz) {
              // check if student already attempted
              const attempt = await ctx.db
                .query("quiz_attempts")
                .withIndex("userId_quizId", (q) =>
                  q.eq("userId", authUserId).eq("quizId", chapterQuiz._id)
                )
                .first()
              items.push({
                ...chapterQuiz,
                belongsTo: `Chapter: ${chapter.title}`,
                chapterTitle: chapter.title,
                attempted: !!attempt?.completedAt,
                score: attempt?.score ?? null,
                maxScore: attempt?.maxScore ?? null,
              })
            }

            // lesson-level quizzes
            const lessons = await ctx.db
              .query("lessons")
              .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
              .collect()
            lessons.sort((a, b) => a.index - b.index)

            for (const lesson of lessons) {
              const quiz = await ctx.db
                .query("quizzes")
                .withIndex("lessonId", (q) => q.eq("lessonId", lesson._id))
                .first()
              if (!quiz) continue
              const attempt = await ctx.db
                .query("quiz_attempts")
                .withIndex("userId_quizId", (q) =>
                  q.eq("userId", authUserId).eq("quizId", quiz._id)
                )
                .first()
              items.push({
                ...quiz,
                belongsTo: `Lesson: ${lesson.title}`,
                chapterTitle: chapter.title,
                lessonId: lesson._id,
                attempted: !!attempt?.completedAt,
                score: attempt?.score ?? null,
                maxScore: attempt?.maxScore ?? null,
              })
            }
            return items
          })
        )

        return {
          courseId: enrollment.courseId,
          courseTitle: course.title,
          quizzes: quizzes.flat(),
        }
      })
    )

    return grouped.filter(Boolean)
  },
})

// getQuizById — fetch a single quiz by its ID, for the standalone editor page
export const getQuizById = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    const quiz = await ctx.db.get(args.quizId)
    if (!quiz) throw new Error("Quiz not found")

    // resolve courseId and check role
    let courseId
    if (quiz.lessonId) {
      const lesson = await ctx.db.get(quiz.lessonId)
      const chapter = await ctx.db.get(lesson!.chapterId)
      courseId = chapter!.courseId
    } else {
      const chapter = await ctx.db.get(quiz.chapterId!)
      courseId = chapter!.courseId
    }
    await requireCourseRole(ctx.db, authUserId, courseId)

    return quiz
  },
})