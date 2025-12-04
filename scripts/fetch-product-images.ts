import * as fs from "node:fs"
import https from "node:https"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import * as dotenv from "dotenv"

// Load environment variables from .env
dotenv.config()

// ESM polyfill for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Flower name mapping: keywords that indicate flower type
const flowerNameMapping: Record<string, string> = {
  ecuadorian: "Rose",
  hybrid: "Lily",
  oriental: "Lily",
  mini: "Calla Lily",
  "mini calla": "Calla Lily",
  florigene: "Carnation",
  dinner: "Dahlia",
  butterfly: "Ranunculus",
  local: "Rose", // Default for unspecified local varieties
  blonde: "Lily",
  dianthus: "Carnation",
  marigold: "Marigold",
  "aster serenade": "Aster",
  "solid aster": "Aster",
  protea: "Protea",
  ranunculus: "Ranunculus",
  dahlia: "Dahlia",
  delphinium: "Delphinium",
  gladiolas: "Gladiolus",
  liatris: "Liatris",
  snapdragon: "Snapdragon",
  stock: "Stock",
  "straw flower": "Strawflower",
  sunflower: "Sunflower",
  tuberose: "Tuberose",
  tulip: "Tulip",
  anemone: "Anemone",
  alstromeria: "Alstroemeria",
  astrantia: "Astrantia",
  "bird of paradise": "Bird of Paradise",
  "calla lily": "Calla Lily",
  carnation: "Carnation",
  cosmos: "Cosmos",
  cremone: "Celosia",
  gerbera: "Gerbera",
  hellebore: "Hellebore",
  hydrangea: "Hydrangea",
  hyd: "Hydrangea",
  iris: "Iris",
  kale: "Ornamental Kale",
  larkspur: "Larkspur",
  lisianthus: "Lisianthus",
  matsumoto: "Aster",
  peonies: "Peony",
  "pom colombia": "Chrysanthemum",
  "pom fall": "Chrysanthemum",
  // Fillers - search for their base names
  eucalyptus: "Eucalyptus",
  fern: "Fern",
  acacia: "Acacia",
  ageratum: "Ageratum",
  agonis: "Agonis",
  amaranthus: "Amaranthus",
  aralia: "Aralia",
  aspidistra: "Aspidistra",
  "bells of ireland": "Bells of Ireland",
  "black majestic": "Foliage",
  bluperum: "Bluperum",
  boxwood: "Boxwood",
  "broom corn": "Broom Corn",
  "cat tails": "Cattail",
  "chocolate lace": "Fern",
  cocculus: "Cocculus",
  "coontie fern": "Fern",
  craspedia: "Craspedia",
  "dusty miller": "Dusty Miller",
  echinacea: "Echinacea",
  "fever few": "Feverfew",
  "flat fern": "Fern",
  "fox tail": "Foxtail",
  ginestra: "Ginestra",
  "green mist": "Foliage",
  grevellia: "Grevillea",
  "gyp cosmic pearl": "Gypsophila",
  "gypsy dianthus": "Dianthus",
  "honey bracelet": "Foliage",
  horsetail: "Horsetail",
  hypericum: "Hypericum",
  ivy: "Ivy",
  "leather fern": "Fern",
  lemon: "Foliage",
  "lily grass": "Grass",
  limonium: "Limonium",
  magnolia: "Magnolia",
  millet: "Grass",
  "ming fern": "Fern",
  "monte casino": "Aster",
  monstera: "Monstera",
  moss: "Moss",
  myrtle: "Myrtle",
  nagi: "Nagi",
  olive: "Olive",
  orlaya: "Orlaya",
  "phoenix robellini": "Palm",
  pittosporum: "Pittosporum",
  plumosus: "Asparagus Fern",
  podocarpus: "Podocarpus",
  "queen anne lace": "Queen Anne's Lace",
  "queen of africa": "Foliage",
  rosemary: "Rosemary",
  ruscus: "Ruscus",
  "safari sunset": "Foliage",
  safflower: "Safflower",
  sage: "Sage",
  scabiosa: "Scabiosa",
  "silver queen": "Foliage",
  springerii: "Asparagus Fern",
  statice: "Limonium",
  "sword fern": "Fern",
  thistle: "Thistle",
  "ti leaf": "Ti Leaf",
  "tree fern": "Fern",
  veronica: "Veronica",
  wax: "Wax Flower",
  xanadu: "Xanadu",
  yarrow: "Yarrow",
}

