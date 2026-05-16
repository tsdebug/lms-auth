import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireRole, requireCourseRole } from "../lib/authorization"

// --- createCourse ---
// a teacher can create a course, which starts in "draft" status
export const createCourse = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        slug: v.optional(v.string()),
        difficultyLevel: v.optional(
            v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
        ),
        // categoryIds lives in course_categories bridge table
        // not on the courses table itself — extracted separately below
        categoryIds: v.optional(v.array(v.id("categories"))),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. role check
        await requireRole(ctx.db, authUserId, "teacher");

        // 3. slug uniqueness check
        if (args.slug) {
            const existingSlug = await ctx.db
                .query("courses")
                .withIndex("slug", (q) => q.eq("slug", args.slug))
                .first();
            if (existingSlug) throw new Error("Slug already in use");
        }

        // 4. extract categoryIds before inserting course
        // categoryIds must NOT be spread into courses table
        // it belongs in course_categories bridge table only
        const { categoryIds, ...courseFields } = args;

        // 5. insert course — only course fields, no categoryIds
        const courseId = await ctx.db.insert("courses", {
            ...courseFields,
            userId: authUserId,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 6. insert into course_instructors — creator is lead
        await ctx.db.insert("course_instructors", {
            courseId,
            userId: authUserId,
            role: "lead",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 7. insert category links into bridge table
        if (categoryIds && categoryIds.length > 0) {
            for (const categoryId of categoryIds) {
                await ctx.db.insert("course_categories", {
                    courseId,
                    categoryId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }

        return courseId;
    },
});

// --- updateCourse ---
// a teacher can update course fields, but NOT the status (published courses can't be edited)
// categoryIds is handled separately since it's a many-to-many bridge table, not a field on courses
export const updateCourse = mutation({
    args: {
        courseId: v.id("courses"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        slug: v.optional(v.string()),
        difficultyLevel: v.optional(
            v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
        ),
        // same as createCourse — categoryIds is handled separately
        categoryIds: v.optional(v.array(v.id("categories"))),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. does course exist?
        const existingCourse = await ctx.db.get(args.courseId);
        if (!existingCourse) throw new Error("Course not found");

        // 3. role check
        await requireCourseRole(ctx.db, authUserId, args.courseId);

        // 4. slug uniqueness check
        if (args.slug) {
            const existingSlug = await ctx.db
                .query("courses")
                .withIndex("slug", (q) => q.eq("slug", args.slug))
                .first();
            if (existingSlug && existingSlug._id !== args.courseId) {
                throw new Error("Slug already in use");
            }
        }

        // 5. extract categoryIds AND courseId before patching
        // categoryIds must NOT be patched onto courses table
        // courseId is just the identifier, not a field to update
        const { courseId, categoryIds, ...fieldsToUpdate } = args;

        // 6. patch only course fields onto courses table
        await ctx.db.patch(args.courseId, {
            ...fieldsToUpdate,
            updatedAt: Date.now(),
        });

        // 7. handle categories in bridge table
        if (categoryIds !== undefined) {
            // delete all existing category links for this course
            // then re-insert fresh ones — simpler than diffing
            const existing = await ctx.db
                .query("course_categories")
                .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
                .collect();
            for (const row of existing) {
                await ctx.db.delete(row._id);
            }
            // insert new category links
            for (const categoryId of categoryIds) {
                await ctx.db.insert("course_categories", {
                    courseId: args.courseId,
                    categoryId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }
    },
});


// --- publishCourse ---
// a teacher can publish a course, but only if it's in draft status and has at least one chapter with at least one lesson
export const publishCourse = mutation({
    args: {
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. does course exist?
        const existingCourse = await ctx.db.get(args.courseId);
        if (!existingCourse) throw new Error("Course not found");

        // 3. role check
        await requireCourseRole(ctx.db, authUserId, args.courseId);

        // 4. only draft courses can be published
        if (existingCourse.status !== "draft") {
            throw new Error("Only draft courses can be published");
        }

        // 5. must have at least one chapter with at least one lesson
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
            .collect();

        if (chapters.length === 0) {
            throw new Error("Course must have at least one chapter to be published");
        }

        for (const chapter of chapters) {
            const lesson = await ctx.db
                .query("lessons")
                .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
                .first();
            if (!lesson) {
                throw new Error(`Chapter "${chapter.title}" must have at least one lesson`);
            }
        }

        // 6. publish
        await ctx.db.patch(args.courseId, {
            status: "published",
            updatedAt: Date.now(),
        });
    },
});


// --- archiveCourse ---
// a teacher can archive a course, but only if it's in published status (archived courses can't be edited or published, but they also don't show up in the marketplace)
export const archiveCourse = mutation({
    args: {
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. does course exist?
        const existingCourse = await ctx.db.get(args.courseId);
        if (!existingCourse) throw new Error("Course not found");

        // 3. role check
        await requireCourseRole(ctx.db, authUserId, args.courseId);

        // 4. only published courses can be archived
        if (existingCourse.status !== "published") {
            throw new Error("Only published courses can be archived");
        }

        // 5. archive
        await ctx.db.patch(args.courseId, {
            status: "archived",
            updatedAt: Date.now(),
        });
    },
});


// --- unarchiveCourse ---
// a teacher can unarchive a course, but only if it's in archived status (unarchived courses go back to draft status)
export const unarchiveCourse = mutation({
    args: {
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. does course exist?
        const existingCourse = await ctx.db.get(args.courseId);
        if (!existingCourse) throw new Error("Course not found");

        // 3. role check
        await requireCourseRole(ctx.db, authUserId, args.courseId);

        // 4. only archived courses can be unarchived
        if (existingCourse.status !== "archived") {
            throw new Error("Only archived courses can be unarchived");
        }

        // 5. move back to draft
        await ctx.db.patch(args.courseId, {
            status: "draft",
            updatedAt: Date.now(),
        });
    },
});


// --- deleteCourse ---
// a teacher can delete a course, which deletes all related chapters, lessons, and enrollments via cascade deletes in the schema
// rules: 
// - only draft courses can be deleted (published courses can't be deleted, but they can be archived)
// - only the course owner (userId) can delete, not co-instructors 
export const deleteCourse = mutation({
    args: {
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("Unauthenticated");

        // 2. does course exist?
        const course = await ctx.db.get(args.courseId);
        if (!course) throw new Error("Course not found.");

        // 3. only course owner can delete, not co-instructors: check whether the user is also the owner
        if (course.userId !== authUserId) {
            throw new Error("Only the course owner can delete the course.");
        }

        // 4. only draft courses can be deleted
        if (course.status !== "draft") {
            throw new Error("Only draft courses can be deleted.");
        }

        // 5. delete course (cascade deletes related chapters, lessons, enrollments)
        // get the chapters of the course using the args courseId
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
            .collect();

        // for each chapter, delete its lessons
        for (const chapter of chapters) {
            // delete all lessons with the chapterId of the chapter
            const lessons = await ctx.db
                .query("lessons")
                .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
                .collect();
            // delete each lesson
            for (const lesson of lessons) {
                await ctx.db.delete(lesson._id);
            }
            // delete the chapter
            await ctx.db.delete(chapter._id);
        }

        // 6. delete course_instructors rows
        const instructors = await ctx.db
        .query("course_instructors")
        .withIndex("courseId", (q)=> q.eq("courseId", args.courseId))
        .collect();

        for(const instructor of instructors){
            await ctx.db.delete(instructor._id);
        }

        // 7. delete course_categories rows
        const categories = await ctx.db
        .query("course_categories")
        .withIndex("courseId", (q)=> q.eq("courseId", args.courseId))
        .collect();

        for(const category of categories){
            await ctx.db.delete(category._id);
        }

        // 8. delete the course
        await ctx.db.delete(args.courseId);
    }
})