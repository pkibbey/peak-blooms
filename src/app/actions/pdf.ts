"use server"

/**
 * Server-only PDF helper.
 * - Generates invoices using pdf-lib, which has excellent TypeScript support
 * - Export a small function that returns a PDF `Buffer` for an order
 */

import { PDFDocument, rgb } from "pdf-lib"

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
  const fontSize = 12
  const { height } = page.getSize()
  let y = height - 50

  // Header
  page.drawText("Peak Blooms", {
    x: 50,
    y,
    size: 20,
    color: rgb(0, 0, 0),
  })

  page.drawText(`Invoice #${order.orderNumber}`, {
    x: 350,
    y,
    size: 12,
    color: rgb(0, 0, 0),
  })

  y -= 40

  // Bill To section
  page.drawText("Bill To:", {
    x: 50,
    y,
    size: 12,
    color: rgb(0, 0, 0),
  })

  y -= 20

  const addr = order.deliveryAddress
  const addressLines = []
  if (addr) {
    addressLines.push(`${addr.firstName} ${addr.lastName}`.trim())
    if (addr.company) addressLines.push(addr.company)
    if (addr.street1) addressLines.push(addr.street1)
    if (addr.street2) addressLines.push(addr.street2)

    const cityStateZip = [addr.city, addr.state, addr.zip].filter(Boolean).join(" ")
    if (cityStateZip) addressLines.push(cityStateZip)

    if (addr.country) addressLines.push(addr.country)
    if (addr.email) addressLines.push(addr.email)
  } else {
    addressLines.push(order.user?.name || "—")
    addressLines.push(order.user?.email || "—")
  }

  for (const line of addressLines) {
    page.drawText(line, {
      x: 50,
      y,
      size: fontSize - 2,
      color: rgb(0, 0, 0),
    })
    y -= 18
  }

  y -= 10

  // Table header
  const colX = [50, 350, 430, 500]
  const colLabels = ["Description", "Qty", "Unit", "Total"]

  page.drawText(colLabels[0], { x: colX[0], y, size: 11, color: rgb(0, 0, 0) })
  page.drawText(colLabels[1], { x: colX[1], y, size: 11, color: rgb(0, 0, 0) })
  page.drawText(colLabels[2], { x: colX[2], y, size: 11, color: rgb(0, 0, 0) })
  page.drawText(colLabels[3], { x: colX[3], y, size: 11, color: rgb(0, 0, 0) })

  y -= 20

  // Items
  let subtotal = 0

  for (const item of order.items) {
    const unit = item.price ?? 0
    const quantity = item.quantity ?? 0
    const lineTotal = unit * quantity
    subtotal += lineTotal

    page.drawText(item.productNameSnapshot || item.product?.name || "Item", {
      x: colX[0],
      y,
      size: fontSize - 2,
      color: rgb(0, 0, 0),
    })
    page.drawText(String(quantity), {
      x: colX[1],
      y,
      size: fontSize - 2,
      color: rgb(0, 0, 0),
    })
    page.drawText(`$${unit.toFixed(2)}`, {
      x: colX[2],
      y,
      size: fontSize - 2,
      color: rgb(0, 0, 0),
    })
    page.drawText(`$${lineTotal.toFixed(2)}`, {
      x: colX[3],
      y,
      size: fontSize - 2,
      color: rgb(0, 0, 0),
    })

    y -= 20
  }

  y -= 10

  // Totals
  page.drawText(`Subtotal: $${subtotal.toFixed(2)}`, {
    x: 350,
    y,
    size: fontSize - 2,
    color: rgb(0, 0, 0),
  })

  y -= 20
  page.drawText(`Tax: $0.00`, {
    x: 350,
    y,
    size: fontSize - 2,
    color: rgb(0, 0, 0),
  })

  y -= 20
  page.drawText(`Total: $${subtotal.toFixed(2)}`, {
    x: 350,
    y,
    size: 14,
    color: rgb(0, 0, 0),
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
