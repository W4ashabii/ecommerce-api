import { injectable } from 'tsyringe';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config/index.js';

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  resourceType: string;
}

@injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret
    });
  }

  async uploadImage(
    file: string,
    folder: string = 'ecommerce/products'
  ): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });

    return this.formatResult(result);
  }

  async uploadImages(
    files: string[],
    folder: string = 'ecommerce/products'
  ): Promise<UploadResult[]> {
    const uploads = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploads);
  }

  async upload3DModel(
    file: string,
    folder: string = 'ecommerce/models'
  ): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'raw',
      use_filename: true,
      unique_filename: true
    });

    return this.formatResult(result);
  }

  async uploadHeroImage(
    file: string,
    folder: string = 'ecommerce/hero'
  ): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1080, crop: 'fill' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });

    return this.formatResult(result);
  }

  async uploadBannerImage(
    file: string,
    folder: string = 'ecommerce/banners'
  ): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 400, crop: 'fill' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });

    return this.formatResult(result);
  }

  async uploadCategoryImage(
    file: string,
    folder: string = 'ecommerce/categories'
  ): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 600, height: 600, crop: 'fill' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });

    return this.formatResult(result);
  }

  async deleteFile(publicId: string, resourceType: string = 'image'): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType as 'image' | 'video' | 'raw'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
      return false;
    }
  }

  async deleteFiles(publicIds: string[], resourceType: string = 'image'): Promise<void> {
    const deletions = publicIds.map(id => this.deleteFile(id, resourceType));
    await Promise.all(deletions);
  }

  private formatResult(result: UploadApiResponse): UploadResult {
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type
    };
  }
}



