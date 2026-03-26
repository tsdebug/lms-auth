import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
        

        // 5. insert into course_instructors table (the creator is the lead instructor)
    },
});