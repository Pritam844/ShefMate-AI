export type ScreenId = 'screen1' | 'screen2' | 'screen5';
export type BottomNavTab = 'home' | 'popular' | 'recent';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  savedRecipeIds: string[];
  recentRecipeIds: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'Carbs' | 'Dairy' | 'Veggies' | 'Spices' | 'Sauces';
  icon: string;
  clayColor: string;
  inPantry: boolean;
}

export interface QuickCommerceItem {
  id: string;
  name: string;
  quantity: string;
  priceZepto: number;
  priceBlinkit: number;
  priceInstamart: number;
  inStock: boolean;
}

export interface CookingStep {
  stepNumber: number;
  instruction: string;
  timerMinutes?: number;
  tip?: string;
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  category: 'Crispy Snacks' | '5-min bites' | 'Cheesy Melts' | 'Air Fryer' | 'Sweet Craving';
  cookTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Quick';
  servings: number;
  calories: number;
  matchScore: number; // e.g. 100, 80
  missingCount: number; // 0, 1, 2
  heroImage: string;
  clayEmoji: string;
  tags: string[];
  ingredients: {
    name: string;
    quantity: string;
    isAvailable: boolean;
    quickCommerceItem?: QuickCommerceItem;
  }[];
  steps: CookingStep[];
  rating: number;
  reviewsCount: number;
  videoUrl?: string;
  youtubeId?: string;
}

export interface QuickCommerceStore {
  name: 'Zepto' | 'Blinkit' | 'Swiggy Instamart';
  logoColor: string;
  etaMinutes: number;
  deliveryFee: number;
  minOrderFreeDelivery: number;
  rating: number;
  tagline: string;
  badge: string;
}