const apiKey = process.env.PIXABAY_API_KEY
if (!apiKey) {
  console.error("❌ PIXABAY_API_KEY environment variable not set")
  process.exit(1)
}

const imageDir = path.join(__dirname, "../public/product-images")
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true })
  console.log(`📁 Created image directory: ${imageDir}`)
}

interface ProductRow {
  name: string
  price: string
  type: string
  description: string
  colors: string
  image?: string
}

// Parse CSV file
function readCSV(filePath: string): ProductRow[] {
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  // Parse header
  const headers = parseCSVLine(lines[0])
  const products: ProductRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    if (values.length < headers.length) continue

    const row: ProductRow = {
      name: values[0] || "",
      price: values[1] || "",
      type: values[2] || "",
      description: values[3] || "",
      colors: values[4] || "",
      image: values[5] || "",
    }

    if (row.name) {
      products.push(row)
    }
  }

  return products
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Extract base flower type and normalize product name
function normalizeProductName(name: string): {
  normalized: string
  baseFlower: string
} {
  const lowerName = name.toLowerCase()

  // Find matching flower type
  let baseFlower = ""

  // Try longest matches first (to handle multi-word entries like "bird of paradise")
  const sortedKeys = Object.keys(flowerNameMapping).sort((a, b) => b.length - a.length)

  for (const key of sortedKeys) {
    if (lowerName.includes(key)) {
      baseFlower = flowerNameMapping[key]
      break
    }
  }

  // Normalize: capitalize words, remove extra spaces
  const normalized =
    name
      .replace(/\bCM\b/gi, "cm")
      .replace(/\s+/g, " ")
      .trim() +
    (baseFlower && !name.toLowerCase().includes(baseFlower.toLowerCase()) ? ` ${baseFlower}` : "")

  return { normalized, baseFlower: baseFlower || name }
}

