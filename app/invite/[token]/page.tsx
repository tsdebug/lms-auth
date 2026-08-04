"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const invitation = useQuery(api.courses.invitations.queries.getInvitationByToken, { token });
  const acceptInvitation = useMutation(api.courses.invitations.mutations.acceptCourseInvitation);

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || invitation === undefined) return;
    if (!invitation || invitation.status !== "pending") return;

    if (!isAuthenticated) {
      // send to login or signup, with a way back to this exact invite link.
      // NOTE: /login and /signup need to read `redirect` and return here after success.
      const returnTo = encodeURIComponent(`/invite/${token}`);
      if (invitation.accountExists) {
        router.replace(`/login?redirect=${returnTo}`);
      } else {
        router.replace(`/signup?redirect=${returnTo}&email=${encodeURIComponent(invitation.email)}`);
      }
      return;
    }

    // logged in and invitation still pending — accept automatically
    if (!accepting) {
      setAccepting(true);
      acceptInvitation({ token })
        .then((result) => {
          router.replace(`/teacher/courses/${result.courseId}`);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Could not accept invitation");
          setAccepting(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, invitation, token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Course invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {invitation === undefined && <p>Checking your invitation...</p>}

          {invitation === null && <p>This invitation link is invalid.</p>}

          {invitation?.status === "accepted" && (
            <p>This invitation has already been used.</p>
          )}
          {invitation?.status === "revoked" && (
            <p>This invitation is no longer valid.</p>
          )}

          {error && <p className="text-destructive">{error}</p>}

          {invitation?.status === "pending" && !error && (
            <p>
              {accepting
                ? `Adding you to "${invitation.courseTitle}"...`
                : "Redirecting you to sign in..."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}