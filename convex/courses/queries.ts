import { query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// getCourses — public, paginated, filterable published course list
export const getCourses = query({
  args: {
    // pagination options for efficient pagination meaning we don't have to load and filter all courses in memory - instead we can paginate at the database level and only filter the current page in memory
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

// getPublishedCourses — simple version without pagination
// used for public courses page 
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
    // get all published courses
    let courses = await ctx.db
      .query("courses")
      .withIndex("status", (q) => q.eq("status", "published")) // only published courses
      .collect()

    // filter by difficulty if provided
    if (args.difficultyLevel) {
      courses = courses.filter(
        (c) => c.difficultyLevel === args.difficultyLevel
      )
    }

    // filter by category if provided
    if (args.categoryId) {
      const courseCategories = await ctx.db
        .query("course_categories")
        .withIndex("categoryId", (q) =>
          q.eq("categoryId", args.categoryId!)
        )
        .collect()
      const courseIds = courseCategories.map((cc) => cc.courseId)
      courses = courses.filter((c) => courseIds.includes(c._id))
    }

    // enrich each course with instructor name and categories - enrich keyword id used because we are adding additional data to the course object
    const enriched = await Promise.all(
      courses.map(async (course) => {
        // get instructor name from users table
        const instructor = await ctx.db.get(course.userId)

        // get categories for this course
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
// enriched with their role on each course and student count
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
        // get this teacher's role on this specific course
        const instructorRow = await ctx.db
          .query("course_instructors")
          .withIndex("courseId_userId", (q) =>
            q.eq("courseId", course._id).eq("userId", authUserId)
          )
          .first();

        // count enrolled students for this course
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

// getCourseDetails — public for published courses, owner sees draft too
export const getCourseDetails = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

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
// used in course forms and public courses page for filtering
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});