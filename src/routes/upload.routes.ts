import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { z } from 'zod';
import { UploadService } from '../services/upload.service.js';
import { requireAdmin } from '../middleware/auth.js';

const router: Router = Router();

// All upload routes require admin access
router.use(requireAdmin);

// Upload product image(s)
router.post('/product-image', async (req: Request, res: Response) => {
  const uploadService = container.resolve<UploadService>('UploadService');
  
  const { image } = z.object({
    image: z.string().min(1, 'Image data is required')
  }).parse(req.body);
  
  const result = await uploadService.uploadImage(image, 'ecommerce/products');
  res.json(result);
});

router.post('/product-images', async (req: Request, res: Response) => {
  const uploadService = container.resolve<UploadService>('UploadService');
  
  const { images } = z.object({
    images: z.array(z.string()).min(1, 'At least one image is required')
  }).parse(req.body);
  
  const results = await uploadService.uploadImages(images, 'ecommerce/products');
  res.json(results);
});

// Get Cloudinary upload signature for direct upload (bypasses Vercel body size limit)
router.get('/model/signature', async (req: Request, res: Response) => {
  try {
    const { cloudinary } = await import('../config/cloudinary.js');
    const { config } = await import('../config/index.js');
    
    if (!config.cloudinary.apiSecret || !config.cloudinary.apiKey || !config.cloudinary.cloudName) {
      res.status(500).json({ error: 'Cloudinary not configured' });
      return;
    }
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'ecommerce/models';
    
    // Generate signature for raw file upload
    const params = {
      timestamp,
      folder,
      resource_type: 'raw',
    };
    
    const signature = cloudinary.utils.api_sign_request(params, config.cloudinary.apiSecret);
    
    res.json({
      signature,
      timestamp,
      folder,
      cloudName: config.cloudinary.cloudName,
      apiKey: config.cloudinary.apiKey,
    });
  } catch (error) {
    console.error('Failed to generate upload signature:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload signature',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload 3D model (legacy - kept for backward compatibility, but has size limits)
router.post('/model', async (req: Request, res: Response) => {
  const uploadService = container.resolve<UploadService>('UploadService');
  
  const { model } = z.object({
    model: z.string().min(1, 'Model data is required')
  }).parse(req.body);
  
  const result = await uploadService.upload3DModel(model);
  res.json(result);
});

// Upload hero image
router.post('/hero-image', async (req: Request, res: Response) => {
  const uploadService = container.resolve<UploadService>('UploadService');
  
  const { image } = z.object({
    image: z.string().min(1, 'Image data is required')
  }).parse(req.body);
  
  const result = await uploadService.uploadHeroImage(image);
  res.json(result);
});

// Upload banner image
router.post('/banner-image', async (req: Request, res: Response) => {
  const uploadService = container.resolve<UploadService>('UploadService');
  
  const { image } = z.object({
    image: z.string().min(1, 'Image data is required')
  }).parse(req.body);
  
  const result = await uploadService.uploadBannerImage(image);
  res.json(result);
});

// Upload category image
router.post('/category-image', async (req: Request, res: Response) => {
  const uploadService = container.resolve<UploadService>('UploadService');
  
  const { image } = z.object({
    image: z.string().min(1, 'Image data is required')
  }).parse(req.body);
  
  const result = await uploadService.uploadCategoryImage(image);
  res.json(result);
});

// Delete file
router.delete('/', async (req: Request, res: Response) => {
  const uploadService = container.resolve<UploadService>('UploadService');
  
  const { publicId, resourceType } = z.object({
    publicId: z.string().min(1, 'Public ID is required'),
    resourceType: z.enum(['image', 'video', 'raw']).optional()
  }).parse(req.body);
  
  const success = await uploadService.deleteFile(publicId, resourceType);
  
  if (!success) {
    res.status(400).json({ error: 'Failed to delete file' });
    return;
  }
  
  res.json({ success: true });
});

export { router as uploadRoutes };

