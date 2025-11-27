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
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1)
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
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
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

export { router as orderRoutes };

