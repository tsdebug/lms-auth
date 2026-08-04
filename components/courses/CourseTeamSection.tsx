"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Drop <CourseTeamSection courseId={courseId} /> into your course edit page.
export function CourseTeamSection({ courseId }: { courseId: Id<"courses"> }) {
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const instructors = useQuery(api.courses.queries.getCourseInstructors, { courseId });
  const pendingInvites = useQuery(api.courses.invitations.queries.getPendingInvitesForCourse, { courseId });

  const inviteCoInstructor = useMutation(api.courses.invitations.mutations.inviteCoInstructor);
  const revokeInvite = useMutation(api.courses.invitations.mutations.revokeCoInstructorInvite);
  const removeCoInstructor = useMutation(api.courses.mutations.removeCoInstructor);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    try {
      await inviteCoInstructor({ courseId, email: email.trim() });
      toast.success("Invitation sent");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send invitation");
    } finally {
      setInviting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Course team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active team */}
        <div className="space-y-2">
          {instructors === undefined && (
            <p className="text-sm text-muted-foreground">Loading team...</p>
          )}
          {instructors?.map((inst) =>
            inst ? (
              <div key={inst.userId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{inst.name}</span>
                  <span className="text-muted-foreground">({inst.email})</span>
                  <Badge variant={inst.isOwner ? "outline" : "secondary"}>
                    {inst.isOwner ? "Owner" : inst.role}
                  </Badge>
                </div>
                {!inst.isOwner && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      removeCoInstructor({ courseId, userId: inst.userId as Id<"users"> }).catch(
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

        {/* Pending invites */}
        {pendingInvites && pendingInvites.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground">Pending invitations</p>
            {pendingInvites.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between text-sm">
                <span>{inv.email}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    revokeInvite({ invitationId: inv._id }).catch((err) =>
                      toast.error(err instanceof Error ? err.message : "Could not revoke")
                    )
                  }
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Invite form */}
        <form onSubmit={handleInvite} className="flex gap-2 border-t pt-4">
          <Input
            type="email"
            placeholder="Email address to invite as co-instructor"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={inviting}>
            {inviting ? "Sending..." : "Invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}