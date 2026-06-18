"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { CertificateCard } from "@/components/certificates/CertificateCard"
import { Button } from "@/components/ui/button"
import { ShieldCheckIcon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

export default function CertificateVerificationPage() {
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const cert = useQuery(api.certificates.queries.getCertificateByCode, {
    verificationCode: code,
  })

  if (cert === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying...</p>
      </div>
    )
  }

  if (cert === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <XCircleIcon className="size-12 text-destructive" />
          <h1 className="text-xl font-semibold">Certificate not found</h1>
          <p className="text-sm text-muted-foreground">
            This verification code is invalid or the certificate has been revoked.
          </p>
        </div>
      </div>
    )
  }

  return (
    // WHY bg-gray-100 not bg-background: certificate page should feel
    // like a physical document — neutral background regardless of theme
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "48px 16px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* verified badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "24px",
        }}>
          <ShieldCheckIcon style={{ width: "18px", color: "#16a34a" }} />
          <p style={{ fontSize: "14px", color: "#16a34a", fontWeight: 500 }}>
            Verified Certificate
          </p>
        </div>

        {/* the certificate itself */}
        <CertificateCard
          recipientName={cert.recipientName}
          courseTitle={cert.courseTitle}
          instructorName={cert.instructorName}
          issuedAt={cert.issuedAt}
          verificationCode={cert.verificationCode}
        />

        {/* share + copy actions below certificate */}
        <div style={{
          marginTop: "24px",
          display: "flex",
          gap: "12px",
          justifyContent: "center",
        }}>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success("Link copied!")
            }}
          >
            Copy verification link
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>

        <p style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#6b7280",
          marginTop: "16px",
        }}>
          This certificate can be verified at any time using the link above.
        </p>
      </div>
    </div>
  )
}