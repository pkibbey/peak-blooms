import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconFlower } from "@/components/ui/icons"
import { ReactNode } from "react"

interface HeroProps {
  title: string
  subtitle: string
  cta: {
    label: string
    href: string
    icon?: ReactNode
  }
}

export default function Hero({ title, subtitle, cta }: HeroProps) {
  return (
    <section className="w-full bg-hero-gradient">
      <div className="container mx-auto px-6 py-16 md:py-20">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left section - Content */}
          <div className="flex flex-col justify-center md:w-2/3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              {title}
            </h1>
            <p className="mt-4 text-lg text-white/80">
              {subtitle}
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href={cta.href} className="inline-flex items-center gap-1">
                  {cta.icon || <IconFlower aria-hidden="true" />}
                  {cta.label}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right section - Image placeholder */}
          <div className="md:w-1/3 h-full bg-black/10 rounded-lg" />
        </div>
      </div>
    </section>
  )
}
