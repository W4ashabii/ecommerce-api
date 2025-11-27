import { injectable } from 'tsyringe';
import { Settings, ISettings, IHeroSlide, IBanner } from '../models/Settings.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

const SETTINGS_KEY = 'main';

@injectable()
export class SettingsService {
  async getSettings(): Promise<ISettings> {
    let settings = await Settings.findOne({ key: SETTINGS_KEY });
    
    if (!settings) {
      settings = await Settings.create({
        key: SETTINGS_KEY,
        heroSlides: [],
        banners: [],
        featuredProductIds: [],
        socialLinks: {},
        contactInfo: {},
        seoDefaults: {}
      });
    }

    return settings;
  }

  async updateSettings(updates: Partial<ISettings>): Promise<ISettings> {
    const settings = await Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return settings!;
  }

  // Hero Slides
  async addHeroSlide(slide: IHeroSlide): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $push: { heroSlides: slide } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }

  async updateHeroSlide(slideId: string, updates: Partial<IHeroSlide>): Promise<ISettings | null> {
    const updateFields: Record<string, unknown> = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      updateFields[`heroSlides.$.${key}`] = value;
    });

    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY, 'heroSlides._id': slideId },
      { $set: updateFields },
      { new: true }
    );
  }

  async removeHeroSlide(slideId: string): Promise<ISettings | null> {
    const settings = await Settings.findOne({ key: SETTINGS_KEY });
    const slide = settings?.heroSlides.find(s => (s as any)._id?.toString() === slideId);
    
    if (slide?.imagePublicId) {
      try {
        await deleteFromCloudinary(slide.imagePublicId);
      } catch (error) {
        console.error('Failed to delete hero slide image:', error);
      }
    }

    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $pull: { heroSlides: { _id: slideId } } },
      { new: true }
    );
  }

  async reorderHeroSlides(orderedIds: string[]): Promise<ISettings | null> {
    const settings = await Settings.findOne({ key: SETTINGS_KEY });
    
    if (!settings) return null;

    const reorderedSlides = orderedIds
      .map((id, index) => {
        const slide = settings.heroSlides.find(s => (s as any)._id?.toString() === id);
        if (slide) {
          const slideObj = (slide as any).toObject ? (slide as any).toObject() : { ...slide };
          return { ...slideObj, order: index };
        }
        return null;
      })
      .filter(Boolean) as IHeroSlide[];

    settings.heroSlides = reorderedSlides;
    await settings.save();
    
    return settings;
  }

  // Banners
  async addBanner(banner: IBanner): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $push: { banners: banner } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }

  async updateBanner(bannerId: string, updates: Partial<IBanner>): Promise<ISettings | null> {
    const updateFields: Record<string, unknown> = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      updateFields[`banners.$.${key}`] = value;
    });

    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY, 'banners._id': bannerId },
      { $set: updateFields },
      { new: true }
    );
  }

  async removeBanner(bannerId: string): Promise<ISettings | null> {
    const settings = await Settings.findOne({ key: SETTINGS_KEY });
    const banner = settings?.banners.find(b => (b as any)._id?.toString() === bannerId);
    
    if (banner?.imagePublicId) {
      try {
        await deleteFromCloudinary(banner.imagePublicId);
      } catch (error) {
        console.error('Failed to delete banner image:', error);
      }
    }

    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $pull: { banners: { _id: bannerId } } },
      { new: true }
    );
  }

  // Featured Products
  async setFeaturedProducts(productIds: string[]): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { featuredProductIds: productIds } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }

  // Announcement Bar
  async updateAnnouncementBar(announcement: {
    text: string;
    link?: string;
    isActive: boolean;
  }): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { announcementBar: announcement } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }

  // Social Links
  async updateSocialLinks(links: Record<string, string>): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { socialLinks: links } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }

  // Contact Info
  async updateContactInfo(info: Record<string, string>): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { contactInfo: info } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }

  // SEO Defaults
  async updateSeoDefaults(seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  }): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { seoDefaults: seo } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }
}

