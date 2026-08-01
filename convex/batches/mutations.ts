import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireRole, requireBatchOwner, requireBatchInstructor } from "../lib/authorization";

// --- createBatch ---
// only teachers can create batches
export const createBatch = mutation({
  args: { name: v.string(), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    await requireRole(ctx.db, userId, "teacher");

    const now = Date.now();
    const batchId = await ctx.db.insert("batches", {
      name: args.name,
      createdBy: userId,        // ADDED
      status: "upcoming",
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("batch_instructors", {
      batchId,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    return batchId;
  },
});

// --- addBatchInstructor ---
// only batch instructors can update batches
export const addBatchInstructor = mutation({
  args: { batchId: v.id("batches"), userId: v.id("users") },
  handler: async (ctx, args) => {
    // auth check: make sure the caller is logged in
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    // 2. authorization check: make sure the caller is a batch instructor
    await requireBatchOwner(ctx.db, callerId, args.batchId);

    // 3. check if the user is already an instructor for this batch
    const existing = await ctx.db
      .query("batch_instructors")
      .withIndex("batchId_userId", q =>
        q.eq("batchId", args.batchId).eq("userId", args.userId))
      .first();
    if (existing) throw new ConvexError("User is already a batch instructor");

    // 4. add the new instructor
    const now = Date.now();
    return await ctx.db.insert("batch_instructors", {
      batchId: args.batchId,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// --- removeBatchInstructor ---
// only batch instructors can remove other instructors

export const removeBatchInstructor = mutation({
  args: { batchId: v.id("batches"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    await requireBatchOwner(ctx.db, callerId, args.batchId);

    // owner cannot remove themself — ownership isn't transferable per current design
    const batch = await ctx.db.get(args.batchId);
    if (batch?.createdBy === args.userId) {
      throw new ConvexError("Cannot remove the batch owner");
    }

    const row = await ctx.db
      .query("batch_instructors")
      .withIndex("batchId_userId", q =>
        q.eq("batchId", args.batchId).eq("userId", args.userId))
      .first();
    if (!row) throw new ConvexError("User is not a batch instructor");

    await ctx.db.patch(row._id, { deletedAt: Date.now() });
  },
});


// --- updateBatchStatus ---
export const updateBatchStatus = mutation({
  args: {
    batchId: v.id("batches"),
    status: v.union(v.literal("upcoming"), v.literal("active"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    await requireBatchInstructor(ctx.db, callerId, args.batchId);

    await ctx.db.patch(args.batchId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});


// --- enrollStudentInBatch ---
// REQ-BAT-003 — the important one: cascades enrollment into every course in the batch
export const enrollStudentInBatch = mutation({
  args: { batchId: v.id("batches"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    // caller must be batch instructor OR the student enrolling themself — adjust if
    // you want self-enrollment to work differently
    const isInstructor = await ctx.db
      .query("batch_instructors")
      .withIndex("batchId_userId", q =>
        q.eq("batchId", args.batchId).eq("userId", callerId))
      .first();
    if (!isInstructor && callerId !== args.userId) {
      throw new ConvexError("Unauthorized");
    }

    const existing = await ctx.db
      .query("batch_students")
      .withIndex("batchId_userId", q =>
        q.eq("batchId", args.batchId).eq("userId", args.userId))
      .first();
    if (existing) throw new ConvexError("Student already enrolled in this batch");

    const now = Date.now();
    await ctx.db.insert("batch_students", {
      batchId: args.batchId,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    // cascade — enroll in every course tied to this batch
    const batchCourses = await ctx.db
      .query("batch_courses")
      .withIndex("batchId", q => q.eq("batchId", args.batchId))
      .collect();

    for (const bc of batchCourses) {
      const course = await ctx.db.get(bc.courseId);
      if (!course || course.status !== "published") continue;
      const alreadyEnrolled = await ctx.db
        .query("enrollments")
        .withIndex("userId_courseId", q =>
          q.eq("userId", args.userId).eq("courseId", bc.courseId))
        .first();

      if (!alreadyEnrolled) {
        await ctx.db.insert("enrollments", {
          userId: args.userId,
          courseId: bc.courseId,
          enrolledAt: now,
          status: "active",
          updatedAt: now,
        });
      }
    }
  },
});