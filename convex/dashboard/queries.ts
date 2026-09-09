import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─────────────────────────────────────────────────────────────────
// getStudentDashboardHighlights
// Bundles: assignments due soon (not yet submitted), quizzes not yet
// attempted, and a "continue learning" pointer to the most recent
// active enrollment. One query call powers the whole dashboard widget.
// ─────────────────────────────────────────────────────────────────
export const getStudentDashboardHighlights = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();
    const activeEnrollments = enrollments.filter((e) => e.status === "active");

    if (activeEnrollments.length === 0) {
      return { upcomingAssignments: [], pendingQuizzes: [], continueCourse: null };
    }

    const courseIds = activeEnrollments.map((e) => e.courseId);

    const chaptersByCourse = await Promise.all(
      courseIds.map((courseId) =>
        ctx.db.query("chapters").withIndex("courseId", (q) => q.eq("courseId", courseId)).collect()
      )
    );
    const allChapters = chaptersByCourse.flat();
    const chapterToCourse = new Map(allChapters.map((c) => [c._id, c.courseId]));

    const lessonsByChapter = await Promise.all(
      allChapters.map((c) =>
        ctx.db.query("lessons").withIndex("chapterId", (q) => q.eq("chapterId", c._id)).collect()
      )
    );
    const allLessons = lessonsByChapter.flat();
    const lessonToChapter = new Map(allLessons.map((l) => [l._id, l.chapterId]));

    // assignments — chapter-level and lesson-level, across all enrolled courses
    const assignmentsByChapter = await Promise.all(
      allChapters.map((c) =>
        ctx.db.query("assignments").withIndex("chapterId", (q) => q.eq("chapterId", c._id)).collect()
      )
    );
    const assignmentsByLesson = await Promise.all(
      allLessons.map((l) =>
        ctx.db.query("assignments").withIndex("lessonId", (q) => q.eq("lessonId", l._id)).collect()
      )
    );
    const allAssignments = [...assignmentsByChapter.flat(), ...assignmentsByLesson.flat()];

    const mySubmissions = await ctx.db
      .query("submissions")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();
    const submittedAssignmentIds = new Set(
      mySubmissions
        .filter((s) => s.status === "submitted" || s.status === "graded" || s.status === "resubmitted")
        .map((s) => s.assignmentId)
    );

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const upcomingAssignments = allAssignments
      .filter((a) => !submittedAssignmentIds.has(a._id))
      .map((a) => ({ ...a, dueDateMs: new Date(a.dueDate).getTime() }))
      .filter((a) => !isNaN(a.dueDateMs) && a.dueDateMs - now <= sevenDaysMs)
      .sort((a, b) => a.dueDateMs - b.dueDateMs)
      .slice(0, 5)
      .map((a) => {
        const courseId = a.chapterId
          ? chapterToCourse.get(a.chapterId)
          : a.lessonId
          ? chapterToCourse.get(lessonToChapter.get(a.lessonId)!)
          : undefined;
        return {
          assignmentId: a._id,
          title: a.title,
          dueDate: a.dueDate,
          courseId,
          isOverdue: a.dueDateMs < now,
        };
      });

    // quizzes — chapter-level and lesson-level, across enrolled courses
    const quizzesByChapter = await Promise.all(
      allChapters.map((c) =>
        ctx.db.query("quizzes").withIndex("chapterId", (q) => q.eq("chapterId", c._id)).collect()
      )
    );
    const quizzesByLesson = await Promise.all(
      allLessons.map((l) =>
        ctx.db.query("quizzes").withIndex("lessonId", (q) => q.eq("lessonId", l._id)).collect()
      )
    );
    const allQuizzes = [...quizzesByChapter.flat(), ...quizzesByLesson.flat()];

    const myAttempts = await ctx.db
      .query("quiz_attempts")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();
    const attemptedQuizIds = new Set(
      myAttempts.filter((a) => a.completedAt !== undefined).map((a) => a.quizId)
    );

    const pendingQuizzes = allQuizzes
      .filter((qz) => !attemptedQuizIds.has(qz._id))
      .slice(0, 5)
      .map((qz) => {
        const navigationLesson = qz.lessonId
          ? allLessons.find((lesson) => lesson._id === qz.lessonId)
          : allLessons.find((lesson) => lesson.chapterId === qz.chapterId);
        const courseId = navigationLesson
          ? chapterToCourse.get(navigationLesson.chapterId)
          : qz.chapterId
          ? chapterToCourse.get(qz.chapterId)
          : undefined;
        const navigationLessonId = navigationLesson?._id;
        return { quizId: qz._id, title: qz.title, courseId, navigationLessonId };
      });

    // "continue learning" — most recently enrolled active course.
    // NOTE: this is a simple heuristic (no "last viewed" timestamp exists yet).
    // Good enough for v1; revisit if you add lesson-view tracking later.
    const mostRecent = [...activeEnrollments].sort((a, b) => b.enrolledAt - a.enrolledAt)[0];
    let continueCourse = null;
    if (mostRecent) {
      const course = await ctx.db.get(mostRecent.courseId);
      continueCourse = course ? { courseId: course._id, title: course.title } : null;
    }

    return { upcomingAssignments, pendingQuizzes, continueCourse };
  },
});

