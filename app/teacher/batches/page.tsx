"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateBatchDialog } from "@/components/batches/CreateBatchDialog";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  upcoming: "outline",
  active: "default",
  completed: "secondary",
};

export default function BatchesPage() {
  const batches = useQuery(api.batches.queries.getBatchesByInstructor, {});

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Batches</h1>
          <p className="text-muted-foreground text-sm">
            Cohorts you instruct or manage.
          </p>
        </div>
        <CreateBatchDialog />
      </div>

      {batches === undefined && (
        <p className="text-muted-foreground text-sm">Loading batches...</p>
      )}

      {batches?.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No batches yet. Create one to start running a cohort.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {batches
          ?.filter((batch): batch is NonNullable<typeof batch> => batch !== null)
          .map((batch) => (
            <Link key={batch._id} href={`/teacher/batches/${batch._id}`}>
              <Card className="transition-colors hover:border-foreground/30">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-base">{batch.name}</CardTitle>
                  <Badge variant={statusVariant[batch.status] ?? "outline"}>
                    {batch.status}
                  </Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {batch.startDate} – {batch.endDate}
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}