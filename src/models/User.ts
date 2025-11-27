import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  picture?: string;
  role: 'admin' | 'customer' | 'none';
  googleId?: string;
  theme: 'light' | 'dark';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    picture: {
      type: String
    },
    role: {
      type: String,
      enum: ['admin', 'customer', 'none'],
      default: 'customer'
    },
    googleId: {
      type: String
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  {
    timestamps: true
  }
);

// email already has unique: true which creates an index
// googleId index with sparse option (skips documents without googleId)
userSchema.index({ googleId: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', userSchema);

