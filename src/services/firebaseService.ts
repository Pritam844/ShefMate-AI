import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase, ref, get } from 'firebase/database';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { Recipe, UserAccount } from '../types/snackhack';

// User-provided Firebase configuration (project-e1f20)
export const firebaseConfig = {
  apiKey: "AIzaSyAkAFA0AudDp0GzxhNsV8CRJoZuBTMYt-g",
  authDomain: "project-e1f20.firebaseapp.com",
  databaseURL: "https://project-e1f20-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-e1f20",
  storageBucket: "project-e1f20.firebasestorage.app",
  messagingSenderId: "1003380149412",
  appId: "1:1003380149412:web:54c90bba7a8db512fdaa31",
  measurementId: "G-086NYH89VE"
};

// Aliases for backwards compatibility
export const firebaseConfigSearch = firebaseConfig;

// Initialize Firebase (single project-e1f20 instance)
export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const searchFirebaseApp = app;

export const db = getDatabase(app);
export const searchDb = db;

// Initialize Firebase Authentication for project-e1f20
export const auth = getAuth(app);

// Initialize Firebase Analytics safely (in supported browser environments)
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analyticsInstance = getAnalytics(app);
      } catch (err) {
        console.warn('[Firebase] Analytics init skipped:', err);
      }
    }
  });
}
export { analyticsInstance as analytics };

export function mapFirebaseUserToAccount(user: FirebaseUser): UserAccount {
  const savedKey = `chefmate_saved_${user.uid}`;
  const recentKey = `chefmate_recent_${user.uid}`;

  let savedRecipeIds: string[] = [];
  let recentRecipeIds: string[] = [];

  try {
    const rawSaved = localStorage.getItem(savedKey);
    if (rawSaved) savedRecipeIds = JSON.parse(rawSaved);
    const rawRecent = localStorage.getItem(recentKey);
    if (rawRecent) recentRecipeIds = JSON.parse(rawRecent);
  } catch {
    // LocalStorage quota or access error fallback
  }

  const email = user.email || '';
  const name = user.displayName || (email.includes('@') ? email.split('@')[0] : 'Chef');

  return {
    id: user.uid,
    name,
    email,
    avatar: user.photoURL || undefined,
    savedRecipeIds,
    recentRecipeIds,
  };
}

export async function signUpWithEmail(email: string, password: string): Promise<UserAccount> {
  const trimmed = email.trim();
  const credential = await createUserWithEmailAndPassword(auth, trimmed, password);
  return mapFirebaseUserToAccount(credential.user);
}

export async function loginWithEmail(email: string, password: string): Promise<UserAccount> {
  const trimmed = email.trim();
  const credential = await signInWithEmailAndPassword(auth, trimmed, password);
  return mapFirebaseUserToAccount(credential.user);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export function subscribeToAuth(callback: (user: UserAccount | null) => void): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(mapFirebaseUserToAccount(firebaseUser));
    } else {
      callback(null);
    }
  });
}

export function getFirebaseErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify and try again.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or tap "Forgot password?".';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method.';
    default:
      return error.message || 'Authentication error. Please try again.';
  }
}

export function extractYoutubeId(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : undefined;
}

