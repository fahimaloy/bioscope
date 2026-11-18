'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ORDER_STATUS_LABELS } from '@/lib/order-status'
import { formatDate } from '@/lib/utils'

interface InvoiceOrder {
  id: string
  orderNumber: string
  status: string
  createdAt: string
  currency: string
  subtotal: string
  taxAmount: string
  deliveryCharge: string
  discountAmount: string
  total: string
  paymentMethod: string
  paymentStatus: string
  transactionId?: string | null
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingDivision: string
  shippingPostalCode?: string | null
  items: Array<{
    id: string
    productName: string
    width: number
    height: number
    quantity: number
    unitPrice: string
    totalPrice: string
    customization?: unknown
  }>
  user?: { name: string | null; email: string; phone: string | null } | null
}

export default function AdminOrderInvoicePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<InvoiceOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load order')
        setOrder(json.data.order)
      })
      .catch((e) => setError(e.message))
  }, [params.id])

  if (error) {
    return (
      <div className="pt-24 pb-12 text-center">
        <p className="text-error">{error}</p>
        <Button className="mt-4" onClick={() => router.back()}>Back</Button>
      </div>
    )
  }
  if (!order) return <div className="pt-24 pb-12 text-center text-[var(--text-subtle)]">Loading invoice…</div>

  const statusLabel = ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      {/* Print rules: show only the invoice sheet */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .invoice-print, .invoice-print * { visibility: visible !important; }
        .invoice-print { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
        .no-print { display: none !important; }
      }`}</style>

      <div className="no-print max-w-3xl mx-auto mb-4 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.back()}>← Back to orders</Button>
        <Button onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>

      <div className="invoice-print max-w-3xl mx-auto bg-white text-black p-8 shadow-lg border border-gray-200" style={{ fontFamily: 'Georgia, serif' }}>
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">BIOSCOPE</h1>
            <p className="text-sm text-gray-600">Custom Stickers & Print</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-lg font-bold">INVOICE</p>
            <p>#{order.orderNumber}</p>
            <p>{formatDate(order.createdAt)}</p>
            <p className="mt-1 inline-block border border-gray-400 rounded px-2 py-0.5 text-xs uppercase">{statusLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm mb-6">
          <div>
            <p className="font-bold uppercase text-xs text-gray-500 mb-1">Bill to</p>
            <p className="font-semibold">{order.user?.name ?? order.shippingName}</p>
            {order.user?.email && <p>{order.user.email}</p>}
            {(order.user?.phone ?? order.shippingPhone) && <p>{order.user?.phone ?? order.shippingPhone}</p>}
          </div>
          <div>
            <p className="font-bold uppercase text-xs text-gray-500 mb-1">Ship to</p>
            <p className="font-semibold">{order.shippingName}</p>
            <p>{order.shippingAddress}</p>
            <p>{order.shippingCity}, {order.shippingDistrict}, {order.shippingDivision}{order.shippingPostalCode ? ` - ${order.shippingPostalCode}` : ''}</p>
            <p>{order.shippingPhone}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.width}×{item.height} cm</p>
                </td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">৳{Number(item.unitPrice).toFixed(2)}</td>
                <td className="py-2 text-right">৳{Number(item.totalPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <table className="text-sm w-64">
            <tbody>
              <tr><td className="py-1 text-gray-600">Subtotal</td><td className="py-1 text-right">৳{Number(order.subtotal).toFixed(2)}</td></tr>
              <tr><td className="py-1 text-gray-600">Tax</td><td className="py-1 text-right">৳{Number(order.taxAmount).toFixed(2)}</td></tr>
              <tr><td className="py-1 text-gray-600">Delivery</td><td className="py-1 text-right">৳{Number(order.deliveryCharge).toFixed(2)}</td></tr>
              {Number(order.discountAmount) > 0 && <tr><td className="py-1 text-gray-600">Discount</td><td className="py-1 text-right">-৳{Number(order.discountAmount).toFixed(2)}</td></tr>}
              <tr className="border-t-2 border-gray-800"><td className="py-2 font-bold">Total</td><td className="py-2 text-right font-bold">৳{Number(order.total).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Payment: {order.paymentMethod} · {order.paymentStatus}{order.transactionId ? ` · TXN ${order.transactionId}` : ''}
        </p>
        <p className="mt-2 text-xs text-gray-400">Thank you for shopping with BIOSCOPE. This is a computer-generated invoice.</p>
      </div>
    </div>
  )
}
