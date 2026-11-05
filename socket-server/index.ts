import { Server } from 'socket.io'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env from the project root (tsx does not do this automatically)
for (const envPath of [join(process.cwd(), '.env'), join(process.cwd(), 'socket-server', '.env')]) {
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    }
    break
  } catch {
    // try next path
  }
}
console.log('socket-server env loaded:', Boolean(process.env.NEXTAUTH_SECRET), 'emit secret:', Boolean(process.env.SOCKET_EMIT_SECRET || process.env.NEXTAUTH_SECRET))

const prisma = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Store connected clients
const userSockets = new Map<string, Set<string>>() // userId -> Set<socketId>
const adminSockets = new Set<string>() // socketIds of admin users

// HTTP bridge so the Next.js server can emit events into this socket server.
// POST /emit { event, target: { userId? | room? }, data } with header x-emit-secret.
const EMIT_SECRET = process.env.SOCKET_EMIT_SECRET || process.env.NEXTAUTH_SECRET || ''
httpServer.on('request', (req, res) => {
  if (req.method === 'POST' && req.url === '/emit') {
    if (!EMIT_SECRET || req.headers['x-emit-secret'] !== EMIT_SECRET) {
      res.writeHead(401, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'unauthorized' }))
      return
    }
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        const { event, target, data } = JSON.parse(body)
        if (typeof event !== 'string' || !target) throw new Error('bad payload')
        if (target.userId) emitToUser(target.userId, event, data)
        else if (target.room) io.to(target.room).emit(event, data)
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (err) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'bad payload' }))
      }
    })
  } else if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, clients: io.engine.clientsCount }))
  } else {
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: false }))
  }
})

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

    if (!token) {
      return next(new Error('Authentication required'))
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
      id: string
      email: string
      role: string
    }

    socket.data.user = decoded
    next()
  } catch (error) {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  const user = socket.data.user
  console.log(`🔌 Client connected: ${user.email} (${user.role})`)

  // Track user sockets
  if (!userSockets.has(user.id)) {
    userSockets.set(user.id, new Set())
  }
  userSockets.get(user.id)!.add(socket.id)

  // Track admin sockets
  if (user.role === 'ADMIN') {
    adminSockets.add(socket.id)
    socket.join('admins')
  }

  // Join user-specific room
  socket.join(`user:${user.id}`)

  // Join order room if orderId provided
  const orderId = socket.handshake.query.orderId as string
  if (orderId) {
    socket.join(`order:${orderId}`)
  }

  // Handle events
  socket.on('order:subscribe', (orderId: string) => {
    socket.join(`order:${orderId}`)
    console.log(`📦 User ${user.email} subscribed to order ${orderId}`)
  })

  socket.on('order:unsubscribe', (orderId: string) => {
    socket.leave(`order:${orderId}`)
    console.log(`📦 User ${user.email} unsubscribed from order ${orderId}`)
  })

  socket.on('notification:mark_read', async (notificationId: string) => {
    try {
      await prisma.notification.update({
        where: { id: notificationId, userId: user.id },
        data: { isRead: true, readAt: new Date() },
      })
      socket.emit('notification:marked_read', { notificationId })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  })

  socket.on('notification:mark_all_read', async () => {
    try {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      socket.emit('notification:all_marked_read')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  })

  // Disconnect handling
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${user.email} (${reason})`)

    const sockets = userSockets.get(user.id)
    if (sockets) {
      sockets.delete(socket.id)
      if (sockets.size === 0) {
        userSockets.delete(user.id)
      }
    }

    if (user.role === 'ADMIN') {
      adminSockets.delete(socket.id)
    }
  })
})

// Export functions to emit events from API routes
export const emitToUser = (userId: string, event: string, data: any) => {
  const sockets = userSockets.get(userId)
  if (sockets) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, data)
    })
  }
  // Also emit to user room for any connected clients
  io.to(`user:${userId}`).emit(event, data)
}

export const emitToAdmins = (event: string, data: any) => {
  io.to('admins').emit(event, data)
}

export const emitToOrder = (orderId: string, event: string, data: any) => {
  io.to(`order:${orderId}`).emit(event, data)
}

export const emitNewOrder = async (order: any) => {
  // Notify all admins
  emitToAdmins('order:created', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.shippingName,
    total: order.total,
    itemCount: order.items?.length || 0,
    createdAt: order.createdAt,
  })

  // Create notification records for admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'NEW_ORDER',
          title: `New Order: ${order.orderNumber}`,
          message: `New order from ${order.shippingName} for ${order.currency} ${order.total}`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        },
      })
    )
  )
}

export const emitOrderStatusChange = async (order: any, oldStatus: string, newStatus: string) => {
  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    PRINTING: 'Printing',
    READY_TO_SHIP: 'Ready to Ship',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }

  // Notify customer
  emitToUser(order.userId, 'order:status_changed', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    oldStatus,
    newStatus,
    statusLabel: statusLabels[newStatus] || newStatus,
    updatedAt: new Date().toISOString(),
  })

  // Notify admins
  emitToAdmins('order:status_changed', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.shippingName,
    oldStatus,
    newStatus,
    statusLabel: statusLabels[newStatus] || newStatus,
  })

  // Create notification for customer
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: 'ORDER_STATUS_CHANGED',
      title: `Order ${order.orderNumber} Status Updated`,
      message: `Your order status changed from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}`,
      data: { orderId: order.id, orderNumber: order.orderNumber, oldStatus, newStatus },
    },
  })
}

export const emitCustomRequestSubmitted = async (request: any) => {
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

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'CUSTOM_REQUEST',
          title: 'New Custom Sticker Request',
          message: `${request.user?.name || 'A customer'} submitted a custom sticker request`,
          data: { requestId: request.id },
        },
      })
    )
  )
}

export const emitCustomRequestPriced = async (request: any) => {
  emitToUser(request.userId, 'custom_request:priced', {
    requestId: request.id,
    quotedPrice: request.quotedPrice,
    adminNotes: request.adminNotes,
    quotedAt: request.quotedAt,
  })

  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'CUSTOM_REQUEST_PRICED',
      title: 'Custom Request Priced',
      message: `Your custom sticker request has been priced at ${request.currency || 'BDT'} ${request.quotedPrice}`,
      data: { requestId: request.id, quotedPrice: request.quotedPrice },
    },
  })
}

export const emitLowStockAlert = async (product: any) => {
  emitToAdmins('product:low_stock', {
    productId: product.id,
    productName: product.name,
    currentStock: product.stock,
    threshold: product.lowStockThreshold,
  })

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'LOW_STOCK',
          title: `Low Stock: ${product.name}`,
          message: `Only ${product.stock} units remaining (threshold: ${product.lowStockThreshold})`,
          data: { productId: product.id },
        },
      })
    )
  )
}

// Start server
const PORT = parseInt(process.env.SOCKET_SERVER_PORT || '3001', 10)

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  io.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  io.close()
  await prisma.$disconnect()
  process.exit(0)
})

export { io, httpServer }