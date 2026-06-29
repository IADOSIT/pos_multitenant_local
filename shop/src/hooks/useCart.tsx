'use client'
import { createContext, useContext, useState, useCallback } from 'react'

export interface CartItem {
  productoId: number
  nombre: string
  precio: number
  precioMayor: number | null
  qtyMinMayor: number | null
  qty: number
  stock: number
  imagen: string
  sku: string
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  removeItem: (productoId: number) => void
  updateQty: (productoId: number, qty: number) => void
  clearCart: () => void
  calcularTotal: (qtyMinMayoreoGlobal: number, modoMayoreo: boolean) => { subtotal: number; esMayoreo: boolean }
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productoId === item.productoId)
      if (existing) return prev.map(i => i.productoId === item.productoId ? { ...i, qty: Math.min(i.qty + qty, i.stock || 999) } : i)
      return [...prev, { ...item, qty }]
    })
  }, [])

  const removeItem = useCallback((productoId: number) => {
    setItems(prev => prev.filter(i => i.productoId !== productoId))
  }, [])

  const updateQty = useCallback((productoId: number, qty: number) => {
    if (qty <= 0) { removeItem(productoId); return }
    setItems(prev => prev.map(i => i.productoId === productoId ? { ...i, qty: Math.min(qty, i.stock || 999) } : i))
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const calcularTotal = useCallback((qtyMinMayoreoGlobal: number, modoMayoreo: boolean) => {
    let subtotal = 0
    let esMayoreo = false
    for (const item of items) {
      const qtyMin = item.qtyMinMayor ?? qtyMinMayoreoGlobal
      const aplicaMayor = modoMayoreo && item.precioMayor != null && item.qty >= qtyMin
      if (aplicaMayor) esMayoreo = true
      subtotal += (aplicaMayor ? item.precioMayor! : item.precio) * item.qty
    }
    return { subtotal, esMayoreo }
  }, [items])

  return <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, calcularTotal }}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
