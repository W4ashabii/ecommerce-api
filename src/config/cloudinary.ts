import { v2 as cloudinary } from 'cloudinary';
import { config } from './index.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

export { cloudinary };

export const uploadToCloudinary = async (
  file: string,
  folder: string = 'ecommerce'
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'auto'
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id
  };
};

export const uploadModelToCloudinary = async (
  file: string,
  folder: string = 'ecommerce/models'
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'raw'
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id
  };
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};


