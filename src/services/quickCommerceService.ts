export interface QuickStoreOption {
  id: 'zepto' | 'blinkit' | 'instamart';
  name: string;
  tagline: string;
  badge: string;
  logoBg: string;
  logoTextColor: string;
  logoEmoji: string;
  eta: string;
  deliveryMinutes: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  baseUrl: string;
  appScheme: string;
}

export const QUICK_COMMERCE_STORES: QuickStoreOption[] = [
  {
    id: 'zepto',
    name: 'Zepto',
    tagline: '10-Min Superfast Grocery Delivery',
    badge: '⚡ 8-10 mins',
    logoBg: 'bg-[#5B1082]',
    logoTextColor: 'text-white',
    logoEmoji: '⚡',
    eta: '8-10 mins Delivery',
    deliveryMinutes: 8,
    deliveryFee: 0,
    freeDeliveryThreshold: 99,
    baseUrl: 'https://www.zeptonow.com/search?query=',
    appScheme: 'zepto://search?q=',
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    tagline: 'Everything delivered in 10 mins',
    badge: '⚡ 10-12 mins',
    logoBg: 'bg-[#F8CB46]',
    logoTextColor: 'text-black',
    logoEmoji: '💛',
    eta: '10-12 mins Delivery',
    deliveryMinutes: 10,
    deliveryFee: 15,
    freeDeliveryThreshold: 199,
    baseUrl: 'https://blinkit.com/s/?q=',
    appScheme: 'blinkit://search?q=',
  },
  {
    id: 'instamart',
    name: 'Swiggy Instamart',
    tagline: 'Groceries delivered in minutes',
    badge: '⚡ 12-15 mins',
    logoBg: 'bg-[#FC8019]',
    logoTextColor: 'text-white',
    logoEmoji: '🛵',
    eta: '12-15 mins Delivery',
    deliveryMinutes: 14,
    deliveryFee: 20,
    freeDeliveryThreshold: 149,
    baseUrl: 'https://www.swiggy.com/instamart/search?query=',
    appScheme: 'swiggy://instamart?query=',
  },
];

export function getQuickCommerceOrderUrl(storeId: 'zepto' | 'blinkit' | 'instamart', ingredientName: string): string {
  const store = QUICK_COMMERCE_STORES.find(s => s.id === storeId) || QUICK_COMMERCE_STORES[0];
  const query = encodeURIComponent(ingredientName.trim());
  return `${store.baseUrl}${query}`;
}

export function openQuickCommerceStore(storeId: 'zepto' | 'blinkit' | 'instamart', ingredientName: string): void {
  const url = getQuickCommerceOrderUrl(storeId, ingredientName);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
