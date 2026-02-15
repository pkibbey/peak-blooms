"use server"

/**
 * Server-only PDF helper.
 * - Generates invoices using pdf-lib, which has excellent TypeScript support
 * - Export a small function that returns a PDF `Buffer` for an order
 */

import fs from "node:fs/promises"
import path from "node:path"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export async function generateInvoicePdfBuffer(order: {
  orderNumber?: string | number
  items: Array<{
    productNameSnapshot?: string | null
    product?: { name?: string | null }
    price?: number | null
    quantity?: number | null
  }>
  deliveryAddress?: {
    firstName?: string | null
    lastName?: string | null
    company?: string | null
    street1?: string | null
    street2?: string | null
    city?: string | null
    state?: string | null
    zip?: string | null
    country?: string | null
    email?: string | null
  } | null
  user?: { name?: string | null; email?: string | null } | null
}): Promise<Buffer> {
  if (!order) throw new Error("Order is required to generate PDF")

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Letter size
  const { width, height } = page.getSize()
  const margin = 50

  // prefer embedding the exact site fonts (place TTFs in `public/fonts/`):
  // - Geist → `public/fonts/geist.ttf` (preferred default for PDFs)
  // - Raleway → `public/fonts/raleway-regular.ttf`
  // - Playfair Display → `public/fonts/playfair-display-regular.ttf`
  // fall back to stable PDF standard fonts if files are not present
  let font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  let serif = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  try {
    // Prefer Geist if available (will be used as the default for all text)
    let geistBytes: Buffer | null = null
    for (const name of [
      "geist-regular.ttf",
      "geist.ttf",
      "geist-sans.ttf",
      "geist-sans-regular.ttf",
    ]) {
      const p = path.join(process.cwd(), "public", "fonts", name)
      geistBytes = await fs.readFile(p).catch(() => null)
      if (geistBytes) break
    }

    if (geistBytes) {
      const geistPdfFont = await pdfDoc.embedFont(geistBytes)
      font = geistPdfFont
      serif = geistPdfFont
    } else {
      // try common filename variants so server-side embedding works with either name
      let ralewayBytes: Buffer | null = null
      for (const name of ["raleway-regular.ttf", "raleway.ttf"]) {
        const p = path.join(process.cwd(), "public", "fonts", name)
        ralewayBytes = await fs.readFile(p).catch(() => null)
        if (ralewayBytes) break
      }

      let playfairBytes: Buffer | null = null
      for (const name of ["playfair-display-regular.ttf", "playfair.ttf"]) {
        const p = path.join(process.cwd(), "public", "fonts", name)
        playfairBytes = await fs.readFile(p).catch(() => null)
        if (playfairBytes) break
      }

      if (ralewayBytes) font = await pdfDoc.embedFont(ralewayBytes)
      if (playfairBytes) serif = await pdfDoc.embedFont(playfairBytes)
    }
  } catch {
    // ignore and continue with standard fonts
  }

  // brand color from style guide (#1F332E)
  const brand = rgb(112 / 255, 139 / 255, 108 / 255)
  const white = rgb(1, 1, 1)
  const black = rgb(0, 0, 0)

  // starting Y (top of page)
  let y = height - margin

  const defaultFontSize = 10

  // Logo (top-left) — scale reduced by 75% and expose its height for layout bounds
  let logoHeight = 0
  try {
    const logoPath = path.join(process.cwd(), "public", "logos", "peak-blooms-black.png")
    const logoBytes = await fs.readFile(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBytes)
    const logoScale = 0.2
    const logoDims = logoImage.scale(logoScale)
    logoHeight = logoDims.height
    page.drawImage(logoImage, {
      x: margin,
      y: y - logoDims.height + 6,
      width: logoDims.width,
      height: logoDims.height,
    })
  } catch {
    // ignore if logo file is missing; fall back to text title
    page.drawText("Peak Blooms", { x: margin, y, size: 18, font: serif, color: black })
    logoHeight = 18
  }

  // Company / Sales rep (top-right)
  const rightColX = width - margin
  const companyLines = [
    "Sales Representative",
    "Izzy Rabban",
    "(858) 394-9420",
    "peakbloomssd@gmail.com",
  ]

  let companyY = y
  for (const line of companyLines) {
    const textWidth = font.widthOfTextAtSize(line, defaultFontSize)
    page.drawText(line, {
      x: rightColX - textWidth,
      y: companyY,
      size: defaultFontSize,
      font,
      color: black,
    })
    companyY -= defaultFontSize + 4
  }

  // Invoice title / number under header area — place it below the header (logo + company block)
  const companyBlockHeight = companyLines.length * (defaultFontSize + 4)
  const headerOccupied = Math.max(logoHeight, companyBlockHeight)
  y = height - margin - headerOccupied - defaultFontSize
  // show invoice date/time instead of invoice number
  const invoiceDateLabel = new Date().toLocaleString()
  page.drawText(`Invoice Date: ${invoiceDateLabel}`, {
    x: margin,
    y,
    size: defaultFontSize,
    font,
    color: black,
  })

  // Customer details (left-aligned, full page width)
  y -= defaultFontSize * 3
  page.drawText("Bill To:", { x: margin, y, size: defaultFontSize, font, color: black })
  y -= defaultFontSize * 2

  const addr = order.deliveryAddress
  const addressLines: string[] = []
  if (addr) {
    addressLines.push(
      `${(addr.firstName || "").trim()} ${(addr.lastName || "").trim()}`.trim() || "—"
    )
    if (addr.company) addressLines.push(addr.company)
    if (addr.street1) addressLines.push(addr.street1)
    if (addr.street2) addressLines.push(addr.street2)
    const cityStateZip = [addr.city, addr.state, addr.zip].filter(Boolean).join(" ")
    if (cityStateZip) addressLines.push(cityStateZip)
    if (addr.country) addressLines.push(addr.country)
    if (addr.email) addressLines.push(addr.email)
  } else {
    addressLines.push(order.user?.name || "—")
    if (order.user?.email) addressLines.push(order.user.email)
  }

  const contentWidth = width - margin * 2
  for (const line of addressLines) {
    page.drawText(line, {
      x: margin,
      y,
      size: defaultFontSize,
      font,
      color: black,
      maxWidth: contentWidth,
    })
    y -= defaultFontSize + 4
  }

  y -= 8

  // Order table header (full page width)
  const tableTopY = y
  const tableLeft = margin
  const tableRight = width - margin
  const tableWidth = tableRight - tableLeft
  const headerHeight = 20

  // header background (solid rectangle)
  const headerRectY = tableTopY - headerHeight + 4
  page.drawRectangle({
    x: tableLeft,
    y: headerRectY,
    width: tableWidth,
    height: headerHeight,
    color: brand,
  })

  // table columns (Description, Quantity, Unit price, Cost)
  const colX = [
    tableLeft + 6,
    tableLeft + Math.round(tableWidth * 0.55),
    tableLeft + Math.round(tableWidth * 0.8),
    tableRight - 60,
  ]
  const headerLabels = ["Description", "Quantity", "Unit price", "Cost"]

  // header text (white) — vertically centered in the header cell
  const headerTextY = headerRectY + headerHeight / 2 - (defaultFontSize - 5) / 2
  page.drawText(headerLabels[0], {
    x: colX[0],
    y: headerTextY,
    size: defaultFontSize,
    font,
    color: white,
  })
  page.drawText(headerLabels[1], {
    x: colX[1],
    y: headerTextY,
    size: defaultFontSize,
    font,
    color: white,
  })
  page.drawText(headerLabels[2], {
    x: colX[2],
    y: headerTextY,
    size: defaultFontSize,
    font,
    color: white,
  })
  // right-align the Cost header only
  const costHeader = headerLabels[3]
  const costHeaderWidth = serif.widthOfTextAtSize(costHeader, defaultFontSize)
  page.drawText(costHeader, {
    x: tableRight - costHeaderWidth - 8,
    y: headerTextY,
    size: defaultFontSize,
    font,
    color: white,
  })

  y = tableTopY - headerHeight - 8

  // Items rows
  let subtotal = 0
  const rowHeight = 18
  const itemFontSize = 10
  for (const item of order.items) {
    const unit = item.price ?? 0
    const quantity = item.quantity ?? 0
    const lineTotal = unit * quantity
    subtotal += lineTotal

    // Description (allow wrapping within column)
    page.drawText(item.productNameSnapshot || item.product?.name || "Item", {
      x: colX[0],
      y,
      size: itemFontSize,
      font,
      color: black,
      maxWidth: colX[1] - colX[0] - 8,
    })

    // Quantity
    page.drawText(String(quantity), { x: colX[1], y, size: itemFontSize, font, color: black })

    // Unit price
    page.drawText(`$${unit.toFixed(2)}`, { x: colX[2], y, size: itemFontSize, font, color: black })

    // Cost (right-aligned)
    const costText = `$${lineTotal.toFixed(2)}`
    const costWidth = font.widthOfTextAtSize(costText, itemFontSize)
    page.drawText(costText, {
      x: tableRight - costWidth - 6,
      y,
      size: itemFontSize,
      font,
      color: black,
    })

    y -= rowHeight

    // simple page-break handling (start new page)
    if (y < 120) {
      // add totals to previous page will be handled after loop; create new page
      const newPage = pdfDoc.addPage([612, 792])
      y = newPage.getSize().height - margin
    }
  }

  y -= 8

  // calculate tax (apply standard California sales tax when shipping to CA)
  const CA_SALES_TAX_RATE = 0.0725 // 7.25%
  const shippingState = (order.deliveryAddress?.state || "").trim().toLowerCase()
  const isCalifornia = shippingState === "ca" || shippingState === "california"
  const tax = isCalifornia ? +(subtotal * CA_SALES_TAX_RATE).toFixed(2) : 0
  const total = +(subtotal + tax).toFixed(2)
  const taxLabel = isCalifornia ? `Tax (CA ${(CA_SALES_TAX_RATE * 100).toFixed(2)}%):` : "Tax:"

  // Totals column (right-aligned)
  const rightColStart = tableRight - 200
  const labelSize = 12
  const valueSize = 12

  const drawRightValue = (label: string, value: string, yy: number) => {
    page.drawText(label, { x: rightColStart, y: yy, size: labelSize, font, color: black })
    const valueWidth = font.widthOfTextAtSize(value, valueSize)
    page.drawText(value, {
      x: tableRight - valueWidth - 6,
      y: yy,
      size: valueSize,
      font,
      color: black,
    })
  }

  drawRightValue("Subtotal:", `$${subtotal.toFixed(2)}`, y)
  y -= 18
  drawRightValue(taxLabel, `$${tax.toFixed(2)}`, y)
  y -= 22
  drawRightValue("Total:", `$${total.toFixed(2)}`, y)

  // Disclaimer paragraph near bottom
  const disclaimer = `Please inspect product upon delivery. Any concerns regarding quality or quantity must be reported within 24 hours of receipt with supporting photos. Claims reported after this period may not be eligible for review.`
  const disclaimerY = 90
  page.drawText(disclaimer, {
    x: margin,
    y: disclaimerY,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: contentWidth,
    lineHeight: 12,
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
