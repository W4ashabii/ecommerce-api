import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  parent?: Types.ObjectId;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
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
      trim: true
    },
    image: {
      type: String
    },
    imagePublicId: {
      type: String
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// slug already has unique: true which creates an index
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });

// Generate slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);

