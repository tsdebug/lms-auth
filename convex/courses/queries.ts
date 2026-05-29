import { query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// getCourses — public, paginated, filterable published course list
export const getCourses = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    tagId: v.optional(v.id("tags")),
    difficultyLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("courses")
      .withIndex("status", (q) => q.eq("status", "published"))
      .paginate(args.paginationOpts);

    let courses = results.page;

    if (args.difficultyLevel) {
      courses = courses.filter((c) => c.difficultyLevel === args.difficultyLevel);
    }

    if (args.categoryId) {
      const courseCategories = await ctx.db
        .query("course_categories")
        .withIndex("categoryId", (q) => q.eq("categoryId", args.categoryId!))
        .collect();
      const courseIds = courseCategories.map((cc) => cc.courseId);
      courses = courses.filter((c) => courseIds.includes(c._id));
    }

    if (args.tagId) {
      const courseTags = await ctx.db
        .query("course_tags")
        .withIndex("tagId", (q) => q.eq("tagId", args.tagId!))
        .collect();
      const courseIds = courseTags.map((ct) => ct.courseId);
      courses = courses.filter((c) => courseIds.includes(c._id));
    }

    return { ...results, page: courses };
  },
});

// getPublishedCourses — simple version without pagination, intentionally public
export const getPublishedCourses = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    difficultyLevel: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
  },
  handler: async (ctx, args) => {
    let courses = await ctx.db
      .query("courses")
      .withIndex("status", (q) => q.eq("status", "published"))
      .collect()

    if (args.difficultyLevel) {
      courses = courses.filter((c) => c.difficultyLevel === args.difficultyLevel)
    }

    if (args.categoryId) {
      const courseCategories = await ctx.db
        .query("course_categories")
        .withIndex("categoryId", (q) => q.eq("categoryId", args.categoryId!))
        .collect()
      const courseIds = courseCategories.map((cc) => cc.courseId)
      courses = courses.filter((c) => courseIds.includes(c._id))
    }

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const instructor = await ctx.db.get(course.userId)
        const courseCategories = await ctx.db
          .query("course_categories")
          .withIndex("courseId", (q) => q.eq("courseId", course._id))
          .collect()
        const categories = await Promise.all(
          courseCategories.map((cc) => ctx.db.get(cc.categoryId))
        )
        return {
          ...course,
          instructorName: instructor
            ? `${instructor.fName ?? ""} ${instructor.lName ?? ""}`.trim()
            : "Unknown",
          categories: categories.filter(Boolean),
        }
      })
    )

    return enriched
  },
})

// getCoursesByTeacher — private, returns teacher's own courses
export const getCoursesByTeacher = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthorized");

    const courses = await ctx.db
      .query("courses")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();

    const enrichedCourses = await Promise.all(
      courses.map(async (course) => {
        const instructorRow = await ctx.db
          .query("course_instructors")
          .withIndex("courseId_userId", (q) =>
            q.eq("courseId", course._id).eq("userId", authUserId)
          )
          .first();

        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("courseId", (q) => q.eq("courseId", course._id))
          .collect();

        return {
          ...course,
          myRole: instructorRow?.role ?? "owner",
          studentCount: enrollments.length,
        };
      })
    );

    return enrichedCourses;
  },
});

// getCourseDetails — FIXED
// published courses: visible to anyone (public detail page)
// draft/archived courses: only visible to the course instructor
// previously returned draft courses to anyone who knew the courseId
export const getCourseDetails = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    // if course is not published, only the owner/instructor may see it
    if (course.status !== "published") {
      const authUserId = await getAuthUserId(ctx);
      if (!authUserId) throw new Error("Not found"); // don't reveal draft exists

      // check if caller is an instructor on this course
      const isInstructor = await ctx.db
        .query("course_instructors")
        .withIndex("courseId_userId", (q) =>
          q.eq("courseId", args.courseId).eq("userId", authUserId)
        )
        .first();

      // throw "Not found" rather than "Unauthorized" to avoid leaking
      // that the course exists at all to random users
      if (!isInstructor) throw new Error("Not found");
    }

    const chapters = await ctx.db
      .query("chapters")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    const chaptersWithLessons = await Promise.all(
      chapters.map(async (chapter) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
          .collect();
        return { ...chapter, lessons };
      })
    );

    return { ...course, chapters: chaptersWithLessons };
  },
});

// getCategories — public, no auth needed
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});