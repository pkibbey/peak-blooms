"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IconSearch } from "@/components/ui/icons"
import type { ProductModel } from "@/generated/models"
import NavSearch from "./NavSearch"

export default function SearchDialog({ featuredProducts }: { featuredProducts: ProductModel[] }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="icon" variant="ghost" aria-label="Search products">
            <IconSearch aria-hidden="true" />
          </Button>
        }
      ></DialogTrigger>

      <DialogContent className="max-w-lg flex flex-col gap-8 p-8 w-[calc(100%_-2rem)] top-28 bg-primary-foreground/95">
        <DialogHeader>
          <DialogTitle className="font-serif heading-3">Search products</DialogTitle>
          <DialogDescription>Find products by name or keyword</DialogDescription>
        </DialogHeader>

        <NavSearch featuredProducts={featuredProducts} />
      </DialogContent>
    </Dialog>
  )
}
