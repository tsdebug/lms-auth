import { query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// getCourses - Public query for paginated, filterable published course list
export const getCourses = query({
  args: {
    // needed filter relevant to the course list page, but not necessarily the course details page
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    tagId: v.optional(v.id("tags")),
    difficultyLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
  },
  handler: async (ctx, args) => {
    // step 1 - get published courses
    const results = await ctx.db
      .query("courses")
      .withIndex("status", (q) => q.eq("status", "published"))
      .paginate(args.paginationOpts); // provide one page at a time rather than all results at once

    // step 2 - apply optional filters

    // difficulty level filter 
    // Since filtering and replacing courses, need to use let
    let courses = results.page; // extract the array of courses

    if (args.difficultyLevel) {
      courses = courses.filter(
        (course) => course.difficultyLevel === args.difficultyLevel
      );
    }

    // category filter
    if (args.categoryId) {
      // 1 - find all course_categories rows for this category
      const courseCategories = await ctx.db
        .query("course_categories")
        .withIndex("categoryId", (q) => q.eq("categoryId", args.categoryId!))
        .collect();

      // 2 - extract just the courseIds into a simple array
      const courseIds = courseCategories.map((cc) => cc.courseId); // Result is a plain array of IDs

      // 3 - keep only courses whose _id is in that array
      courses = courses.filter((course) => courseIds.includes(course._id));  // .includes() — checks if a value exists in an array
    }

    // tag filter
    if (args.tagId) {
      // 1 - find all course_tags rows for this tag
      const courseTags = await ctx.db
        .query("course_tags")
        .withIndex("tagId", (q) => q.eq("tagId", args.tagId!))
        .collect();

      // 2 - extract just the courseIds into a simple array
      const courseIds = courseTags.map((ct) => ct.courseId); // Result is a plain array of IDs

      // 3 - keep only courses whose _id is in that array
      courses = courses.filter((course) => courseIds.includes(course._id));  // .includes() — checks if a value exists in an array
    }

    // step 3 - return results with filtered courses
    return { ...results, page: courses };
  },
});


// getCoursesByTeacher - Private query for paginated, filterable course list for a specific teacher
export const getCoursesByTeacher = query({
  args: {},
  handler: async (ctx) => {
    // Step 1 - auth check
    const authUserId = await getAuthUserId(ctx);

    if (!authUserId) {
      throw new Error("Unauthorized");
    }

    // Step 2 - get all courses for this teacher
    const results = await ctx.db
      .query("courses")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();

    return results;
  }
})

// getCourseDetails - Public query for course details page, which includes only published courses
export const getCourseDetails = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {

    // 1. fetch the course using courseId
    const course = await ctx.db.get(args.courseId); // Convex already knows which table from the ID type — don't need to specify it.

    if (!course) {
      throw new Error("Course not found");
    }

    // chapters of the said course
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    // lessons of the said course but chapterwise
    const chaptersWithLessons = await Promise.all(
      chapters.map(async (chapter) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
          .collect();

        return {
          ...chapter,
          lessons: lessons,
        };
      })
    );

    return {
      ...course,
      chapters: chaptersWithLessons,
    };

  }
})