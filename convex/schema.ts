import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const authUsers = authTables.users;

export default defineSchema({
  ...authTables, // spread operator to include all auth tables (users, sessions, etc.) with their existing structure and indexes

  // ─── Users ───────────────────────────────────────────────────────────────
  // CHANGED: removed single `role` field — users can hold multiple roles per PRD §3.
  // Role membership now lives in user_roles bridge table.
  users: defineTable({
    ...authUsers.validator.fields,
    fName: v.optional(v.string()),
    mName: v.optional(v.string()),
    lName: v.optional(v.string()),
    slug: v.optional(v.string()),
    pfpUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    // ADDED: expertise tags for Teacher Discovery §12 filtering.
    // Stored as array of strings (e.g. ["Python", "Data Science"]).
    // Avoids a separate user_expertise junction table for a simple list.
    expertise: v.optional(v.array(v.string())),
    // ADDED: availability for mentoring/teaching sessions
    availability: v.optional(v.string()),
    // ADDED: experienceLevel for Teacher Directory card display (§12).
    experienceLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("slug", ["slug"]),

  // ─── Roles ───────────────────────────────────────────────────────────────
  // RESTORED: needed again because role is no longer a single field on users.
  // Keeping it as a table (not just an enum) means you can add new roles
  // (e.g. "moderator", "evaluator") in the future without a schema migration.
  roles: defineTable({
    name: v.string(), // "student" | "teacher" | "moderator" | "evaluator"
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("name", ["name"]),

  // ─── User Roles (bridge) ─────────────────────────────────────────────────
  // RESTORED: one user → many roles per PRD §3.
  user_roles: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("roleId", ["roleId"])
    .index("userId_roleId", ["userId", "roleId"]),

  // ─── Courses ─────────────────────────────────────────────────────────────
  // ADDED: thumbnailUrl, difficultyLevel, slug — required by PRD §4 and
  // Teacher Discovery §12 (courses shown on teacher profile card).
  courses: defineTable({
    title: v.string(),
    userId: v.id("users"),         // original creator / owner
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),   // PRD §4
    slug: v.optional(v.string()),           // clean URL: /courses/intro-to-python
    difficultyLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),                                      // PRD §4
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("slug", ["slug"])
    .index("userId_title", ["userId", "title"]),

  // ─── Course Instructors (bridge) ─────────────────────────────────────────
  // NEW: PRD §2 allows multiple instructors per course and per batch.
  // Separating this from `courses.userId` (the owner) lets co-instructors
  // exist without ownership transfer. Also powers Teacher Discovery §12
  // ("courses created by the teacher" on profile pages).
  course_instructors: defineTable({
    courseId: v.id("courses"),
    userId: v.id("users"),
    role: v.optional(v.string()), // "lead" | "co-instructor" | "evaluator"
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("courseId", ["courseId"])
    .index("userId", ["userId"])
    .index("courseId_userId", ["courseId", "userId"]),

  // ─── Chapters ────────────────────────────────────────────────────────────
  // Unchanged
  chapters: defineTable({
    title: v.string(),
    index: v.number(),
    courseId: v.id("courses"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("courseId", ["courseId"])
    .index("courseId_index", ["courseId", "index"]),

  // ─── Lessons ─────────────────────────────────────────────────────────────
  // Unchanged
  lessons: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    chapterId: v.id("chapters"),
    index: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("chapterId", ["chapterId"])
    .index("chapterId_index", ["chapterId", "index"]),

  // ─── Media Files ─────────────────────────────────────────────────────────
  // Unchanged
  media_files: defineTable({
    lessonId: v.id("lessons"),
    fileType: v.string(),   // "video" | "pdf" | "slides" | "code" | "image"
    fileName: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    videoDuration: v.optional(v.number()),
    isDownloadable: v.boolean(),
    index: v.number(),      // display order within lesson
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("lessonId", ["lessonId"]),

  // ─── Quizzes ─────────────────────────────────────────────────────────────
  // Unchanged
  quizzes: defineTable({
    title: v.string(),
    lessonId: v.id("lessons"),
    totalScore: v.number(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("lessonId", ["lessonId"]),

  // ─── Quiz Questions ───────────────────────────────────────────────────────
  // Unchanged
  q_questions: defineTable({
    content: v.string(),
    quizId: v.id("quizzes"),
    quesScore: v.number(),
    index: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("quizId", ["quizId"])
    .index("quizId_index", ["quizId", "index"]),

  // ─── Quiz Answers ─────────────────────────────────────────────────────────
  // Unchanged
  q_answers: defineTable({
    content: v.string(),
    questionId: v.id("q_questions"),
    isCorrect: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("questionId", ["questionId"]),

  // ─── Quiz Attempts ────────────────────────────────────────────────────────
  // ADDED: startedAt — lets you detect and expire abandoned attempts.
  // Without it there's no way to distinguish "in progress" from "abandoned".
  quiz_attempts: defineTable({
    userId: v.id("users"),
    quizId: v.id("quizzes"),
    score: v.number(),
    maxScore: v.number(),
    startedAt: v.number(),        // ADDED
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("quizId", ["quizId"])
    .index("userId_quizId", ["userId", "quizId"]),  // ADDED: check if student already attempted

  // ─── User Answers ─────────────────────────────────────────────────────────
  // Unchanged
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

  // ─── Assignments ─────────────────────────────────────────────────────────
  // CHANGED: lessonId made optional, chapterId added.
  // PRD §7: "Instructors can create assignments associated with lessons OR chapters."
  // At least one of lessonId/chapterId should be set (enforce in application logic).
  assignments: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    lessonId: v.optional(v.id("lessons")),    // CHANGED to optional
    chapterId: v.optional(v.id("chapters")),  // ADDED
    createdBy: v.id("users"),
    dueDate: v.string(),
    maxScore: v.number(),
    allowLateSubmission: v.boolean(),
    allowResubmission: v.boolean(),           // ADDED: PRD §7 mentions resubmission
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("lessonId", ["lessonId"])
    .index("chapterId", ["chapterId"])        // ADDED
    .index("createdBy", ["createdBy"]),

  // ─── Submissions ─────────────────────────────────────────────────────────
  // CHANGED: single fileUrl → separate table submission_files for multi-file support.
  // PRD §7: students can submit file uploads, text, AND external links — possibly all three.
  // The scalar fields (textSubmission, linkUrl) stay here. Files get their own table.
  submissions: defineTable({
    assignmentId: v.id("assignments"),
    userId: v.id("users"),
    textSubmission: v.optional(v.string()),
    linkUrl: v.optional(v.string()),          // ADDED: external link submissions (PRD §7)
    score: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("graded"),
      v.literal("resubmitted")               // ADDED: for resubmission tracking
    ),
    feedback: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
    gradedAt: v.optional(v.number()),
    gradedBy: v.optional(v.id("users")),      // ADDED: PRD §2 says evaluators grade, not just instructors
    attemptNumber: v.number(),                // ADDED: 1 for first submission, 2 for resubmission, etc.
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("assignmentId", ["assignmentId"])
    .index("userId", ["userId"])
    .index("assignmentId_userId", ["assignmentId", "userId"]),

  // ─── Submission Files ─────────────────────────────────────────────────────
  // NEW: supports multiple file uploads per submission (PRD §7).
  submission_files: defineTable({
    submissionId: v.id("submissions"),
    fileUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("submissionId", ["submissionId"]),

  // ─── Enrollments ─────────────────────────────────────────────────────────
  // Unchanged
  enrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("dropped")
    ),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("courseId", ["courseId"])
    .index("userId_courseId", ["userId", "courseId"]),

  // ─── Lesson Completions ───────────────────────────────────────────────────
  // Unchanged
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

  // ─── Schedules ────────────────────────────────────────────────────────────
  // ADDED: timezone — essential for a platform where instructors and students
  // are in different time zones. Without it, "09:00" is ambiguous.
  schedules: defineTable({
    userId: v.id("users"),
    scheduleType: v.union(v.literal("recurring"), v.literal("one_time")),
    dayOfWeek: v.optional(v.number()),    // 0=Sun … 6=Sat, only for recurring
    specificDate: v.optional(v.string()), // ISO date, only for one_time
    startTime: v.string(),               // "HH:MM" in user's timezone
    endTime: v.string(),
    timezone: v.string(),                // ADDED: e.g. "Asia/Kolkata"
    isAvailable: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("userId", ["userId"]),

  // ─── Batches ─────────────────────────────────────────────────────────────
  // Unchanged
  batches: defineTable({
    name: v.string(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("active"),
      v.literal("completed")
    ),
    startDate: v.string(),
    endDate: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("status", ["status"]),

  // ─── Batch Instructors (bridge) ───────────────────────────────────────────
  // NEW: PRD §8 explicitly says batches have "assigned instructors" (plural).
  // The original schema had no way to store this.
  batch_instructors: defineTable({
    batchId: v.id("batches"),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("batchId", ["batchId"])
    .index("userId", ["userId"])
    .index("batchId_userId", ["batchId", "userId"]),

  // ─── Batch Students (bridge) ──────────────────────────────────────────────
  // Unchanged
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

  // ─── Batch Courses (bridge) ───────────────────────────────────────────────
  // Unchanged
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

  // ─── Categories ───────────────────────────────────────────────────────────
  // Unchanged
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("name", ["name"]),

  // ─── Course Categories (bridge) ───────────────────────────────────────────
  // Unchanged
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

  // ─── Tags ─────────────────────────────────────────────────────────────────
  // Unchanged
  tags: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("name", ["name"]),

  // ─── Course Tags (bridge) ─────────────────────────────────────────────────
  // Unchanged 
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

  // ─── Certificates ─────────────────────────────────────────────────────────
  // Unchanged 
  certificates: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    verificationCode: v.string(),
    completedAt: v.number(),
    issuedAt: v.number(),
    status: v.union(v.literal("issued"), v.literal("revoked")),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("courseId", ["courseId"])
    .index("verificationCode", ["verificationCode"])
    .index("userId_courseId", ["userId", "courseId"]),

  // ─── Reviews ──────────────────────────────────────────────────────────────
  // Unchanged — kept because the table is ready even though the feature is
  // flagged as future. The schema comment is the right place to note this.
  // Future: wire up to Teacher Discovery §12 "average rating" on teacher cards.
  reviews: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    review: v.optional(v.string()),
    star: v.number(),  // 1–5
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("courseId", ["courseId"])
    .index("userId_courseId", ["userId", "courseId"]),
});