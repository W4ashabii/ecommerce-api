import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { z } from 'zod';
import { SettingsService } from '../services/settings.service.js';
import { requireAdmin } from '../middleware/auth.js';

const router: Router = Router();

const heroSlideSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  image: z.string().min(1),
  imagePublicId: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
});

const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  image: z.string().min(1),
  imagePublicId: z.string().optional(),
  position: z.enum(['top', 'middle', 'bottom']).default('middle'),
  isActive: z.boolean().default(true)
});

// Public routes
router.get('/', async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const settings = await settingsService.getSettings();
  res.json(settings);
});

// Admin routes
router.put('/', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const settings = await settingsService.updateSettings(req.body);
  res.json(settings);
});

// Hero Slides
router.post('/hero-slides', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const slide = heroSlideSchema.parse(req.body);
  const settings = await settingsService.addHeroSlide(slide);
  
  res.status(201).json(settings);
});

router.put('/hero-slides/:id', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const slide = heroSlideSchema.partial().parse(req.body);
  const settings = await settingsService.updateHeroSlide(req.params.id, slide);
  
  if (!settings) {
    res.status(404).json({ error: 'Hero slide not found' });
    return;
  }
  
  res.json(settings);
});

router.delete('/hero-slides/:id', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const settings = await settingsService.removeHeroSlide(req.params.id);
  
  if (!settings) {
    res.status(404).json({ error: 'Hero slide not found' });
    return;
  }
  
  res.json(settings);
});

router.post('/hero-slides/reorder', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const { orderedIds } = z.object({
    orderedIds: z.array(z.string())
  }).parse(req.body);
  
  const settings = await settingsService.reorderHeroSlides(orderedIds);
  res.json(settings);
});

// Banners
router.post('/banners', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const banner = bannerSchema.parse(req.body);
  const settings = await settingsService.addBanner(banner);
  
  res.status(201).json(settings);
});

router.put('/banners/:id', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const banner = bannerSchema.partial().parse(req.body);
  const settings = await settingsService.updateBanner(req.params.id, banner);
  
  if (!settings) {
    res.status(404).json({ error: 'Banner not found' });
    return;
  }
  
  res.json(settings);
});

router.delete('/banners/:id', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const settings = await settingsService.removeBanner(req.params.id);
  
  if (!settings) {
    res.status(404).json({ error: 'Banner not found' });
    return;
  }
  
  res.json(settings);
});

// Featured Products
router.put('/featured-products', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const { productIds } = z.object({
    productIds: z.array(z.string())
  }).parse(req.body);
  
  const settings = await settingsService.setFeaturedProducts(productIds);
  res.json(settings);
});

// Announcement Bar
router.put('/announcement', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const announcement = z.object({
    text: z.string().min(1),
    link: z.string().optional(),
    isActive: z.boolean()
  }).parse(req.body);
  
  const settings = await settingsService.updateAnnouncementBar(announcement);
  res.json(settings);
});

// Social Links
router.put('/social-links', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const settings = await settingsService.updateSocialLinks(req.body);
  res.json(settings);
});

// Contact Info
router.put('/contact-info', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const settings = await settingsService.updateContactInfo(req.body);
  res.json(settings);
});

// SEO Defaults
router.put('/seo', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const seo = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).parse(req.body);
  
  const settings = await settingsService.updateSeoDefaults(seo);
  res.json(settings);
});

export { router as settingsRoutes };