// Verified real working YouTube cooking videos for Bengali / Indian dishes
export const DISH_VERIFIED_VIDEOS: { pattern: RegExp; id: string }[] = [
  { pattern: /egg|dim|bora|anda/i, id: 'JHHCS3GDO_s' },
  { pattern: /potato|alu|chop|croquette/i, id: 'pa0lchq60hs' },
  { pattern: /begun|eggplant|brinjal/i, id: 'TKkzlsSpzEc' },
  { pattern: /peyaji|onion|fritter/i, id: 'Y9iujFS8lx4' },
  { pattern: /singara|samosa/i, id: 'qDD5eMsSw0w' },
  { pattern: /nimki/i, id: 'aCRfAILuKNQ' },
  { pattern: /mocha/i, id: 'Om42Wg4x1Fk' },
  { pattern: /ghugni/i, id: 'ZveiVet2ENk' },
  { pattern: /kochuri|kachori/i, id: 'Dm1jHiPnvIM' },
  { pattern: /crab|kakra/i, id: '86hOnyJKmTA' },
  { pattern: /luchi|puri/i, id: 'qH1kB0u35dI' },
  { pattern: /mutton|kosha|mangsho/i, id: 'CUCtn02Juk0' },
  { pattern: /dum|dom/i, id: 'lgKT3avl8j0' },
  { pattern: /chingri|prawn|shrimp/i, id: 'wlklb1hNnyM' },
  { pattern: /fish|maach|macher/i, id: 'xAqwQrwpXxA' },
  { pattern: /khichuri|khichdi/i, id: '0kO4-w37T80' },
  { pattern: /payesh|kheer/i, id: 'k5yq660mCVI' },
  { pattern: /toast|bread/i, id: '1vQYLE_C8Gs' },
  { pattern: /nachos|chips/i, id: 'Kc_hdbH2CB8' },
  { pattern: /noodle|maggi|chowmein/i, id: 'R4GAb4-1l4A' },
];

export function resolveRecipeYoutubeId(title: string, rawUrl?: string, rawId?: string): string {
  if (rawId && rawId.length === 11 && rawId !== '8A8z7uK1p4U') {
    return rawId;
  }
  const extracted = extractYoutubeId(rawUrl);
  if (extracted && extracted.length === 11 && extracted !== '8A8z7uK1p4U') {
    return extracted;
  }
  for (const item of DISH_VERIFIED_VIDEOS) {
    if (item.pattern.test(title)) {
      return item.id;
    }
  }
  return '1vQYLE_C8Gs';
}

function createQuickCommerceStub(ingredientName: string) {
  const cleanName = ingredientName.replace(/[:0-9/()-]/g, '').trim();
  const prices = [35, 45, 60, 85, 95, 120, 160];
  const basePrice = prices[Math.floor(Math.abs(cleanName.charCodeAt(0) || 50) % prices.length)];

  return {
    id: `qc_${cleanName.toLowerCase().replace(/\s+/g, '_')}`,
    name: `${cleanName} (Fresh Pack)`,
    quantity: 'Standard Unit',
    priceZepto: basePrice,
    priceBlinkit: basePrice + 4,
    priceInstamart: basePrice + 2,
    inStock: true,
  };
}

// Common kitchen basics available in almost all homes (don't penalize as missing items)
const COMMON_PANTRY_STAPLES = [
  'salt', 'oil', 'mustard oil', 'vegetable oil', 'water', 'sugar', 'baking soda',
  'black pepper', 'turmeric', 'turmeric powder'
];

