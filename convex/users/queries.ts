import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// getCurrentUser - for getting the current authenticated user's profile with roles
export const getCurrentUser = query({
  handler: async (ctx) => {
    // step 1: auth check
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;

    // step 2: fetch the user profile
    const user = await ctx.db.get(authUserId);
    if (!user) return null;

    // step 3: fetch all roles for this user
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();

    // step 4: get role details for each user_role entry
    const roles = await Promise.all(
      userRoles.map(async (ur) => {
        const role = await ctx.db.get(ur.roleId);
        return role;
      })
    );

    return {
      ...user,
      roles: roles.filter(Boolean),
    };
  },
});

// getUserProfile - for user profile page
export const getUserProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // step 1: auth check
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("User must be authenticated");

    // step 2: fetch the user profile
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // step 3: fetch all roles for this user
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    // step 4: get role details
    const roles = await Promise.all(
      userRoles.map(async (ur) => {
        const role = await ctx.db.get(ur.roleId);
        return role;
      })
    );

    return {
      ...user,
      roles: roles.filter(Boolean),
    };
  },
});

// getTeacherDirectory - for teacher directory page
export const getTeacherDirectory = query({
  args: {
    expertise: v.optional(v.string()),
    experienceLevel: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
  },
  handler: async (ctx, { expertise, experienceLevel }) => {
    // step 1: get the teacher role
    const teacherRole = await ctx.db
      .query("roles")
      .withIndex("name", (q) => q.eq("name", "teacher"))
      .first();

    if (!teacherRole) return [];

    // step 2: get all user_roles entries for teachers
    const teacherUserRoles = await ctx.db
      .query("user_roles")
      .withIndex("roleId", (q) => q.eq("roleId", teacherRole._id))
      .collect();

    // step 3: fetch user profiles for each teacher
    const teachers = await Promise.all(
      teacherUserRoles.map(async (ur) => {
        const user = await ctx.db.get(ur.userId);
        return user;
      })
    );

    // step 4: filter out null/deleted users
    let filtered = teachers.filter(Boolean);

    // step 5: apply expertise filter if provided
    if (expertise) {
      filtered = filtered.filter(
        (user) => user?.expertise && user.expertise.includes(expertise)
      );
    }

    // step 6: apply experienceLevel filter if provided
    if (experienceLevel) {
      filtered = filtered.filter(
        (user) => user?.experienceLevel === experienceLevel
      );
    }

    return filtered;
  },
});

