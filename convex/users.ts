import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const roles = await Promise.all(
      userRoles.map(async (ur) => await ctx.db.get(ur.roleId))
    );

    const nonNullRoles = roles.filter((role): role is NonNullable<typeof role> => role !== null);
    const primaryRole = nonNullRoles.length > 0 ? nonNullRoles[0].name : null;

    return {
      ...user,
      roles: nonNullRoles,
      role: primaryRole,
    };
  },
});