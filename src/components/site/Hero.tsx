import { ReactNode } from "react"
import Image from "next/image"

interface HeroProps {
  title: string
  subtitle: string
  cta: ReactNode
}

export default function Hero({ title, subtitle, cta }: HeroProps) {
  return (
    <section className="relative w-full bg-hero-gradient overflow-hidden">
      <Image
        src="/hero/slate-green-flowers-bg.png"
        alt="Slate green flowers background"
        fill
        sizes="100vw"
        priority
        className="absolute inset-0 object-cover z-0"
      />
      {/* Linear gradient overlay for text readability */}
      <div className="absolute inset-0 z-5 bg-gradient-to-r from-black/60 from-20% to-transparent to-70% hidden md:block" />
      <div className="absolute inset-0 z-5 bg-black/50 md:hidden" />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left section - Content */}
          <div className="flex flex-col justify-center md:w-1/3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white font-serif">
              {title}
            </h1>
            <p className="mt-3 text-lg text-white/80">
              {subtitle}
            </p>
            <div className="mt-6">
              {cta}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
