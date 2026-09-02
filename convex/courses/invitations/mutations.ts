import { v, ConvexError } from "convex/values";
import { mutation } from "../../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ensureRole, requireCourseOwner } from "../../lib/authorization";
import { internal } from "../../_generated/api"; 

// --- inviteCoInstructor ---
// owner-only: sends an invite link to an email address.
// no expiry, per decision — invitations stay pending until accepted or revoked.
export const inviteCoInstructor = mutation({
  args: { courseId: v.id("courses"), email: v.string() },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    await requireCourseOwner(ctx.db, callerId, args.courseId);

    const normalizedEmail = args.email.trim().toLowerCase();

    // don't double-invite an email that already has a pending invite
    const existingInvite = await ctx.db
      .query("course_invitations")
      .withIndex("courseId_email", q =>
        q.eq("courseId", args.courseId).eq("email", normalizedEmail))
      .first();
    if (existingInvite && existingInvite.status === "pending") {
      throw new ConvexError("An invitation is already pending for this email");
    }

    // don't invite someone who's already an active co-instructor
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", q => q.eq("email", normalizedEmail))
      .first();
    if (existingUser) {
      const alreadyInstructor = await ctx.db
        .query("course_instructors")
        .withIndex("courseId_userId", q =>
          q.eq("courseId", args.courseId).eq("userId", existingUser._id))
        .first();
      if (alreadyInstructor && !alreadyInstructor.deletedAt) {
        throw new ConvexError("This user is already a co-instructor on this course");
      }
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const now = Date.now();

    const invitationId = await ctx.db.insert("course_invitations", {
      courseId: args.courseId,
      email: normalizedEmail,
      token,
      status: "pending",
      invitedBy: callerId,
      createdAt: now,
      updatedAt: now,
    });

    // fire off the email — scheduled so this mutation doesn't wait on the send
    await ctx.scheduler.runAfter(0, internal.courses.actions.sendInviteEmail, {
      email: normalizedEmail,
      token,
      courseId: args.courseId,
    });

    return invitationId;
  },
});

// --- revokeCoInstructorInvite ---
// owner-only: cancels a pending invitation before it's accepted
export const revokeCoInstructorInvite = mutation({
  args: { invitationId: v.id("course_invitations") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new ConvexError("Invitation not found");

    await requireCourseOwner(ctx.db, callerId, invitation.courseId);

    if (invitation.status !== "pending") {
      throw new ConvexError("Only pending invitations can be revoked");
    }

    await ctx.db.patch(args.invitationId, {
      status: "revoked",
      updatedAt: Date.now(),
    });
  },
});

// --- acceptCourseInvitation ---
// called when someone clicks the invite link AND is logged in.
// verifies their logged-in email matches the invited email before adding them.
export const acceptCourseInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    const invitation = await ctx.db
      .query("course_invitations")
      .withIndex("token", q => q.eq("token", args.token))
      .first();

    if (!invitation) throw new ConvexError("Invalid invitation link");
    if (invitation.status === "accepted") throw new ConvexError("This invitation has already been used");
    if (invitation.status === "revoked") throw new ConvexError("This invitation is no longer valid");

    const caller = await ctx.db.get(callerId);
    if (!caller) throw new ConvexError("User not found");

    // security check: the logged-in account's email must match the invited email
    // otherwise anyone could grab a link meant for someone else
    if (caller.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ConvexError(
        "This invitation was sent to a different email address. Please log in with that email."
      );
    }

    const now = Date.now();

    const existing = await ctx.db
      .query("course_instructors")
      .withIndex("courseId_userId", q =>
        q.eq("courseId", invitation.courseId).eq("userId", callerId))
      .first();

    if (existing && existing.deletedAt) {
      // was previously removed — reactivate rather than duplicate-insert
      await ctx.db.patch(existing._id, {
        deletedAt: undefined,
        role: "co-instructor",
        updatedAt: now,
      });
    } else if (!existing) {
      await ctx.db.insert("course_instructors", {
        courseId: invitation.courseId,
        userId: callerId,
        role: "co-instructor",
        createdAt: now,
        updatedAt: now,
      });
    }
    // if existing && !deletedAt, they're already an active instructor — no-op, just mark accepted below

    await ensureRole(ctx.db, callerId, "teacher");

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    });

    return { courseId: invitation.courseId };
  },
});