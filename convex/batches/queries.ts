import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// All batches a given instructor teaches
export const getBatchesByInstructor = query({
  args: {},
  handler: async (ctx) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    const targetUserId = callerId; // CHANGED — always self, no cross-user lookups

    const links = await ctx.db
      .query("batch_instructors")
      .withIndex("userId", q => q.eq("userId", targetUserId))
      .collect();

    const batches = await Promise.all(
      links
        .filter(l => !l.deletedAt)
        .map(l => ctx.db.get(l.batchId))
    );

    return batches.filter(b => b !== null && !b.deletedAt);
  },
});

// All students enrolled in a batch — instructor/owner only
export const getBatchStudents = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    const isInstructor = await ctx.db
      .query("batch_instructors")
      .withIndex("batchId_userId", q =>
        q.eq("batchId", args.batchId).eq("userId", callerId))
      .first();
    if (!isInstructor || isInstructor.deletedAt) throw new ConvexError("Unauthorized");

    const links = await ctx.db
      .query("batch_students")
      .withIndex("batchId", q => q.eq("batchId", args.batchId))
      .collect();

    const students = await Promise.all(
      links
        .filter(l => !l.deletedAt)
        .map(async l => {
          const user = await ctx.db.get(l.userId);
          if (!user) return null;
          return {
            userId: user._id,
            fName: user.fName,
            lName: user.lName,
            email: user.email,
            pfpUrl: user.pfpUrl,
            enrolledAt: l.createdAt,
          };
        })
    );

    return students.filter(s => s !== null);
  },
});

// All batches a given student belongs to
export const getBatchesByStudent = query({
  args: {},
  handler: async (ctx) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    const targetUserId = callerId; // CHANGED — always self

    // students can only see their own batches; instructors/self can pass an explicit id
    if (targetUserId !== callerId) {
      const isInstructor = await ctx.db
        .query("batch_instructors")
        .withIndex("userId", q => q.eq("userId", callerId))
        .first();
      if (!isInstructor) throw new ConvexError("Unauthorized");
    }

    const links = await ctx.db
      .query("batch_students")
      .withIndex("userId", q => q.eq("userId", targetUserId))
      .collect();

    const batches = await Promise.all(
      links
        .filter(l => !l.deletedAt)
        .map(l => ctx.db.get(l.batchId))
    );

    return batches.filter(b => b !== null && !b.deletedAt);
  },
});

// --- getBatchDetails ---
// full detail for the batch management page: instructor names, linked
// courses, student count. Instructor-only.
export const getBatchDetails = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    const isInstructor = await ctx.db
      .query("batch_instructors")
      .withIndex("batchId_userId", q =>
        q.eq("batchId", args.batchId).eq("userId", callerId))
      .first();
    if (!isInstructor || isInstructor.deletedAt) throw new ConvexError("Unauthorized");

    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new ConvexError("Batch not found");

    const instructorLinks = await ctx.db
      .query("batch_instructors")
      .withIndex("batchId", q => q.eq("batchId", args.batchId))
      .collect();

    const instructors = await Promise.all(
      instructorLinks
        .filter(l => !l.deletedAt)
        .map(async l => {
          const user = await ctx.db.get(l.userId);
          return user
            ? {
              userId: user._id,
              name: `${user.fName ?? ""} ${user.lName ?? ""}`.trim() || "Unknown",
              email: user.email,
              isOwner: batch.createdBy === user._id,
            }
            : null;
        })
    );

    const courseLinks = await ctx.db
      .query("batch_courses")
      .withIndex("batchId", q => q.eq("batchId", args.batchId))
      .collect();

    const courses = await Promise.all(
      courseLinks.map(async l => {
        const course = await ctx.db.get(l.courseId);
        return course ? { courseId: course._id, title: course.title, status: course.status } : null;
      })
    );

    const studentLinks = await ctx.db
      .query("batch_students")
      .withIndex("batchId", q => q.eq("batchId", args.batchId))
      .collect();
    const studentCount = studentLinks.filter(l => !l.deletedAt).length;

    return {
      ...batch,
      instructors: instructors.filter(Boolean),
      courses: courses.filter(Boolean),
      studentCount,
    };
  },
});