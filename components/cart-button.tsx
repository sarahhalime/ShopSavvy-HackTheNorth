"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { CartSheet } from "./cart-sheet"

export function CartButton() {
  const { getTotalItems, setIsOpen } = useCartStore()
  const totalItems = getTotalItems()

  return (
    <CartSheet>
      <Button variant="outline" size="sm" className="relative bg-transparent" onClick={() => setIsOpen(true)}>
        <ShoppingCart className="w-4 h-4" />
        {totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </Badge>
        )}
      </Button>
    </CartSheet>
  )
}
