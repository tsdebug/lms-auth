"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ArrowLeftIcon } from "lucide-react";

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
} from "@/components/ui/alert-dialog";

export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const router = useRouter();
  const id = batchId as Id<"batches">;

  const batch = useQuery(api.batches.queries.getBatchDetails, { batchId: id });
  const students = useQuery(api.batches.queries.getBatchStudents, { batchId: id });
  const myCourses = useQuery(api.courses.queries.getCoursesByTeacher, {});

  const updateStatus = useMutation(api.batches.mutations.updateBatchStatus);
  const addInstructor = useMutation(api.batches.mutations.addBatchInstructor);
  const removeInstructor = useMutation(api.batches.mutations.removeBatchInstructor);
  const addCourse = useMutation(api.batches.mutations.addCourseToBatch);
  const removeCourse = useMutation(api.batches.mutations.removeCourseFromBatch);
  const enrollStudent = useMutation(api.batches.mutations.enrollStudentInBatch);
  const removeStudent = useMutation(api.batches.mutations.removeStudentFromBatch);
  

  if (batch === undefined) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (batch === null) return <p className="p-6 text-muted-foreground">Batch not found.</p>;

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl">
          <button
            onClick={() => router.push("/teacher/batches")}
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to batches
          </button>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{batch.name}</h1>
              <p className="text-sm text-muted-foreground">
                {batch.startDate} – {batch.endDate}
              </p>
            </div>
            <Select
              value={batch.status}
              onValueChange={(value) =>
                updateStatus({ batchId: id, status: value as "upcoming" | "active" | "completed" }).catch(
                  (err) => toast.error(err instanceof Error ? err.message : "Could not update status")
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Instructors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instructors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {batch.instructors.map((inst) =>
                    inst ? (
                      <div key={inst.userId} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{inst.name}</span>{" "}
                          <span className="text-muted-foreground">({inst.email})</span>
                          {inst.isOwner && <Badge variant="outline" className="ml-2">Owner</Badge>}
                        </div>
                        {!inst.isOwner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              removeInstructor({ batchId: id, userId: inst.userId as Id<"users"> }).catch(
                                (err) => toast.error(err instanceof Error ? err.message : "Could not remove")
                              )
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
                <AddInstructorByEmail batchId={id} onAdd={addInstructor} />
              </CardContent>
            </Card>

            {/* Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked courses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {batch.courses.length === 0 && (
                    <p className="text-sm text-muted-foreground">No courses linked yet.</p>
                  )}
                  {batch.courses.map((c) =>
                    c ? (
                      <div key={c.courseId} className="flex items-center justify-between text-sm">
                        <span>{c.title}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            removeCourse({ batchId: id, courseId: c.courseId as Id<"courses"> }).catch(
                              (err) => toast.error(err instanceof Error ? err.message : "Could not remove")
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ) : null
                  )}
                </div>
                {myCourses && (
                  <Select
                    onValueChange={(courseId) =>
                      addCourse({ batchId: id, courseId: courseId as Id<"courses"> }).catch((err) =>
                        toast.error(err instanceof Error ? err.message : "Could not link course")
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a course to this batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {myCourses
                        .filter((c) => !batch.courses.some((bc) => bc?.courseId === c._id))
                        .map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Students ({batch.studentCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {students === undefined && <p className="text-sm text-muted-foreground">Loading...</p>}
              {students?.length === 0 && (
                <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
              )}
              <div className="space-y-2">
                {students?.map((s) => (
                  <div key={s.userId} className="flex items-center justify-between text-sm">
                    <span>
                      {`${s.fName ?? ""} ${s.lName ?? ""}`.trim() || "Unknown"}{" "}
                      <span className="text-muted-foreground">({s.email})</span>
                    </span>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove {`${s.fName ?? ""} ${s.lName ?? ""}`.trim() || "this student"} from the batch?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            They'll lose access to the batch itself. Their course enrollments that came from
                            this batch can either stay active, or be dropped along with the batch removal —
                            choose below.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button
                            variant="outline"
                            onClick={() =>
                              removeStudent({ batchId: id, userId: s.userId as Id<"users">, dropEnrollments: false })
                                .then(() => toast.success("Removed from batch — course access kept"))
                                .catch((err) =>
                                  toast.error(err instanceof Error ? err.message : "Could not remove")
                                )
                            }
                          >
                            Remove, keep courses
                          </Button>
                          <AlertDialogAction
                            onClick={() =>
                              removeStudent({ batchId: id, userId: s.userId as Id<"users">, dropEnrollments: true })
                                .then(() => toast.success("Removed from batch and dropped their course enrollments"))
                                .catch((err) =>
                                  toast.error(err instanceof Error ? err.message : "Could not remove")
                                )
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove & drop courses
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
              <AddStudentByEmail batchId={id} onAdd={enrollStudent} />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// small inline component — email lookup then confirm-add flow
function AddInstructorByEmail({
  batchId,
  onAdd,
}: {
  batchId: Id<"batches">;
  onAdd: (args: { batchId: Id<"batches">; userId: Id<"users"> }) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState<string | null>(null);
  const found = useQuery(
    api.users.queries.findUserByEmail,
    searchEmail ? { email: searchEmail } : "skip"
  );

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex gap-2">
        <Input
          placeholder="Instructor's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="outline" onClick={() => setSearchEmail(email.trim())}>
          Find
        </Button>
      </div>
      {searchEmail && found === null && (
        <p className="text-sm text-muted-foreground">No account found with that email.</p>
      )}
      {found && (
        <div className="flex items-center justify-between rounded-md border p-2 text-sm">
          <span>{found.name} ({found.email})</span>
          <Button
            size="sm"
            onClick={() => {
              onAdd({ batchId, userId: found.userId as Id<"users"> })
                .then(() => {
                  setEmail("");
                  setSearchEmail(null);
                  toast.success("Instructor added");
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add"));
            }}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}


// small inline component — same pattern as AddInstructorByEmail, for students
function AddStudentByEmail({
  batchId,
  onAdd,
}: {
  batchId: Id<"batches">;
  onAdd: (args: { batchId: Id<"batches">; userId: Id<"users"> }) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState<string | null>(null);
  const found = useQuery(
    api.users.queries.findUserByEmail,
    searchEmail ? { email: searchEmail } : "skip"
  );

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex gap-2">
        <Input
          placeholder="Student's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="outline" onClick={() => setSearchEmail(email.trim())}>
          Find
        </Button>
      </div>
      {searchEmail && found === null && (
        <p className="text-sm text-muted-foreground">No account found with that email.</p>
      )}
      {found && (
        <div className="flex items-center justify-between rounded-md border p-2 text-sm">
          <span>{found.name} ({found.email})</span>
          <Button
            size="sm"
            onClick={() => {
              onAdd({ batchId, userId: found.userId as Id<"users"> })
                .then(() => {
                  setEmail("");
                  setSearchEmail(null);
                  toast.success("Student enrolled — added to all linked courses");
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "Could not enroll"));
            }}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}