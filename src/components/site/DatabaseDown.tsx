"use client"

import Lottie from "react-lottie-player"
import animationData from "@/components/animations/bird.json"

export default function DatabaseDown({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-white px-4"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto w-48 h-48">
          <Lottie
            loop
            play
            animationData={animationData}
            style={{ width: "100%", height: "100%" }}
            aria-label="Animated bird bouncing"
            role="img"
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-6">Database unavailable</h1>
        <p className="text-gray-600 mt-2 mb-6">
          We're having trouble connecting to our database — please try again.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
