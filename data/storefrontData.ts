// ─── Core ───
export interface Creator {
  name: string;
  tagline: string;
  bio: string;
  profileImage: string;
  favicon?: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  ctaTertiary?: { label: string; href: string };
  adminLogo?: string;
  adminTitle?: string;
  footerText?: string;
}

export interface App {
  id: string;
  name: string;
  logo: string;
  description: string;
  profileUrl: string;
  affiliateUrl?: string;
  promoCode?: string;
  highlight?: boolean;
}

export interface BuyLink {
  platform: string;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  images?: string[];
  wornImage?: string;
  wornImages?: string[];
  buyLinks: BuyLink[];
  note: string;
  price?: number;
  currency?: string;
  featured?: boolean;
  rating?: number;
  review?: string;
  reviewMedia?: string[]; // image/video URLs
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  image: string;
  appName: string;
  appIcon?: string;
  planUrl: string;
  type: "gym" | "running" | "hybrid" | "other";
  duration?: string;
  level?: string;
  featured?: boolean;
  price?: number;
  currency?: string;
  paymentUrl?: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon?: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  socials: SocialLink[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  type: "general" | "collaboration" | "business" | "feedback";
  message: string;
  createdAt: string;
  read?: boolean;
}

// ─── New Feature Interfaces ───

export interface Transformation {
  id: string;
  title: string;
  beforeImage: string;
  afterImage: string;
  description?: string;
  duration?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string;
  platform?: string;
  expiresAt?: string;
  active: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Achievement {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

export interface ScheduleSlot {
  id: string;
  title: string;
  description?: string;
  availability: string;
  type: "collab" | "coaching" | "content" | "other";
}

export interface SocialFeedConfig {
  instagramUsername?: string;
  youtubeChannelId?: string;
}

export interface SEOSettings {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string;
}

export interface ConsultationConfig {
  title?: string;
  description?: string;
  bookingUrl?: string;
  price?: number;
  currency?: string;
}

export interface TipConfig {
  title?: string;
  description?: string;
  upiId?: string;
  paymentUrl?: string;
}

export interface SectionVisibility {
  apps?: boolean;
  gear?: boolean;
  plans?: boolean;
  contact?: boolean;
  transformations?: boolean;
  faq?: boolean;
  achievements?: boolean;
  schedule?: boolean;
  socialFeed?: boolean;
  newsletter?: boolean;
  comparison?: boolean;
  discountBanner?: boolean;
  consultation?: boolean;
  tip?: boolean;
}

export interface LanguageConfig {
  defaultLang: string;
  available: string[];
  translations: Record<string, Record<string, string>>;
}

// ─── Default Data ───

export const creator: Creator = {
  name: "SteelX",
  tagline: "Hybrid Athlete | Lifting + Running",
  bio: "Building strength and endurance — one rep and one mile at a time. Follow my journey and train with the same tools I use daily.",
  profileImage: "/profile.jpg",
  ctaPrimary: { label: "Train With Me", href: "#apps" },
  ctaSecondary: { label: "Shop My Gear", href: "#gear" },
  ctaTertiary: { label: "Connect With Me", href: "#contact" },
  adminTitle: "SX",
  footerText: "",
};

export const apps: App[] = [
  {
    id: "lyfta",
    name: "Lyfta",
    logo: "/logos/lyfta.svg",
    description: "My go-to lifting tracker. Every set, every rep — all logged here. Clean UI and great exercise library.",
    profileUrl: "https://lyfta.app",
    affiliateUrl: "https://lyfta.app",
    promoCode: "STEELX10",
    highlight: true,
  },
  {
    id: "runna",
    name: "Runna",
    logo: "/logos/runna.svg",
    description: "Personalized running plans that actually work. Helped me go from casual jogger to half-marathon finisher.",
    profileUrl: "https://runna.com",
    affiliateUrl: "https://runna.com",
  },
  {
    id: "strava",
    name: "Strava",
    logo: "/logos/strava.svg",
    description: "Where all my runs and rides live. Follow me for weekly activity updates and route shares.",
    profileUrl: "https://strava.com",
  },
];

export const products: Product[] = [
  {
    id: "nike-metcon-9",
    name: "Nike Metcon 9",
    category: "Shoes",
    image: "/products/metcon9.jpg",
    buyLinks: [
      { platform: "Amazon", url: "https://amazon.in" },
      { platform: "Flipkart", url: "https://flipkart.com" },
    ],
    note: "Best all-around training shoe. Stable for lifts, decent for short runs.",
    price: 12995,
    featured: true,
  },
  {
    id: "gymshark-shorts",
    name: "Gymshark Apex Shorts",
    category: "Gym Wear",
    image: "/products/gymshark-shorts.jpg",
    buyLinks: [{ platform: "Myntra", url: "https://myntra.com" }],
    note: "Lightweight, no ride-up. My daily gym go-to.",
    price: 2499,
  },
  {
    id: "garmin-forerunner",
    name: "Garmin Forerunner 265",
    category: "Watches",
    image: "/products/garmin265.jpg",
    buyLinks: [{ platform: "Amazon", url: "https://amazon.in" }],
    note: "AMOLED display, incredible GPS accuracy. Worth every rupee.",
    price: 39990,
    featured: true,
  },
  {
    id: "resistance-bands",
    name: "JELEX Resistance Bands Set",
    category: "Accessories",
    image: "/products/bands.jpg",
    buyLinks: [{ platform: "Amazon", url: "https://amazon.in" }],
    note: "Great for warm-ups and mobility work. Travel-friendly too.",
    price: 599,
  },
  {
    id: "whey-protein",
    name: "Optimum Nutrition Gold Standard",
    category: "Supplements",
    image: "/products/whey.jpg",
    buyLinks: [{ platform: "Amazon", url: "https://amazon.in" }],
    note: "The OG whey. Double chocolate flavor never disappoints.",
    price: 4899,
  },
  {
    id: "nike-pegasus",
    name: "Nike Pegasus 41",
    category: "Shoes",
    image: "/products/pegasus41.jpg",
    buyLinks: [
      { platform: "Myntra", url: "https://myntra.com" },
      { platform: "Ajio", url: "https://ajio.com" },
    ],
    note: "My daily running shoe. Cushioned, responsive, reliable.",
    price: 11495,
  },
];

export const workoutPlans: WorkoutPlan[] = [
  {
    id: "ppl-split",
    title: "Push Pull Legs Split",
    description: "My go-to 6-day hypertrophy program. Progressive overload with compound and isolation work.",
    image: "",
    appName: "Lyfta",
    planUrl: "https://lyfta.app",
    type: "gym",
    duration: "6 weeks",
    level: "Intermediate",
    featured: true,
  },
  {
    id: "half-marathon",
    title: "Half Marathon Training",
    description: "16-week plan that took me from 5K to 21K. Includes easy runs, tempo, and long runs.",
    image: "",
    appName: "Runna",
    planUrl: "https://runna.com",
    type: "running",
    duration: "16 weeks",
    level: "Beginner–Intermediate",
  },
];

export const contacts: ContactInfo = {
  phone: "",
  email: "",
  socials: [],
};