// Rich synonyms for common pantry items
const PANTRY_SYNONYMS: Record<string, string[]> = {
  'potatoes': ['potato', 'potatoes', 'alu', 'alur', 'batata'],
  'cheese block': ['cheese', 'cheddar', 'mozzarella', 'paneer', 'queso'],
  'white bread': ['bread', 'toast', 'pao', 'pav', 'bun', 'breadcrumbs'],
  'salted butter': ['butter', 'ghee', 'makkhan'],
  'garlic pods': ['garlic', 'roshun', 'lehsun'],
  'chili flakes': ['chilli', 'chili', 'mirch', 'pepper', 'capsicum'],
  'tortilla chips': ['tortilla', 'chips', 'nachos', 'corn'],
  'mozzarella block': ['mozzarella', 'cheese', 'cheddar'],
  'oregano flakes': ['oregano', 'herb', 'seasoning'],
  'plum tomatoes': ['tomato', 'tomatoes', 'tamatar'],
  'peri peri mix': ['peri', 'spice', 'chili', 'seasoning'],
  'instant noodles': ['noodle', 'noodles', 'maggi', 'chowmein'],
  'farm eggs': ['egg', 'eggs', 'dim', 'dimer', 'anda'],
  'red onions': ['onion', 'onions', 'peyaj', 'pyaz'],
  'fresh cucumber': ['cucumber', 'shosa', 'kheera'],
  'button mushrooms': ['mushroom', 'mushrooms'],
  'fresh broccoli': ['broccoli'],
  'fresh lemon': ['lemon', 'lime', 'nimbu', 'lebu'],
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordMatch(text: string, keyword: string): boolean {
  const cleanKeyword = keyword.trim().toLowerCase();
  if (!cleanKeyword) return false;
  // Match keyword as an exact word or simple plural
  const pattern = new RegExp(`\\b${escapeRegex(cleanKeyword)}(?:s|es)?\\b`, 'i');
  return pattern.test(text);
}

function matchesUserPantry(ingText: string, activePantryNames: string[]): boolean {
  if (activePantryNames.length === 0) return true;
  const clean = ingText.toLowerCase().split(':')[0].trim();

  // Guard against false positive substring matches:
  // e.g. "eggplant" or "brinjal" must NOT match "egg" unless user selected eggplant/brinjal
  if (/eggplant|brinjal|begun/i.test(clean)) {
    return activePantryNames.some((p) => /eggplant|brinjal|begun/i.test(p));
  }
  // "cauliflower" must NOT match "flour"
  if (/cauliflower|fulkopi/i.test(clean)) {
    return activePantryNames.some((p) => /cauliflower|fulkopi/i.test(p));
  }

  for (const pName of activePantryNames) {
    const pLower = pName.toLowerCase().trim();
    if (wordMatch(clean, pLower)) return true;

    const syns = PANTRY_SYNONYMS[pLower] || [];
    for (const syn of syns) {
      if (wordMatch(clean, syn)) return true;
    }
  }

  return false;
}

function isCommonStaple(ingText: string): boolean {
  const clean = ingText.toLowerCase().split(':')[0].trim();
  for (const staple of COMMON_PANTRY_STAPLES) {
    if (wordMatch(clean, staple)) return true;
  }
  return false;
}

function checkIngredientAvailable(ingText: string, activePantryNames: string[]): boolean {
  if (activePantryNames.length === 0) return true;
  if (isCommonStaple(ingText)) return true;
  return matchesUserPantry(ingText, activePantryNames);
}


export async function fetchSearchRecipes(activePantryNames: string[] = []): Promise<Recipe[]> {
  const { RECIPES: fallbackRecipes } = await import('../data/mockData');

  // Re-evaluate curated recipes against active pantry
  const evaluatedCurated = fallbackRecipes.map((recipe) => {
    let userPantryMatches = 0;
    let nonStapleTotal = 0;
    let nonStapleMissing = 0;

    const mappedIngredients = recipe.ingredients.map((ing) => {
      const ingName = typeof ing === 'string' ? ing : ing.name || '';
      const isStaple = isCommonStaple(ingName);
      const isUserMatch = matchesUserPantry(ingName, activePantryNames);
      const isAvailable = isStaple || isUserMatch;

      if (!isStaple) {
        nonStapleTotal++;
        if (isUserMatch) {
          userPantryMatches++;
        } else {
          nonStapleMissing++;
        }
      }

      return {
        ...ing,
        name: ingName,
        isAvailable,
        quickCommerceItem: !isAvailable ? (ing.quickCommerceItem || createQuickCommerceStub(ingName)) : undefined,
      };
    });

    const missingCount = activePantryNames.length > 0 ? nonStapleMissing : 0;
    const matchScore = activePantryNames.length > 0
      ? (missingCount === 0 ? 100 : Math.round((userPantryMatches / Math.max(nonStapleTotal, 1)) * 100))
      : 100;

    return {
      ...recipe,
      ingredients: mappedIngredients,
      missingCount,
      matchScore,
    };
  });

  try {
    const recipesRef = ref(searchDb, 'recipes');
    const snapshot = await get(recipesRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const rawList = Array.isArray(data) ? data : Object.values(data);

      const parsed: Recipe[] = rawList
        .filter((item: any) => item && (item.name || item.title || item.englishName) && item.ingredients)
        .map((item: any, idx: number) => {
          const title = item.englishName || item.name || item.title || `Recipe #${idx + 1}`;
          const rawIngredients: string[] = Array.isArray(item.ingredients) ? item.ingredients : [];

          let userPantryMatches = 0;
          let nonStapleTotal = 0;
          let nonStapleMissing = 0;

          const mappedIngredients = rawIngredients.map((rawIng) => {
            const ingText = typeof rawIng === 'string' ? rawIng : (rawIng as any).name || '';
            const isStaple = isCommonStaple(ingText);
            const isUserMatch = matchesUserPantry(ingText, activePantryNames);
            const isAvailable = isStaple || isUserMatch;

            if (!isStaple) {
              nonStapleTotal++;
              if (isUserMatch) {
                userPantryMatches++;
              } else {
                nonStapleMissing++;
              }
            }

            return {
              name: ingText,
              quantity: (rawIng as any).quantity || 'As required',
              isAvailable,
              quickCommerceItem: !isAvailable ? createQuickCommerceStub(ingText) : undefined,
            };
          });

          const missingCount = activePantryNames.length > 0 ? nonStapleMissing : 0;
          const matchScore = activePantryNames.length > 0
            ? (missingCount === 0 ? 100 : Math.round((userPantryMatches / Math.max(nonStapleTotal, 1)) * 100))
            : 100;

          const rawSteps = Array.isArray(item.recipe)
            ? item.recipe
            : Array.isArray(item.steps)
            ? item.steps
            : ['Prepare ingredients.', 'Cook until golden.', 'Serve hot.'];

          const steps = rawSteps.map((stepText: any, stepIdx: number) => ({
            stepNumber: stepIdx + 1,
            instruction: typeof stepText === 'string' ? stepText : stepText.instruction || '',
            timerMinutes: typeof stepText === 'object' && stepText.timerMinutes ? stepText.timerMinutes : 3,
            tip: typeof stepText === 'object' ? stepText.tip : undefined,
          }));

          const youtubeId = resolveRecipeYoutubeId(
            title,
            item.youtube_video_link || item.videoUrl,
            item.youtubeId
          );

          const videoUrl =
            item.youtube_video_link ||
            item.videoUrl ||
            `https://www.youtube.com/watch?v=${youtubeId}`;

          const titleLower = title.toLowerCase();
          const stepCount = item.stepCount || steps.length;
          const isQuickSnack =
            stepCount <= 6 ||
            /toast|egg|bora|fritter|chop|fry|snack|chaat|maggi|noodle|quick|roll|melt/i.test(titleLower);

          const cookTimeMinutes = item.cookTimeMinutes || item.timeMinutes || (
            isQuickSnack
              ? Math.min(10, Math.max(5, (stepCount || 4) + 2))
              : 14
          );

          return {
            id: item.id || `rec_fb_${idx + 1}`,
            title,
            subtitle: item.description || item.subtitle || (item.bengaliName ? `Bengali: ${item.bengaliName}` : 'Authentic Delicacy'),
            category: item.category || 'Crispy Snacks',
            cookTimeMinutes,
            difficulty: item.difficulty || (cookTimeMinutes <= 10 ? 'Quick' : 'Easy'),
            servings: item.servings || 2,
            calories: item.calories || 230,
            matchScore,
            missingCount,
            heroImage: item.image_url || item.heroImage || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
            clayEmoji: item.clayEmoji || '🥘✨',
            tags: item.tags || [item.category || 'Snack', cookTimeMinutes <= 10 ? 'Under 10 mins' : 'Authentic'],
            ingredients: mappedIngredients.length > 0 ? mappedIngredients : [
              { name: 'Potatoes', quantity: '2 medium', isAvailable: true },
              { name: 'Salted Butter', quantity: '1 tbsp', isAvailable: true }
            ],
            steps,
            rating: item.rating || 4.8,
            reviewsCount: item.reviewsCount || 150,
            videoUrl,
            youtubeId,
          };
        });

      // Combine curated recipes with catalog
      const combined = [...evaluatedCurated, ...parsed];

      // When user has selected pantry ingredients:
      // ONLY include recipes that actually use the user's selected ingredients!
      let finalRecipes = combined;
      if (activePantryNames.length > 0) {
        finalRecipes = combined.filter((r) => {
          const userMatches = r.ingredients.filter((i) => !isCommonStaple(i.name) && matchesUserPantry(i.name, activePantryNames)).length;
          return userMatches > 0 && r.missingCount <= 2;
        });
      }

      // Sort: 100% matches with only selected ingredients first, then missing 1, then missing 2
      finalRecipes.sort((a, b) => {
        if (a.missingCount === 0 && b.missingCount !== 0) return -1;
        if (b.missingCount === 0 && a.missingCount !== 0) return 1;
        if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
        return b.matchScore - a.matchScore;
      });

      return finalRecipes;
    }
  } catch (err) {
    console.warn('[Firebase] fetchSearchRecipes error, using curated recipes:', err);
  }

  if (activePantryNames.length > 0) {
    const filteredCurated = evaluatedCurated.filter((r) => {
      const userMatches = r.ingredients.filter((i) => !isCommonStaple(i.name) && matchesUserPantry(i.name, activePantryNames)).length;
      return userMatches > 0 && r.missingCount <= 2;
    });
    filteredCurated.sort((a, b) => {
      if (a.missingCount === 0 && b.missingCount !== 0) return -1;
      if (b.missingCount === 0 && a.missingCount !== 0) return 1;
      return a.missingCount - b.missingCount;
    });
    return filteredCurated;
  }

  return evaluatedCurated;
}

export async function fetchPopularWorldRecipes(): Promise<Recipe[]> {
  try {
    const recipesRef = ref(db, 'recipes');
    const snapshot = await get(recipesRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const rawList = Array.isArray(data) ? data : Object.values(data);
      const parsed: Recipe[] = rawList
        .filter((item: any) => item && (item.name || item.title || item.englishName))
        .map((item: any, idx: number) => {
          const title = item.englishName || item.name || item.title || `Recipe #${idx + 1}`;
          const youtubeId = resolveRecipeYoutubeId(
            title,
            item.youtube_video_link || item.videoUrl,
            item.youtubeId
          );
          const videoUrl =
            item.youtube_video_link ||
            item.videoUrl ||
            `https://www.youtube.com/watch?v=${youtubeId}`;

          const rawIngredients = Array.isArray(item.ingredients) ? item.ingredients : [];
          const mappedIngredients = rawIngredients.map((rawIng: any) => ({
            name: typeof rawIng === 'string' ? rawIng : rawIng.name || '',
            quantity: typeof rawIng === 'object' && rawIng.quantity ? rawIng.quantity : 'As required',
            isAvailable: true,
          }));

          const rawSteps = Array.isArray(item.recipe)
            ? item.recipe
            : Array.isArray(item.steps)
            ? item.steps
            : ['Prepare ingredients.', 'Cook until golden and fragrant.', 'Serve hot.'];

          const steps = rawSteps.map((stepText: any, stepIdx: number) => ({
            stepNumber: stepIdx + 1,
            instruction: typeof stepText === 'string' ? stepText : stepText.instruction || '',
            timerMinutes: typeof stepText === 'object' && stepText.timerMinutes ? stepText.timerMinutes : 3,
            tip: typeof stepText === 'object' ? stepText.tip : undefined,
          }));

          return {
            id: item.id || `rec_pop_${idx + 1}`,
            title,
            subtitle: item.description || item.subtitle || (item.bengaliName ? `Bengali: ${item.bengaliName}` : 'Authentic Delicacy'),
            category: item.category || 'Popular Favorites',
            cookTimeMinutes: item.cookTimeMinutes || item.timeMinutes || 12,
            difficulty: item.difficulty || 'Easy',
            servings: item.servings || 2,
            calories: item.calories || 240,
            matchScore: 100,
            missingCount: 0,
            heroImage: item.image_url || item.heroImage || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
            clayEmoji: item.clayEmoji || '🥘✨',
            tags: item.tags || [item.category || 'Popular', 'Authentic'],
            ingredients: mappedIngredients.length > 0 ? mappedIngredients : [
              { name: 'Potatoes', quantity: '2 medium', isAvailable: true },
              { name: 'Spices', quantity: 'to taste', isAvailable: true },
            ],
            steps,
            rating: item.rating || 4.9,
            reviewsCount: item.reviewsCount || 280,
            videoUrl,
            youtubeId,
          };
        });

      return parsed;
    }
  } catch (err) {
    console.warn('[Firebase] fetchPopularWorldRecipes error:', err);
  }
  return [];
}
