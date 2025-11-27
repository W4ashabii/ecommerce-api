import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { z } from 'zod';
import { ProductService } from '../services/product.service.js';
import { requireAdmin } from '../middleware/auth.js';

const router: Router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().min(1),
  price: z.number().positive(),
  salePrice: z.number().positive().optional(),
  category: z.string().min(1),
  colorVariants: z.array(z.object({
    name: z.string(),
    hex: z.string(),
    images: z.array(z.string()),
    stock: z.number().min(0)
  })).optional(),
  sizes: z.array(z.string()).optional(),
  modelUrl: z.string().optional(),
  modelPublicId: z.string().optional(),
  featured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

const colorVariantSchema = z.object({
  name: z.string().min(1),
  hex: z.string().min(1),
  images: z.array(z.string()),
  stock: z.number().min(0)
});

// Public routes
router.get('/', async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const filters = {
    category: req.query.category as string,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    sizes: req.query.sizes ? (req.query.sizes as string).split(',') : undefined,
    colors: req.query.colors ? (req.query.colors as string).split(',') : undefined,
    featured: req.query.featured === 'true' ? true : undefined,
    isNewArrival: req.query.isNew === 'true' ? true : undefined,
    isBestSeller: req.query.isBestSeller === 'true' ? true : undefined,
    isActive: req.query.isActive === 'false' ? false : true,
    search: req.query.search as string
  };
  
  const result = await productService.findAll(filters, page, limit);
  res.json(result);
});

router.get('/featured', async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  const limit = parseInt(req.query.limit as string) || 8;
  
  const products = await productService.findFeatured(limit);
  res.json(products);
});

router.get('/new', async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  const limit = parseInt(req.query.limit as string) || 8;
  
  const products = await productService.findNew(limit);
  res.json(products);
});

router.get('/bestsellers', async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  const limit = parseInt(req.query.limit as string) || 8;
  
  const products = await productService.findBestSellers(limit);
  res.json(products);
});

router.get('/category/:categoryId', async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await productService.findByCategory(req.params.categoryId, page, limit);
  res.json(result);
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const product = await productService.findBySlug(req.params.slug);
  
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  
  res.json(product);
});

router.get('/:id', async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const product = await productService.findById(req.params.id);
  
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  
  res.json(product);
});

// Admin routes
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const data = productSchema.parse(req.body);
  const product = await productService.create(data);
  
  res.status(201).json(product);
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const data = productSchema.partial().parse(req.body);
  const product = await productService.update(req.params.id, data);
  
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  
  res.json(product);
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const deleted = await productService.delete(req.params.id);
  
  if (!deleted) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  
  res.status(204).send();
});

// Color variant routes
router.post('/:id/variants', requireAdmin, async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const variant = colorVariantSchema.parse(req.body);
  const product = await productService.addColorVariant(req.params.id, variant);
  
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  
  res.json(product);
});

router.put('/:id/variants/:variantId', requireAdmin, async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const variant = colorVariantSchema.partial().parse(req.body);
  const product = await productService.updateColorVariant(
    req.params.id, 
    req.params.variantId, 
    variant
  );
  
  if (!product) {
    res.status(404).json({ error: 'Product or variant not found' });
    return;
  }
  
  res.json(product);
});

router.delete('/:id/variants/:variantId', requireAdmin, async (req: Request, res: Response) => {
  const productService = container.resolve<ProductService>('ProductService');
  
  const product = await productService.removeColorVariant(
    req.params.id, 
    req.params.variantId
  );
  
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  
  res.json(product);
});

export { router as productRoutes };