// getStudentsForTeacher — all students enrolled in teacher's courses
// enriched with quiz attempts, assignment submissions, and last active date
// used on /teacher/students page
export const getStudentsForTeacher = query({
  args: {},
  handler: async (ctx) => {
    // step 1: auth check
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthenticated");

    // step 2: get all courses this teacher owns
    const courses = await ctx.db
      .query("courses")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();

    if (courses.length === 0) return [];

    // step 3: get all enrollments across all teacher's courses
    const enrollmentArrays = await Promise.all(
      courses.map((course) =>
        ctx.db
          .query("enrollments")
          .withIndex("courseId", (q) => q.eq("courseId", course._id))
          .collect()
      )
    );

    // step 4: flatten enrollments
    const allEnrollments = enrollmentArrays.flat();

    // step 5: group enrollments by student userId
    // WHY: a student enrolled in 2 courses appears twice — group by userId
    const studentMap = new Map<string, { userId: string; enrollments: typeof allEnrollments }>();

    for (const enrollment of allEnrollments) {
      const existing = studentMap.get(enrollment.userId);
      if (existing) {
        existing.enrollments.push(enrollment);
      } else {
        studentMap.set(enrollment.userId, {
          userId: enrollment.userId,
          enrollments: [enrollment],
        });
      }
    }

    // step 6: enrich each student with all their data
    const students = await Promise.all(
      Array.from(studentMap.values()).map(
        async ({ userId, enrollments }) => {
          // step 6a: get user record
          const user = await ctx.db.get(userId as Id<"users">);
          if (!user) return null;

          // step 6b: compute per-course progress for each enrollment
          const courseProgress = await Promise.all(
            enrollments.map(async (enrollment) => {
              // find course from already-fetched list
              const course = courses.find(
                (c) => c._id === enrollment.courseId
              );
              if (!course) return null;

              // get all chapters in this course
              const chapters = await ctx.db
                .query("chapters")
                .withIndex("courseId", (q) =>
                  q.eq("courseId", enrollment.courseId)
                )
                .collect();

              // get all lessons across all chapters
              const lessonArrays = await Promise.all(
                chapters.map((c) =>
                  ctx.db
                    .query("lessons")
                    .withIndex("chapterId", (q) =>
                      q.eq("chapterId", c._id)
                    )
                    .collect()
                )
              );
              const allLessons = lessonArrays.flat();

              // count completed lessons for this student
              const completionChecks = await Promise.all(
                allLessons.map((l) =>
                  ctx.db
                    .query("lesson_completions")
                    .withIndex("userId_lessonId", (q) =>
                      q
                        .eq("userId", userId as Id<"users">)
                        .eq("lessonId", l._id)
                    )
                    .first()
                )
              );
              const completedLessons = completionChecks.filter(Boolean).length;
              const progressPercent =
                allLessons.length > 0
                  ? Math.round(
                    (completedLessons / allLessons.length) * 100
                  )
                  : 0;

              return {
                courseId: enrollment.courseId,
                courseTitle: course.title,
                enrollmentStatus: enrollment.status,
                progressPercent,
                completedLessons,
                totalLessons: allLessons.length,
              };
            })
          );

          // step 6c: quiz attempts — how many and average score
          // WHY: tells teacher if student is engaging with quiz content
          const quizAttempts = await ctx.db
            .query("quiz_attempts")
            .withIndex("userId", (q) =>
              q.eq("userId", userId as Id<"users">)
            )
            .collect();

          const completedAttempts = quizAttempts.filter(
            (a) => a.completedAt
          );
          const quizzesTaken = completedAttempts.length;
          const avgQuizScore =
            quizzesTaken > 0
              ? Math.round(
                completedAttempts.reduce(
                  (sum, a) =>
                    sum +
                    (a.maxScore > 0
                      ? (a.score / a.maxScore) * 100
                      : 0),
                  0
                ) / quizzesTaken
              )
              : null;

          // step 6d: assignment submissions count
          // WHY: tells teacher if student is keeping up with work
          const submissions = await ctx.db
            .query("submissions")
            .withIndex("userId", (q) =>
              q.eq("userId", userId as Id<"users">)
            )
            .collect();

          // WHY explicit equality checks instead of includes:
          // s.status is a union literal type — includes() causes TS errors
          const assignmentsSubmitted = submissions.filter(
            (s) =>
              s.status === "submitted" ||
              s.status === "resubmitted" ||
              s.status === "graded"
          ).length;

          // step 6e: last active = most recent lesson completion timestamp
          // WHY: tells teacher when student was last engaged with content
          const allCompletions = await ctx.db
            .query("lesson_completions")
            .withIndex("userId", (q) =>
              q.eq("userId", userId as Id<"users">)
            )
            .collect();

          const lastActiveAt =
            allCompletions.length > 0
              ? Math.max(...allCompletions.map((c) => c.completedAt))
              : null;

          return {
            userId,
            name:
              `${user.fName ?? ""} ${user.lName ?? ""}`.trim() ||
              "Unknown",
            email: user.email ?? "",
            totalCourses: enrollments.length,
            courses: courseProgress.filter(Boolean),
            quizzesTaken,
            avgQuizScore,
            assignmentsSubmitted,
            lastActiveAt,
          };
        }
      )
    );

    // step 7: filter nulls and sort by most recently active first
    return students
      .filter(Boolean)
      .sort(
        (a, b) => (b!.lastActiveAt ?? 0) - (a!.lastActiveAt ?? 0)
      );
  },
});