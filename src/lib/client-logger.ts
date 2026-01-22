function normalizeError(e: unknown) {
  if (e instanceof Error) return { message: e.message, stack: e.stack }
  try {
    return { message: String(e) }
  } catch {
    return { message: "Unknown error" }
  }
}

export function reportError(error: unknown): void {
  // Only log to console in development
  if (process.env.NODE_ENV === "development") {
    const err = normalizeError(error)
    // eslint-disable-next-line no-console
    console.error("Client error:", err)
  }
}
