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

// Upload 3D model
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

