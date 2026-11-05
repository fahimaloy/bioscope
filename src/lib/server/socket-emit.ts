// Server-only bridge that lets Next.js route handlers / server actions emit
// socket.io events through the standalone socket server over HTTP.
// Never import this from client components.

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001'
const EMIT_SECRET = () => process.env.SOCKET_EMIT_SECRET || process.env.NEXTAUTH_SECRET || ''

type EmitTarget = { userId?: string; room?: string }

async function emit(event: string, target: EmitTarget, data: unknown): Promise<void> {
  try {
    const res = await fetch(`${SOCKET_SERVER_URL}/emit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-emit-secret': EMIT_SECRET() },
      body: JSON.stringify({ event, target, data }),
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    if (!res.ok) console.error(`[socket-emit] ${event} -> HTTP ${res.status}`)
  } catch (err) {
    // Realtime notifications must never break the mutation that triggered them.
    console.error(`[socket-emit] failed to emit ${event}:`, err)
  }
}

export const emitToUser = (userId: string, event: string, data: unknown) => emit(event, { userId }, data)
export const emitToAdmins = (event: string, data: unknown) => emit(event, { room: 'admins' }, data)
export const emitToOrder = (orderId: string, event: string, data: unknown) => emit(event, { room: `order:${orderId}` }, data)

export const emitNewOrder = (order: any) =>
  emitToAdmins('order:created', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.shippingName,
    total: order.total,
    itemCount: order.items?.length ?? 0,
    createdAt: order.createdAt,
  })

export const emitOrderStatusChange = (order: any, oldStatus: string, newStatus: string) => {
  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    oldStatus,
    newStatus,
    statusLabel: newStatus,
    customerName: order.shippingName,
    updatedAt: new Date().toISOString(),
  }
  return Promise.all([
    emitToUser(order.userId, 'order:status_changed', payload),
    emitToAdmins('order:status_changed', payload),
    emitToOrder(order.id, 'order:status_changed', payload),
  ])
}

export const emitCustomRequestSubmitted = (request: any) =>
  emitToAdmins('custom_request:submitted', {
    requestId: request.id,
    customerName: request.user?.name || request.user?.email,
    imageUrl: request.imageUrl,
    dimensions: `${request.width}x${request.height} cm`,
    quantity: request.quantity,
    material: request.material,
    finish: request.finish,
    cutType: request.cutType,
    createdAt: request.createdAt,
  })

export const emitCustomRequestPriced = (request: any) =>
  emitToUser(request.userId, 'custom_request:priced', {
    requestId: request.id,
    quotedPrice: request.quotedPrice,
    adminNotes: request.adminNotes,
    quotedAt: request.quotedAt,
  })

export const emitLowStockAlert = (product: any) =>
  emitToAdmins('product:low_stock', {
    productId: product.id,
    productName: product.name,
    currentStock: product.stock,
    threshold: product.lowStockThreshold,
  })

export const emitNotificationNew = (notification: any) =>
  emitToUser(notification.userId, 'notification:new', notification)
