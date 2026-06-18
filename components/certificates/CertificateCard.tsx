// CertificateCard — the actual certificate design
// used in two places:
//   1. full size on /certificate/[code] page
//   2. as a thumbnail in /student/certificates

interface CertificateCardProps {
  recipientName: string
  courseTitle: string
  instructorName: string
  issuedAt: number
  verificationCode: string
  thumbnail?: boolean
}

export function CertificateCard({
  recipientName,
  courseTitle,
  instructorName,
  issuedAt,
  verificationCode,
  thumbnail = false,
}: CertificateCardProps) {
  const issuedDate = new Date(issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const p = thumbnail ? 0.42 : 1 // scale factor for thumbnail

  const s = (n: number) => `${Math.round(n * p)}px`

  return (
    <div style={{
      // fixed cream/gold palette — never changes with theme
      background: "#FFFBF0",
      borderRadius: s(16),
      overflow: "hidden",
      // outer gold border
      border: `${s(3)} solid #B8960C`,
      boxShadow: thumbnail ? "none" : "0 4px 32px rgba(184,150,12,0.15)",
      fontFamily: "Georgia, 'Times New Roman', serif",
      position: "relative",
      width: "100%",
    }}>

      {/* top accent bar — deep gold */}
      <div style={{
        background: "linear-gradient(90deg, #8B6914 0%, #C9A84C 40%, #F0D060 60%, #C9A84C 80%, #8B6914 100%)",
        height: s(12),
        width: "100%",
      }} />

      {/* main certificate body */}
      <div style={{
        padding: `${s(40)} ${s(56)}`,
        position: "relative",
      }}>

        {/* corner ornaments — top left */}
        <svg
          style={{ position: "absolute", top: s(16), left: s(16), opacity: 0.35 }}
          width={s(60)} height={s(60)} viewBox="0 0 60 60"
        >
          <path d="M0 60 L0 0 L60 0" fill="none" stroke="#8B6914" strokeWidth="2"/>
          <path d="M8 60 L8 8 L60 8" fill="none" stroke="#8B6914" strokeWidth="1"/>
          <circle cx="8" cy="8" r="3" fill="#8B6914"/>
        </svg>

        {/* corner ornaments — top right */}
        <svg
          style={{ position: "absolute", top: s(16), right: s(16), opacity: 0.35 }}
          width={s(60)} height={s(60)} viewBox="0 0 60 60"
        >
          <path d="M60 60 L60 0 L0 0" fill="none" stroke="#8B6914" strokeWidth="2"/>
          <path d="M52 60 L52 8 L0 8" fill="none" stroke="#8B6914" strokeWidth="1"/>
          <circle cx="52" cy="8" r="3" fill="#8B6914"/>
        </svg>

        {/* corner ornaments — bottom left */}
        <svg
          style={{ position: "absolute", bottom: s(16), left: s(16), opacity: 0.35 }}
          width={s(60)} height={s(60)} viewBox="0 0 60 60"
        >
          <path d="M0 0 L0 60 L60 60" fill="none" stroke="#8B6914" strokeWidth="2"/>
          <path d="M8 0 L8 52 L60 52" fill="none" stroke="#8B6914" strokeWidth="1"/>
          <circle cx="8" cy="52" r="3" fill="#8B6914"/>
        </svg>

        {/* corner ornaments — bottom right */}
        <svg
          style={{ position: "absolute", bottom: s(16), right: s(16), opacity: 0.35 }}
          width={s(60)} height={s(60)} viewBox="0 0 60 60"
        >
          <path d="M60 0 L60 60 L0 60" fill="none" stroke="#8B6914" strokeWidth="2"/>
          <path d="M52 0 L52 52 L0 52" fill="none" stroke="#8B6914" strokeWidth="1"/>
          <circle cx="52" cy="52" r="3" fill="#8B6914"/>
        </svg>

        {/* platform name / issuer */}
        <p style={{
          textAlign: "center",
          fontSize: s(11),
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#8B6914",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 600,
          margin: `0 0 ${s(6)} 0`,
        }}>
          LMS Platform
        </p>

        {/* title */}
        <p style={{
          textAlign: "center",
          fontSize: s(22),
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#5C3D02",
          fontWeight: "bold",
          margin: `0 0 ${s(4)} 0`,
        }}>
          Certificate of Completion
        </p>

        {/* ornamental divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: s(10),
          margin: `${s(16)} 0`,
        }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #C9A84C)" }} />
          <svg width={s(20)} height={s(20)} viewBox="0 0 20 20">
            <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill="#C9A84C"/>
          </svg>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #C9A84C, transparent)" }} />
        </div>

        {/* presented to */}
        <p style={{
          textAlign: "center",
          fontSize: s(13),
          color: "#7A5C2E",
          fontFamily: "system-ui, sans-serif",
          margin: `0 0 ${s(8)} 0`,
          fontStyle: "italic",
        }}>
          This certificate is proudly presented to
        </p>

        {/* recipient name — the hero element */}
        <h1 style={{
          textAlign: "center",
          fontSize: s(44),
          color: "#2C1A00",
          fontFamily: "Georgia, serif",
          fontWeight: "bold",
          margin: `0 0 ${s(16)} 0`,
          lineHeight: 1.1,
          // subtle text shadow gives depth
          textShadow: "0 1px 2px rgba(184,150,12,0.2)",
        }}>
          {recipientName}
        </h1>

        {/* completion text */}
        <p style={{
          textAlign: "center",
          fontSize: s(13),
          color: "#7A5C2E",
          fontFamily: "system-ui, sans-serif",
          margin: `0 0 ${s(10)} 0`,
          fontStyle: "italic",
        }}>
          has successfully completed the course
        </p>

        {/* course title */}
        <h2 style={{
          textAlign: "center",
          fontSize: s(26),
          color: "#8B6914",
          fontFamily: "Georgia, serif",
          fontWeight: "bold",
          margin: `0 0 ${s(6)} 0`,
          lineHeight: 1.3,
        }}>
          {courseTitle}
        </h2>

        {/* instructor line — no blank line, just natural text */}
        <p style={{
          textAlign: "center",
          fontSize: s(13),
          color: "#7A5C2E",
          fontFamily: "system-ui, sans-serif",
          margin: `0 0 ${s(6)} 0`,
        }}>
          Instructed by{" "}
          <span style={{ fontWeight: 600, color: "#5C3D02" }}>
            {instructorName}
          </span>
        </p>

        {/* date — natural sentence, no blank line */}
        <p style={{
          textAlign: "center",
          fontSize: s(13),
          color: "#7A5C2E",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
        }}>
          Issued on{" "}
          <span style={{ fontWeight: 600, color: "#5C3D02" }}>
            {issuedDate}
          </span>
        </p>

        {/* second ornamental divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: s(10),
          margin: `${s(20)} 0 ${s(16)} 0`,
        }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #C9A84C)" }} />
          <svg width={s(20)} height={s(20)} viewBox="0 0 20 20">
            <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill="#C9A84C"/>
          </svg>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #C9A84C, transparent)" }} />
        </div>

        {/* verification code — only on full size, not thumbnail */}
        {!thumbnail && (
          <p style={{
            textAlign: "center",
            fontSize: "11px",
            color: "#A07830",
            fontFamily: "monospace",
            letterSpacing: "0.15em",
          }}>
            VERIFY AT: /certificate/{verificationCode}
          </p>
        )}
      </div>

      {/* bottom accent bar */}
      <div style={{
        background: "linear-gradient(90deg, #8B6914 0%, #C9A84C 40%, #F0D060 60%, #C9A84C 80%, #8B6914 100%)",
        height: s(12),
        width: "100%",
      }} />
    </div>
  )
}