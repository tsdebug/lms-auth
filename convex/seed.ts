import { internalMutation } from "./_generated/server";

export const seedRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const roles = ["student", "teacher"];
    for (const name of roles) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("name", (q) => q.eq("name", name))
        .first();
      if (!existing) {
        await ctx.db.insert("roles", {
          name,
          description: `Default ${name} role`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  },
});