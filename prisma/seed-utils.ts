import * as fs from "node:fs"
import * as path from "node:path"
import { COLOR_IDS } from "../src/lib/colors"

// Common synonyms mapping to canonical color ids (normalized to price-list tokens)
const SYNONYMS: Record<string, string> = {
  "hot-pink": "hot-pink",
  "hot pink": "hot-pink",
  hotpink: "hot-pink",
  "light-pink": "light-pink",
  "light pink": "light-pink",
  lightpink: "light-pink",
  greens: "green",
  greenery: "green",
  "ivory-white": "ivory",
  "cream-white": "cream",
}

function normalizeColorToken(token: string): string {
  return token
    .toLowerCase()
    .trim()
    .replace(/["'`]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

export function normalizeAndMapColors(tokens: string[] = []) {
  const canonical = new Set<string>(COLOR_IDS as readonly string[])

  const mapped = new Set<string>()
  const unknowns = new Set<string>()

  for (const t of tokens) {
    if (!t) continue
    let normalized = normalizeColorToken(t)
    if (SYNONYMS[normalized]) normalized = SYNONYMS[normalized]

    if (canonical.has(normalized)) mapped.add(normalized)
    else unknowns.add(normalized)
  }

  return { mapped: Array.from(mapped), unknowns: Array.from(unknowns) }
}

export function logUnknownColors(unknowns: string[]) {
  if (!unknowns || unknowns.length === 0) return

  // Warn to console for immediate feedback
  console.warn(`⚠️  Unknown color tokens found during seed: ${unknowns.join(", ")}`)

  // Persist to tmp/unknown-colors.json for manual review (merge with existing)
  try {
    const tmpDir = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

    const file = path.join(tmpDir, "unknown-colors.json")
    let existing: string[] = []
    if (fs.existsSync(file)) {
      try {
        existing = JSON.parse(fs.readFileSync(file, "utf-8")) || []
      } catch (_) {
        existing = []
      }
    }

    const merged = Array.from(new Set([...existing, ...unknowns]))
    fs.writeFileSync(file, JSON.stringify(merged, null, 2), "utf-8")
  } catch (err) {
    // If logging fails, don't block seeding
    console.warn("⚠️  Failed to write unknown-colors.json:", (err as Error).message)
  }
}
