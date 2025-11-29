import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IColorVariant {
  name: string;
  hex: string;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  category: Types.ObjectId;
  images: string[]; // Product images (not per color variant)
  colorVariants: IColorVariant[];
  sizes: string[];
  featured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const colorVariantSchema = new Schema<IColorVariant>(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
    stock: { type: Number, default: 0, min: 0 }
  },
  { _id: true }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    images: [{
      type: String
    }],
    colorVariants: [colorVariantSchema],
    sizes: [{
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size']
    }],
    featured: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// slug already has unique: true which creates an index
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Generate slug from name before saving
productSchema.pre('save', function(next) {
  const doc = this as IProduct;
  if (doc.isModified('name') && !doc.slug) {
    doc.slug = doc.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema);

