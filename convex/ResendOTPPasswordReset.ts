import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    // generate 8 random digits without @oslojs/crypto
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((n) => n % 10)
      .join("");
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "LMS App <onboarding@resend.dev>",
      to: [email],
      subject: "Reset your password",
      text: `Your password reset code is: ${token}\n\nThis code expires shortly. If you didn't request this, ignore this email.`,
    });
    if (error) {
      throw new Error("Could not send reset email");
    }
  },
});