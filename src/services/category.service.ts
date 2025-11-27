import { injectable } from 'tsyringe';
import { Category, ICategory } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { Types } from 'mongoose';

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  parent?: string;
  isActive?: boolean;
  order?: number;
}

@injectable()
export class CategoryService {
  async findAll(includeInactive = false): Promise<ICategory[]> {
    const query = includeInactive ? {} : { isActive: true };
    return Category.find(query)
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 });
  }

  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id).populate('parent', 'name slug');
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug }).populate('parent', 'name slug');
  }

  async findRootCategories(): Promise<ICategory[]> {
    return Category.find({ parent: { $exists: false }, isActive: true })
      .sort({ order: 1, name: 1 });
  }

  async findSubcategories(parentId: string): Promise<ICategory[]> {
    return Category.find({ parent: parentId, isActive: true })
      .sort({ order: 1, name: 1 });
  }

  async create(input: CategoryInput): Promise<ICategory> {
    const slug = input.slug || this.generateSlug(input.name);
    
    const categoryData: Record<string, unknown> = {
      ...input,
      slug
    };

    if (input.parent) {
      categoryData.parent = new Types.ObjectId(input.parent);
    }

    const category = new Category(categoryData);
    await category.save();
    
    return category.populate('parent', 'name slug');
  }

  async update(id: string, input: Partial<CategoryInput>): Promise<ICategory | null> {
    const updateData: Record<string, unknown> = { ...input };
    
    if (input.parent) {
      updateData.parent = new Types.ObjectId(input.parent);
    } else if (input.parent === null) {
      updateData.$unset = { parent: 1 };
      delete updateData.parent;
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    return category;
  }

  async delete(id: string): Promise<boolean> {
    const category = await Category.findById(id);
    
    if (!category) {
      return false;
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw new Error('Cannot delete category with associated products');
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parent: id });
    if (subcategoryCount > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Delete image from Cloudinary if exists
    if (category.imagePublicId) {
      try {
        await deleteFromCloudinary(category.imagePublicId);
      } catch (error) {
        console.error('Failed to delete image from Cloudinary:', error);
      }
    }

    await Category.findByIdAndDelete(id);
    return true;
  }

  async getProductCount(categoryId: string): Promise<number> {
    return Product.countDocuments({ category: categoryId });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } }
      }
    }));

    await Category.bulkWrite(updates);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

