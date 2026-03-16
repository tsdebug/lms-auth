# Product Requirements Document — LMS 

---

## 1. Overview

LMS is a free, role-based Learning Management System built with Next.js and Convex. Teachers create and publish courses. Students discover, enroll, and learn.

---

## 2. User Roles

### Teacher
- Can sign up with email, password, role = Teacher
- Redirected to /teacher/dashboard after login
- Can create, edit, publish, unpublish courses
- Can add chapters and lessons to courses
- Can upload video, PDF, and text content
- Can create quizzes
- Can view students enrolled in their courses and their progress

### Student
- Can sign up with email, password, role = Student
- Redirected to /student/dashboard after login
- Can browse all published courses
- Can enroll in any course (free for now)
- Can access content only after enrolling
- Can mark lessons as complete
- Can attempt quizzes and view scores
- Can see course their own couse progress

---

## 3. Features

### Auth
- Signup: Email, Password, Role (need to add First name, Last name later)
- Signin: Email + Password
- Role-based redirect after login
- Protected routes — unauthenticated users → /signin

### Teacher Features
- Create course: Title, Description, Thumbnail, Category, Level
- Course starts as draft — not visible to students
- Add modules (ordered sections) to a course
- Add lessons to modules: Video URL, PDF, Text/Notes
- Publish course → visible to students
- Unpublish course → hidden from students
- Create quiz: MCQ questions, 4 options, 1 correct answer
- View enrolled students per course

### Student Features
- Browse all published courses
- View course detail: description, modules, teacher info
- Enroll in a course (one click, free)
- Access lessons only after enrolling
- Mark lessons as complete
- Track progress per course
- Attempt quiz once
- View score after submission

---

## 4. Out of Scope (v1)

- Payments
- Social login (GitHub, Google)
- Comments or discussion
- Course ratings
- Email notifications
- Admin panel
- Mobile app