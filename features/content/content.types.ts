export type ContentMediaType = "lottie" | "video" | "image" | string;

export interface ContentHeroBannerItem {
  _id?: string;
  title?: string;
  mediaUrl?: string;
  mediaType?: ContentMediaType;
  link?: string;
  isActive?: boolean;
}

export interface ContentHeroSection {
  mediaUrl?: string;
  mediaType?: ContentMediaType;
  isActive?: boolean;
  link?: string;
  title?: string;
  banners?: ContentHeroBannerItem[];
}

export interface ContentMidSection {
  title?: string;
  mediaUrl?: string;
  mediaType?: ContentMediaType;
  isActive?: boolean;
  link?: string;
}

export interface ContentAdBanner {
  mediaUrl?: string;
  mediaType?: ContentMediaType;
  link?: string;
  isActive?: boolean;
  title?: string;
}

export interface ContentServiceItem {
  _id?: string;
  title: string;
  mediaUrl: string;
  mediaType: ContentMediaType;
  deliveryHours?: string;
  slug: string;
  subtitle?: string;
}

export interface ContentProcessStage {
  _id?: string;
  stageName?: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: ContentMediaType;
  stepNumber?: number;
}

export interface ContentTestimonial {
  _id?: string;
  customerName?: string;
  customerImage?: string;
  rating?: number;
  reviewText?: string;
  role?: string;
  tag?: string;
}

export interface ContentBlogItem {
  _id?: string;
  key?: string;
  title?: string;
  subtitle?: string;
  brief?: string;
  description?: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: ContentMediaType;
  image?: string | { uri: string };
  slug?: string;
  link?: string;
  date?: string;
  author?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogItem {
  _id: string;
  title: string;
  mediaUrl?: string;
  mediaType?: ContentMediaType;
  brief?: string;
  subtitle?: string;
  content?: string;
  slug: string;
  author?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogsListApiResponse {
  success: boolean;
  data: BlogItem[];
}

export interface BlogDetailApiResponse {
  success: boolean;
  data: BlogItem;
}

export interface ContentSection<T = any> {
  title?: string;
  mediaUrl?: string;
  mediaType?: ContentMediaType;
  link?: string;
  isActive?: boolean;
  services?: T[];
  processStages?: ContentProcessStage[];
  testimonials?: ContentTestimonial[];
}

export interface LayoutContentData {
  // New backend API keys
  herosection?: ContentHeroSection;
  midsection?: ContentMidSection;
  services?: ContentServiceItem[];
  ad_banner?: ContentAdBanner;
  process?: ContentProcessStage[];
  testimonials?: ContentTestimonial[];
  recent_blogs?: ContentBlogItem[];

  // Legacy / Aliases
  hero_banner?: ContentHeroSection;
  mid_section?: ContentMidSection;
  services_section?: ContentSection<ContentServiceItem>;
  process_section?: ContentSection;
  testimonials_section?: ContentSection;
}

export interface LayoutApiResponse {
  success: boolean;
  data: LayoutContentData;
}

