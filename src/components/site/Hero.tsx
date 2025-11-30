import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

// Gradient preset class mapping
const GRADIENT_CLASS_MAP: Record<string, string> = {
  "slate-green": "bg-hero-gradient-slate-green",
  forest: "bg-hero-gradient-forest",
  rose: "bg-hero-gradient-rose",
  ocean: "bg-hero-gradient-ocean",
  earth: "bg-hero-gradient-earth",
}

interface HeroProps {
  title: string
  subtitle: string
  cta?: ReactNode
  ctaText?: string | null
  ctaLink?: string | null
  backgroundImage?: string | null
  gradientPreset?: string | null
  textPosition?: "left" | "center" | "right"
}

export default function Hero({
  title,
  subtitle,
  cta,
  ctaText,
  ctaLink,
  backgroundImage,
  gradientPreset = "slate-green",
  textPosition,
}: HeroProps) {
  // Determine the gradient class to use
  const gradientClass = gradientPreset
    ? GRADIENT_CLASS_MAP[gradientPreset] || "bg-hero-gradient-slate-green"
    : "bg-hero-gradient-slate-green"

  // Render CTA: use provided ReactNode or build from ctaText/ctaLink
  const renderCta = () => {
    if (cta) return cta
    if (ctaText && ctaLink) {
      return (
        <Button asChild>
          <Link href={ctaLink} className="inline-flex items-center gap-1">
            {ctaText}
          </Link>
        </Button>
      )
    }
    return null
  }

  const alignment = textPosition ?? "left"

  // map alignment to layout classes for responsive layout
  const alignmentClasses = {
    left: {
      container: "md:justify-start md:items-start",
      text: "text-left",
      width: "md:w-1/3",
    },
    center: {
      container: "md:justify-center md:items-center",
      text: "text-center",
      width: "md:w-full",
    },
    right: {
      container: "md:justify-end md:items-end",
      text: "text-left",
      width: "md:w-1/3",
    },
  }[alignment]

  return (
    <section className={`relative w-full ${gradientClass} overflow-hidden`}>
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          sizes="100vw"
          priority
          className="absolute inset-0 object-cover z-0"
        />
      )}
      {/* Gradient overlay for text readability.
          - left: desktop gradient from left -> right, mobile uses semi-opaque overlay
          - right: desktop gradient flipped (from right -> left), mobile uses semi-opaque overlay
          - center: no overlay (image left unobscured)
      */}
      {alignment !== "center" && (
        <>
          {/* Desktop gradient */}
          <div
            className="absolute inset-0 z-5 hidden md:block"
            style={{
              background:
                alignment === "left"
                  ? "linear-gradient(to right, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0) 70%)"
                  : "linear-gradient(to left, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0) 70%)",
            }}
          />

          {/* Mobile fallback: single-color overlay for legibility */}
          <div className="absolute inset-0 z-5 bg-black/50 md:hidden" />
        </>
      )}
      {/* Center gradient */}
      {alignment === "center" && <div className="absolute inset-0 z-5 bg-black/50" />}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className={`flex flex-col md:flex-row gap-6 ${alignmentClasses.container}`}>
          {/* Content - placement controlled by textPosition */}
          <div
            className={`flex flex-col justify-center ${alignmentClasses.width} ${alignmentClasses.text}`}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white font-serif">{title}</h1>
            <p className="mt-3 text-lg text-white/80">{subtitle}</p>
            {renderCta() && <div className="mt-6">{renderCta()}</div>}
          </div>
        </div>
      </div>
    </section>
  )
}
