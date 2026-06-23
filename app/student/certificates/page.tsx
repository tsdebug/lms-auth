"use client"

// ROUTE: /student/certificates
// WHAT: shows all certificates the student has earned
// HOW: queries getMyCertificates — returns enriched list with course title
// each certificate has a share button that copies the public verification link

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { AwardIcon, ShareIcon, ExternalLinkIcon } from "lucide-react"
import { CertificateCard } from "@/components/certificates/CertificateCard"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function StudentCertificatesPage() {
  const router = useRouter()
  const certificates = useQuery(api.certificates.queries.getMyCertificates)

  function handleShare(verificationCode: string) {
    const url = `${window.location.origin}/certificate/${verificationCode}`
    navigator.clipboard.writeText(url)
    toast.success("Verification link copied!")
  }

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">

          <div>
            <h1 className="text-2xl font-semibold">My Certificates</h1>
            <p className="text-sm text-muted-foreground">
              Certificates earned by completing courses
            </p>
          </div>

          {certificates === undefined && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {certificates !== undefined && certificates.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <AwardIcon className="size-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No certificates yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete all lessons in a course to earn one.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/courses")}
              >
                Browse courses
              </Button>
            </div>
          )}

          {/* certificate cards grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certificates?.map((cert: any) => (
              <div
                key={cert._id}
                className="rounded-xl border bg-card flex flex-col overflow-hidden"
              >
                {/* certificate thumbnail at the top of the card */}
                <div className="border-b" style={{ height: "220px", overflow: "hidden" }}>
                  <CertificateCard
                    recipientName={cert.recipientName}
                    courseTitle={cert.courseTitle}
                    instructorName={cert.instructorName}
                    issuedAt={cert.issuedAt}
                    verificationCode={cert.verificationCode}
                    thumbnail
                  />
                </div>

                {/* details below thumbnail */}
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      {cert.courseTitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cert.instructorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* verification code */}
                  <div className="bg-muted rounded px-2.5 py-1.5">
                    <p className="font-mono text-xs text-muted-foreground">
                      {cert.verificationCode}
                    </p>
                  </div>

                  {/* actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleShare(cert.verificationCode)}
                    >
                      <ShareIcon className="size-3.5 mr-1.5" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/certificate/${cert.verificationCode}`)
                      }
                    >
                      <ExternalLinkIcon className="size-3.5 mr-1.5" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}