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

## Table of Contents

1. [Introduction & Overview](#1-introduction--overview)
2. [Definitions, Acronyms & Abbreviations](#2-definitions-acronyms--abbreviations)
3. [References](#3-references)
4. [Overall Description](#4-overall-description)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Architecture & Design](#7-system-architecture--design)
8. [Technical Specifications](#8-technical-specifications)
9. [Acceptance Criteria & Test Plan](#9-acceptance-criteria--test-plan)
10. [Glossary & Appendix](#10-glossary--appendix)

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

## 3. References

| Document | Location | Purpose |
|---|---|---|
| Product Requirements Document | [PRD.md](./PRD.md) | Feature requirements and user stories |
| Convex documentation | https://docs.convex.dev | Backend platform reference |
| Convex Auth documentation | https://labs.convex.dev/auth | Authentication implementation reference |
| Convex schema reference | `convex/schema.ts` | Database schema — single source of truth for types |
| Next.js App Router docs | https://nextjs.org/docs/app | Frontend framework reference |
| Cloudflare R2 documentation | https://developers.cloudflare.com/r2 | File storage API reference |
| shadcn/ui documentation | https://ui.shadcn.com | UI component library reference |
| Tailwind CSS documentation | https://tailwindcss.com/docs | Styling framework reference |

---

## 4. Overall Description

### 4.1 Technology Stack

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

### 4.2 Technology Rationale

**Next.js** was chosen for its hybrid rendering model. Public pages (course catalogue, instructor directory) benefit from SSR for SEO and initial load performance. Authenticated dashboards use client components with reactive Convex subscriptions. The App Router's route group feature cleanly separates public, auth, and authenticated route trees.

**Convex** replaces the traditional REST API + relational database stack with serverless backend functions and a reactive document database. Key reasons for this choice: queries are reactive by default, eliminating the need for polling or manual cache invalidation on dashboards; the schema generates TypeScript types automatically, meaning database field changes surface as compile errors rather than runtime bugs; and infrastructure management (scaling, backups, deployment) is handled entirely by the platform.

**Convex Auth** was chosen over external providers (Auth0, Clerk) to keep the entire auth flow within the same type system and deployment unit as the rest of the backend. It supports email/password in v1 and can be extended to OAuth providers without architectural changes.

**Cloudflare R2** was chosen over AWS S3 as the file storage provider. R2 charges no egress fees, which matters for a video-heavy platform. It exposes an S3-compatible API, meaning the AWS SDK works without modification and the switch is reversible.

**TypeScript** is used end-to-end. Convex's schema-to-types generation means the database, backend, and frontend all share the same type definitions from a single source of truth.

### 4.3 Assumptions

- All users access the system via a modern web browser. Mobile app support is out of scope for v1.
- Instructors upload media files directly from the browser via the teacher dashboard.
- Video files are served via CDN and streamed. The platform does not transcode video.
- The system operates in a single region in v1. Multi-region deployment is a future concern.
- Email notifications are out of scope for v1. No email provider integration is required.
- All time-related data is stored as UTC. Timezone conversion is handled client-side.

### 4.4 Constraints

- Convex's free tier limits apply during development. Production deployment requires a paid Convex plan.
- Convex mutations cannot call external APIs directly — this must be done via Actions.
- File uploads must be routed through Convex Actions (server-side) to keep storage credentials out of the browser.
- Next.js server components cannot use Convex client-side hooks (`useQuery`, `useMutation`). Server-side data fetching uses the Convex HTTP client.

### 4.5 Dependencies

| Dependency | Type | Impact if unavailable |
|---|---|---|
| Convex Cloud | Runtime (backend + DB) | Complete system outage |
| Vercel | Runtime (frontend) | Frontend unavailable; backend still functions |
| Cloudflare R2 | Runtime (file storage) | File uploads fail; existing URLs unaffected |
| Convex Auth | Runtime (auth) | Login and signup unavailable |

---
