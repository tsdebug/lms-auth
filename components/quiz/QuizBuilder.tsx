"use client"

// QuizBuilder — teacher-facing quiz creation and editing UI : is used in: lesson editor page
// recieves: lessonId — everything flows from this

// sections:
//   s1. Quiz header — title + score (editable)
//   s2. Question list — each expandable for editing
//   s3. Add question form — at the bottom

// data flow:
//   lessonId → getQuizByLesson query → quiz + questions + answers
//   mutations: createQuiz, updateQuiz, createQuestion, updateQuestion,
//              deleteQuestion, createAnswers, updateAnswers

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  PlusIcon,
  CheckCircleIcon,
  Trash2Icon,
  PencilIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface QuizBuilderProps {
  lessonId: Id<"lessons">
}

// AnswerForm — reusable component for adding/editing answer options
// used in both createAnswers and updateAnswers flows
// recieves: initial options, onSave callback, onCancel callback
function AnswerForm({
  initialOptions,
  questionId,
  onDone,
  isEdit,
}: {
  initialOptions: { content: string; isCorrect: boolean }[]
  questionId: Id<"q_questions">
  onDone: () => void
  isEdit: boolean
}) {
  const createAnswers = useMutation(api.quizzes.mutations.createAnswers)
  const updateAnswers = useMutation(api.quizzes.mutations.updateAnswers)

  const [options, setOptions] = useState(initialOptions)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const filled = options.filter((a) => a.content.trim())
    if (filled.length < 2) {
      toast.error("Add at least 2 answer options")
      return
    }
    const correct = filled.filter((a) => a.isCorrect)
    if (correct.length !== 1) {
      toast.error("Select exactly one correct answer using the radio button")
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateAnswers({
          questionId,
          answers: filled.map((a) => ({
            content: a.content.trim(),
            isCorrect: a.isCorrect,
          })),
        })
      } else {
        await createAnswers({
          questionId,
          answers: filled.map((a) => ({
            content: a.content.trim(),
            isCorrect: a.isCorrect,
          })),
        })
      }
      toast.success("Answers saved")
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* instruction — tells teacher what the radio button does */}
      <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
        Click the radio button on the left to mark the correct answer.
        All other options will be treated as wrong answers.
      </p>

      {options.map((option, i) => (
        <div key={i} className="flex items-center gap-2">
          {/* radio — clicking marks this as the correct answer */}
          <input
            type="radio"
            name={`correct-${questionId}`}
            checked={option.isCorrect}
            onChange={() =>
              // set isCorrect true only for this index
              setOptions((prev) =>
                prev.map((o, idx) => ({
                  ...o,
                  isCorrect: idx === i,
                }))
              )
            }
            className="shrink-0 cursor-pointer"
          />
          <Input
            value={option.content}
            onChange={(e) =>
              setOptions((prev) =>
                prev.map((o, idx) =>
                  idx === i ? { ...o, content: e.target.value } : o
                )
              )
            }
            placeholder={`Option ${i + 1}`}
            className="h-8 text-sm"
          />
          {/* remove option button — only if more than 2 options */}
          {options.length > 2 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() =>
                setOptions((prev) => prev.filter((_, idx) => idx !== i))
              }
            >
              <Trash2Icon className="size-3" />
            </Button>
          )}
        </div>
      ))}

      {/* add another option */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-xs"
        onClick={() =>
          setOptions((prev) => [...prev, { content: "", isCorrect: false }])
        }
      >
        <PlusIcon className="size-3 mr-1" />
        Add option
      </Button>

      <div className="flex gap-2 mt-1">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Answers"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// QuestionItem — one question with full edit capability
// States:
//   - view mode: shows question text + answers
//   - edit mode: inline form to edit text + score
//   - answer edit mode: shows AnswerForm
function QuestionItem({
  question,
  index,
}: {
  question: {
    _id: Id<"q_questions">
    content: string
    quesScore: number
    answers: { _id: Id<"q_answers">; content: string; isCorrect: boolean }[]
  }
  index: number
}) {
  const updateQuestion = useMutation(api.quizzes.mutations.updateQuestion)
  const deleteQuestion = useMutation(api.quizzes.mutations.deleteQuestion)

  // editing question text/score
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(question.content)
  const [score, setScore] = useState(String(question.quesScore))
  const [saving, setSaving] = useState(false)

  // editing answers
  const [editingAnswers, setEditingAnswers] = useState(false)

  async function handleSaveQuestion() {
    setSaving(true)
    try {
      await updateQuestion({
        questionId: question._id,
        content: content.trim() || undefined,
        quesScore: Number(score),
      })
      toast.success("Question updated")
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteQuestion({ questionId: question._id })
      toast.success("Question deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  return (
    <div className="rounded-md border p-3 flex flex-col gap-3">

      {/* question header */}
      {editing ? (
        // --- edit mode ---
        <div className="flex flex-col gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-20 h-7 text-sm"
            />
            <span className="text-xs text-muted-foreground">points</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveQuestion}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false)
                setContent(question.content)
                setScore(String(question.quesScore))
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // --- view mode ---
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">
            Q{index + 1}. {question.content}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {question.quesScore} pts
            </span>
            {/* edit question button */}
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setEditing(true)}
            >
              <PencilIcon className="size-3" />
            </Button>
            {/* delete question button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon className="size-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will also delete all answer options.
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* answers section */}
      {!editing && (
        editingAnswers ? (
          // --- answer edit mode ---
          <AnswerForm
            initialOptions={
              question.answers.length > 0
                ? question.answers.map((a) => ({
                    content: a.content,
                    isCorrect: a.isCorrect,
                  }))
                : [
                    { content: "", isCorrect: false },
                    { content: "", isCorrect: false },
                  ]
            }
            questionId={question._id}
            onDone={() => setEditingAnswers(false)}
            isEdit={question.answers.length > 0}
          />
        ) : question.answers.length > 0 ? (
          // --- answers exist — show them ---
          <div className="flex flex-col gap-1 pl-2">
            {question.answers.map((answer) => (
              <div
                key={answer._id}
                className="flex items-center gap-2 text-sm"
              >
                {answer.isCorrect ? (
                  <CheckCircleIcon className="size-3.5 text-green-500 shrink-0" />
                ) : (
                  <span className="size-3.5 rounded-full border shrink-0 inline-block" />
                )}
                <span>{answer.content}</span>
              </div>
            ))}
            {/* edit answers button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-fit text-xs mt-1"
              onClick={() => setEditingAnswers(true)}
            >
              <PencilIcon className="size-3 mr-1" />
              Edit Answers
            </Button>
          </div>
        ) : (
          // --- no answers yet ---
          <div className="flex flex-col gap-1 pl-2">
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              ⚠️ No answers added yet. Add answers to complete this question.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-fit text-xs mt-1"
              onClick={() => setEditingAnswers(true)}
            >
              <PlusIcon className="size-3 mr-1" />
              Add Answers
            </Button>
          </div>
        )
      )}
    </div>
  )
}

// ------ Main QuizBuilder component -----
export function QuizBuilder({ lessonId }: QuizBuilderProps) {

  // fetch existing quiz — null = no quiz yet, undefined = loading
  const quiz = useQuery(api.quizzes.queries.getQuizByLesson, { lessonId })

  const createQuiz = useMutation(api.quizzes.mutations.createQuiz)
  const updateQuiz = useMutation(api.quizzes.mutations.updateQuiz)
  const createQuestion = useMutation(api.quizzes.mutations.createQuestion)

  // --- create quiz form state ---
  const [quizTitle, setQuizTitle] = useState("")
  const [totalScore, setTotalScore] = useState("100")
  const [creatingQuiz, setCreatingQuiz] = useState(false)

  // --- edit quiz header state ---
  const [editingQuizHeader, setEditingQuizHeader] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editTotalScore, setEditTotalScore] = useState("")

  // --- add question form state ---
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [questionContent, setQuestionContent] = useState("")
  const [questionScore, setQuestionScore] = useState("10")
  const [addingQuestion, setAddingQuestion] = useState(false)

  async function handleCreateQuiz() {
    if (!quizTitle.trim()) return
    setCreatingQuiz(true)
    try {
      await createQuiz({
          lessonId,
          title: quizTitle.trim(),
          totalScore: Number(totalScore),
          description: ""
      })
      toast.success("Quiz created")
      setQuizTitle("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setCreatingQuiz(false)
    }
  }

  async function handleUpdateQuizHeader() {
    if (!quiz) return
    try {
      await updateQuiz({
        quizId: quiz._id,
        title: editTitle.trim() || undefined,
        totalScore: Number(editTotalScore),
      })
      toast.success("Quiz updated")
      setEditingQuizHeader(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  async function handleAddQuestion() {
    if (!quiz || !questionContent.trim()) return
    setAddingQuestion(true)
    try {
      await createQuestion({
        quizId: quiz._id,
        content: questionContent.trim(),
        quesScore: Number(questionScore),
      })
      toast.success("Question added")
      setQuestionContent("")
      setQuestionScore("10")
      setShowAddQuestion(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setAddingQuestion(false)
    }
  }

  // loading
  if (quiz === undefined) {
    return (
      <div className="text-sm text-muted-foreground">Loading quiz...</div>
    )
  }

  // ----- S1: no quiz yet -----
  if (quiz === null) {
    return (
      <div className="rounded-lg border p-4 flex flex-col gap-4">
        <h3 className="font-medium text-sm">Create a Quiz</h3>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Quiz Title</Label>
          <Input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="e.g. Python Basics Quiz"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Total Score</Label>
          <Input
            type="number"
            value={totalScore}
            onChange={(e) => setTotalScore(e.target.value)}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            Set the maximum score for this quiz. Distribute this across questions.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleCreateQuiz}
          disabled={creatingQuiz || !quizTitle.trim()}
          className="w-fit"
        >
          {creatingQuiz ? "Creating..." : "Create Quiz"}
        </Button>
      </div>
    )
  }

  // ----- S2: quiz exists -----
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-4">

      {/* quiz header — title + score, editable */}
      {editingQuizHeader ? (
        <div className="flex flex-col gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Quiz title"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={editTotalScore}
              onChange={(e) => setEditTotalScore(e.target.value)}
              className="w-32"
            />
            <span className="text-xs text-muted-foreground">total points</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpdateQuizHeader}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingQuizHeader(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{quiz.title}</h3>
            <p className="text-xs text-muted-foreground">
              {quiz.questions.length} questions · {quiz.totalScore} pts total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Quiz</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => {
                setEditTitle(quiz.title)
                setEditTotalScore(String(quiz.totalScore))
                setEditingQuizHeader(true)
              }}
            >
              <PencilIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* question list */}
      {quiz.questions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No questions yet. Add your first question below.
        </p>
      )}

      {quiz.questions.map((question, qi) => (
        <QuestionItem
          key={question._id}
          question={question}
          index={qi}
        />
      ))}

      {/* add question section */}
      {showAddQuestion ? (
        <div className="flex flex-col gap-3 border-t pt-3">
          <Label className="text-xs font-medium">New Question</Label>
          <Textarea
            value={questionContent}
            onChange={(e) => setQuestionContent(e.target.value)}
            placeholder="Question text..."
            rows={2}
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={questionScore}
              onChange={(e) => setQuestionScore(e.target.value)}
              className="w-24 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">points</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddQuestion}
              disabled={addingQuestion || !questionContent.trim()}
            >
              {addingQuestion ? "Adding..." : "Add Question"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddQuestion(false)
                setQuestionContent("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setShowAddQuestion(true)}
        >
          <PlusIcon className="size-4 mr-1" />
          Add Question
        </Button>
      )}
    </div>
  )
}