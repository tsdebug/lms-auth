import { query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

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
    if(args.tagId){
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


