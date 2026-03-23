# Technical Requirements Document (TRD)
## Learning Management System (LMS)

| | |
|---|---|
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | 2026-03-21 |
| **Author** | Tanushree Shaw |
| **Companion Document** | [PRD.md](./PRD.md) |

---

## 1. Introduction & Overview

### 1.1 Purpose

This document defines the technical implementation details for the Learning Management System (LMS). It translates feature requirements from the PRD into architectural decisions, data structures, backend function design, security considerations, and deployment strategy.

This document is the authoritative reference for engineers building or maintaining the system. Any implementation decision not covered here should be raised as an open question before proceeding.

### 1.2 Audience

| Audience | Usage |
|---|---|
| Frontend engineers | Architecture, component structure, API contracts |
| Backend engineers | Function design, schema, error handling, auth patterns |
| DevOps / infrastructure | Deployment, environment setup, secret management |
| QA engineers | Acceptance criteria, test plan |
| Technical leads | Architecture decisions, NFRs, security design |

---

## 2. Overall Description

### 2.1 Technology Stack

| Layer | Technology | 
|---|---|
| Frontend framework | Next.js (App Router) |
| Backend platform | Convex |
| Authentication | Convex Auth | 
| Language | TypeScript | 
| Styling | Tailwind CSS | 
| UI component library | shadcn/ui |
| File storage | Cloudflare R2 | 
| Frontend hosting | Vercel | 
| Backend hosting | Convex Cloud |


### 2.2 Assumptions

- All users access the system via a modern web browser. Mobile app support is out of scope for v1.
- Instructors upload media files directly from the browser via the teacher dashboard.
- Video files are served via CDN and streamed. The platform does not transcode video.
- The system operates in a single region in v1. Multi-region deployment is a future concern.
- Email notifications are out of scope for v1. No email provider integration is required.
- All time-related data is stored as UTC. Timezone conversion is handled client-side.

### 2.3 Constraints

- Convex's free tier limits apply during development. Production deployment requires a paid Convex plan.
- Convex mutations cannot call external APIs directly — this must be done via Actions.
- File uploads must be routed through Convex Actions (server-side) to keep storage credentials out of the browser.
- Next.js server components cannot use Convex client-side hooks (`useQuery`, `useMutation`). Server-side data fetching uses the Convex HTTP client.

### 2.4 Dependencies

| Dependency | Type | Impact if unavailable |
|---|---|---|
| Convex Cloud | Runtime (backend + DB) | Complete system outage |
| Vercel | Runtime (frontend) | Frontend unavailable; backend still functions |
| Cloudflare R2 | Runtime (file storage) | File uploads fail; existing URLs unaffected |
| Convex Auth | Runtime (auth) | Login and signup unavailable |

---

## 3. Functional Requirements

Requirements are written as verifiable technical statements. Each requirement maps to one or more acceptance criteria in Section 9.

Format: `REQ-[domain]-[number]: [component] must [behaviour] when [condition].`

### 3.1 User & Authentication

| ID | Requirement |
|---|---|
| REQ-AUTH-001 | The system must create a Convex Auth credential record and a `user_roles` row in a single sign-up flow. |
| REQ-AUTH-002 | The system must reject any mutation call that does not include a valid session token with an `Unauthenticated` error. |
| REQ-AUTH-003 | The system must reject any mutation call where the authenticated user lacks the required role with an `Unauthorized` error. |
| REQ-AUTH-004 | A user must be able to hold more than one role simultaneously (e.g. both `student` and `teacher`). Role membership is stored in `user_roles`, not as a scalar field on the user record. |
| REQ-AUTH-005 | The system must expose a `getUserProfile` query that returns profile fields and all assigned roles for a given `userId`. |
| REQ-USER-001 | A user must be able to update their `bio`, `expertise`, `experienceLevel`, `pfpUrl`, and `slug` via `updateUserProfile`. |
| REQ-USER-002 | User `slug` values must be unique across all users. The mutation must reject a slug that is already in use. |
| REQ-USER-003 | The system must expose a `getTeacherDirectory` query that returns all users with the `teacher` role, filterable by `expertise` and `experienceLevel`. |

### 3.2 Courses

| ID | Requirement |
|---|---|
| REQ-CRS-001 | A user with the `teacher` role must be able to create a course. Created courses must default to `status: "draft"` and must not appear in public listings. |
| REQ-CRS-002 | The `publishCourse` mutation must verify that every chapter in the course contains at least one lesson before setting `status: "published"`. It must return a specific error identifying empty chapters if the check fails. |
| REQ-CRS-003 | Course `slug` values must be unique across all courses. The mutation must reject a duplicate slug. |
| REQ-CRS-004 | A course must support multiple instructors via the `course_instructors` bridge table. The creating user is the owner; co-instructors may be added separately. |
| REQ-CRS-005 | The `getCourses` query must support pagination and accept optional filters for `categoryId`, `tagId`, `difficultyLevel`, and `status`. |
| REQ-CRS-006 | Only the course owner or a co-instructor may call `updateCourse`, `publishCourse`, or `createChapter` on a given course. |

