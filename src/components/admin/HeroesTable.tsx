import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GRADIENT_PRESETS } from "@/lib/validations/hero"

interface HeroBanner {
  id: string
  name: string
  slug: string
  title: string
  backgroundType: "IMAGE" | "GRADIENT"
  gradientPreset: string | null
  slotPosition: number | null
  textPosition?: string | null
}

interface HeroesTableProps {
  heroes: HeroBanner[]
}

function GradientSwatch({ preset }: { preset: string | null }) {
  const gradient = GRADIENT_PRESETS.find((g) => g.value === preset)
  if (!gradient) return <span className="text-muted-foreground">—</span>

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-6 w-10 rounded-sm"
        style={{
          background: `linear-gradient(135deg, ${gradient.colors[0]}, ${gradient.colors[1]})`,
        }}
      />
      <span className="text-sm">{gradient.label}</span>
    </div>
  )
}

function SlotBadge({ position }: { position: number | null }) {
  if (!position) {
    return <span className="text-muted-foreground">Not displayed</span>
  }

  const labels: Record<number, string> = {
    1: "Slot 1 (Top)",
    2: "Slot 2 (Middle)",
    3: "Slot 3 (Bottom)",
  }

  return <Badge variant="secondary">{labels[position] || `Slot ${position}`}</Badge>
}

export default function HeroesTable({ heroes }: HeroesTableProps) {
  if (heroes.length === 0) {
    return (
      <p className="text-muted-foreground">
        No hero banners found. Add your first hero banner to get started.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Background</TableHead>
            <TableHead>Slot</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {heroes.map((hero) => (
            <TableRow key={hero.id}>
              {/* Name */}
              <TableCell>
                <Link
                  href={`/admin/heroes/${hero.id}/edit`}
                  className="text-primary font-medium hover:underline"
                >
                  {hero.name}
                </Link>
              </TableCell>

              {/* Title */}
              <TableCell className="max-w-[200px] truncate">{hero.title}</TableCell>

              {/* Background */}
              <TableCell className="hidden md:table-cell">
                {hero.backgroundType === "GRADIENT" ? (
                  <GradientSwatch preset={hero.gradientPreset} />
                ) : (
                  <span className="text-sm text-muted-foreground">Image</span>
                )}
              </TableCell>

              {/* Slot Position */}
              <TableCell>
                <SlotBadge position={hero.slotPosition} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
