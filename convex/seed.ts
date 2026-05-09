import { internalMutation } from "./_generated/server";

export const seedRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const roles = ["student", "teacher", "moderator", "evaluator"];
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

export const seedCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const categories = [
      { name: "Programming", description: "Software development and coding" },
      { name: "Design", description: "UI/UX and graphic design" },
      { name: "Business", description: "Entrepreneurship and management" },
      { name: "Data Science", description: "Data analysis and machine learning" },
      { name: "Web Development", description: "Frontend and backend web development" },
      { name: "Mobile Development", description: "iOS and Android development" },
    ];

    for (const category of categories) {
      // check if already exists before inserting
      const existing = await ctx.db
        .query("categories")
        .withIndex("name", (q) => q.eq("name", category.name))
        .first();
      if (!existing) {
        await ctx.db.insert("categories", {
          name: category.name,
          description: category.description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  },
});