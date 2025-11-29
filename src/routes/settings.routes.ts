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

const floatingElementSchema = z.object({
  type: z.enum(['icon', 'image']),
  icon: z.enum(['heart', 'star', 'sparkles']).optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  position: z.enum(['top-right', 'bottom-right', 'middle-left']),
  isActive: z.boolean().default(true)
});

// Public routes
router.get('/', async (req: Request, res: Response) => {
  try {
    const settingsService = container.resolve<SettingsService>('SettingsService');
    
    const settings = await settingsService.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    res.status(500).json({
      error: 'Failed to fetch settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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

// Floating Elements
router.put('/floating-elements', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const { elements } = z.object({
    elements: z.array(floatingElementSchema)
  }).parse(req.body);
  
  const settings = await settingsService.updateFloatingElements(elements);
  res.json(settings);
});

router.put('/floating-elements/:id', requireAdmin, async (req: Request, res: Response) => {
  const settingsService = container.resolve<SettingsService>('SettingsService');
  
  const element = floatingElementSchema.partial().parse(req.body);
  const settings = await settingsService.updateFloatingElement(req.params.id, element);
  
  if (!settings) {
    res.status(404).json({ error: 'Floating element not found' });
    return;
  }
  
  res.json(settings);
});

// Website Theme
router.put('/website-theme', requireAdmin, async (req: Request, res: Response) => {
  try {
    const settingsService = container.resolve<SettingsService>('SettingsService');
    
    const { theme } = z.object({
      theme: z.enum(['floral', 'summer', 'winter', 'monsoon', 'classy', 'monochrome'])
    }).parse(req.body);
    
    console.log('Updating website theme to:', theme);
    const settings = await settingsService.updateWebsiteTheme(theme);
    console.log('Website theme updated successfully');
    res.json(settings);
  } catch (error) {
    console.error('Failed to update website theme:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid theme value',
        details: error.errors 
      });
      return;
    }
    
    res.status(500).json({
      error: 'Failed to update website theme',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as settingsRoutes };

