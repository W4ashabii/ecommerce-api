import { injectable } from 'tsyringe';
import { Product, IProduct, IColorVariant } from '../models/Product.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { Types, FilterQuery } from 'mongoose';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  featured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  colorVariants?: IColorVariant[];
  sizes?: string[];
  modelUrl?: string;
  modelPublicId?: string;
  featured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  tags?: string[];
}

@injectable()
export class ProductService {
  async findAll(filters: ProductFilters = {}, page = 1, limit = 20): Promise<{
    products: IProduct[];
    total: number;
    pages: number;
    currentPage: number;
  }> {
    const query: FilterQuery<IProduct> = {};

    if (filters.category) {
      query.category = new Types.ObjectId(filters.category);
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    if (filters.sizes && filters.sizes.length > 0) {
      query.sizes = { $in: filters.sizes };
    }

    if (filters.colors && filters.colors.length > 0) {
      query['colorVariants.name'] = { $in: filters.colors };
    }

    if (filters.featured !== undefined) query.featured = filters.featured;
    if (filters.isNewArrival !== undefined) query.isNewArrival = filters.isNewArrival;
    if (filters.isBestSeller !== undefined) query.isBestSeller = filters.isBestSeller;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).populate('category', 'name slug');
  }

  async findBySlug(slug: string): Promise<IProduct | null> {
    return Product.findOne({ slug }).populate('category', 'name slug');
  }

  async findFeatured(limit = 8): Promise<IProduct[]> {
    return Product.find({ featured: true, isActive: true })
      .populate('category', 'name slug')
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async findNew(limit = 8): Promise<IProduct[]> {
    return Product.find({ isNewArrival: true, isActive: true })
      .populate('category', 'name slug')
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async findBestSellers(limit = 8): Promise<IProduct[]> {
    return Product.find({ isBestSeller: true, isActive: true })
      .populate('category', 'name slug')
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async findByCategory(categoryId: string, page = 1, limit = 20): Promise<{
    products: IProduct[];
    total: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find({ category: categoryId, isActive: true })
        .populate('category', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments({ category: categoryId, isActive: true })
    ]);

    return {
      products,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  async create(input: ProductInput): Promise<IProduct> {
    const slug = input.slug || this.generateSlug(input.name);
    
    const product = new Product({
      ...input,
      slug,
      category: new Types.ObjectId(input.category)
    });

    await product.save();
    return product.populate('category', 'name slug');
  }

  async update(id: string, input: Partial<ProductInput>): Promise<IProduct | null> {
    const updateData: Record<string, unknown> = { ...input };
    
    if (input.category) {
      updateData.category = new Types.ObjectId(input.category);
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    return product;
  }

  async delete(id: string): Promise<boolean> {
    const product = await Product.findById(id);
    
    if (!product) {
      return false;
    }

    // Delete model from Cloudinary if exists
    if (product.modelPublicId) {
      try {
        await deleteFromCloudinary(product.modelPublicId);
      } catch (error) {
        console.error('Failed to delete model from Cloudinary:', error);
      }
    }

    // Delete color variant images from Cloudinary
    for (const variant of product.colorVariants) {
      for (const image of variant.images) {
        // Extract public ID from URL if stored
        // This assumes images are stored with their public IDs
      }
    }

    await Product.findByIdAndDelete(id);
    return true;
  }

  async addColorVariant(productId: string, variant: IColorVariant): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      productId,
      { $push: { colorVariants: variant } },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');
  }

  async updateColorVariant(
    productId: string, 
    variantId: string, 
    variant: Partial<IColorVariant>
  ): Promise<IProduct | null> {
    const updateFields: Record<string, unknown> = {};
    
    Object.entries(variant).forEach(([key, value]) => {
      updateFields[`colorVariants.$.${key}`] = value;
    });

    return Product.findOneAndUpdate(
      { _id: productId, 'colorVariants._id': variantId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');
  }

  async removeColorVariant(productId: string, variantId: string): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      productId,
      { $pull: { colorVariants: { _id: variantId } } },
      { new: true }
    ).populate('category', 'name slug');
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  }
}

