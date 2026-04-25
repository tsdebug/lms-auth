import Link from "next/link"

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Course Editor</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Course created successfully. Continue editing chapters and lessons, then publish when ready.
      </p>
      {/* Keeping this route now prevents a dead-end after create and gives us a stable editor URL. */}
      <p className="mt-6 rounded-md border bg-card px-4 py-3 text-sm">
        Editing course ID: <span className="font-mono">{courseId}</span>
      </p>
      <Link
        href="/teacher/dashboard"
        className="mt-6 inline-flex rounded-md border px-3 py-2 text-sm hover:bg-accent"
      >
        Back to dashboard
      </Link>
    </main>
  )
}
