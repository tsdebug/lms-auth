# Product Requirements Document (PRD)
## Learning Management System (LMS)
 
**Version:** 1.0
**Date:** March 2026
**Status:** In Development
 
---
 
## 1. Product Overview
 
The Learning Management System (LMS) is a web platform designed to enable structured online learning. It allows instructors to create and organize educational content while enabling students to discover courses, enroll, learn, and track their progress.
 
The platform supports multiple user roles and provides tools for course creation, learning assessment, progress tracking, and certification.
 
The goal of the platform is to create an accessible and structured learning environment where knowledge can be shared efficiently and learners can track their development over time.
 
---
 
## 2. Target Users
 
### Students
 
Students are learners who join the platform to discover courses, enroll in them, complete lessons, and evaluate their understanding through quizzes and assignments.
 
They can track their progress, participate in structured learning batches, and earn certificates upon course completion.
 
### Course Creators / Instructors
 
Course creators are responsible for designing and publishing learning content. They organize courses into chapters and lessons, create quizzes and assignments, monitor student progress, and evaluate submissions.
 
### Moderators
 
Moderators help maintain the quality and integrity of the platform by reviewing content and assisting in managing community activity.
 
### Evaluators
 
Evaluators assist instructors by reviewing assignments, grading student submissions, and providing feedback.

#### Clarity

**Owner in course table**
courses.userId — this is the permanent owner. The person who created the course. This never changes. It's used for things like:

- Who can delete the course
- Who can publish the course
- Who can add/remove co-instructors

**Lead in course_instructors table**
course_instructors — this is the working team on the course. It can change over time. People can be added or removed. It's used for things like:

- Who can edit course content
- Who can grade submissions
- Who can see student progress
 
---
 
## 3. User Profiles
 
Each user has a personal profile that represents them on the platform.
 
Profiles allow users to:
 
- Upload a profile picture
- Write a short biography
- Select one or more roles on the platform
- Set their availability schedule for mentoring or teaching sessions
 
Allowing users to hold multiple roles enables flexible participation, such as being both a student and a course creator.
 
---
 
## 4. Course Structure
 
Courses are organized in a structured hierarchy to make learning clear and progressive. Each course contains chapters, and each chapter contains lessons.
 
### Course
 
A course represents a complete learning program on a particular topic.
 
Each course includes:
 
- Title
- Description
- Thumbnail image
- Difficulty level
- Instructor information
- Category and tags for discoverability
 
### Chapters
 
Chapters divide the course into logical sections. Each chapter contains multiple lessons and is arranged in a specific order.
 
### Lessons
 
Lessons are the individual units of learning content. They may contain video lectures, documents, or text-based material.
 
---
 
## 5. Media Content
 
Lessons may contain different types of learning materials including:
 
- Video lectures
- PDF documents
- Slide presentations
- Code files
- Images
 
Each lesson can include multiple media files. Some files may be downloadable while others may be view-only.
 
---
 
## 6. Quiz System
 
Quizzes are used to test student understanding after lessons.
 
Each quiz consists of multiple questions with several answer options. Students select the answer they believe is correct and submit their responses.
 
The system automatically calculates the score and displays the result to the student.
 
Quizzes help instructors measure student comprehension and reinforce learning outcomes.
 
---
 
## 7. Assignments
 
Assignments provide a deeper evaluation of student learning. Instructors can create assignments associated with lessons or chapters.
 
Each assignment includes:
 
- Title
- Description
- Due date
- Submission instructions
 
Students can submit their work in different formats such as file uploads, text responses, or external links.
 
Instructors or evaluators review the submissions, assign scores, and provide feedback.
 
Assignments may allow resubmission depending on instructor settings.
 
---
 
## 8. Course Batches
 
Courses can also be offered through structured batches (cohorts) where groups of students learn together.
 
Each batch has:
 
- A name
- Start date
- End date
- Assigned instructors
- Associated courses
 
Batches can be in one of the following states:
 
- **Upcoming**
- **Active**
- **Completed**
 
Students may enroll in a batch instead of enrolling individually in courses. This allows instructors to run scheduled learning programs.
 
---
 
## 9. Course Categories and Tags
 
Courses are organized using categories and tags to improve discoverability.
 
### Categories
 
Categories represent broad subject areas such as:
 
- Programming
- Design
- Business
- Data Science
 
### Tags
 
Tags provide additional labels describing the course content such as:
 
- Beginner
- Advanced
- JavaScript
- Free
- Video course
 
Students can browse and filter courses using categories or tags.
 
---
 
## 10. Progress Tracking
 
The system continuously tracks student progress throughout a course.
 
Students can view their progress dashboard showing:
 
- Lessons completed
- Course completion percentage
- Quiz scores
- Last accessed lesson
- Time spent learning
 
Instructors can also view progress reports to monitor how students are performing in their courses.
 
---
 
## 11. Certificates
 
Students receive a certificate when they successfully complete a course.
 
Completion requirements may include:
 
- Finishing all lessons
- Passing quizzes
- Completing required assignments
 
Each certificate includes:
 
- Student name
- Course name
- Completion date
- Unique verification code
 
Certificates can be downloaded and shared. The verification code allows anyone to confirm the authenticity of the certificate.
 
---
 
## 12. Teacher Discovery & Filtering
 
### Purpose
 
Students should be able to easily discover instructors on the platform and choose teachers that match their learning needs. The platform will provide a searchable and filterable list of teachers, allowing students to browse instructors based on expertise, experience, and availability.
 
### Teacher Directory
 
The system will display a teacher listing page where all instructors are shown in a structured format.
 
Each teacher card will show:
 
- Profile picture
- Name
- Short bio or expertise summary
- Subjects or courses taught
- Experience level (if provided)
- Average rating *(future feature)*
- Availability status
- Number of courses offered
 
Students can click on a teacher to view a detailed teacher profile.
 
### Teacher Profile Page
 
Each teacher will have a dedicated profile page that includes:
 
- Profile picture
- Biography / About section
- Areas of expertise
- Courses created by the teacher
- Availability schedule for mentoring
- Student reviews *(future feature)*
- Total students taught *(optional metric)*
 
This allows students to evaluate the instructor before enrolling in a course.
 
### Filtering and Search
 
Students can filter the teacher list using different criteria.
 
#### Subject / Expertise
 
- Programming
- Data Science
- Web Development
- Design
 
#### Skill Level
 
- Beginner courses
- Intermediate
- Advanced
 
#### Availability
 
Students can find teachers who are currently available for mentoring or sessions.
 
#### Course Count
 
Teachers with multiple courses can be prioritized.
 
#### Search
 
Students can search for teachers by name or expertise.
 
Example searches:
- `"Python instructor"`
- `"Frontend developer teacher"`
 
### Sorting Options
 
Students can sort the teacher list based on:
 
- Most popular
- Highest rated *(future feature)*
- Most courses created
- Recently joined
- Alphabetical order
 
---
 
## 13. Initial Release Scope (Version 1)
 
The first version of the platform focuses on the core learning experience.
 
Included in Version 1:
 
- User accounts
- Role-based access
- Course creation and publishing
- Course enrollment
- Lessons with media content
- Quiz system
- Basic progress tracking
 
---
 
## 14. Future Features (Out of Scope for Version 1)
 
The following features may be introduced in later versions:
 
- Paid courses and payment integration
- Social login options
- Course ratings and reviews
- Discussion forums and comments
- Email notifications
- Administrative management panel
- Mobile application