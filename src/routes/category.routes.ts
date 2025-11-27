import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { z } from 'zod';
import { CategoryService } from '../services/category.service.js';
import { requireAdmin } from '../middleware/auth.js';

const router: Router = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  parent: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional()
});

// Public routes
router.get('/', async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  const includeInactive = req.query.includeInactive === 'true';
  
  const categories = await categoryService.findAll(includeInactive);
  res.json(categories);
});

router.get('/root', async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  const categories = await categoryService.findRootCategories();
  res.json(categories);
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  const category = await categoryService.findBySlug(req.params.slug);
  
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  
  res.json(category);
});

router.get('/:id', async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  const category = await categoryService.findById(req.params.id);
  
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  
  res.json(category);
});

router.get('/:id/subcategories', async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  const subcategories = await categoryService.findSubcategories(req.params.id);
  res.json(subcategories);
});

router.get('/:id/product-count', async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  const count = await categoryService.getProductCount(req.params.id);
  res.json({ count });
});

// Admin routes
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  const data = categorySchema.parse(req.body);
  const category = await categoryService.create(data);
  
  res.status(201).json(category);
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  const data = categorySchema.partial().parse(req.body);
  const category = await categoryService.update(req.params.id, data);
  
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  
  res.json(category);
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  try {
    const deleted = await categoryService.delete(req.params.id);
    
    if (!deleted) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.post('/reorder', requireAdmin, async (req: Request, res: Response) => {
  const categoryService = container.resolve<CategoryService>('CategoryService');
  
  const { orderedIds } = z.object({
    orderedIds: z.array(z.string())
  }).parse(req.body);
  
  await categoryService.reorder(orderedIds);
  res.json({ success: true });
});

export { router as categoryRoutes };