// Download image from Pixabay
async function downloadImageFromPixabay(query: string, filename: string): Promise<string | null> {
  return new Promise((resolve) => {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(
      query
    )}&image_type=photo&min_width=400&safesearch=true&per_page=3`

    console.log(`  → API request: ${query}`)

    let resolved = false
    const apiTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        console.error(`  ✗ API request timeout (10s)`)
        resolve(null)
      }
    }, 10000)

    https
      .get(url, (res) => {
        let data = ""

        res.on("data", (chunk) => {
          data += chunk
        })

        res.on("end", () => {
          clearTimeout(apiTimeout)
          if (resolved) return

          try {
            const json = JSON.parse(data)

            if (json.error) {
              resolved = true
              console.error(`  ✗ API Error: ${json.error}`)
              resolve(null)
              return
            }

            if (!json.hits) {
              resolved = true
              console.error(`  ✗ Invalid API response: ${JSON.stringify(json).substring(0, 100)}`)
              resolve(null)
              return
            }

            if (json.hits.length > 0) {
              const imageUrl = json.hits[0].webformatURL
              const filePath = path.join(imageDir, filename)

              console.log(`  → Downloading from: ${imageUrl}`)

              // Download image with its own timeout
              https
                .get(imageUrl, (imageRes) => {
                  if (imageRes.statusCode !== 200) {
                    resolved = true
                    console.error(`  ✗ Download failed: HTTP ${imageRes.statusCode}`)
                    resolve(null)
                    return
                  }

                  const fileStream = fs.createWriteStream(filePath)

                  imageRes.pipe(fileStream)

                  const downloadTimeout = setTimeout(() => {
                    if (!resolved) {
                      resolved = true
                      fileStream.destroy()
                      console.error(`  ✗ Download timeout (30s)`)
                      resolve(null)
                    }
                  }, 30000)

                  fileStream.on("finish", () => {
                    clearTimeout(downloadTimeout)
                    if (resolved) return
                    resolved = true
                    fileStream.close()
                    const size = fs.statSync(filePath).size
                    console.log(`  ✓ Downloaded: ${filename} (${(size / 1024).toFixed(1)}KB)`)
                    resolve(`/product-images/${filename}`)
                  })

                  fileStream.on("error", (err) => {
                    if (!resolved) {
                      resolved = true
                      clearTimeout(downloadTimeout)
                      console.error(`  ✗ File write error: ${err.message}`)
                      resolve(null)
                    }
                  })
                })
                .on("error", (err) => {
                  if (!resolved) {
                    resolved = true
                    console.error(`  ✗ Download error: ${err.message}`)
                    resolve(null)
                  }
                })
            } else {
              resolved = true
              console.error(`  ✗ No images found for "${query}"`)
              resolve(null)
            }
          } catch (err) {
            if (!resolved) {
              resolved = true
              console.error(`  ✗ Parse error: ${(err as Error).message}`)
              console.error(`  Raw response: ${data.substring(0, 200)}`)
              resolve(null)
            }
          }
        })
      })
      .on("error", (err) => {
        if (!resolved) {
          resolved = true
          clearTimeout(apiTimeout)
          console.error(`  ✗ API request error: ${err.message}`)
          resolve(null)
        }
      })
  })
}

// Write CSV file
function writeCSV(filePath: string, products: ProductRow[]): void {
  const headers = [
    "Product Name",
    "Price per bunch",
    "Product Type",
    "Description",
    "Colors",
    "image",
  ]

  const lines: string[] = [headers.map((h) => escapeCSVField(h)).join(",")]

  for (const product of products) {
    const fields = [
      product.name,
      product.price,
      product.type,
      product.description,
      product.colors,
      product.image || "",
    ]
    lines.push(fields.map((f) => escapeCSVField(f)).join(","))
  }

  fs.writeFileSync(filePath, lines.join("\n"))
}

// Escape CSV field if contains comma or quotes
function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

// Main execution
async function main() {
  const csvPath = path.join(__dirname, "../prisma/products.csv")

  console.log("📖 Reading products.csv...")
  const products = readCSV(csvPath)
  console.log(`✓ Found ${products.length} products`)

  // Track unique flowers and their images
  const flowerImageMap = new Map<string, string>()
  const ambiguousNames: string[] = []

  // First pass: normalize names and identify unique flowers
  const normalizedProducts = products.map((p) => {
    const { normalized, baseFlower } = normalizeProductName(p.name)
    return { ...p, name: normalized, baseFlower }
  })

  console.log("\n🌸 Normalizing product names...")
  for (const product of normalizedProducts) {
    if (!flowerImageMap.has(product.baseFlower)) {
      console.log(`  → ${product.name}`)
    }
  }

  // Second pass: fetch images for unique flowers
  console.log("\n🖼️  Fetching images from Pixabay...")
  const uniqueFlowers = [...new Set(normalizedProducts.map((p) => p.baseFlower))]

  for (let i = 0; i < uniqueFlowers.length; i++) {
    const flower = uniqueFlowers[i]
    if (flowerImageMap.has(flower)) continue

    const filename = `${flower.toLowerCase().replace(/\s+/g, "-")}.jpg`
    const filePath = path.join(imageDir, filename)

    // Check if image already exists
    if (fs.existsSync(filePath)) {
      console.log(`[${i + 1}/${uniqueFlowers.length}] ${flower} (cached)`)
      flowerImageMap.set(flower, `/product-images/${filename}`)
      continue
    }

    console.log(`[${i + 1}/${uniqueFlowers.length}] Fetching ${flower}...`)

    const imagePath = await downloadImageFromPixabay(flower, filename)

    if (imagePath) {
      flowerImageMap.set(flower, imagePath)
    } else {
      console.error(`\n❌ FATAL: Failed to fetch image for "${flower}"`)
      console.error("Script aborted. Please check your API key and internet connection.")
      process.exit(1)
    }

    // Rate limiting: wait 600ms between requests (respects ~100 req/hr limit)
    await new Promise((r) => setTimeout(r, 600))
  }

  // Third pass: assign images to products
  console.log("\n📝 Updating CSV with images...")
  const finalProducts = normalizedProducts.map((p) => ({
    ...p,
    image: flowerImageMap.get(p.baseFlower) || "",
  }))

  // Remove temporary baseFlower field
  const productsForCSV = finalProducts.map((p) => ({
    name: p.name,
    price: p.price,
    type: p.type,
    description: p.description,
    colors: p.colors,
    image: p.image,
  }))

  writeCSV(csvPath, productsForCSV)

  // Summary
  console.log("\n✅ Summary:")
  console.log(`  ✓ ${flowerImageMap.size} unique flowers processed`)
  console.log(`  ✓ ${products.length} products updated`)
  console.log(`  ⚠️  ${ambiguousNames.length} flowers without images`)

  if (ambiguousNames.length > 0) {
    console.log("\nFlowers that need manual review:")
    ambiguousNames.forEach((f) => {
      console.log(`  - ${f}`)
    })
  }

  console.log("\n📁 CSV updated at:", csvPath)
  console.log("🖼️  Images saved to:", imageDir)
}

main().catch(console.error)
