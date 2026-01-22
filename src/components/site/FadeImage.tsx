"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

interface FadeImageProps {
  src: string
  alt?: string
  priority?: boolean
  className?: string
  sizes?: string
  duration?: number
  onLoadComplete?: (src: string) => void
}

export default function FadeImage({
  src,
  alt,
  priority,
  className = "",
  sizes,
  duration = 200,
  onLoadComplete,
}: FadeImageProps) {
  const [activeSrc, setActiveSrc] = useState(src)
  const [prevSrc, setPrevSrc] = useState<string | null>(null)
  const [showIncoming, setShowIncoming] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const mounted = useRef(false)
  const lastNotifiedRef = useRef<string | null>(null)

  const notifyLoadComplete = useCallback(
    (s: string) => {
      if (lastNotifiedRef.current === s) return
      lastNotifiedRef.current = s
      onLoadComplete?.(s)
    },
    [onLoadComplete]
  )

  useEffect(() => {
    mounted.current = true
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    const handle = () => setPrefersReducedMotion(!!media?.matches)
    handle()
    media?.addEventListener?.("change", handle)
    return () => media?.removeEventListener?.("change", handle)
  }, [])

  useEffect(() => {
    if (!mounted.current) return
    if (src === activeSrc) return

    if (prefersReducedMotion) {
      // Skip animation; swap instantly
      setActiveSrc(src)
      setPrevSrc(null)
      setShowIncoming(false)
      notifyLoadComplete(src)
      return
    }

    // Begin preload new image
    const img = new window.Image()
    img.src = src
    img.onload = () => {
      // Keep previous image for the crossfade
      setPrevSrc(activeSrc)
      // Set active to new src (but it will start hidden)
      setActiveSrc(src)
      // Start transition on next frame so CSS transition runs
      setShowIncoming(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShowIncoming(true)
          // After duration, clean up prev image
          setTimeout(() => {
            setPrevSrc(null)
            setShowIncoming(false)
            notifyLoadComplete(src)
          }, duration)
        })
      })
    }
  }, [src, activeSrc, prefersReducedMotion, duration, notifyLoadComplete])

  const topOpacityClass = prevSrc ? (showIncoming ? "opacity-100" : "opacity-0") : "opacity-100"
  const bottomOpacityClass = prevSrc ? (showIncoming ? "opacity-0" : "opacity-100") : "opacity-0"
  const transitionStyle = { transitionDuration: `${duration}ms` }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {prevSrc && (
        <Image
          src={prevSrc}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          priority={false}
          className={`object-cover transition-opacity motion-reduce:transition-none ${bottomOpacityClass}`}
          style={transitionStyle}
        />
      )}

      <Image
        src={activeSrc}
        alt={alt ?? ""}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover transition-opacity motion-reduce:transition-none ${topOpacityClass}`}
        style={transitionStyle}
        onLoadingComplete={() => {
          // If there was no previous image (no crossfade), notify load complete for initial/instant cases
          if (!prevSrc) notifyLoadComplete(activeSrc)
        }}
      />
    </div>
  )
}
