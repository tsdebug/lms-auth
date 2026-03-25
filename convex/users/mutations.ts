import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createUserProfile = mutation({
    args: {
        // what arguments do we need here?
        fName: v.string(),
        lName: v.string(),
        role: v.union(v.literal("student"), v.literal("teacher")),
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

        await ctx.db.patch(authUserId, {   // don't need to insert email again — it's already in the users row that Convex Auth created, just updating that existing row with the extra fields... thus use patch, instead ofinsert
            fName: args.fName,
            lName: args.lName,
            updatedAt: Date.now(),
        });

        // step 3: find the role's _id from the roles table
        const role = await ctx.db
            .query("roles")
            .withIndex("name", (q) => q.eq("name", args.role))
            .first();
        if (!role) {
            throw new Error(`Role not found: ${args.role}`);
        }
        // step 4: write to user_roles table
        await ctx.db.insert("user_roles", {
            userId: authUserId,
            roleId: role._id,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    },
});