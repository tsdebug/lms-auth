import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ensureRole } from "../lib/authorization";

// createUserProfile - called when user submits profile form for the first time, to save their name and role
export const createUserProfile = mutation({
    args: {
        // what arguments do we need here?
        fName: v.string(),
        lName: v.string(),
        role: v.union(v.literal("student"), v.literal("teacher")),
        slug: v.optional(v.string()),
    },
    // step 1: check if the user is authenticated
    // Verify the requester is authenticated
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            throw new Error("User must be authenticated");
        }

        // step 2: check user exists and write to users table
        const existingUser = await ctx.db.get(authUserId);
        if (!existingUser) {
            throw new Error("User not found");
        }

        if (args.slug) {
            const existingSlug = await ctx.db
                .query("users")
                .withIndex("slug", (q) => q.eq("slug", args.slug))
                .first();

            if (existingSlug && existingSlug._id !== authUserId) {
                throw new Error("Slug already in use");
            }
        }

        await ctx.db.patch(authUserId, {   // don't need to insert email again — it's already in the users row that Convex Auth created, just updating that existing row with the extra fields... thus use patch, instead ofinsert
            fName: args.fName,
            lName: args.lName,
            updatedAt: Date.now(),
        });

        // step 3: ensure the selected platform role is assigned once
        await ensureRole(ctx.db, authUserId, args.role);
    },
});

// updateUserProfile - allows authenticated users to update their profile fields
export const updateUserProfile = mutation({
    args: {
        fName: v.optional(v.string()),
        lName: v.optional(v.string()),
        bio: v.optional(v.string()),
        expertise: v.optional(v.array(v.string())),
        availability: v.optional(v.string()),
        pfpUrl: v.optional(v.string()),
        experienceLevel: v.optional(
            v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
        ),
        slug: v.optional(v.string()),
    },

    handler: async (ctx, args) => {
        // 1. Verify the requester is authenticated
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            throw new Error("User must be authenticated");
        }

        // 2. Check if user exists
        const existingUser = await ctx.db.get(authUserId);
        if (!existingUser) {
            throw new Error("User not found");
        }

        if (args.slug) {
            const existingSlug = await ctx.db
                .query("users")
                .withIndex("slug", (q) => q.eq("slug", args.slug))
                .first();

            if (existingSlug && existingSlug._id !== authUserId) {
                throw new Error("Slug already in use");
            }
        }

        // 3. Update the user profile with provided fields
        await ctx.db.patch(authUserId, {
            ...args,
            updatedAt: Date.now(),
        });
    },
});