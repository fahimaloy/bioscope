import { AppError, handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { getOrderById } from '@/lib/actions/order'
import { ORDER_STATUS_LABELS } from '@/lib/order-status'
import { sendMail, escapeHtml } from '@/lib/email'
import { isEmailConfigured } from '@/lib/server/email-config'

export const dynamic = 'force-dynamic'

// Admin: send the customer an order status/receipt email
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    if (!(await isEmailConfigured())) {
      throw new AppError(501, 'Email is not configured on this server (no SMTP host in settings or environment).', 'EMAIL_NOT_CONFIGURED')
    }

    const order = await getOrderById(params.id)
    if (!order.user?.email) throw new AppError(400, 'Order has no customer email', 'NO_RECIPIENT')

    const statusLabel = ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status
    const rows = order.items
      .map(
        (item: { productName: string; width: number; height: number; quantity: number; totalPrice: { toString(): string } }) => `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.productName)}<br><small>${item.width}×${item.height} cm · Qty ${item.quantity}</small></td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">৳${Number(item.totalPrice).toFixed(2)}</td>
        </tr>`
      )
      .join('')

    const html = `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h1 style="color:#0f766e;font-size:24px">BIOSCOPE</h1>
      <p>Hi ${escapeHtml(order.user.name ?? 'there')},</p>
      <p>Your order <strong>${escapeHtml(order.orderNumber)}</strong> is currently <strong>${escapeHtml(statusLabel)}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
      <p style="text-align:right;font-size:18px"><strong>Total: ৳${Number(order.total).toFixed(2)}</strong> (${escapeHtml(order.paymentMethod)} · ${escapeHtml(order.paymentStatus)})</p>
      <p style="font-size:13px;color:#666">Delivery to: ${escapeHtml(order.shippingName)}, ${escapeHtml(order.shippingAddress)}, ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingDistrict)}</p>
      <p style="font-size:13px;color:#666">Questions? Reply to this email or contact us. Thank you for shopping with BIOSCOPE.</p>
    </div>`

    await sendMail({ to: order.user.email, subject: `BIOSCOPE · Order ${order.orderNumber} — ${statusLabel}`, html })
    return ok({ sent: true, to: order.user.email })
  } catch (error) {
    return handleRouteError(error)
  }
}
