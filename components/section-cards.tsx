import { TrendingUpIcon, BookOpenIcon, UsersIcon, DollarSignIcon, AwardIcon, ClockIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SectionCardsProps {
  role?: "teacher" | "student"
}

const teacherCards = [
  { title: "Total Courses", value: "12", icon: BookOpenIcon, trend: "+2 this month" },
  { title: "Total Students", value: "320", icon: UsersIcon, trend: "+45 this month" },
  { title: "Total Revenue", value: "$3,200", icon: DollarSignIcon, trend: "+$400 this month" },
  { title: "Avg Completion", value: "68%", icon: TrendingUpIcon, trend: "+5% this month" },
]

const studentCards = [
  { title: "Courses Enrolled", value: "5", icon: BookOpenIcon, trend: "+1 this month" },
  { title: "Completed", value: "2", icon: AwardIcon, trend: "+1 this month" },
  { title: "In Progress", value: "3", icon: TrendingUpIcon, trend: "" },
  { title: "Hours Learned", value: "24h", icon: ClockIcon, trend: "+3h this week" },
]

export function SectionCards({ role = "student" }: SectionCardsProps) {
  const cards = role === "teacher" ? teacherCards : studentCards

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