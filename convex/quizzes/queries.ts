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