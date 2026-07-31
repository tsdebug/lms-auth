"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { Resend as ResendAPI } from "resend";

export const sendInviteEmail = internalAction({
  args: {
    email: v.string(),
    token: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // matches the key + client pattern used in ResendOTPPasswordReset.ts
    const resend = new ResendAPI(process.env.AUTH_RESEND_KEY);

    const baseUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${args.token}`;

    const { error } = await resend.emails.send({
      from: "LMS App <onboarding@resend.dev>", // matches existing sender identity
      to: [args.email],
      subject: "You've been invited to co-instruct a course",
      text: `You've been invited to join a course as a co-instructor.\n\nAccept here: ${inviteUrl}\n\nIf you don't have an account yet, you'll be asked to sign up first — the invitation will be applied automatically once you're signed in.`,
    });

    if (error) {
      throw new Error("Could not send invite email");
    }
  },
});