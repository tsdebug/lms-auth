# Product Requirements Document (PRD)
**Project:** LMS — Learning Management System
**Version:** 1.0
**Date:** March 2026
**Status:** In Development

---

## 1. What Are We Building?

LMS is an online learning platform where educators can create and publish courses, and learners can discover, enroll in, and complete them — for free.

Think of it like a lightweight version of Udemy or Coursera, built specifically for structured, cohort-friendly learning with quizzes, assignments, and progress tracking.

---

## 2. Who Is It For?

### Students
Learners who want to enroll in courses, consume content (videos, PDFs, notes), complete quizzes, submit assignments, and track their own progress.

### Course Creators (Teachers)
Educators who create and publish courses. They organize content into chapters and lessons, run quizzes, manage batches of students, grade assignments, and monitor learner progress.

### Moderators
Platform staff who ensure content quality and community standards are maintained.

### Evaluators
Reviewers who assess student submissions and provide feedback on assignments.

---

## 3. What Can Each User Do?

### Students Can:
- Sign up and create a personal profile with a photo and bio
- Browse and search all published courses by category or tag
- Enroll in courses individually or as part of a batch/cohort
- Watch videos, read PDFs, and go through lesson notes
- Mark lessons as complete and track their progress
- Attempt quizzes and instantly see their scores
- Submit assignments (file, text, or URL) and receive instructor feedback
- Earn a certificate when they complete a course
- View all their certificates and share a verification link

### Course Creators (Teachers) Can:
- Create courses with a title, description, thumbnail, category, and tags
- Organize courses into chapters, and chapters into lessons
- Attach videos, PDFs, slides, and other files to each lesson
- Create quizzes with multiple choice questions per lesson
- Create assignments with deadlines and grading criteria
- Create and manage batches (cohorts) of students
- Assign themselves or other instructors to a batch
- Grade student assignment submissions with a score and written feedback
- View detailed progress reports for all enrolled students
- Issue certificates to students who complete a course
- Revoke certificates if necessary

---

## 4. Key Features

### User Profiles
Every user has a profile with their name, photo, bio, and role. A user can hold multiple roles — for example, someone can be both a student and a course creator at the same time.

### Courses & Content
Courses are organized into **Chapters**, and each chapter contains **Lessons**. Lessons can include videos (YouTube, Vimeo, or self-hosted), PDFs, slides, and written notes. Instructors control whether files are downloadable or view-only.

### Categories & Tags
Courses are organized into categories like "Programming", "Design", or "Business". Courses can also have tags like "beginner", "javascript", or "free" so students can easily find what they're looking for.

### Quizzes
Each lesson can have a quiz. Quizzes have multiple choice questions (typically 4 options). The system automatically grades submissions and shows students their score. Results are recorded for instructors to review.

### Assignments
Instructors can create assignments for lessons, chapters, or entire courses. Students can submit files, text, or links. Instructors review and grade submissions with a score and written feedback. Students can resubmit before the deadline if allowed.

### Batches (Cohorts)
Instructors can group students into batches — for example, "March 2026 Cohort". A batch is linked to one or more courses, has a start and end date, and can have multiple instructors assigned. Students enroll in a batch and learn together as a group.

### Progress Tracking
The system tracks how far along each student is in every course they're enrolled in — lessons completed, percentage done, time spent, last active date, and average quiz score. Students see their own progress. Instructors see progress for all their students.

### Certificates
When a student finishes all lessons and passes all quizzes in a course, they receive a certificate. Each certificate has a unique verification code so anyone can confirm it is genuine. Certificates can be downloaded as PDFs. Instructors can revoke certificates if necessary.

### Availability Scheduling
Instructors and mentors can set their availability so students know when they can reach out for help or mentoring sessions.

---

## 5. What Is NOT Included in Version 1

The following features are deliberately left out of the first version to keep scope manageable. They may be added in a future release.

- Payments or paid courses
- Live video sessions or real-time classes
- In-platform messaging or chat
- Course ratings and reviews
- Email or push notifications
- Admin dashboard
- Mobile app
- Social login (Google, GitHub, etc.)

---

## 6. Success Looks Like

- A teacher can sign up, create a full course with chapters, lessons, a quiz, and an assignment — and publish it — in under 30 minutes
- A student can sign up, find a course, enroll, complete it, and receive a certificate — without any confusion or friction
- An instructor can look at a single screen and understand exactly how every student in their course is progressing