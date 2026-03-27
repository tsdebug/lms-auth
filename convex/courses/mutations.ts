import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// createCourse - called when a teacher creates a new course, to save the course details and link it to the creator as the lead instructor
export const createCourse = mutation({
    args: {
        // what does a course need at creation time? - hint: look at the courses table in schema.ts
        title: v.string(),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        slug: v.optional(v.string()),
        difficultyLevel: v.optional(
            v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
        ),
        // status is not needed cuz newly created courses must always default to "draft". The frontend should never be able to pass a different status at creation time. 
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            throw new Error("User must be authenticated");
        }

        // 2. role check — only teachers can create courses (new concept!)
        // now check if THIS user has that role
        const teacherRole = await ctx.db
            .query("roles")
            .withIndex("name", (q) => q.eq("name", "teacher"))
            .first();
        if (!teacherRole) {
            throw new Error("Teacher role not found");
        }
        const isTeacher = await ctx.db
            .query("user_roles")
            .withIndex("userId_roleId", (q) =>
                q.eq("userId", authUserId).eq("roleId", teacherRole._id)
            )
            .first();
        if (!isTeacher) {
            throw new Error("Unauthorized: only teachers can create courses");
        }

        // 3. slug uniqueness check
        if (args.slug) {
            const existingSlug = await ctx.db
                .query("courses") // courses table
                .withIndex("slug", (q) => q.eq("slug", args.slug)) // checks if the said slug already exists in the courses table
                .first();
            if (existingSlug) {
                throw new Error("Slug already in use");
            }
        }
        // 4. insert into courses table
        const courseId = await ctx.db.insert("courses", {
            title: args.title,
            userId: authUserId,
            description: args.description,
            thumbnailUrl: args.thumbnailUrl,
            slug: args.slug,
            difficultyLevel: args.difficultyLevel,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 5. insert into course_instructors table (the creator is the lead instructor)
        await ctx.db.insert("course_instructors", {
            courseId: courseId,
            userId: authUserId,
            role: "lead", // Course instructor role — what is your position on a specific course? "lead" | "co-instructor" | "evaluator"
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

//  updateCourse - called when a teacher updates their course details, to update the course info in the courses table
// idea - if the course i am trying to update exists and if i am authenticated as well as authorized - instructor or co-instructor on this course
export const updateCourse = mutation({
    args: {
        courseId: v.id("courses"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),   // PRD §4
        slug: v.optional(v.string()),
        difficultyLevel: v.optional(
        v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
    },

    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            throw new Error("User must be authenticated");
        }

        // 2. does the course even exist?
        const existingCourse = await ctx.db.get(args.courseId);
        if (!existingCourse) {
            throw new Error("Course not found");
        }

        // 3. role check 
        const isInstructor = await ctx.db
            .query("course_instructors") // if a row exists here for a user & course, that means they are an instructor on that course
            .withIndex("courseId_userId", (q)=> q.eq("courseId", args.courseId).eq("userId", authUserId))
            .first();
            if(!isInstructor){
                throw new Error("Unauthorized: only instructors can update courses");
            }
    },
});