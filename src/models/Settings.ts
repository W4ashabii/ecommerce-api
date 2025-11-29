import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IHeroSlide {
  _id?: Types.ObjectId;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  image: string;
  imagePublicId?: string;
  isActive: boolean;
  order: number;
}

export interface IBanner {
  _id?: Types.ObjectId;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  image: string;
  imagePublicId?: string;
  position: 'top' | 'middle' | 'bottom';
  isActive: boolean;
}

export interface ITeamMember {
  _id?: Types.ObjectId;
  name: string;
  role: string;
  image?: string;
  imagePublicId?: string;
}

export interface IAboutPage {
  title: string;
  subtitle?: string;
  heroImage?: string;
  heroImagePublicId?: string;
  story: {
    title: string;
    content: string;
  };
  mission: {
    title: string;
    content: string;
  };
  values: {
    title: string;
    items: string[];
  };
  team: {
    title: string;
    subtitle?: string;
    members: ITeamMember[];
  };
}

export interface ICollectionsPage {
  title: string;
  subtitle?: string;
  heroImage?: string;
  heroImagePublicId?: string;
  featuredCollectionIds: string[];
}

export interface ISettings extends Document {
  key: string;
  heroSlides: IHeroSlide[];
  banners: IBanner[];
  featuredProductIds: string[];
  announcementBar?: {
    text: string;
    link?: string;
    isActive: boolean;
  };
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    pinterest?: string;
    tiktok?: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  seoDefaults: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  aboutPage: IAboutPage;
  collectionsPage: ICollectionsPage;
  featuredCollection: {
    label: string;
    title: string;
    titleHighlight: string;
    description: string;
    buttonText: string;
    collectionId: string;
    isActive: boolean;
  };
  websiteTheme: 'floral' | 'summer' | 'winter' | 'monsoon' | 'classy' | 'monochrome';
  createdAt: Date;
  updatedAt: Date;
}

const heroSlideSchema = new Schema<IHeroSlide>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    buttonText: { type: String },
    buttonLink: { type: String },
    image: { type: String, required: true },
    imagePublicId: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  { _id: true }
);

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    buttonText: { type: String },
    buttonLink: { type: String },
    image: { type: String, required: true },
    imagePublicId: { type: String },
    position: { 
      type: String, 
      enum: ['top', 'middle', 'bottom'], 
      default: 'middle' 
    },
    isActive: { type: Boolean, default: true }
  },
  { _id: true }
);

const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    image: { type: String },
    imagePublicId: { type: String }
  },
  { _id: true }
);

const settingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'main'
    },
    heroSlides: [heroSlideSchema],
    banners: [bannerSchema],
    featuredProductIds: [{
      type: String
    }],
    announcementBar: {
      text: { type: String },
      link: { type: String },
      isActive: { type: Boolean, default: false }
    },
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
      twitter: { type: String },
      pinterest: { type: String },
      tiktok: { type: String }
    },
    contactInfo: {
      email: { type: String },
      phone: { type: String },
      address: { type: String }
    },
    seoDefaults: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }]
    },
    aboutPage: {
      title: { type: String, default: 'About Us' },
      subtitle: { type: String, default: 'Our Story' },
      heroImage: { type: String },
      heroImagePublicId: { type: String },
      story: {
        title: { type: String, default: 'Our Story' },
        content: { type: String, default: 'Welcome to AMI, where fashion meets elegance.' }
      },
      mission: {
        title: { type: String, default: 'Our Mission' },
        content: { type: String, default: 'To provide high-quality, stylish fashion for the modern woman.' }
      },
      values: {
        title: { type: String, default: 'Our Values' },
        items: [{ type: String }]
      },
      team: {
        title: { type: String, default: 'Meet Our Team' },
        subtitle: { type: String },
        members: [teamMemberSchema]
      }
    },
    collectionsPage: {
      title: { type: String, default: 'Collections' },
      subtitle: { type: String, default: 'Explore our curated collections' },
      heroImage: { type: String },
      heroImagePublicId: { type: String },
      featuredCollectionIds: [{ type: String }]
    },
    featuredCollection: {
      label: { type: String, default: 'Featured Collection' },
      title: { type: String, default: 'Summer' },
      titleHighlight: { type: String, default: 'Essentials' },
      description: { type: String, default: 'Embrace the season with our curated selection of lightweight fabrics and vibrant designs perfect for warm days.' },
      buttonText: { type: String, default: 'Explore Collection' },
      collectionId: { type: String },
      isActive: { type: Boolean, default: true }
    },
    websiteTheme: {
      type: String,
      enum: ['floral', 'summer', 'winter', 'monsoon', 'classy', 'monochrome'],
      default: 'floral'
    }
  },
  {
    timestamps: true
  }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

