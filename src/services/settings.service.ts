import { injectable } from 'tsyringe';
import { Settings, ISettings, IHeroSlide, IBanner, IFloatingElement } from '../models/Settings.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

const SETTINGS_KEY = 'main';

@injectable()
export class SettingsService {
  async getSettings(): Promise<ISettings> {
    let settings = await Settings.findOne({ key: SETTINGS_KEY });
    
    if (!settings) {
      // Create new settings with floatingElements
      settings = await Settings.create({
        key: SETTINGS_KEY,
        heroSlides: [],
        banners: [],
        featuredProductIds: [],
        socialLinks: {},
        contactInfo: {},
        seoDefaults: {},
        floatingElements: [
          { type: 'icon', icon: 'heart', position: 'top-right', isActive: true },
          { type: 'icon', icon: 'star', position: 'bottom-right', isActive: true },
          { type: 'icon', icon: 'sparkles', position: 'middle-left', isActive: true }
        ]
      });
    } else {
      // Check if floatingElements are actually persisted in the database
      const rawSettings = await Settings.findOne({ key: SETTINGS_KEY }).lean();
      if (!rawSettings?.floatingElements || rawSettings.floatingElements.length === 0) {
        // Persist floatingElements to database (one-time migration)
        const updated = await Settings.findOneAndUpdate(
          { key: SETTINGS_KEY },
          { 
            $set: { 
              floatingElements: [
                { type: 'icon', icon: 'heart', position: 'top-right', isActive: true },
                { type: 'icon', icon: 'star', position: 'bottom-right', isActive: true },
                { type: 'icon', icon: 'sparkles', position: 'middle-left', isActive: true }
              ]
            } 
          },
          { new: true }
        );
        if (updated) {
          settings = updated;
        }
      }
    }

    return settings!;
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

  // Floating Elements
  async updateFloatingElements(elements: Partial<IFloatingElement>[]): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { floatingElements: elements } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }

  async updateFloatingElement(elementId: string, updates: Partial<IFloatingElement>): Promise<ISettings | null> {
    // If changing from image to icon, delete old image
    const settings = await Settings.findOne({ key: SETTINGS_KEY });
    const element = settings?.floatingElements?.find(e => (e as any)._id?.toString() === elementId);
    
    if (element?.type === 'image' && updates.type === 'icon' && element.imagePublicId) {
      try {
        await deleteFromCloudinary(element.imagePublicId);
      } catch (error) {
        console.error('Failed to delete floating element image:', error);
      }
    }

    const updateFields: Record<string, unknown> = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      updateFields[`floatingElements.$.${key}`] = value;
    });

    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY, 'floatingElements._id': elementId },
      { $set: updateFields },
      { new: true }
    );
  }

  // Website Theme
  async updateWebsiteTheme(theme: 'floral' | 'summer' | 'winter' | 'monsoon' | 'classy' | 'monochrome'): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { websiteTheme: theme } },
      { new: true, upsert: true }
    ) as Promise<ISettings>;
  }
}

