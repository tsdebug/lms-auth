import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// 1. We extract the default users table from Convex Auth
const authUsers = authTables.users;

export default defineSchema({

  ...authTables,  // adds users, sessions, and other tables needed for authentication

  // - `v.string()` = Any random text like "abc123" or "hello"
  // - `v.id("users")` = A REAL ID that points to an ACTUAL user in the users table

  // ----- Users table (The Single Source of Truth for Auth & Profiles) -----
  users: defineTable({
    ...authUsers.validator.fields, // Keeps email, passwordHash, etc. from Auth
    role: v.optional(v.union(v.literal("teacher"), v.literal("student"))),
    fName: v.optional(v.string()),
    mName: v.optional(v.string()),
    lName: v.optional(v.string()),
    slug: v.optional(v.string()),
    pfpUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
  }).index("email", ["email"])
    .index("slug", ["slug"]),


  // DELETED: profiles, roles, user_roles. (They are no longer needed!)

  // ----- Profiles table -----

  // profiles: defineTable({
  //   userId: v.id("users"),
  //   fName: v.string(),
  //   mName: v.optional(v.string()),
  //   lName: v.string(),
  //   slug: v.string(),
  //   pfpUrl: v.optional(v.string()),
  //   bio: v.optional(v.string()),
  //   createdAt: v.number(),
  //   updatedAt: v.number(),
  //   deletedAt: v.optional(v.number()),
  // })
  //   .index("userId", ["userId"])  // Foreign key
  //   .index("slug", ["slug"]),   // to search profiles by slug for public profile pages


  // // ----- Roles table -----

  // roles: defineTable({
  //   name: v.string(),   // "Student", "Course Creator", "Moderator", etc.
  //   description: v.optional(v.string()),
  //   createdAt: v.number(),
  //   updatedAt: v.number(),
  //   deletedAt: v.optional(v.number()),
  // }).index("name", ["name"]),       // to search roles by name

  // // ----- Bridge table b/w users and roles-----
  // user_roles: defineTable({
  //   userId: v.id("users"),
  //   roleId: v.id("roles"),
  //   createdAt: v.number(),
  //   updatedAt: v.number(),
  //   deletedAt: v.optional(v.number()),
  // })
  //   .index("userId", ["userId"])
  //   .index("roleId", ["roleId"])
  //   .index("userId_roleId", ["userId", "roleId"]),

  // ----- Courses table -----
  courses: defineTable({
    title: v.string(),
    userId: v.id("users"),  // which user created this course
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    status: v.string(),  // "draft", "published", "archived" 
  }).index("userId", ["userId"])              // Foreign key
    .index("status", ["status"])              // Find courses by status
    .index("userId_title", ["userId", "title"]),  // user can't have duplicate course titles

  // ----- Chapters table -----
  chapters: defineTable({
    title: v.string(),
    index: v.number(),  // chap order
    courseId: v.id("courses"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("courseId", ["courseId"])           // Foreign key
    .index("courseId_index", ["courseId", "index"]),  // chapter order per course is uniqye

  // ----- Lessons table -----
  lessons: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    chapterId: v.id("chapters"),
    index: v.number(),  // lesson order within chapter
  }).index("chapterId", ["chapterId"])          // Foreign key
    .index("chapterId_index", ["chapterId", "index"]),  // lesson order per chapter is unique

  // ----- Quizzes table -----
  quizzes: defineTable({
    title: v.string(),
    totalScore: v.number(),
    lessonId: v.id("lessons"),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("lessonId", ["lessonId"]),  // Foreign key

  // ----- Quiz Questions table -----
  q_questions: defineTable({
    content: v.string(),
    quizId: v.id("quizzes"),
    quesScore: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    index: v.number(),  // question order
  }).index("quizId", ["quizId"]) // Foreign key
    .index("quizId_index", ["quizId", "index"]),  // question 1, 2, 3 unique per quiz

  // ----- Quiz Answers table -----
  q_answers: defineTable({
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    questionId: v.id("q_questions"),
    isCorrect: v.boolean(),  // true if this is the right answer
  }).index("questionId", ["questionId"]), // Foreign key

  // ----- Schedules table -----
  schedules: defineTable({
    userId: v.id("users"),  // whose availability schedule
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    scheduleType: v.string(),  // "recurring" or "one_time"
    dayOfWeek: v.optional(v.number()),  // only for recurring
    specificDate: v.optional(v.string()),  // only for one_time
    startTime: v.string(),  // e.g., 09:00
    endTime: v.string(),    // e.g., 17:00
    isAvailable: v.boolean(),  // true = available, false = blocked
  }).index("userId", ["userId"]),  // Foreign key

  // ----- Quiz attempts table -----
  quiz_attempts: defineTable({
    userId: v.id("users"),
    quizId: v.id("quizzes"),
    score: v.number(),
    maxScore: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("quizId", ["quizId"]),

  // ----- User answers table -----
  user_answers: defineTable({
    attemptId: v.id("quiz_attempts"),
    questionId: v.id("q_questions"),
    answerId: v.id("q_answers"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("attemptId", ["attemptId"])
    .index("questionId", ["questionId"])
    .index("answerId", ["answerId"]),

  // ----- Enrollments table -----
  enrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
    status: v.string(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("courseId", ["courseId"])
    .index("userId_courseId", ["userId", "courseId"]),

  // ----- Lesson completions table -----
  lesson_completions: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    completedAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("lessonId", ["lessonId"])
    .index("userId_lessonId", ["userId", "lessonId"]),

  // ----- Reviews table -----
  reviews: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    review: v.optional(v.string()),
    star: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("courseId", ["courseId"])
    .index("userId_courseId", ["userId", "courseId"]),

  // ----- Batches table -----
  batches: defineTable({
    name: v.string(),
    status: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("status", ["status"]),

  // ----- Batch students bridge table -----
  batch_students: defineTable({
    batchId: v.id("batches"),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("batchId", ["batchId"])
    .index("userId", ["userId"])
    .index("batchId_userId", ["batchId", "userId"]),

  // ----- Batch courses bridge table -----
  batch_courses: defineTable({
    batchId: v.id("batches"),
    courseId: v.id("courses"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("batchId", ["batchId"])
    .index("courseId", ["courseId"])
    .index("batchId_courseId", ["batchId", "courseId"]),

  // ----- Assignments table -----
  assignments: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    lessonId: v.id("lessons"),
    createdBy: v.id("users"),
    dueDate: v.string(),
    maxScore: v.number(),
    allowLateSubmission: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("lessonId", ["lessonId"])
    .index("createdBy", ["createdBy"]),

  // ----- Submissions table -----
  submissions: defineTable({
    assignmentId: v.id("assignments"),
    userId: v.id("users"),
    fileUrl: v.optional(v.string()),
    textSubmission: v.optional(v.string()),
    score: v.optional(v.number()),
    status: v.string(),
    feedback: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
    gradedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("assignmentId", ["assignmentId"])
    .index("userId", ["userId"])
    .index("assignmentId_userId", ["assignmentId", "userId"]),

  // ----- Categories table -----
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("name", ["name"]),

  // ----- Course categories table -----
  course_categories: defineTable({
    courseId: v.id("courses"),
    categoryId: v.id("categories"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("courseId", ["courseId"])
    .index("categoryId", ["categoryId"])
    .index("courseId_categoryId", ["courseId", "categoryId"]),

  // ----- Tags table -----
  tags: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("name", ["name"]),

  // ----- Course tags table -----
  course_tags: defineTable({
    courseId: v.id("courses"),
    tagId: v.id("tags"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("courseId", ["courseId"])
    .index("tagId", ["tagId"])
    .index("courseId_tagId", ["courseId", "tagId"]),

  // ----- Media files table -----
  media_files: defineTable({
    lessonId: v.id("lessons"),
    fileType: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    videoDuration: v.optional(v.number()),
    isDownloadable: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("lessonId", ["lessonId"]),

  // ----- Certificates table -----
  certificates: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    verificationCode: v.string(),
    completedAt: v.number(),
    issuedAt: v.number(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("courseId", ["courseId"])
    .index("verificationCode", ["verificationCode"])
    .index("userId_courseId", ["userId", "courseId"]),
});