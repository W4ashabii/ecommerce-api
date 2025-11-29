import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { z } from 'zod';
import { OrderService } from '../services/order.service.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router: Router = Router();

const shippingAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().default('Kathmandu Valley'),
  state: z.string().default('Bagmati'),
  postalCode: z.string().optional(),
  country: z.string().min(1).default('Nepal')
});

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    size: z.string().optional(),
    color: z.string().optional()
  })).min(1),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string().optional()
});

// Public routes
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  // Clean up undefined values from shipping address before validation
  if (req.body.shippingAddress) {
    if (req.body.shippingAddress.city === undefined) delete req.body.shippingAddress.city;
    if (req.body.shippingAddress.state === undefined) delete req.body.shippingAddress.state;
    if (req.body.shippingAddress.postalCode === undefined) delete req.body.shippingAddress.postalCode;
  }
  
  const data = createOrderSchema.parse(req.body);
  
  const order = await orderService.create({
    ...data,
    userId: req.user?.userId,
    guestEmail: req.user ? undefined : data.shippingAddress.email
  });
  
  res.status(201).json(order);
});

router.get('/track/:orderNumber', async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const order = await orderService.findByOrderNumber(req.params.orderNumber);
  
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  
  // Return limited info for public tracking
  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt
  });
});

// Authenticated user routes
router.get('/my-orders', authenticate, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await orderService.findByUser(req.user!.userId, page, limit);
  res.json(result);
});

// Admin routes
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const filters = {
    status: req.query.status as string,
    paymentStatus: req.query.paymentStatus as string,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
  };
  
  const result = await orderService.findAll(filters, page, limit);
  res.json(result);
});

router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const stats = await orderService.getStats();
  res.json(stats);
});

router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const order = await orderService.findById(req.params.id);
  
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  
  res.json(order);
});

router.patch('/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const { status } = z.object({
    status: z.enum(['pending', 'processing', 'delivered', 'cancelled'])
  }).parse(req.body);
  
  const order = await orderService.updateStatus(req.params.id, status);
  
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  
  res.json(order);
});

router.patch('/:id/payment-status', requireAdmin, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const { paymentStatus, paymentId } = z.object({
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
    paymentId: z.string().optional()
  }).parse(req.body);
  
  const order = await orderService.updatePaymentStatus(req.params.id, paymentStatus, paymentId);
  
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  
  res.json(order);
});

router.patch('/:id/tracking', requireAdmin, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const { trackingNumber } = z.object({
    trackingNumber: z.string().min(1)
  }).parse(req.body);
  
  const order = await orderService.addTrackingNumber(req.params.id, trackingNumber);
  
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  
  res.json(order);
});

router.patch('/:id/notes', requireAdmin, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const { notes } = z.object({
    notes: z.string()
  }).parse(req.body);
  
  const order = await orderService.addNote(req.params.id, notes);
  
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  
  res.json(order);
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const orderService = container.resolve<OrderService>('OrderService');
  
  const deleted = await orderService.delete(req.params.id);
  
  if (!deleted) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  
  res.json({ success: true, message: 'Order deleted successfully' });
});

export { router as orderRoutes };