### 3.3 Chapters & Lessons

| ID | Requirement |
|---|---|
| REQ-CHR-001 | Chapters must store an `index` field. The `courseId_index` compound index must enforce unique ordering per course. |
| REQ-LES-001 | Lessons must store an `index` field. The `chapterId_index` compound index must enforce unique ordering per chapter. |
| REQ-LES-002 | A lesson must be accessible only to users with an active enrollment in the parent course. `getLessonContent` must verify enrollment before returning content. |

### 3.4 Media files

| ID | Requirement |
|---|---|
| REQ-MED-001 | File uploads must be processed through a Convex Action. Storage credentials must never be exposed to the browser. |
| REQ-MED-002 | After a successful upload, the Action must write a row to `media_files` containing `lessonId`, `fileUrl`, `fileType`, `fileSize`, `fileName`, `isDownloadable`, and `index`. |
| REQ-MED-003 | The system must validate file MIME type server-side before initiating the upload. Extension-only checks are not sufficient. |
| REQ-MED-004 | File size limits must be enforced before upload: video ≤ 2 GB, PDF/slides ≤ 50 MB, images ≤ 10 MB, code files ≤ 5 MB. |
| REQ-MED-005 | A scheduled cleanup Action must run periodically to identify and flag orphaned files — files present in storage with no corresponding `media_files` row. |

### 3.5 Quizzes

| ID | Requirement |
|---|---|
| REQ-QZ-001 | A quiz must be attached to exactly one lesson via `lessonId`. |
| REQ-QZ-002 | Each question must have exactly one answer option with `isCorrect: true`. The `createAnswers` mutation must validate this constraint before inserting. |
| REQ-QZ-003 | The `submitQuiz` mutation must create a `quiz_attempts` row and one `user_answers` row per question. It must return the calculated score and the correct answers. |
| REQ-QZ-004 | `quiz_attempts` must record both `startedAt` and `completedAt` timestamps to enable detection of abandoned attempts. |
| REQ-QZ-005 | A student must not be able to submit a quiz they have already completed. The `userId_quizId` index must be used to check for an existing completed attempt. |

### 3.6 Assignments

| ID | Requirement |
|---|---|
| REQ-ASN-001 | An assignment may be attached to either a lesson (`lessonId`) or a chapter (`chapterId`). At least one must be set; the mutation must reject assignments with neither. |
| REQ-ASN-002 | A submission must support text, an external URL, and one or more uploaded files simultaneously. Files are stored in `submission_files`; text and URL are stored in `submissions`. |
| REQ-ASN-003 | Each resubmission must increment the `attemptNumber` field on the new `submissions` row. The `allowResubmission` flag on the assignment must be checked before accepting a resubmission. |
| REQ-ASN-004 | Only a user with the `teacher` or `evaluator` role may call `gradeSubmission`. The grader's `userId` must be written to `gradedBy` on the submission. |

### 3.7 Enrollments & Progress

| ID | Requirement |
|---|---|
| REQ-ENR-001 | A student must be enrolled in a course before they can access any lesson, attempt any quiz, or submit any assignment in that course. |
| REQ-ENR-002 | The `getEnrollments` query must return enrolled students with per-lesson completion data for a given course. It must be restricted to the course owner or a co-instructor. |
| REQ-PRG-001 | When a student completes a lesson, a `lesson_completions` row must be created. The `userId_lessonId` index must prevent duplicate completion records. |

### 3.8 Certificates

| ID | Requirement |
|---|---|
| REQ-CRT-001 | A certificate must be issued only when a student has completed all lessons, passed all required quizzes, and submitted all required assignments in a course. |
| REQ-CRT-002 | Each certificate must contain a unique `verificationCode`. Any visitor must be able to verify a certificate using only this code via a public query. |
| REQ-CRT-003 | Certificates must be downloadable as PDF. Generation is handled by a Convex Action. |

### 3.9 Batches

| ID | Requirement |
|---|---|
| REQ-BAT-001 | A batch must support multiple assigned instructors via the `batch_instructors` bridge table. |
| REQ-BAT-002 | Batch status must be one of `upcoming`, `active`, or `completed` enforced at the schema level using `v.union(v.literal(...))`. |
| REQ-BAT-003 | Enrolling a student in a batch must automatically enroll them in all courses associated with that batch via `batch_courses`. |

--- 

