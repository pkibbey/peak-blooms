"use client"

import { useEffect } from "react"
import DatabaseDown from "@/components/site/DatabaseDown"
import { reportError } from "@/lib/client-logger"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Report the error to console in dev mode
    reportError(error)
  }, [error])

  // Heuristic detection for database/connectivity errors
  const _msg = `${error?.message ?? ""} ${error?.stack ?? ""}`.toLowerCase()
  const dbErrorPatterns = [
    "failed to connect to database",
    "econnrefused",
    "p1001",
    "prismaclientinitializationerror",
  ]
  const isDatabaseError = dbErrorPatterns.some((p) => _msg.includes(p))

  if (isDatabaseError) {
    return <DatabaseDown onRetry={reset} />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">We encountered an unexpected error. Please try again.</p>

        <button
          type="button"
          onClick={() => reset()}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Try again
        </button>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-mono text-red-600 break-words">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