// ─────────────────────────────────────────────────────────────────
// getTeacherDashboardHighlights
// Bundles: ungraded submissions awaiting this teacher's review,
// pending co-instructor invitations they've sent, and batches they
// instruct that are starting soon or currently active.
// ─────────────────────────────────────────────────────────────────
export const getTeacherDashboardHighlights = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;

    const ownedCourses = await ctx.db
      .query("courses")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();

    const instructorLinks = await ctx.db
      .query("course_instructors")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();
    const coInstructedCourses = await Promise.all(
      instructorLinks.filter((l) => !l.deletedAt).map((l) => ctx.db.get(l.courseId))
    );
    const seen = new Set(ownedCourses.map((c) => c._id));
    const allCourses = [
      ...ownedCourses,
      ...coInstructedCourses.filter((c) => c && !seen.has(c._id)),
    ].filter(Boolean) as typeof ownedCourses;

    if (allCourses.length === 0) {
      return { ungradedSubmissions: [], pendingInvitations: [], upcomingBatches: [] };
    }

    // ungraded submissions for assignments this teacher created
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("createdBy", (q) => q.eq("createdBy", authUserId))
      .collect();

    const submissionsByAssignment = await Promise.all(
      assignments.map((a) =>
        ctx.db.query("submissions").withIndex("assignmentId", (q) => q.eq("assignmentId", a._id)).collect()
      )
    );
    const allSubmissions = submissionsByAssignment.flat();
    const ungraded = allSubmissions.filter(
      (s) => s.status === "submitted" || s.status === "resubmitted"
    );

    const ungradedSubmissions = await Promise.all(
      ungraded.slice(0, 5).map(async (s) => {
        const assignment = assignments.find((a) => a._id === s.assignmentId);
        const student = await ctx.db.get(s.userId);
        return {
          submissionId: s._id,
          assignmentId: s.assignmentId,
          assignmentTitle: assignment?.title ?? "Unknown assignment",
          studentName: student
            ? `${student.fName ?? ""} ${student.lName ?? ""}`.trim() || "Unknown"
            : "Unknown",
          submittedAt: s.submittedAt,
        };
      })
    );

    // pending co-instructor invitations across this teacher's courses
    const invitationsByCourse = await Promise.all(
      allCourses.map((c) =>
        ctx.db.query("course_invitations").withIndex("courseId", (q) => q.eq("courseId", c._id)).collect()
      )
    );
    const pendingInvitations = invitationsByCourse
      .flat()
      .filter((i) => i.status === "pending")
      .slice(0, 5)
      .map((i) => ({ invitationId: i._id, email: i.email, courseId: i.courseId }));

    // batches this teacher instructs, starting within 14 days or currently active
    const batchLinks = await ctx.db
      .query("batch_instructors")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();
    const batches = await Promise.all(
      batchLinks.filter((l) => !l.deletedAt).map((l) => ctx.db.get(l.batchId))
    );
    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const upcomingBatches = batches
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .filter((b) => {
        const startMs = new Date(b.startDate).getTime();
        return b.status === "active" || (!isNaN(startMs) && startMs - now <= fourteenDaysMs && startMs - now >= 0);
      })
      .map((b) => ({ batchId: b._id, name: b.name, startDate: b.startDate, status: b.status }));

    return { ungradedSubmissions, pendingInvitations, upcomingBatches };
  },
});