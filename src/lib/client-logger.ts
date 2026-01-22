type Meta = Record<string, unknown> | undefined

function normalizeError(e: unknown) {
  if (e instanceof Error) return { message: e.message, stack: e.stack }
  try {
    return { message: String(e) }
  } catch {
    return { message: "Unknown error" }
  }
}

export function reportError(error: unknown, meta?: Meta): void {
  const err = normalizeError(error)

  // In development, keep the console output so engineers see errors locally
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.error("Reported error:", err, meta)
    return
  }

  try {
    const payload = {
      message: err.message,
      // biome-ignore lint/suspicious/noExplicitAny: Error unknown
      stack: (err as any).stack,
      meta: meta || {},
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      ts: new Date().toISOString(),
    }
    const body = JSON.stringify(payload)

    // Prefer sendBeacon for reliability on page unload; fallback to fetch
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" })
      void navigator.sendBeacon("/api/client-errors", blob)
    } else if (typeof fetch === "function") {
      void fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
    }
  } catch (err) {
    // swallow — logging should not throw
    // eslint-disable-next-line no-console
    console.error("reportError failed:", err)
  }
}
