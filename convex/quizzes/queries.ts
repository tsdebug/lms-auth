import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// --- getQuizByLesson ---
// fetch quiz with all questions and answers for a lesson
// USED BY: QuizBuilder (teacher), QuizPlayer (student)
// linking: lessonId → quiz → questions → answers (nested enrichment)
export const getQuizByLesson = query({
    args: {
        lessonId: v.id("lessons"),
    },
    handler: async (ctx, args) => {

        // 1. Auth check
        const authUserId = getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. find quiz attached to this lesson
        // return null if no quiz attached to this lesson - not an error
        const quiz = await ctx.db
            .query("quizzes")
            .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
            .first();

        if (!quiz) return null;

        // 3. get all questions sorted by index (display order)
        const questions = await ctx.db
            .query("q_questions")
            .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
            .collect();
        questions.sort((a, b) => a.index - b.index);

        // 4. enrich each question with its answer options
        // Promise.all runs all answer fetches simultaneously (parallel)
        const questionsWithAnswers = await Promise.all(
            questions.map(async (question) => {
                const answers = await ctx.db
                    .query("q_answers")
                    .withIndex("questionId", (q) => q.eq("questionId", question._id)) // question._id is the foreign key in q_answers
                    .collect();
                return { ...question, answers }; // enrich question with its answers
            })
        )

        // 5. return quiz with nested questions and answers
        return { ...quiz, questions: questionsWithAnswers };
    },
})

// --- getQuizAttempt ---
// fetch a student's completed attempt for a quiz
// USED BY: QuizPlayer — to show results if already attempted
// LINKING: userId + quizId → attempt → user_answers
// returns null if student hasn't attempted yet
export const getQuizAttempt = query({
    args: {
        quizId: v.id("quizzes"),
    },
    handler: async (ctx, args)=>{
        // 1. Auth check
        const authUserId = await getAuthUserId(ctx); 
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. find attempt using compound index on quizId + userId
        const attempt = await ctx.db
            .query("quiz_attempts")
            .withIndex("userId_quizId", (q)=> q.eq("userId", authUserId).eq("quizId", args.quizId))
            .first();

            if (!attempt) return null; // if no attempt found, return null (not an error)

        // 3. get all user answers for this attempt
        const userAnswers = await ctx.db
            .query("user_answers")
            .withIndex("attemptId", (q) => q.eq("attemptId", attempt._id)) // attempt._id is the foreign key in user_answers
            .collect();
        
            return { ...attempt, userAnswers }; // return attempt enriched with user's answers
    },
})