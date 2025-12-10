"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import AddAllToCartButton from "@/components/site/AddAllToCartButton"
import { Button } from "@/components/ui/button"
import { IconMinus, IconPlus } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"

interface Product {
  id: string
  name: string
  slug: string
  image: string | null
  quantity: number
  displayVariant: {
    id: string | null
    price: number
    stemLength: number | null
    quantityPerBunch: number | null
  } | null
}

interface InspirationProductTableProps {
  products: Product[]
  productVariantIds: (string | null)[]
  setName: string
  user?: { approved: boolean } | null
}

export function InspirationProductTable({
  products,
  productVariantIds,
  setName,
  user,
}: InspirationProductTableProps) {
  const [quantities, setQuantities] = useState<number[]>(products.map((p) => p.quantity))

  const handleQuantityChange = (index: number, value: number) => {
    const clamped = Math.max(1, Math.min(999, value))
    const newQuantities = [...quantities]
    newQuantities[index] = clamped
    setQuantities(newQuantities)
  }

  const handleDecrement = (index: number) => {
    setQuantities((prev) => {
      const newQuantities = [...prev]
      newQuantities[index] = Math.max(1, newQuantities[index] - 1)
      return newQuantities
    })
  }

  const handleIncrement = (index: number) => {
    setQuantities((prev) => {
      const newQuantities = [...prev]
      newQuantities[index] = Math.min(999, newQuantities[index] + 1)
      return newQuantities
    })
  }

  return (
    <div className="space-y-4">
      {/* Product Table with Enhanced Styling */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead className="font-semibold">Image</TableHead>
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold">Details</TableHead>
              <TableHead className="font-semibold">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow
                key={product.slug}
                className={index % 2 === 0 ? "bg-white" : "bg-muted/20 hover:bg-muted/30"}
              >
                <TableCell className="py-4">
                  <Link prefetch={false} href={`/shop/${product.slug}`} className="block">
                    {product.image ? (
                      <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted shadow-sm hover:shadow-md transition-shadow">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="py-4">
                  <Link
                    prefetch={false}
                    href={`/shop/${product.slug}`}
                    className="text-primary font-semibold hover:underline text-base"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="py-4">
                  {product.displayVariant ? (
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900 mb-1">
                        {formatPrice(product.displayVariant.price)}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {product.displayVariant.stemLength && (
                          <div>Stem length: {product.displayVariant.stemLength}cm</div>
                        )}
                        {product.displayVariant.quantityPerBunch && (
                          <div>{product.displayVariant.quantityPerBunch} per bunch</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No variant</div>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleDecrement(index)}
                      aria-label="Decrease quantity"
                    >
                      <IconMinus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      value={quantities[index]}
                      onChange={(e) =>
                        handleQuantityChange(index, parseInt(e.target.value, 10) || 1)
                      }
                      className="w-12 h-8 text-center text-xs px-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleIncrement(index)}
                      aria-label="Increase quantity"
                    >
                      <IconPlus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add All to Cart Button */}
      <div className="flex justify-end">
        <AddAllToCartButton
          productIds={products.map((p) => p.id)}
          productVariantIds={productVariantIds}
          quantities={quantities}
          setName={setName}
          user={user}
        />
      </div>
    </div>
  )
}
