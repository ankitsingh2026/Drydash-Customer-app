export type ContentMediaType = "lottie" | "video" | "image" | string;

export interface ContentServiceItem {
  _id: string;
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
  hero_banner?: ContentSection;
  mid_section?: ContentSection;
  services_section?: ContentSection<ContentServiceItem>;
  process_section?: ContentSection;
  testimonials_section?: ContentSection;
}

export interface LayoutApiResponse {
  success: boolean;
  data: LayoutContentData;
}
