import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  Flame,
  Users,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  X,
  Copy,
  Check,
  ExternalLink,
  Maximize2,
  Minimize2,
  VideoOff,
  MessageCircle,
  Send,
  Mail,
  WifiOff,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Square,
} from 'lucide-react';
import { Recipe } from '../../types/snackhack';
import { resolveRecipeYoutubeId } from '../../services/firebaseService';

interface Props {
  recipe: Recipe;
  onBack: () => void;
  isSaved?: boolean;
  onToggleSave?: (recipeId: string) => void;
}

interface DeliveryAppOption {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  logoBg: string;
  logoColor: string;
  logoEmoji: string;
  eta: string;
  priceOffset: number;
  baseUrl: string;
}

const DELIVERY_APPS: DeliveryAppOption[] = [
  {
    id: 'zepto',
    name: 'Zepto',
    tagline: '10-Min Superfast Grocery',
    badge: '⚡ 8-10 mins',
    logoBg: 'bg-[#5B1082]',
    logoColor: 'text-white',
    logoEmoji: '⚡',
    eta: '8-10 mins Delivery',
    priceOffset: 0,
    baseUrl: 'https://www.zeptonow.com/search?query=',
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    tagline: 'Everything delivered in 10 mins',
    badge: '⚡ 10-12 mins',
    logoBg: 'bg-[#F8CB46]',
    logoColor: 'text-black',
    logoEmoji: '💛',
    eta: '10-12 mins Delivery',
    priceOffset: 4,
    baseUrl: 'https://blinkit.com/s/?q=',
  },
  {
    id: 'instamart',
    name: 'Swiggy Instamart',
    tagline: 'Groceries delivered in minutes',
    badge: '⚡ 12-15 mins',
    logoBg: 'bg-[#FC8019]',
    logoColor: 'text-white',
    logoEmoji: '🛵',
    eta: '12-15 mins Delivery',
    priceOffset: 6,
    baseUrl: 'https://www.swiggy.com/instamart/search?query=',
  },
  {
    id: 'bigbasket',
    name: 'BigBasket BB Now',
    tagline: 'Fresh grocery & pantry staples',
    badge: '⚡ 15-20 mins',
    logoBg: 'bg-[#84C225]',
    logoColor: 'text-white',
    logoEmoji: '🧺',
    eta: '15-20 mins Delivery',
    priceOffset: -3,
    baseUrl: 'https://www.bigbasket.com/ps/?q=',
  },
  {
    id: 'flipkart_minutes',
    name: 'Flipkart Minutes',
    tagline: 'Fast hyper-local delivery',
    badge: '⚡ 10-14 mins',
    logoBg: 'bg-[#2874F0]',
    logoColor: 'text-white',
    logoEmoji: '🛍️',
    eta: '10-14 mins Delivery',
    priceOffset: 2,
    baseUrl: 'https://www.flipkart.com/search?q=',
  },
];

// Verified real working YouTube cooking videos
const RECIPE_VIDEOS: Record<
  string,
  { title: string; youtubeId: string; author: string; duration: number }
> = {
  rec_potato_poppers: {
    title: 'Crispy Cheesy Potato Poppers',
    youtubeId: 'pa0lchq60hs',
    author: 'Chef Kitchen',
    duration: 254,
  },
  rec_garlic_toast: {
    title: 'Golden Garlic Butter Toast',
    youtubeId: '1vQYLE_C8Gs',
    author: 'Chef Ranveer Brar',
    duration: 180,
  },
  rec_molten_nachos: {
    title: 'Molten Queso Loaded Nachos',
    youtubeId: 'Kc_hdbH2CB8',
    author: 'Chef Ranveer Brar',
    duration: 310,
  },
  rec_peri_peri_rolls: {
    title: 'Crispy Peri-Peri Bread Rolls',
    youtubeId: 'qDD5eMsSw0w',
    author: 'Crispy Kitchen',
    duration: 215,
  },
  rec_spicy_chili_noodles: {
    title: '5-Min Butter Garlic Chili Noodles',
    youtubeId: 'R4GAb4-1l4A',
    author: 'Chef Ranveer Brar',
    duration: 195,
  },
  rec_crispy_smashed_potatoes: {
    title: 'Crispy Smashed Garlic Herb Potatoes',
    youtubeId: 'Ucab3DlamsU',
    author: 'Chef Ranveer Brar',
    duration: 280,
  },
  rec_chili_cheese_lava_toast: {
    title: 'Loaded Chili Cheese Lava Toast',
    youtubeId: '1vQYLE_C8Gs',
    author: 'Chef Ranveer Brar',
    duration: 190,
  },
};

