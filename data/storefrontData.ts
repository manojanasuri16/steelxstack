export interface Creator {
  name: string;
  tagline: string;
  bio: string;
  profileImage: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
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
  buyLinks: BuyLink[];
  note: string;
  price?: number;
  featured?: boolean;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  socials: SocialLink[];
}

export const creator: Creator = {
  name: "SteelX",
  tagline: "Hybrid Athlete | Lifting + Running",
  bio: "Building strength and endurance — one rep and one mile at a time. Follow my journey and train with the same tools I use daily.",
  profileImage: "/profile.jpg",
  ctaPrimary: { label: "Train With Me", href: "#apps" },
  ctaSecondary: { label: "Shop My Gear", href: "#gear" },
};

export const apps: App[] = [
  {
    id: "lyfta",
    name: "Lyfta",
    logo: "/logos/lyfta.svg",
    description:
      "My go-to lifting tracker. Every set, every rep — all logged here. Clean UI and great exercise library.",
    profileUrl: "https://lyfta.app",
    affiliateUrl: "https://lyfta.app",
    promoCode: "STEELX10",
    highlight: true,
  },
  {
    id: "runna",
    name: "Runna",
    logo: "/logos/runna.svg",
    description:
      "Personalized running plans that actually work. Helped me go from casual jogger to half-marathon finisher.",
    profileUrl: "https://runna.com",
    affiliateUrl: "https://runna.com",
  },
  {
    id: "strava",
    name: "Strava",
    logo: "/logos/strava.svg",
    description:
      "Where all my runs and rides live. Follow me for weekly activity updates and route shares.",
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

export const contacts: ContactInfo = {
  phone: "",
  email: "",
  socials: [],
};
