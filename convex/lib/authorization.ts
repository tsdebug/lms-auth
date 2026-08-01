import { DatabaseReader } from "../_generated/server"
import { Id } from "../_generated/dataModel"

// --- Platform-Level Role check ---
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
    if (!role || role.deletedAt) {
        throw new Error(`Role ${roleName} not found`);
    }

    // step 3 — check if this user has that role
    const userRole = await db
        .query("user_roles")
        .withIndex("userId_roleId", (q) => q.eq("userId", userId).eq("roleId", role._id))
        .first();

    // step 4 — if no matching row, they don't have this role
    if (!userRole || userRole.deletedAt) {
        throw new Error(`User ${userId} does not have role ${roleName}`);
    }
}

// --- Course-Level Role check ---
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

    if (!instructor || instructor.deletedAt) {
        throw new Error(`User ${userId} is not an instructor for course ${courseId}`);
    }
}

// --- checks student is enrolled in a course ---
// throws if not — same pattern as requireCourseRole
export async function requireEnrollment(
    db: DatabaseReader,
    userId: Id<"users">,
    courseId: Id<"courses">
): Promise<void> {
    const enrollment = await db
        .query("enrollments")
        .withIndex("userId_courseId", (q) =>
            q.eq("userId", userId).eq("courseId", courseId)
        )
        .first()

    if (!enrollment || enrollment.deletedAt) {
        throw new Error("Unauthorized: not enrolled in this course")
    }
}

// --- checks if user can view a course — either enrolled or instructor
// checks if user can grade quizzes for a course — either course instructor or platform evaluator role
export async function requireGradingPermission(
    db: DatabaseReader,
    userId: Id<"users">,
    courseId: Id<"courses">
): Promise<void> {
    // path 1 — course instructor
    const instructor = await db
        .query("course_instructors")
        .withIndex("courseId_userId", (q) =>
            q.eq("courseId", courseId).eq("userId", userId)
        )
        .first()

    if (instructor && !instructor.deletedAt) return // they're an instructor, done

    // path 2 — platform evaluator role
    const evaluatorRole = await db
        .query("roles")
        .withIndex("name", (q) => q.eq("name", "evaluator"))
        .first()

    if (evaluatorRole && !evaluatorRole.deletedAt) {
        const hasRole = await db
            .query("user_roles")
            .withIndex("userId_roleId", (q) =>
                q.eq("userId", userId).eq("roleId", evaluatorRole._id)
            )
            .first()

        if (hasRole && !hasRole.deletedAt) return // they're an evaluator, done
    }

    throw new Error("Unauthorized") // neither
}

// --- Owner-only check — stricter than requireCourseRole ---
// Used for: publishCourse, archiveCourse, deleteCourse, add/removeCoInstructor.
export async function requireCourseOwner(
    db: DatabaseReader,
    userId: Id<"users">,
    courseId: Id<"courses">
): Promise<void> {
    const course = await db.get(courseId);
    if (!course) {
        throw new Error("Course not found");
    }
    if (course.userId !== userId) {
        throw new Error("Unauthorized: only the course owner can perform this action");
    }
}


// Batch-Level Role check

// --- requireBatchInstructor---
// should throw an error if the user isn't an instructor on this batch
export async function requireBatchInstructor(
    db: DatabaseReader,
    userId: Id<"users">,
    batchId: Id<"batches">
): Promise<void> {
    const instructor = await db
        .query("batch_instructors")
        .withIndex("batchId_userId", (q) =>
            q.eq("batchId", batchId).eq("userId", userId)
        )
        .first();

    if (!instructor || instructor.deletedAt) {
        throw new Error(`User ${userId} is not an instructor for batch ${batchId}`);
    }
}


// --- requireBatchOwner---
// should throw an error if the user isn't the owner of this batch
export async function requireBatchOwner(
    db: DatabaseReader,
    userId: Id<"users">,
    batchId: Id<"batches">
): Promise<void> {
    const batch = await db.get(batchId);
    if (!batch) {
        throw new Error("Batch not found");
    }
    if (batch.createdBy !== userId) {
        throw new Error("Unauthorized: only the batch owner can perform this action");
    }
}

// Stricter content-management check — same as requireCourseRole, but
// excludes evaluators. Evaluators grade only; they can't create/edit/delete
// course content. Use requireCourseRole for VIEW access (any instructor role).
// Use this for anything that CREATES, EDITS, or DELETES course content.
export async function requireCourseContentRole(
    db: DatabaseReader,
    userId: Id<"users">,
    courseId: Id<"courses">
): Promise<void> {
    const instructor = await db
        .query("course_instructors")
        .withIndex("courseId_userId", (q) => q.eq("courseId", courseId).eq("userId", userId))
        .first();

    if (!instructor || instructor.deletedAt) {
        throw new Error(`User ${userId} is not an instructor for course ${courseId}`);
    }

    if (instructor.role === "evaluator") {
        throw new Error("Evaluators cannot manage course content");
    }
}