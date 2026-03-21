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

### 1.3 Scope

**This document covers:**

- Technology stack decisions and rationale
- System and application architecture
- Database schema organisation and conventions
- Backend function structure and design patterns
- File storage design and upload flow
- Authentication and authorisation implementation
- Error handling strategy
- Security design
- Non-functional requirements with measurable targets
- Functional requirements as verifiable technical statements
- Acceptance criteria per major flow
- Deployment and environment setup

**This document does not cover:**

- Feature requirements — see [PRD.md](./PRD.md)
- UI design specifications or wireframes
- Business strategy or product roadmap
- Third-party SLA guarantees

### 1.4 Project Summary

The LMS is a web-based platform where instructors create structured courses and students enroll, learn, and track progress. The system supports multiple user roles, quiz-based assessment, file-based assignments, course batches, and certificate issuance. Version 1 delivers the core learning experience. Paid courses, discussion forums, and live sessions are deferred to future versions.

---

## 2. Definitions, Acronyms & Abbreviations

### 2.1 Convex-specific terms

| Term | Definition |
|---|---|
| **Query** | A Convex function type used exclusively for reading data. Queries are reactive — subscribed clients receive automatic updates when the underlying data changes. Queries cannot perform writes. |
| **Mutation** | A Convex function type used for transactional database writes. A mutation either completes fully or rolls back entirely. All mutations in this system validate inputs and check authorisation before writing. |
| **Action** | A Convex function type that can call external services (file storage, email providers, LLM APIs). Actions are not transactional and may call mutations internally to persist results. |
| **`useQuery`** | A React hook that subscribes to a Convex query over a persistent WebSocket connection. The component re-renders automatically when data changes. Not a one-time fetch. |
| **`useMutation`** | A React hook that calls a Convex mutation. Returns a promise that resolves with the mutation's return value or rejects with a `ConvexError`. |
| **Schema** | The TypeScript file at `convex/schema.ts` that defines all database tables, field types, and indexes. Convex generates TypeScript types from this file automatically. |
| **Convex Auth** | The official Convex authentication library. Manages password hashing (bcrypt), session tokens, and token verification within the Convex runtime. |
| **`_id`** | The auto-generated primary key assigned by Convex to every document. Type-safe and unique per table. |

### 2.2 Domain terms

| Term | Definition |
|---|---|
| **Course** | A complete learning program on a topic, created by a teacher, containing chapters and lessons. Always in one of three statuses: `draft`, `published`, or `archived`. |
| **Chapter** | An ordered section within a course. Chapters contain lessons. A course must have at least one lesson per chapter before it can be published. |
| **Lesson** | An individual learning unit within a chapter. Contains an ordered set of media files. |
| **Batch** | A cohort — a group of students enrolled together in one or more courses with a defined start and end date. Status: `upcoming`, `active`, or `completed`. |
| **Quiz attempt** | A single instance of a student taking a quiz. Records the score, the answers selected, and the start and completion timestamps. |
| **Submission** | A student's response to an assignment. Can include text, an external URL, and one or more uploaded files. Tracks attempt number to support resubmission. |
| **Soft delete** | The practice of setting a `deletedAt` timestamp rather than removing a record from the database. Soft-deleted records are excluded from all queries by default but are never permanently lost in v1. |
| **Slug** | A URL-safe, human-readable identifier derived from a name (e.g. `intro-to-python`). Used in course and user profile URLs. Must be unique. |

### 2.3 Acronyms

| Acronym | Meaning |
|---|---|
| LMS | Learning Management System |
| TRD | Technical Requirements Document |
| PRD | Product Requirements Document |
| RBAC | Role-Based Access Control |
| SSR | Server-Side Rendering |
| CDN | Content Delivery Network |
| NFR | Non-Functional Requirement |
| REQ | Requirement |
| AC | Acceptance Criterion |

---