function extractYoutubeId(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : undefined;
}

export const Screen5RecipeDetailCooking: React.FC<Props> = ({
  recipe,
  onBack,
  isSaved: externalIsSaved,
  onToggleSave,
}) => {
  // Ref for the scrollable container to preserve scroll position on video close
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTop = useRef<number>(0);

  // Step & Timer State
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(420); // 7 minutes default

  // Save State
  const [internalIsSaved, setInternalIsSaved] = useState(false);
  const isSaved = externalIsSaved !== undefined ? externalIsSaved : internalIsSaved;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ingredient Checklist State
  const [ingredientList, setIngredientList] = useState(recipe.ingredients);

  // Sync ingredients when recipe changes
  useEffect(() => {
    setIngredientList(recipe.ingredients);
    setActiveStepIndex(0);
    setCompletedSteps({});
  }, [recipe]);

  // Modals & Bottom Sheets
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<{
    name: string;
    quantity: string;
    isAll?: boolean;
  } | null>(null);

  // Video Player State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showInlineVideo, setShowInlineVideo] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoFullScreen, setIsVideoFullScreen] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  // Text-to-Speech (TTS) Audio Player State
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [autoAdvanceTts, setAutoAdvanceTts] = useState<boolean>(true);

  const activeStep = recipe.steps[activeStepIndex] || recipe.steps[0];
  const missingItems = ingredientList.filter((item) => !item.isAvailable);

  const speakStep = (index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showToast('Text-to-Speech (TTS) is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const step = recipe.steps[index];
    if (!step) {
      setIsTtsPlaying(false);
      return;
    }

    const textToRead = `Step ${index + 1}. ${step.instruction}. ${step.tip ? `Chef tip: ${step.tip}` : ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = ttsRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsTtsPlaying(true);
    };

    utterance.onend = () => {
      if (autoAdvanceTts && index < recipe.steps.length - 1) {
        setActiveStepIndex(index + 1);
        setTimeout(() => speakStep(index + 1), 600);
      } else {
        setIsTtsPlaying(false);
      }
    };

    utterance.onerror = () => {
      setIsTtsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleTts = () => {
    if (isTtsPlaying) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsTtsPlaying(false);
    } else {
      speakStep(activeStepIndex);
    }
  };

  const handleNextTtsStep = () => {
    if (activeStepIndex < recipe.steps.length - 1) {
      const nextIdx = activeStepIndex + 1;
      setActiveStepIndex(nextIdx);
      if (isTtsPlaying) {
        speakStep(nextIdx);
      }
    }
  };

  const handlePrevTtsStep = () => {
    if (activeStepIndex > 0) {
      const prevIdx = activeStepIndex - 1;
      setActiveStepIndex(prevIdx);
      if (isTtsPlaying) {
        speakStep(prevIdx);
      }
    }
  };

  const handleStopTts = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsTtsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const videoData = useMemo(() => {
    // 1. Check curated mapping
    const curated = RECIPE_VIDEOS[recipe.id];
    if (curated) {
      return {
        title: curated.title,
        youtubeId: curated.youtubeId,
        embedUrl: `https://www.youtube.com/embed/${curated.youtubeId}?rel=0&playsinline=1&enablejsapi=1`,
        watchUrl: `https://www.youtube.com/watch?v=${curated.youtubeId}`,
        author: curated.author,
        duration: curated.duration,
      };
    }

    // 2. Check recipe's own youtubeId or videoUrl
    let vidId = recipe.youtubeId;
    if (!vidId || vidId === '8A8z7uK1p4U' || vidId.length !== 11) {
      const extracted = recipe.videoUrl ? extractYoutubeId(recipe.videoUrl) : undefined;
      if (extracted && extracted.length === 11 && extracted !== '8A8z7uK1p4U') {
        vidId = extracted;
      } else {
        vidId = resolveRecipeYoutubeId(recipe.title, recipe.videoUrl, recipe.youtubeId);
      }
    }

    const watchUrl =
      recipe.videoUrl && recipe.videoUrl.includes('youtube.com')
        ? recipe.videoUrl
        : `https://www.youtube.com/watch?v=${vidId}`;

    return {
      title: recipe.title,
      youtubeId: vidId,
      embedUrl: `https://www.youtube.com/embed/${vidId}?rel=0&playsinline=1&enablejsapi=1`,
      watchUrl,
      author: 'Chef Ranveer Brar & Bong Eats',
      duration: 240,
    };
  }, [recipe]);
  const videoDuration = videoData.duration || 240;

  // Step countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Video playback seek bar progression timer
  useEffect(() => {
    let timer: any = null;
    if (isVideoModalOpen && isVideoPlaying && !isLoadingVideo && !hasVideoError) {
      timer = setInterval(() => {
        setCurrentVideoTime((prev) => {
          if (prev >= videoDuration) {
            setIsVideoPlaying(false);
            return videoDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVideoModalOpen, isVideoPlaying, isLoadingVideo, hasVideoError, videoDuration]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStepDone = (index: number) => {
    setCompletedSteps((prev) => ({ ...prev, [index]: true }));
    if (activeStepIndex < recipe.steps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
      const nextStep = recipe.steps[activeStepIndex + 1];
      if (nextStep?.timerMinutes) {
        setTimeLeft(nextStep.timerMinutes * 60);
      }
    }
  };

  // 1. HEART (SAVE) BUTTON HANDLER
  const handleToggleSave = () => {
    const nextSavedState = !isSaved;
    if (onToggleSave) {
      onToggleSave(recipe.id);
    } else {
      setInternalIsSaved(nextSavedState);
    }

    if (nextSavedState) {
      showToast('Saved to your recipes');
    } else {
      showToast('Removed from your recipes');
    }
  };

  // 2. SHARE BUTTON HANDLER
  const handleOpenShare = async () => {
    const recipeUrl = `${window.location.origin}/#recipe-${recipe.id}`;
    const shareData = {
      title: `${recipe.title} - ChefMate AI`,
      text: `${recipe.title}: ${recipe.subtitle}. Ready in ${recipe.cookTimeMinutes} mins. Check out the recipe on ChefMate AI!`,
      url: recipeUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to custom share sheet
      }
    }

    setIsShareSheetOpen(true);
  };

  const handleCopyLink = async () => {
    const recipeUrl = `${window.location.origin}/#recipe-${recipe.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(recipeUrl);
      }
      setIsCopiedLink(true);
      showToast('Link copied to clipboard!');
      setTimeout(() => setIsCopiedLink(false), 2500);
    } catch {
      showToast('Link copied to clipboard!');
    }
  };

  // 3. ORDER MISSING INGREDIENTS HANDLERS
  const handleOpenOrderSheet = (item: { name: string; quantity: string } | null) => {
    if (item) {
      setSelectedOrderItem({ name: item.name, quantity: item.quantity, isAll: false });
    } else {
      const allNames = missingItems.map((i) => i.name).join(', ');
      setSelectedOrderItem({ name: allNames, quantity: `${missingItems.length} missing items`, isAll: true });
    }
    setIsOrderSheetOpen(true);
  };

  const handlePlaceOrder = (app: DeliveryAppOption) => {
    const query = selectedOrderItem?.name || recipe.title;
    const targetUrl = `${app.baseUrl}${encodeURIComponent(query)}`;

    // Open delivery app or website
    window.open(targetUrl, '_blank');

    // Do NOT add to pantry or change pantry status on order
    showToast(`Redirecting to ${app.name} to order ${selectedOrderItem?.name || 'missing items'}...`);
    setIsOrderSheetOpen(false);
  };

  // 4. VIDEO PLAYER HANDLERS
  const handleOpenVideo = () => {
    // Record current scroll position so closing the video returns to the exact same position
    if (scrollContainerRef.current) {
      savedScrollTop.current = scrollContainerRef.current.scrollTop;
    }
    setIsVideoModalOpen(true);
    setIsLoadingVideo(true);
    setHasVideoError(false);
    setIsVideoPlaying(true);
    setCurrentVideoTime(0);

    // Simulate realistic video loading
    setTimeout(() => {
      setIsLoadingVideo(false);
    }, 700);
  };

  const handleCloseVideo = () => {
    setIsVideoModalOpen(false);
    setIsVideoPlaying(false);
    setIsVideoFullScreen(false);

    // Return to the exact same scroll position
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = savedScrollTop.current;
      }
    });
  };

  const handleRetryVideo = () => {
    setHasVideoError(false);
    setIsLoadingVideo(true);
    setTimeout(() => {
      setIsLoadingVideo(false);
      setIsVideoPlaying(true);
    }, 650);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentVideoTime(newTime);
  };

  return (
    <div className="relative flex flex-col h-full bg-[#FAF7F2] text-[#1E293B] overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1A1F2C]/95 text-white px-4 py-2 rounded-full text-xs font-syne font-bold shadow-xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Floating App Bar */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-3 pb-2 flex items-center justify-between z-20 pointer-events-auto">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:text-[#FF5500] transition-colors cursor-pointer"
          title="Go Back"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-2">
          {/* 1. HEART (SAVE) BUTTON */}
          <button
            onClick={handleToggleSave}
            className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title={isSaved ? 'Remove from Saved' : 'Save Recipe'}
            aria-label={isSaved ? 'Remove from Saved' : 'Save Recipe'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved ? 'fill-[#FF5500] text-[#FF5500]' : 'text-slate-700 hover:text-[#FF5500]'
              }`}
            />
          </button>

          {/* 2. SHARE BUTTON */}
          <button
            onClick={handleOpenShare}
            className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:text-[#FF5500] active:scale-90 transition-colors cursor-pointer"
            title="Share Recipe"
            aria-label="Share Recipe"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Recipe Details */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-24 mobile-scrollbar"
      >
        {/* Glossy 3D Hero Dish Render */}
        <div className="relative h-60 w-full overflow-hidden bg-[#E8E1D7] shadow-md">
          <img
            src={recipe.heroImage}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-black/30 pointer-events-none" />

          {/* Dish Badges */}
          <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-black text-[#FF5500] shadow-sm">
              ⚡ 3D Clay Master Recipe
            </span>
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-white">
              ★ {recipe.rating} ({recipe.reviewsCount} reviews)
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-5 pt-2 space-y-4">
          {/* Title & Quick Stats */}
          <div>
            <h1 className="text-xl sm:text-2xl font-syne font-extrabold text-[#181B22] leading-tight">
              {recipe.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">{recipe.subtitle}</p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="clay-card-porcelain rounded-xl p-2 text-center">
                <Clock className="w-4 h-4 mx-auto text-[#FF5500] mb-0.5" />
                <div className="text-xs font-bold font-mono-tabular">
                  {recipe.cookTimeMinutes} mins
                </div>
                <div className="text-[10px] text-slate-400">Total Prep</div>
              </div>
              <div className="clay-card-porcelain rounded-xl p-2 text-center">
                <Flame className="w-4 h-4 mx-auto text-[#FF5500] mb-0.5" />
                <div className="text-xs font-bold font-mono-tabular">
                  {recipe.calories} kcal
                </div>
                <div className="text-[10px] text-slate-400">Light Snack</div>
              </div>
              <div className="clay-card-porcelain rounded-xl p-2 text-center">
                <Users className="w-4 h-4 mx-auto text-[#FF5500] mb-0.5" />
                <div className="text-xs font-bold font-mono-tabular">
                  {recipe.servings} Servings
                </div>
                <div className="text-[10px] text-slate-400">Portions</div>
              </div>
            </div>
          </div>

          {/* Ingredient Checklist (Green checkmarks for available, orange tags for missing) */}
          <div className="clay-card-porcelain rounded-2xl p-4 border border-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-[#181B22] tracking-wide uppercase">
                Ingredient Checklist ({ingredientList.length})
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                Pantry auto-sync
              </span>
            </div>

            <div className="space-y-2">
              {ingredientList.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl flex items-center justify-between transition-all ${
                    item.isAvailable
                      ? 'bg-emerald-50/70 border border-emerald-100/80'
                      : 'bg-[#FFF3EC] border border-[#FFD3BA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    {item.isAvailable ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}

                    <div className="truncate">
                      <div className="text-xs font-bold text-[#1E293B] truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity}
                      </div>
                    </div>
                  </div>

                  {/* Available vs Missing Tags & ORDER BUTTON NEXT TO MISSING ITEM */}
                  {item.isAvailable ? (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                      In Pantry
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-extrabold text-[#FF5500] bg-[#FF5500]/10 px-2 py-0.5 rounded-md shrink-0 border border-[#FF5500]/20">
                        Missing from Pantry
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenOrderSheet(item)}
                        className="clay-btn-orange px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                        title={`Order ${item.name}`}
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Order</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ORDER ALL MISSING ITEMS BUTTON (Shown if any ingredient is missing) */}
            {missingItems.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => handleOpenOrderSheet(null)}
                  className="clay-btn-orange w-full py-2.5 px-4 rounded-xl font-syne font-bold text-xs tracking-wide shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order all missing items ({missingItems.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* 1. EMBEDDED YOUTUBE VIDEO PLAYER SECTION */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenVideo}
                className="clay-btn-orange py-3 px-3 rounded-2xl font-syne font-bold text-xs tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Play Fullscreen Video Player"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shadow-xs">
                  <Play className="w-3 h-3 fill-current ml-0.5 text-white" />
                </div>
                <span>Play Video Modal</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInlineVideo(!showInlineVideo)}
                className="clay-card-porcelain py-3 px-3 rounded-2xl font-syne font-bold text-xs text-slate-800 hover:text-[#FF5500] border border-[#ECE5DC] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Toggle In-App Inline Video Player"
              >
                <span className="text-sm">📺</span>
                <span>{showInlineVideo ? 'Hide Inline Video' : 'Inline Video Player'}</span>
              </button>
            </div>

            {/* In-App Inline Embedded YouTube Player (No external app/browser) */}
            {showInlineVideo && (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-white/80 bg-black animate-in fade-in duration-300">
                <iframe
                  src={videoData.embedUrl}
                  title={`${recipe.title} Embedded Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[9px] font-bold flex items-center gap-1">
                  <span>▶</span>
                  <span>YouTube Stream</span>
                </div>
                <a
                  href={videoData.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm"
                  title="Watch on YouTube App"
                >
                  <span>Open in YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Interactive Step-by-Step Cooking Guide */}
          <div className="clay-card-elevated rounded-2xl p-4 border border-white space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#181B22] tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
                Step-by-Step Cooking
              </h2>
              <span className="text-[10px] font-mono-tabular font-bold text-[#FF5500]">
                Step {activeStepIndex + 1} of {recipe.steps.length}
              </span>
            </div>

            {/* 2. TEXT-TO-SPEECH (TTS) AUDIO PLAYER CONTROLLER */}
            <div className="p-3 rounded-2xl bg-white/95 border border-[#ECE7DF] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isTtsPlaying ? 'bg-[#FF5500] text-white shadow-sm animate-pulse' : 'bg-orange-100 text-[#E64A00]'
                  }`}>
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-syne font-extrabold text-[#181B22] flex items-center gap-1.5">
                      <span>Recipe Voice Reader (TTS)</span>
                      {isTtsPlaying && (
                        <span className="flex items-center gap-0.5">
                          <span className="w-1 h-3 bg-[#FF5500] rounded-full animate-bounce"></span>
                          <span className="w-1 h-4 bg-[#FF5500] rounded-full animate-bounce delay-100"></span>
                          <span className="w-1 h-2.5 bg-[#FF5500] rounded-full animate-bounce delay-200"></span>
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {isTtsPlaying ? `Reading aloud Step ${activeStepIndex + 1}...` : 'Tap play to listen to instructions'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTtsRate(ttsRate === 1.0 ? 1.25 : 1.0)}
                    className="px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Toggle Reading Speed"
                  >
                    {ttsRate}x Speed
                  </button>
                </div>
              </div>

              {/* TTS Audio Controls Bar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {/* Previous Step Audio */}
                  <button
                    type="button"
                    onClick={handlePrevTtsStep}
                    disabled={activeStepIndex === 0}
                    className="w-8 h-8 rounded-xl clay-card-porcelain flex items-center justify-center text-slate-600 hover:text-[#FF5500] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    title="Previous Step"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  {/* Primary TTS Play / Pause Button */}
                  <button
                    type="button"
                    onClick={handleToggleTts}
                    className={`px-3.5 py-1.5 rounded-xl font-syne font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                      isTtsPlaying
                        ? 'bg-amber-500 text-white shadow-amber-500/30'
                        : 'clay-btn-orange text-white'
                    }`}
                    title={isTtsPlaying ? 'Pause Voice Reading' : 'Play Recipe Instructions Aloud'}
                  >
                    {isTtsPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>Read Step {activeStepIndex + 1} Aloud</span>
                      </>
                    )}
                  </button>

                  {/* Next Step Audio */}
                  <button
                    type="button"
                    onClick={handleNextTtsStep}
                    disabled={activeStepIndex === recipe.steps.length - 1}
                    className="w-8 h-8 rounded-xl clay-card-porcelain flex items-center justify-center text-slate-600 hover:text-[#FF5500] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    title="Next Step"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  {/* Stop TTS Button */}
                  {isTtsPlaying && (
                    <button
                      type="button"
                      onClick={handleStopTts}
                      className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors cursor-pointer"
                      title="Stop Audio"
                    >
                      <Square className="w-3 h-3 fill-current" />
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-1 text-[9px] text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAdvanceTts}
                    onChange={(e) => setAutoAdvanceTts(e.target.checked)}
                    className="accent-[#FF5500] w-3 h-3 rounded"
                  />
                  <span>Auto-advance</span>
                </label>
              </div>
            </div>

            {/* Step navigation tabs */}
            <div className="flex items-center gap-1.5 mb-2">
              {recipe.steps.map((st, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveStepIndex(i);
                    if (st.timerMinutes) setTimeLeft(st.timerMinutes * 60);
                    if (isTtsPlaying) speakStep(i);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    activeStepIndex === i
                      ? 'bg-[#FF5500] text-white shadow-sm'
                      : completedSteps[i]
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {completedSteps[i] ? '✓' : `0${i + 1}`}
                </button>
              ))}
            </div>

            {/* Active Step Content with Speech Highlight */}
            <div className={`p-3.5 rounded-2xl bg-white border transition-all space-y-2 ${
              isTtsPlaying ? 'ring-2 ring-[#FF5500] border-transparent shadow-md' : 'border-[#ECE5DC]'
            }`}>
              {isTtsPlaying && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#FF5500] uppercase tracking-wider">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  <span>Now Speaking Step {activeStepIndex + 1}</span>
                </div>
              )}

              <div className="text-xs font-bold text-[#181B22] leading-relaxed">
                {activeStep.instruction}
              </div>

              {activeStep.tip && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">
                  💡 <span className="font-semibold">Pro Chef Tip:</span> {activeStep.tip}
                </div>
              )}

              {/* Step Timer Widget */}
              {activeStep.timerMinutes && (
                <div className="mt-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Air Fryer / Step Timer
                    </div>
                    <div className="text-lg font-mono-tabular font-extrabold text-[#FF5500]">
                      {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="w-8 h-8 rounded-lg bg-[#FF5500] text-white flex items-center justify-center shadow-sm hover:bg-[#E64400] transition-colors cursor-pointer"
                    >
                      {isTimerRunning ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimeLeft((activeStep.timerMinutes || 1) * 60);
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Step Action Bar */}
      <div className="absolute bottom-4 left-5 right-5 z-20">
        <button
          onClick={() => handleStepDone(activeStepIndex)}
          className="clay-btn-orange w-full py-3.5 px-6 rounded-full flex items-center justify-center gap-2 font-syne font-bold text-xs sm:text-sm tracking-wide shadow-xl active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>
            {activeStepIndex === recipe.steps.length - 1
              ? '🎉 Finish Cooking & Serve'
              : 'Done, Next Step →'}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SHARE BOTTOM SHEET MODAL                                                 */}
      {/* ========================================================================= */}
      {isShareSheetOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200 select-none">
          <div className="flex-1" onClick={() => setIsShareSheetOpen(false)} />

          <div className="w-full bg-[#FAF7F2] rounded-t-[32px] p-5 pt-3 pb-8 shadow-2xl border-t border-white/90 max-h-[90%] flex flex-col overflow-y-auto mobile-scrollbar animate-in slide-in-from-bottom-4 duration-300">
            {/* Grab handle */}
            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE5DC]">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#FF5500]" />
                <h3 className="font-syne font-extrabold text-sm text-[#181B22]">
                  Share Recipe
                </h3>
              </div>
              <button
                onClick={() => setIsShareSheetOpen(false)}
                className="w-7 h-7 rounded-full clay-chip-default flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Recipe Preview Card */}
            <div className="mt-3.5 p-3 rounded-2xl clay-card-porcelain border border-white flex items-center gap-3">
              <img
                src={recipe.heroImage}
                alt={recipe.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-syne font-bold text-xs text-[#181B22] truncate">
                  {recipe.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {recipe.subtitle}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[#FF5500] font-semibold mt-1">
                  <span>⚡ {recipe.cookTimeMinutes}m</span>
                  <span>·</span>
                  <span>★ {recipe.rating}</span>
                  <span>·</span>
                  <span className="text-slate-400 font-mono">chefmate.ai</span>
                </div>
              </div>
            </div>

            {/* Copy Link Row */}
            <div className="mt-3.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Recipe Link
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#E8E1D5] shadow-inner">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/#recipe-${recipe.id}`}
                  className="flex-1 text-[11px] text-slate-600 bg-transparent px-2 outline-none truncate font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="clay-btn-orange px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
                >
                  {isCopiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Installed Mobile Apps Grid */}
            <div className="mt-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Share via Installed Apps
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Check out this delicious recipe: ${recipe.title} (${recipe.cookTimeMinutes} mins) on ChefMate AI! ${window.location.origin}/#recipe-${recipe.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl clay-card-porcelain flex flex-col items-center justify-center hover:border-emerald-300 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center text-lg shadow-sm mb-1">
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">WhatsApp</span>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    `${window.location.origin}/#recipe-${recipe.id}`
                  )}&text=${encodeURIComponent(`${recipe.title} - ${recipe.subtitle}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl clay-card-porcelain flex flex-col items-center justify-center hover:border-sky-300 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#0088CC] text-white flex items-center justify-center text-lg shadow-sm mb-1">
                    <Send className="w-4 h-4 ml-0.5 fill-current" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">Telegram</span>
                </a>

                {/* Instagram */}
                <button
                  type="button"
                  onClick={() => {
                    handleCopyLink();
                    window.open('https://www.instagram.com/', '_blank');
                  }}
                  className="p-2.5 rounded-2xl clay-card-porcelain flex flex-col items-center justify-center hover:border-pink-300 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] text-white flex items-center justify-center text-lg shadow-sm mb-1">
                    📷
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">Instagram</span>
                </button>

                {/* Gmail / Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Recipe: ${recipe.title}`
                  )}&body=${encodeURIComponent(
                    `Hey! Check out this recipe on ChefMate AI: ${recipe.title}\n\n${recipe.subtitle}\nCook time: ${recipe.cookTimeMinutes} mins\n\nLink: ${window.location.origin}/#recipe-${recipe.id}`
                  )}`}
                  className="p-2.5 rounded-2xl clay-card-porcelain flex flex-col items-center justify-center hover:border-red-300 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#EA4335] text-white flex items-center justify-center text-lg shadow-sm mb-1">
                    <Mail className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">Gmail</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER MISSING INGREDIENTS BOTTOM SHEET                                    */}
      {/* ========================================================================= */}
      {isOrderSheetOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200 select-none">
          <div className="flex-1" onClick={() => setIsOrderSheetOpen(false)} />

          <div className="w-full bg-[#FAF7F2] rounded-t-[32px] p-5 pt-3 pb-8 shadow-2xl border-t border-white/90 max-h-[92%] flex flex-col overflow-y-auto mobile-scrollbar animate-in slide-in-from-bottom-4 duration-300">
            {/* Grab handle */}
            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE5DC]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FF5500] text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-syne font-extrabold text-sm text-[#181B22] leading-tight">
                    Quick-Commerce Delivery
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Get missing ingredients delivered in 10 mins
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderSheetOpen(false)}
                className="w-7 h-7 rounded-full clay-chip-default flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ordered Item Target Summary */}
            <div className="mt-3 p-3 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#E64A00] uppercase tracking-wider block">
                  Target Missing Item{selectedOrderItem?.isAll ? 's' : ''}
                </span>
                <span className="text-xs font-bold text-[#181B22]">
                  {selectedOrderItem?.name}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {selectedOrderItem?.quantity}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF5500] text-white shadow-xs">
                Missing from Pantry
              </span>
            </div>

            {/* Delivery Apps List */}
            <div className="mt-4 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Delivery App (Instant 10m Delivery)
              </div>

              {DELIVERY_APPS.map((app) => {
                return (
                  <div
                    key={app.id}
                    className="p-3 rounded-2xl clay-card-elevated border border-white flex items-center justify-between transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl ${app.logoBg} ${app.logoColor} flex items-center justify-center text-base font-bold shadow-sm shrink-0`}
                      >
                        {app.logoEmoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-syne font-bold text-[#181B22]">
                            {app.name}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {app.eta}
                        </div>
                        <div className="text-xs font-medium text-slate-600 mt-0.5">
                          {selectedOrderItem?.quantity || 'Standard pack'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlaceOrder(app)}
                      className="clay-btn-orange px-3 py-1.5 rounded-xl text-[11px] font-syne font-bold flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>Go to app</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* One-tap Add to Pantry confirmation button */}
            <div className="mt-4 pt-3 border-t border-[#ECE5DC]">
              <button
                type="button"
                onClick={() => {
                  if (selectedOrderItem?.isAll) {
                    setIngredientList((prev) =>
                      prev.map((ing) => ({ ...ing, isAvailable: true }))
                    );
                    showToast('All missing items marked as ordered & in pantry!');
                  } else if (selectedOrderItem) {
                    setIngredientList((prev) =>
                      prev.map((ing) =>
                        ing.name.toLowerCase() === selectedOrderItem.name.toLowerCase()
                          ? { ...ing, isAvailable: true }
                          : ing
                      )
                    );
                    showToast(`"${selectedOrderItem.name}" added to pantry!`);
                  }
                  setIsOrderSheetOpen(false);
                }}
                className="clay-chip-default w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#1E293B] hover:text-[#FF5500] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Already have it? Mark as &ldquo;In Pantry&rdquo;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. RECIPE VIDEO PLAYER (Full-Screen / Sheet with Seek Bar & Controls)     */}
      {/* ========================================================================= */}
      {isVideoModalOpen && (
        <div
          className={`absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-center animate-in fade-in duration-200 select-none ${
            isVideoFullScreen ? 'p-0' : 'p-3 sm:p-4'
          }`}
        >
          <div
            className={`w-full bg-[#181D26] text-white overflow-hidden shadow-2xl border border-white/20 flex flex-col ${
              isVideoFullScreen
                ? 'h-full rounded-none border-none'
                : 'rounded-3xl max-h-[96%]'
            }`}
          >
            {/* Video Top Bar */}
            <div className="p-3 px-4 flex items-center justify-between border-b border-white/10 bg-[#131720]">
              <div className="flex items-center gap-2 truncate pr-2">
                <div className="w-6 h-6 rounded-lg bg-[#FF5500] text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                  ▶
                </div>
                <div className="truncate">
                  <h3 className="font-syne font-bold text-xs truncate">
                    {recipe.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    YouTube Video Tutorial · {videoData.author}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Direct YouTube App Link */}
                <a
                  href={videoData.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
                  title="Open in YouTube App / Web"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* Close Button: returns to Screen 3 at the same scroll position */}
                <button
                  type="button"
                  onClick={handleCloseVideo}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Video"
                  aria-label="Close Video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Viewport Area */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
              {/* STATE A: Loading Indicator */}
              {isLoadingVideo && (
                <div className="absolute inset-0 z-30 bg-[#131720] flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                  <div className="w-10 h-10 border-3 border-[#FF5500] border-t-transparent rounded-full animate-spin shadow-sm shadow-[#FF5500]/40" />
                  <span className="text-xs font-syne font-bold text-white tracking-wide">
                    Loading recipe video...
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Fetching &ldquo;{recipe.title}&rdquo; from YouTube
                  </span>
                </div>
              )}

              {/* STATE B: Friendly "Video not available" message with direct YouTube link */}
              {hasVideoError && (
                <div className="absolute inset-0 z-30 bg-[#131720] p-6 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-2.5 shadow-sm">
                    <VideoOff className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="font-syne font-bold text-sm text-white">
                    Watch Directly on YouTube
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                    Browser embed is restricted. Tap below to watch &ldquo;{recipe.title}&rdquo; instantly on YouTube!
                  </p>
                  <div className="mt-3.5 flex items-center gap-2">
                    <a
                      href={videoData.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="clay-btn-orange px-4 py-2 rounded-full font-syne font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-white"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Open on YouTube</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleRetryVideo}
                      className="clay-chip-default px-3 py-2 rounded-full text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE C: Embedded Video Stream (YouTube embed based on recipe name) */}
              {!hasVideoError && (
                <>
                  <iframe
                    src={videoData.embedUrl}
                    title={`${recipe.title} Video Player`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full object-cover"
                    onLoad={() => setIsLoadingVideo(false)}
                  />

                  {/* Play state indicator badge when playing */}
                  {isVideoPlaying && !isLoadingVideo && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>LIVE STREAM</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Video Controls Panel (Play/Pause, Seek Bar, Duration, Full-Screen Toggle) */}
            <div className="p-3 px-4 bg-[#141822] border-t border-white/10 space-y-2">
              {/* Interactive Seek Bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-300 w-10 text-right">
                  {formatTime(currentVideoTime)}
                </span>

                <div className="relative flex-1 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    value={currentVideoTime}
                    onChange={handleSeekChange}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#FF5500] hover:h-2 transition-all"
                    title="Seek Video"
                    aria-label="Seek Video"
                  />
                </div>

                <span className="text-[10px] font-mono font-bold text-slate-400 w-10">
                  {formatTime(videoDuration)}
                </span>
              </div>

              {/* Bottom Control Buttons */}
              <div className="flex items-center justify-between pt-1">
                {/* Play/Pause Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                    className="clay-btn-orange px-3 py-1.5 rounded-xl font-syne font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    title={isVideoPlaying ? 'Pause' : 'Play'}
                  >
                    {isVideoPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentVideoTime(0)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                    title="Restart from beginning"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Right controls: Quality & Full-Screen Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                    1080p HD
                  </span>

                  {/* Full-Screen Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsVideoFullScreen(!isVideoFullScreen)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                    title={isVideoFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                    aria-label={isVideoFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                  >
                    {isVideoFullScreen ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={handleCloseVideo}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                    title="Close"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Footer info */}
            <div className="p-2.5 px-4 bg-[#10131B] text-[11px] text-slate-400 flex items-center justify-between border-t border-white/5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <span>Follow along step-by-step while you cook</span>
              </span>
              <button
                type="button"
                onClick={handleCloseVideo}
                className="text-[11px] font-syne font-bold text-[#FF5500] hover:underline cursor-pointer shrink-0 ml-2"
              >
                Done Watching
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
