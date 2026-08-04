"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const id = batchId as Id<"batches">;

  const batch = useQuery(api.batches.queries.getBatchDetails, { batchId: id });
  const students = useQuery(api.batches.queries.getBatchStudents, { batchId: id });
  const myCourses = useQuery(api.courses.queries.getCoursesByTeacher, {});

  const updateStatus = useMutation(api.batches.mutations.updateBatchStatus);
  const addInstructor = useMutation(api.batches.mutations.addBatchInstructor);
  const removeInstructor = useMutation(api.batches.mutations.removeBatchInstructor);
  const addCourse = useMutation(api.batches.mutations.addCourseToBatch);
  const removeCourse = useMutation(api.batches.mutations.removeCourseFromBatch);

  if (batch === undefined) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (batch === null) return <p className="p-6 text-muted-foreground">Batch not found.</p>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{batch.name}</h1>
          <p className="text-muted-foreground text-sm">
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
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