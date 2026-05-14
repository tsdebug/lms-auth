import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireCourseRole } from "../lib/authorization";

// --- createQuiz ---
// teacher attaches one quiz to a lesson
// linking: lessonId links quiz to lesson to check permissions we follow: lesson → chapter → courseId
// RULE: one quiz per lesson only
export const createQuiz = mutation({
    // args = data that comes FROM OUTSIDE (from the frontend calling this function)
    args: {
        lessonId: v.id("lessons"), // which lesson this quiz belongs to
        title: v.string(),
        description: v.string(),
        totalScore: v.number(), // max possible score e.g. 100
    },
    handler: async (ctx, args) => {

        // 1. Auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. Follow the chain to get courseId for role check
        // quiz live on lesson, lesson live on chapter, chapter live on course (quiz ->> lesson → chapter ->> courseId)
        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        const chapter = await ctx.db.get(lesson.chapterId);
        if (!chapter) throw new Error("Chapter not found");

        // 3. Role check - only course instructor can create quiz
        await requireCourseRole(ctx.db, authUserId, chapter.courseId);

        // 4. One quiz per lesson rule check
        const existingQuiz = await ctx.db
            .query("quizzes")
            .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
            .first();

        if (existingQuiz) throw new Error("A quiz for this lesson already exists");

        // 5. Create quiz
        return await ctx.db.insert("quizzes", {
            title: args.title,
            description: args.description,
            lessonId: args.lessonId,
            totalScore: args.totalScore,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })
    },
})

// ---createQuizQuestion---
// teacher adds questions to an existing quiz
// linking: quizId links question to quiz to check permissions we follow: question ->> quiz → lesson → chapter ->> courseId
// RULE: a quiz can have multiple questions
export const createQuizQuestion = mutation({
    args: {
        quizId: v.id("quizzes"),    // which quiz this question belongs to
        content: v.string(),        // the question text
        quesScore: v.number(),
    },
    handler: async (ctx, args) => {
        // 1. Auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. Follow the chain to get courseId for role check (question ->> quiz → lesson → chapter ->> courseId)
        const quiz = await ctx.db.get(args.quizId);
        if (!quiz) throw new Error("Quiz not found");

        const lesson = await ctx.db.get(quiz.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        const chapter = await ctx.db.get(lesson.chapterId);
        if (!chapter) throw new Error("Chapter not found");

        // 3. Role check - only course instructor can create question
        await requireCourseRole(ctx.db, authUserId, chapter.courseId);

        // 4. count existing questions to set display order index
        const existingQuestionsCount = await ctx.db
            .query("q_questions")
            .withIndex("quizId", (q) => q.eq("quizId", args.quizId))
            .collect();

        // 5. Create quiz question
        return await ctx.db.insert("q_questions", {
            content: args.content,
            quizId: args.quizId,
            quesScore: args.quesScore,
            index: existingQuestionsCount.length,  // 0-based position
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })

    }
})