"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  TrendingUpIcon,
  BookOpenIcon,
  UsersIcon,
  AwardIcon,
  ClockIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SectionCardsProps {
  role?: "teacher" | "student"
}

// ── Teacher cards ──────────────────────────────────────────────
function TeacherSectionCards() {
  const courses = useQuery(api.courses.queries.getCoursesByTeacher)

  // derive counts from real data
  const totalCourses = courses?.length ?? 0
  const totalStudents = courses?.reduce(
    (sum, c) => sum + (c.studentCount ?? 0), 0
  ) ?? 0
  const publishedCourses = courses?.filter(
    (c) => c.status === "published"
  ).length ?? 0

  const cards = [
    {
      title: "Total Courses",
      value: courses === undefined ? "..." : String(totalCourses),
      icon: BookOpenIcon,
      trend: `${publishedCourses} published`,
    },
    {
      title: "Total Students",
      value: courses === undefined ? "..." : String(totalStudents),
      icon: UsersIcon,
      trend: "across all courses",
    },
    {
      title: "Avg Completion",
      value: "—",
      icon: TrendingUpIcon,
      trend: "available after progress tracking",
    },
  ]

  return <CardGrid cards={cards} />
}

// ── Student cards ──────────────────────────────────────────────
function StudentSectionCards() {
  const enrollments = useQuery(api.enrollments.queries.getEnrollmentsByStudent)

  const total = enrollments?.length ?? 0
  const completed = enrollments?.filter(
    (e) => e?.enrollmentStatus === "completed"
  ).length ?? 0
  const inProgress = enrollments?.filter(
    (e) => e?.enrollmentStatus === "active"
  ).length ?? 0

  const cards = [
    {
      title: "Courses Enrolled",
      value: enrollments === undefined ? "..." : String(total),
      icon: BookOpenIcon,
      trend: `${inProgress} in progress`,
    },
    {
      title: "Completed",
      value: enrollments === undefined ? "..." : String(completed),
      icon: AwardIcon,
      trend: completed > 0 ? "keep it up!" : "complete your first course",
    },
    {
      title: "In Progress",
      value: enrollments === undefined ? "..." : String(inProgress),
      icon: TrendingUpIcon,
      trend: "",
    },
    {
      title: "Hours Learned",
      value: "—",
      icon: ClockIcon,
      trend: "available after progress tracking",
    },
  ]

  return <CardGrid cards={cards} />
}

// ── Shared card grid ───────────────────────────────────────────
function CardGrid({
  cards,
}: {
  cards: {
    title: string
    value: string
    icon: React.ElementType
    trend: string
  }[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.trend && (
              <p className="text-xs text-muted-foreground">{card.trend}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────
export function SectionCards({ role = "student" }: SectionCardsProps) {
  if (role === "teacher") return <TeacherSectionCards />
  return <StudentSectionCards />
}