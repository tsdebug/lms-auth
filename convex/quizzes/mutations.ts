import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireCourseRole, requireEnrollment } from "../lib/authorization";

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
        passingScore: v.optional(v.number()), // optional minimum passing score; defaults to totalScore when omitted
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

        // 5. Create quiz (default passingScore to totalScore when not provided)
        const passingScore = args.passingScore ?? args.totalScore

        return await ctx.db.insert("quizzes", {
            title: args.title,
            description: args.description,
            lessonId: args.lessonId,
            totalScore: args.totalScore,
            passingScore,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })
    },
})

// ---createQuestion---
// teacher adds questions to an existing quiz
// linking: quizId links question to quiz to check permissions we follow: question ->> quiz → lesson → chapter ->> courseId
// RULE: a quiz can have multiple questions
export const createQuestion = mutation({
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

// --- createAnswers ---
// teacher adds answer options to a quiz question
// linking: questionId links answers to question to check permissions we follow: answer ->> question → quiz → lesson → chapter ->> courseId
// RULE: a question can have multiple answer options, but only one correct answer
export const createAnswers = mutation({
    args: {
        questionId: v.id("q_questions"), // which question this answer option belongs to
        // array because teacher adds multiple options at once, frontend will enforce only one correct answer
        answers: v.array(
            v.object({
                content: v.string(), // the answer text
                isCorrect: v.boolean(), // only one should be true
            })
        )
    },
    handler: async (ctx, args) => {
        // 1. Auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. Follow the chain to get courseId for role check (answer ->> question → quiz → lesson → chapter ->> courseId)
        const question = await ctx.db.get(args.questionId);
        if (!question) throw new Error("Question not found");

        const quiz = await ctx.db.get(question.quizId);
        if (!quiz) throw new Error("Quiz not found");

        const lesson = await ctx.db.get(quiz.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        const chapter = await ctx.db.get(lesson.chapterId);
        if (!chapter) throw new Error("Chapter not found");

        // 3. Role check - only course instructor can create answer option
        await requireCourseRole(ctx.db, authUserId, chapter.courseId);

        // 4. Validation: only one correct answer allowed
        const correctAnswersCount = args.answers.filter((ans) => ans.isCorrect).length;
        if (correctAnswersCount !== 1) {
            throw new Error("There must be exactly one correct answer");
        }

        // 5. Create answer options
        for (const answer of args.answers) {
            await ctx.db.insert("q_answers", {
                content: answer.content,
                isCorrect: answer.isCorrect,
                questionId: args.questionId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
        }
    }
})

// --- submitQuiz ---
// student submits their answers to a quiz
// linking: quizId links attempt to quiz, userId links attempt to student attemptId links user_answers to attempt
// to check permissions we follow: attempt ->> quiz → lesson → chapter ->> courseId
// RULES:
//   creates quiz_attempts + user_answers, returns score
//   student cannot resubmit — userId_quizId index checked
// HOW SCORING WORKS:
//   for each submitted answer → check if chosen answerId has isCorrect:true
//   if correct → add that question's quesScore to total
export const submitQuiz = mutation({
    args: {
        quizId: v.id("quizzes"), // which quiz is being submitted
        // one entry per question - questionId + which answerId student chose
        answers: v.array(
            v.object({
                questionId: v.id("q_questions"), // which question is being answered
                answerId: v.id("q_answers")       // which answer option student chose for that question
            })
        )
    },
    handler: async (ctx, args) => {
        // 1. Auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. chain attempt ->> quiz → lesson → chapter ->> courseId to check permissions
        const quiz = await ctx.db.get(args.quizId);
        if (!quiz) throw new Error("Quiz not found");

        const lesson = await ctx.db.get(quiz.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        const chapter = await ctx.db.get(lesson.chapterId);
        if (!chapter) throw new Error("Chapter not found");

        // 3. Role check - only students can submit quiz
        await requireEnrollment(ctx.db, authUserId, chapter.courseId);

        // 4. Check if student already submitted (userId_quizId unique index)
        const existingAttempt = await ctx.db
            .query("quiz_attempts")
            .withIndex("userId_quizId", (q) => q.eq("userId", authUserId).eq("quizId", args.quizId))
            .first();
        if (existingAttempt?.completedAt) throw new Error("You have already submitted this quiz");

        // 5. create attempt row
        const attemptId = await ctx.db.insert("quiz_attempts", {
            quizId: args.quizId,
            userId: authUserId,
            score: 0, // to be updated after grading
            maxScore: quiz.totalScore,
            startedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })

        // 6. insert one user_answers row per submitted answer
        for (const answer of args.answers) {
            await ctx.db.insert("user_answers", {
                attemptId,
                questionId: answer.questionId,
                answerId: answer.answerId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
        }

        // 7. calculate score - for each answer check if chosen answer is marked isCorrect in db
        let score = 0;
        const results = await Promise.all(
            args.answers.map(async (answer) => {
                // get the question to know its point value
                const question = await ctx.db.get(answer.questionId)
                // get the answer the student chose
                const chosenAnswer = await ctx.db.get(answer.answerId)

                // if the chosen answer is correct, add this question's score
                if (chosenAnswer?.isCorrect && question) {
                    score += question.quesScore;
                }

                // find the correct answer for this question - return to frontend so student can see what was right
                const correctAnswer = await ctx.db
                    .query("q_answers")
                    .withIndex("questionId", (q) => q.eq("questionId", answer.questionId))
                    .filter((q) => q.eq(q.field("isCorrect"), true))
                    .first()

                return {
                    questionId: answer.questionId,
                    chosenAnswerId: answer.answerId,
                    correctAnswerId: correctAnswer?._id,
                    isCorrect: chosenAnswer?.isCorrect ?? false,
                }
            })
        );

        // 8. patch attempt with final score + completion time
        await ctx.db.patch(attemptId, {
            score,
            completedAt: Date.now(),
            updatedAt: Date.now(),
        })

        // 9. return result to frontend for immediate display
        return { score, maxScore: quiz.totalScore, results }
    },
})

// --- updateQuiz ---
// teachers can update quiz title or total score
// linking : quizId ->> quiz → lesson → chapter ->> courseId for permissions
export const updateQuiz = mutation({
    args: {
        quizId: v.id("quizzes"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        totalScore: v.optional(v.number()),
        passingScore: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // get the quiz using the quizId
        const quiz = await ctx.db.get(args.quizId);
        if (!quiz) throw new Error("Quiz not found");

        // if quiz found, find the lesson it belongs to
        const lesson = await ctx.db.get(quiz.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        // if lesson found, find the chapter the lesson belongs to
        const chapter = await ctx.db.get(lesson.chapterId);
        if (!chapter) throw new Error("Chapter not found");

        // 2. role check - only course instructor can update quiz
        await requireCourseRole(ctx.db, authUserId, chapter.courseId);

        // 3. update quiz - only update fields that were provided (non-undefined)
        const { quizId, ...fields } = args
        await ctx.db.patch(args.quizId, {
            ...fields,
            updatedAt: Date.now(),
        })
    },
})


// --- updateQuestion ---
// teachers can update question content or score
// linking : questionId ->> question → quiz → lesson → chapter ->> courseId for permissions
export const updateQuestion = mutation({
    args: {
        questionId: v.id("q_questions"),
        content: v.optional(v.string()),
        quesScore: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        const question = await ctx.db.get(args.questionId)
        if (!question) throw new Error("Question not found")

        const quiz = await ctx.db.get(question.quizId)
        if (!quiz) throw new Error("Quiz not found")

        const lesson = await ctx.db.get(quiz.lessonId)
        if (!lesson) throw new Error("Lesson not found")

        const chapter = await ctx.db.get(lesson.chapterId)
        if (!chapter) throw new Error("Chapter not found")

        await requireCourseRole(ctx.db, authUserId, chapter.courseId)

        const { questionId, ...fields } = args
        await ctx.db.patch(args.questionId, {
            ...fields,
            updatedAt: Date.now(),
        })
    },
})


// --- deleteQuestion ---
// teachers can delete a quiz question
// linking : questionId ->> question → quiz → lesson → chapter ->> courseId for permissions
export const deleteQuestion = mutation({
    args: {
        questionId: v.id("q_questions"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. role check - only teachers can delete a quiz question
        // find the question using the questionId
        const question = await ctx.db.get(args.questionId)
        if (!question) throw new Error("Question not found")

        // if question found, find the quiz it belongs to 
        const quiz = await ctx.db.get(question.quizId)
        if (!quiz) throw new Error("Quiz not found")

        // if quiz found, find the lesson it belongs to
        const lesson = await ctx.db.get(quiz.lessonId)
        if (!lesson) throw new Error("Lesson not found")

        // if lesson found, find the course it belongs to find the courseId for role check
        const chapter = await ctx.db.get(lesson.chapterId)
        if (!chapter) throw new Error("Chapter not found")

        await requireCourseRole(ctx.db, authUserId, chapter.courseId)

        // delete all answers for this question first
        const answers = await ctx.db
            .query("q_answers")
            .withIndex("questionId", (q) => q.eq("questionId", args.questionId))
            .collect()

        for (const answer of answers) {
            await ctx.db.delete(answer._id)
        }

        // then delete the question
        await ctx.db.delete(args.questionId)
    },
})

// --- updateAnswers --- 
// teachers replace all answer options for a quiz question 
// deletes existing answers and inserts fresh ones
export const updateAnswers = mutation({
    args: {
        questionId: v.id("q_questions"),
        answers: v.array(
            v.object({
                content: v.string(),
                isCorrect: v.boolean(),
            })
        ),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. role check - only teachers can update quiz question answers
        // find the question using the questionId
        const question = await ctx.db.get(args.questionId)
        if (!question) throw new Error("Question not found")

        // if question found, find the quiz it belongs to
        const quiz = await ctx.db.get(question.quizId)
        if (!quiz) throw new Error("Quiz not found")

        // if quiz found, find the lesson it belongs to
        const lesson = await ctx.db.get(quiz.lessonId)
        if (!lesson) throw new Error("Lesson not found")

        // if lesson found, find the chapter the lesson belongs to, to get the courseId
        const chapter = await ctx.db.get(lesson.chapterId)
        if (!chapter) throw new Error("Chapter not found")

        await requireCourseRole(ctx.db, authUserId, chapter.courseId)

        // validate exactly one correct answer
        const correctAnswers = args.answers.filter((a) => a.isCorrect) // this statement is used for validation only, we will still insert all answers even if multiple are marked correct, frontend should prevent this but we check again here to be safe
        if (correctAnswers.length === 0) {
            throw new Error("Mark one answer as correct")
        }
        if (correctAnswers.length > 1) {
            throw new Error("Only one answer can be correct")
        }
        // delete existing answers
        const existing = await ctx.db
            .query("q_answers")
            .withIndex("questionId", (q) => q.eq("questionId", args.questionId))
            .collect()

        for (const answer of existing) {
            await ctx.db.delete(answer._id)
        }

        // insert fresh answers
        for (const answer of args.answers) {
            await ctx.db.insert("q_answers", {
                content: answer.content,
                questionId: args.questionId,
                isCorrect: answer.isCorrect,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
        }
    },
})
