import { DatabaseReader } from "../_generated/server"
import { Id } from "../_generated/dataModel"

// Platform-Level Role check
// should throw an error if the user doesn't have the role
export async function requireRole(
    db: DatabaseReader,
    userId: Id<"users">,
    roleName: string
): Promise<void> {
    // step 1 — find the role row by name
    const role = await db
        .query("roles")
        .withIndex("name", (q) => q.eq("name", roleName))
        .first();

    // step 2 — if the role doesn't even exist in the roles table, throw an error
    if (!role) {
        throw new Error(`Role ${roleName} not found`);
    }

    // step 3 — check if this user has that role
    const userRole = await db
        .query("user_roles")
        .withIndex("userId_roleId", (q) => q.eq("userId", userId).eq("roleId", role._id))
        .first();

    // step 4 — if no matching row, they don't have this role
    if (!userRole) {
        throw new Error(`User ${userId} does not have role ${roleName}`);
    }
}

// Course-Level Role check
// should throw an error if the user isn't an instructor on this course
export async function requireCourseRole(
    db: DatabaseReader,
    userId: Id<"users">,
    courseId: Id<"courses">
): Promise<void> {
    const instructor = await db
        .query("course_instructors")
        .withIndex("courseId_userId", (q) => q.eq("courseId", courseId).eq("userId", userId))
        .first();

    if (!instructor) {
        throw new Error(`User ${userId} is not an instructor for course ${courseId}`);
    }
}
