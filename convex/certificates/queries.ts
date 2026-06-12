import { v } from "convex/values"
import { query } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// getMyCertificates — fetch all certificates earned by the logged in student
// used on /student/certificates page
export const getMyCertificates = query({
  args: {},
  handler: async (ctx) => {
    // step 1: auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) return []

    // step 2: get all certificates for this student
    const certs = await ctx.db
      .query("certificates")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect()

    // step 3: filter out revoked ones
    const active = certs.filter((c) => c.status === "issued")

    // step 4: enrich each cert with course title
    // WHY: we only store courseId on the cert, student needs the title to display
    const enriched = await Promise.all(
      active.map(async (cert) => {
        const course = await ctx.db.get(cert.courseId)
        return {
          ...cert,
          courseTitle: course?.title ?? "Unknown Course",
          // instructorName for display on certificate
          instructorName: course
            ? await ctx.db.get(course.userId).then((u) =>
                u ? `${u.fName ?? ""} ${u.lName ?? ""}`.trim() : "Unknown"
              )
            : "Unknown",
        }
      })
    )

    // step 5: sort by most recently issued first
    return enriched.sort((a, b) => b.issuedAt - a.issuedAt)
  },
})

// getCertificateByCode — public verification query
// anyone with the code can verify a certificate — no auth required
// used on /certificate/[code] page
export const getCertificateByCode = query({
  args: {
    verificationCode: v.string(),
  },
  handler: async (ctx, args) => {
    // step 1: find cert by verification code
    // WHY NO AUTH: this page is public — employers/institutions verify certificates
    const cert = await ctx.db
      .query("certificates")
      .withIndex("verificationCode", (q) =>
        q.eq("verificationCode", args.verificationCode)
      )
      .first()

    // step 2: return null if not found or revoked
    // WHY NULL NOT ERROR: public page should show "not found" gracefully
    if (!cert || cert.status === "revoked") return null

    // step 3: enrich with course and student name for display
    const course = await ctx.db.get(cert.courseId)
    const user = await ctx.db.get(cert.userId)

    return {
      verificationCode: cert.verificationCode,
      issuedAt: cert.issuedAt,
      completedAt: cert.completedAt,
      courseTitle: course?.title ?? "Unknown Course",
      recipientName: user
        ? `${user.fName ?? ""} ${user.lName ?? ""}`.trim()
        : "Unknown",
      instructorName: course
        ? await ctx.db.get(course.userId).then((u) =>
            u ? `${u.fName ?? ""} ${u.lName ?? ""}`.trim() : "Unknown"
          )
        : "Unknown",
      status: cert.status,
    }
  },
})