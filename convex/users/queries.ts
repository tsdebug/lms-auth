import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// getUserProfile - for user profile page, need to fetch user info + all their roles
export const getUserProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // 1. Verify the requester is authenticated
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("User must be authenticated");
    }

    // 2. Fetch the user profile
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // 3. Fetch all roles for this user
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    // 4. Get role details for each user_role entry
    const roles = await Promise.all(
      userRoles.map(async (ur) => {
        const role = await ctx.db.get(ur.roleId);
        return role;
      })
    );

    return {
      ...user, // spread operator to include all user fields (fName, lName, email, etc.)
      roles: roles.filter(Boolean), // Filter out any null roles
    };
  },
});


// getTeacherDirectory - for teacher directory page, need to fetch all teachers, with optional filters for expertise and experience level
export const getTeacherDirectory = query({
  args: {
    expertise: v.optional(v.string()),
    experienceLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
  },
  handler: async (ctx, { expertise, experienceLevel }) => {
    // 1. Get the "teacher" role
    const teacherRole = await ctx.db
      .query("roles")
      .withIndex("name", (q) => q.eq("name", "teacher"))
      .first();

    if (!teacherRole) {
      return []; // No teacher role exists yet
    }

    // 2. Get all user_roles entries for teachers
    const teacherUserRoles = await ctx.db
      .query("user_roles")
      .withIndex("roleId", (q) => q.eq("roleId", teacherRole._id))
      .collect();

    // 3. Fetch user profiles for each teacher
    const teachers = await Promise.all(
      teacherUserRoles.map(async (ur) => {
        const user = await ctx.db.get(ur.userId);
        return user;
      })
    );

    // 4. Filter out null/deleted users
    let filtered = teachers.filter(Boolean);

    // 5. Apply expertise filter if provided
    if (expertise) {
      filtered = filtered.filter(
        (user) => user?.expertise && user.expertise.includes(expertise)
      );
    }

    // 6. Apply experienceLevel filter if provided
    if (experienceLevel) {
      filtered = filtered.filter(
        (user) => user?.experienceLevel === experienceLevel
      );
    }

    return filtered;
  },
});
