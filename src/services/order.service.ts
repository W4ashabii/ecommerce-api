import { injectable } from 'tsyringe';
import { Order, IOrder, IOrderItem, IShippingAddress } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Types, FilterQuery } from 'mongoose';

export interface CreateOrderInput {
  userId?: string;
  guestEmail?: string;
  items: {
    productId: string;
    quantity: number;
    size?: string;
    color?: string;
  }[];
  shippingAddress: IShippingAddress;
  paymentMethod?: string;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  userId?: string;
  guestEmail?: string;
  startDate?: Date;
  endDate?: Date;
}

@injectable()
export class OrderService {
  async findAll(filters: OrderFilters = {}, page = 1, limit = 20): Promise<{
    orders: IOrder[];
    total: number;
    pages: number;
    currentPage: number;
  }> {
    const query: FilterQuery<IOrder> = {};

    if (filters.status) query.status = filters.status;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.userId) query.user = new Types.ObjectId(filters.userId);
    if (filters.guestEmail) query.guestEmail = filters.guestEmail;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'email name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id)
      .populate('user', 'email name')
      .populate('items.product', 'name slug');
  }

  async findByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    return Order.findOne({ orderNumber })
      .populate('user', 'email name')
      .populate('items.product', 'name slug');
  }

  async findByUser(userId: string, page = 1, limit = 10): Promise<{
    orders: IOrder[];
    total: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: userId })
    ]);

    return {
      orders,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  async create(input: CreateOrderInput): Promise<IOrder> {
    // Build order items with product details
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const price = product.salePrice || product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      // Get first image from first color variant or undefined
      const image = product.colorVariants[0]?.images[0];

      orderItems.push({
        product: new Types.ObjectId(item.productId) as any,
        name: product.name,
        price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image
      });
    }

    // Calculate tax and shipping (simplified)
    const tax = subtotal * 0.1; // 10% tax
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shippingCost;

    const order = new Order({
      user: input.userId ? new Types.ObjectId(input.userId) : undefined,
      guestEmail: input.guestEmail,
      items: orderItems,
      shippingAddress: input.shippingAddress,
      subtotal,
      tax,
      shippingCost,
      total,
      paymentMethod: input.paymentMethod
    });

    await order.save();
    return order;
  }

  async updateStatus(id: string, status: IOrder['status']): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
  }

  async updatePaymentStatus(
    id: string, 
    paymentStatus: IOrder['paymentStatus'],
    paymentId?: string
  ): Promise<IOrder | null> {
    const update: Record<string, unknown> = { paymentStatus };
    if (paymentId) update.paymentId = paymentId;

    return Order.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );
  }

  async addTrackingNumber(id: string, trackingNumber: string): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(
      id,
      { $set: { trackingNumber, status: 'shipped' } },
      { new: true, runValidators: true }
    );
  }

  async addNote(id: string, note: string): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(
      id,
      { $set: { notes: note } },
      { new: true }
    );
  }

  async getStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
  }> {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      revenueResult
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    return {
      totalOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders
    };
  }
}



