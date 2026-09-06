import { v, ConvexError } from "convex/values";
import { query } from "../../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireCourseOwner } from "../../lib/authorization";


// --- getInvitationByToken ---
// public query — powers the /invite/[token] landing page.
// no auth required so the page can decide login vs signup before the user is authenticated.
export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("course_invitations")
      .withIndex("token", q => q.eq("token", args.token))
      .first();

    if (!invitation) return null;

    const course = await ctx.db.get(invitation.courseId);

    // check whether an account already exists for this email —
    // the frontend uses this to decide "send to login" vs "send to signup"
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", q => q.eq("email", invitation.email))
      .first();

    return {
      status: invitation.status,
      email: invitation.email,
      courseTitle: course?.title ?? "Unknown Course",
      accountExists: !!existingUser,
    };
  },
});

// --- getPendingInvitesForCourse ---
// owner-only view of who's been invited but hasn't accepted yet
export const getPendingInvitesForCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");

    await requireCourseOwner(ctx.db, callerId, args.courseId);

    const invites = await ctx.db
      .query("course_invitations")
      .withIndex("courseId", q => q.eq("courseId", args.courseId))
      .collect();

    return invites.filter(i => i.status === "pending");
  },
});