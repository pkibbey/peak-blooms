interface ContactInfoProps {
  name?: string | null
  email?: string | null
  phone?: string | null
  compact?: boolean
  className?: string
}

export default function ContactInfo({
  name,
  email,
  phone,
  compact = false,
  className = "",
}: ContactInfoProps) {
  const containerClass = compact ? "text-sm" : "text-sm space-y-2"

  return (
    <div className={`${containerClass} ${className}`.trim()}>
      {name ? (
        compact ? (
          <p className="text-muted-foreground truncate">{name}</p>
        ) : (
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">{name}</span>
          </p>
        )
      ) : null}

      {email ? (
        compact ? (
          <p className="text-muted-foreground truncate">{email}</p>
        ) : (
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{email}</span>
          </p>
        )
      ) : null}

      {phone ? (
        compact ? (
          <p className="text-muted-foreground">{phone}</p>
        ) : (
          <p>
            <span className="text-muted-foreground">Phone:</span>{" "}
            <span className="font-medium">{phone}</span>
          </p>
        )
      ) : null}

      {/* If nothing provided, render a subtle placeholder */}
      {!name && !email && !phone ? <p className="text-muted-foreground">—</p> : null}
    </div>
  )
}
