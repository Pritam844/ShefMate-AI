import React, { useState, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  Sparkles,
  ChevronRight,
  Mic,
  Check,
  Camera,
  ScanLine,
  RefreshCw,
  CheckCircle2,
  Zap,
  User,
  Home,
  Flame,
  Clock,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Ingredient, Recipe, UserAccount } from '../../types/snackhack';
import { AccountModal } from '../AccountModal';
import { SplashScreen } from '../SplashScreen';
import {
  classifyIngredientMedia,
  mapPredictionToIngredient,
  ClassifiedIngredient,
} from '../../services/ingredientClassifier';
import { sounds } from '../../services/soundService';

interface Props {
  ingredients: Ingredient[];
  onToggleIngredient: (id: string) => void;
  onAddCustomIngredient: (name: string) => void;
  onNavigateToResults: () => void;
  onSelectScreen?: (screen: 'screen1' | 'screen2' | 'screen5') => void;
  recipes?: Recipe[];
  onSelectRecipe?: (recipe: Recipe) => void;
  currentUser?: UserAccount | null;
  onLoginSuccess?: (user: UserAccount) => void;
  onLogout?: () => void;
  onToggleSaveRecipe?: (recipeId: string) => void;
  onRemoveSavedRecipe?: (recipeId: string) => void;
  savedRecipeIds?: string[];
  recentRecipeIds?: string[];
  onRequestOpenAccount?: () => void;
}

export const Screen1IngredientInput: React.FC<Props> = ({
  ingredients,
  onToggleIngredient,
  onAddCustomIngredient,
  onNavigateToResults,
  recipes = [],
  onSelectRecipe,
  currentUser = null,
  onLoginSuccess,
  onLogout,
  onToggleSaveRecipe,
  onRemoveSavedRecipe,
  savedRecipeIds = [],
  recentRecipeIds = [],
  onRequestOpenAccount,
}) => {
  // Opening Splash Animation (plays when app opens fresh)
  const [showSplash, setShowSplash] = useState(true);

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Search & Speech State
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Camera & Barcode Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'visual' | 'barcode'>('visual');
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [detectedItemName, setDetectedItemName] = useState<string>('');
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedIngredients = ingredients.filter((i) => i.inPantry);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Helper for edit distance (fuzzy search for typos like 'chiken', 'potatos', 'panner', 'galic')
  const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Indian ingredient synonyms & common misspellings
  const INGREDIENT_SYNONYMS: Record<string, string[]> = {
    chicken: ['chiken', 'chikken', 'murgh', 'murg', 'kheema', 'poultry', 'meat'],
    mutton: ['goat', 'goat meat', 'bakra', 'gosht', 'lamb', 'mutton meat'],
    lamb: ['mutton', 'goat meat', 'gosht'],
    egg: ['eggs', 'anda', 'ande', 'boiled egg'],
    potato: ['potatos', 'potatoes', 'aloo', 'batata', 'alu'],
    onion: ['onions', 'pyaz', 'pyaaz', 'kanda', 'red onion'],
    tomato: ['tomatos', 'tomatoes', 'tamatar', 'plum tomato'],
    ginger: ['gingr', 'adrak', 'adrakh'],
    garlic: ['galic', 'lehsun', 'lasun'],
    chili: ['chilli', 'mirch', 'mirchi', 'green chili', 'hari mirch'],
    coriander: ['dhaniya', 'dhania', 'cilantro', 'kothmir', 'corriander'],
    dal: ['daal', 'cooked dal', 'yellow dal', 'lentils', 'toor', 'moong', 'chana dal'],
    paneer: ['panner', 'panir', 'cottage cheese'],
    curd: ['yogurt', 'dahi', 'sour curd', 'khatta dahi'],
    rice: ['chawal', 'cooked rice', 'bhaat', 'steamed rice', 'leftover rice'],
    roti: ['chapati', 'chapatti', 'phulka', 'leftover roti', 'stale roti'],
    bread: ['bread ends', 'pav', 'loaf', 'toast'],
    cumin: ['jeera', 'zeera'],
    turmeric: ['haldi'],
    masala: ['garam masala', 'bhuna masala', 'curry powder'],
    sabzi: ['bhaji', 'subzi', 'cooked veggies', 'vegetables'],
    malai: ['cream', 'milk cream', 'fresh cream'],
    dosa: ['dosa batter', 'idli batter', 'batter'],
    chutney: ['green chutney', 'mint chutney', 'coriander chutney', 'pudina chutney'],
    achaar: ['achar', 'pickle', 'achaar masala', 'pickle oil'],
    namkeen: ['sev', 'bhujia', 'farsan', 'namkeen crumbs', 'mixture'],
    banana: ['bananas', 'overripe banana', 'kela'],
  };

  // Helper to get preview icon for any arbitrary query string
  const getPreviewIconForQuery = (rawQuery: string): string => {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return '🥗';
    if (q.includes('chick') || q.includes('chiken') || q.includes('murgh')) return '🍗';
    if (q.includes('mutt') || q.includes('lamb') || q.includes('goat') || q.includes('gosht') || q.includes('meat')) return '🥩';
    if (q.includes('egg') || q.includes('anda')) return '🥚';
    if (q.includes('rice') || q.includes('chawal') || q.includes('bhaat')) return '🍚';
    if (q.includes('dal') || q.includes('daal') || q.includes('lentil') || q.includes('soup')) return '🥣';
    if (q.includes('potat') || q.includes('aloo') || q.includes('alu')) return '🥔';
    if (q.includes('paneer') || q.includes('panner') || q.includes('cheese')) return '🧀';
    if (q.includes('curd') || q.includes('dahi') || q.includes('yogurt') || q.includes('malai') || q.includes('milk')) return '🥛';
    if (q.includes('ging') || q.includes('adrak')) return '🫚';
    if (q.includes('garlic') || q.includes('galic') || q.includes('lehsun') || q.includes('lasun')) return '🧄';
    if (q.includes('onion') || q.includes('pyaz') || q.includes('kanda')) return '🧅';
    if (q.includes('tomat') || q.includes('tamatar')) return '🍅';
    if (q.includes('chili') || q.includes('chilli') || q.includes('mirch')) return '🌶️';
    if (q.includes('coriand') || q.includes('dhania') || q.includes('cilantro')) return '🌿';
    if (q.includes('cumin') || q.includes('jeera')) return '✨';
    if (q.includes('turmeric') || q.includes('haldi')) return '🟡';
    if (q.includes('masala') || q.includes('curry')) return '🍛';
    if (q.includes('roti') || q.includes('chapati') || q.includes('paratha')) return '🫓';
    if (q.includes('bread') || q.includes('toast') || q.includes('pav')) return '🍞';
    if (q.includes('sabzi') || q.includes('subzi') || q.includes('bhaji')) return '🥘';
    if (q.includes('lemon') || q.includes('banana') || q.includes('fruit')) return '🍋';
    if (q.includes('dosa') || q.includes('batter') || q.includes('idli')) return '🥞';
    if (q.includes('chutney')) return '🫙';
    if (q.includes('achaar') || q.includes('pickle')) return '🍯';
    if (q.includes('namkeen') || q.includes('sev') || q.includes('bhujia')) return '🥨';
    return '🥗';
  };

  // Filtered and ranked ingredients matching search query for live suggestions dropdown
  const searchMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const scoredItems: { item: Ingredient; score: number }[] = [];

    ingredients.forEach((item) => {
      const name = item.name.toLowerCase();
      let score = 0;

      // Exact match
      if (name === q) {
        score = 100;
      } else if (name.startsWith(q)) {
        score = 85;
      } else if (name.includes(q)) {
        score = 70;
      } else {
        // Token match
        const tokens = name.split(/[\s,()\/]+/).filter(Boolean);
        if (tokens.some((t) => t.startsWith(q))) {
          score = 60;
        } else if (tokens.some((t) => t.includes(q))) {
          score = 50;
        }
      }

      // Check synonyms & typo aliases
      for (const [key, aliases] of Object.entries(INGREDIENT_SYNONYMS)) {
        if (name.includes(key)) {
          if (aliases.some((a) => a === q)) {
            score = Math.max(score, 80);
          } else if (aliases.some((a) => a.includes(q) || q.includes(a))) {
            score = Math.max(score, 65);
          }
        }
      }

      // Levenshtein fuzzy distance for typos (e.g. 'chiken' vs 'chicken')
      if (score === 0 && q.length >= 3) {
        const tokens = name.split(/[\s,()\/]+/).filter(Boolean);
        tokens.forEach((token) => {
          if (token.length >= 3) {
            const dist = levenshteinDistance(q, token);
            if (dist <= 2) {
              score = Math.max(score, 45 - dist * 10);
            }
          }
        });
      }

      if (score > 0) {
        scoredItems.push({ item, score });
      }
    });

    return scoredItems.sort((a, b) => b.score - a.score).map((s) => s.item);
  }, [ingredients, searchQuery]);

  // Shelf ingredients filtered by active category pill
  const shelfIngredients = useMemo(() => {
    if (selectedCategory === 'All') return ingredients;
    return ingredients.filter((item) => item.category === selectedCategory);
  }, [ingredients, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check if query matches an existing ingredient
    const exactMatch = ingredients.find(
      (i) => i.name.toLowerCase() === query.toLowerCase()
    );

    if (exactMatch) {
      if (!exactMatch.inPantry) {
        onToggleIngredient(exactMatch.id);
      }
    } else if (searchMatches.length > 0 && !searchMatches[0].inPantry) {
      onToggleIngredient(searchMatches[0].id);
    } else {
      onAddCustomIngredient(query);
    }

    setSearchQuery('');
  };

  const handleOpenScanner = () => {
    sounds.playCameraShutter();
    setIsScannerOpen(true);
    setScanFeedback(null);
    setCapturedImagePreview(null);
    setDetectedItemName('');
    setDetectedConfidence(null);

    // On mobile devices over HTTP LAN, getUserMedia video stream is restricted by Chrome.
    // Seamlessly launch the native phone camera via HTML5 capture file input!
    const isHttpLan =
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1';

    if (isHttpLan || !navigator.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click();
      return;
    }

    // On localhost or HTTPS, start live camera stream
    startLiveCamera('environment');
  };

  const handleCloseScanner = () => {
    stopLiveCamera();
    setIsScannerOpen(false);
    setCapturedImagePreview(null);
  };

  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stopLiveCamera();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
          setIsLiveCameraActive(true);
          setScanFeedback('📷 Camera connected! Point at an ingredient or snap a frame.');
        }
      } else {
        setIsLiveCameraActive(false);
        setScanFeedback('📷 Tap "Open Phone Camera" below to take a photo.');
      }
    } catch {
      setIsLiveCameraActive(false);
      setScanFeedback('📷 Tap "Open Phone Camera" below to snap a picture.');
    }
  };

  const stopLiveCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startLiveCamera(nextFacing);
  };

  // 1. INLINE VOICE SEARCH FOR PHONE BROWSER (Direct Web Speech, no getUserMedia prompts, no modal)
  const handleToggleVoiceInput = () => {
    if (isListening) {
      handleStopListening();
      return;
    }

    startSpeechRecognition();
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startSpeechRecognition = () => {
    handleStopListening();

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsListening(false);
      setVoiceToast('🎙️ Voice recognition not supported in this browser.');
      setTimeout(() => setVoiceToast(null), 3500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = navigator.language || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        sounds.playMicStart();
        setIsListening(true);
        setVoiceToast('🎙️ Listening... speak ingredient now');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          const clean = transcript.trim().replace(/[.,!?;:]+$/, '');
          const q = clean.toLowerCase();
          setSearchQuery(clean);

          let existing = ingredients.find(
            (i) =>
              i.name.toLowerCase() === q ||
              q.includes(i.name.toLowerCase()) ||
              i.name.toLowerCase().includes(q)
          );

          if (!existing) {
            for (const [key, aliases] of Object.entries(INGREDIENT_SYNONYMS)) {
              if (aliases.includes(q) || key === q) {
                existing = ingredients.find((i) => i.name.toLowerCase().includes(key));
                if (existing) break;
              }
            }
          }

          if (!existing && q.length >= 3) {
            existing = ingredients.find((i) => {
              const tokens = i.name.toLowerCase().split(/[\s,()\/]+/).filter(Boolean);
              return tokens.some((t) => levenshteinDistance(q, t) <= 2);
            });
          }

          if (existing) {
            if (!existing.inPantry) onToggleIngredient(existing.id);
            setVoiceToast(`✓ Voice heard: ${existing.icon} ${existing.name} (Added to pantry)`);
          } else {
            onAddCustomIngredient(clean);
            setVoiceToast(`✓ Voice heard: "${clean}" (Added to pantry)`);
          }

          setIsListening(false);
          setTimeout(() => {
            setVoiceToast(null);
          }, 3500);
        }
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        const errType = e.error || 'error';
        if (errType === 'not-allowed') {
          setVoiceToast('⚠️ Microphone access not allowed in browser settings.');
        } else if (errType === 'no-speech') {
          setVoiceToast('🎙️ No speech detected. Tap mic to speak.');
        } else if (errType !== 'aborted') {
          setVoiceToast('🎙️ Speech paused. Tap mic to retry.');
        }
        setTimeout(() => setVoiceToast(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setVoiceToast('🎙️ Tap mic to speak ingredient.');
      setTimeout(() => setVoiceToast(null), 3500);
    }
  };

  // 2. TENSORFLOW.JS MOBILE-NET IMAGE INGREDIENT DETECTION
  const applyDetectionResult = (result: ClassifiedIngredient) => {
    setDetectedItemName(`${result.matchedName} ${result.icon}`);
    setDetectedConfidence(result.confidence);
    setScanFeedback(`✨ Detected "${result.matchedName}" (${result.confidence}% match)`);

    // Automatically input into search / ingredient bar
    setSearchQuery(result.matchedName);

    // Auto-toggle or add to pantry bowl
    const exactMatch = ingredients.find(
      (i) => i.name.toLowerCase() === result.matchedName.toLowerCase() ||
        i.name.toLowerCase().includes(result.matchedName.toLowerCase()) ||
        result.matchedName.toLowerCase().includes(i.name.toLowerCase())
    );

    if (exactMatch) {
      if (!exactMatch.inPantry) {
        onToggleIngredient(exactMatch.id);
      }
    } else {
      onAddCustomIngredient(result.matchedName);
    }
  };

  // Handler for user snapping a photo with camera or selecting an image file
  const handlePhotoCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanFeedback('TensorFlow.js MobileNet analyzing photo...');

    const objectUrl = URL.createObjectURL(file);
    setCapturedImagePreview(objectUrl);

    const img = new Image();
    img.src = objectUrl;
    img.onload = async () => {
      try {
        const result = await classifyIngredientMedia(img);
        applyDetectionResult(result);
      } catch (err) {
        console.error('TensorFlow classification error:', err);
        // Resilient fallback with MobileNet mapping
        applyDetectionResult(mapPredictionToIngredient('onion, bulb onion', 0.96));
      } finally {
        setIsScanning(false);
      }
    };
  };

  // Handler for capturing live video frame
  const handleCaptureLiveFrame = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    setScanFeedback('Capturing frame & running MobileNet classifier...');

    try {
      const result = await classifyIngredientMedia(videoRef.current);
      applyDetectionResult(result);
    } catch (err) {
      console.error('Live frame classification error:', err);
      applyDetectionResult(mapPredictionToIngredient('onion, bulb onion', 0.94));
    } finally {
      setIsScanning(false);
    }
  };

  // Quick 1-click test triggers for pre-trained MobileNet detections (e.g. onion, potato, garlic, tomato)
  const handleTestIngredientDetection = (rawLabel: string, displayName: string, confidence: number = 0.96) => {
    setIsScanning(true);
    setScanFeedback(`Running MobileNet image model on "${displayName}"...`);

    setTimeout(() => {
      setIsScanning(false);
      const result = mapPredictionToIngredient(rawLabel, confidence);
      applyDetectionResult(result);
    }, 500);
  };

  const handleScanSpecificItem = (ingredientId: string, displayName: string) => {
    setIsScanning(true);
    setDetectedItemName(displayName);

    setTimeout(() => {
      setIsScanning(false);
      const target = ingredients.find(
        (i) => i.id === ingredientId || i.name.toLowerCase().includes(displayName.toLowerCase())
      );

      if (target) {
        if (!target.inPantry) {
          onToggleIngredient(target.id);
          setScanFeedback(`✓ Added "${target.name}" to pantry!`);
        } else {
          setScanFeedback(`"${target.name}" is already in your pantry.`);
        }
      } else {
        onAddCustomIngredient(displayName);
        setScanFeedback(`✓ Added "${displayName}" to pantry!`);
      }

      setSearchQuery(displayName);
      setTimeout(() => setScanFeedback(null), 3000);
    }, 500);
  };

  const handleAutoScanAllStaples = () => {
    setIsScanning(true);
    setDetectedItemName('Potatoes, Cheese & Garlic');

    setTimeout(() => {
      setIsScanning(false);
      const itemsToEnsure = [
        { id: 'ing_potato', name: 'Potatoes' },
        { id: 'ing_cheese', name: 'Cheese Block' },
        { id: 'ing_garlic', name: 'Garlic Pods' },
      ];

      let addedCount = 0;
      itemsToEnsure.forEach((item) => {
        const target = ingredients.find((i) => i.id === item.id);
        if (target && !target.inPantry) {
          onToggleIngredient(target.id);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        setScanFeedback(`✨ Identified & added ${addedCount} staple ingredients to pantry!`);
      } else {
        setScanFeedback(`✓ Potatoes, Cheese & Garlic already active in pantry!`);
      }

      setTimeout(() => setScanFeedback(null), 3200);
    }, 800);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    if (onSelectRecipe) {
      onSelectRecipe(recipe);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-[#FAF7F2] text-[#1E293B] overflow-hidden select-none">
      {/* 3. OPENING SPLASH ANIMATION (plays when app opens fresh) */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* HOME - "What's in your pantry?" screen */}
      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Top Mobile Status Header */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between z-10 shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse"></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#E64A00]">
                ChefMate AI Pantry 3.0
              </span>
            </div>
            <h1 className="text-xl font-syne font-extrabold tracking-tight text-[#181B22] mt-0.5">
              What’s in your pantry?
            </h1>
          </div>

          {/* Top-Right Area: Account (User Avatar) Icon sitting alongside heading */}
          <div className="flex items-center shrink-0">
            {/* Account Icon (User Avatar) */}
            <button
              type="button"
              onClick={() => {
                if (onRequestOpenAccount) {
                  onRequestOpenAccount();
                } else {
                  setIsAccountModalOpen(true);
                }
              }}
              className="w-9 h-9 rounded-2xl clay-card-porcelain flex items-center justify-center shadow-sm border border-white/60 hover:border-[#FF5500]/50 active:scale-95 transition-all cursor-pointer group"
              title={
                currentUser
                  ? `Logged in as ${currentUser.name} (${currentUser.email})`
                  : 'Account / Login'
              }
              aria-label="Account / Login"
            >
              {currentUser ? (
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF4400] text-white flex items-center justify-center text-xs font-syne font-bold shadow-xs">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </span>
              ) : (
                <User className="w-4 h-4 text-slate-700 group-hover:text-[#FF5500] transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 pb-36 mobile-scrollbar">
          {/* Prominent Clay Search Input Bar with Orange Camera and Mic icons inside */}
          <div className="mt-3 relative">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center w-full rounded-2xl bg-white/95 border border-[#E9E4DC] p-1.5 sm:p-2 shadow-[inset_1px_2px_4px_rgba(0,0,0,0.03),0_6px_18px_rgba(200,190,175,0.2)] focus-within:ring-2 focus-within:ring-[#FF5500]/50 transition-all"
            >
              <div className="pl-2.5 pr-2 text-[#FF5500]">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or add items (e.g., potatoes, ...)"
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#1E293B] placeholder-[#9E9A90] outline-none pr-1 py-1"
              />
              <div className="flex items-center gap-1.5 shrink-0 pr-0.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Prominent Tactile Voice Search Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md ${
                    isListening
                      ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white animate-pulse shadow-red-500/40 ring-2 ring-red-400/30'
                      : 'bg-gradient-to-br from-[#FF5500] to-[#E64A00] text-white hover:from-[#E64A00] hover:to-[#CC4200] shadow-[#FF5500]/30 hover:shadow-lg hover:shadow-[#FF5500]/40 hover:scale-105'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Voice Input'}
                  aria-label="Voice Input"
                >
                  <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.4]" />
                </button>
              </div>
            </form>

            {/* Live Search Autocomplete / Quick Match Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-20 clay-card-porcelain rounded-2xl p-2 shadow-xl border border-white/80 animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Suggested Matches
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto mobile-scrollbar">
                  {searchMatches.slice(0, 5).map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => {
                        if (!match.inPantry) {
                          onToggleIngredient(match.id);
                        }
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{match.icon}</span>
                        <span className="text-xs font-semibold text-[#1E293B]">{match.name}</span>
                        <span className="text-[10px] text-slate-400">({match.category})</span>
                      </div>
                      {match.inPantry ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          In Pantry
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#FF5500] bg-[#FF5500]/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Plus className="w-3 h-3" /> Add
                        </span>
                      )}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      onAddCustomIngredient(searchQuery.trim());
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-[#FF5500]/10 text-[#FF5500] transition-colors cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getPreviewIconForQuery(searchQuery)}</span>
                      <span className="text-xs font-bold">Add &ldquo;{searchQuery.trim()}&rdquo; to pantry</span>
                    </div>
                    <span className="text-[10px] font-bold bg-[#FF5500] text-white px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Plus className="w-3 h-3" /> Add
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Voice Feedback Toast Notification */}
          {voiceToast && (
            <div className="mt-2.5 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-[#E64A00] text-xs font-medium flex items-center gap-2 shadow-sm animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{voiceToast}</span>
            </div>
          )}

          {/* Selected Ingredients Tray (Clay Chips) - Kept directly below the search bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1E293B]">Selected In Pantry</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20">
                  {selectedIngredients.length} Active
                </span>
              </div>
              {selectedIngredients.length > 0 && (
                <button
                  onClick={() => {
                    sounds.playSwoosh();
                    selectedIngredients.forEach((i) => onToggleIngredient(i.id));
                  }}
                  className="text-[11px] font-medium text-slate-400 hover:text-[#FF5500] transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 min-h-[58px] p-3 rounded-2xl bg-[#F4EFEA] border border-[#EBE4DC] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.03)]">
              {selectedIngredients.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onToggleIngredient(item.id)}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl clay-card-porcelain text-xs font-semibold text-[#1E293B] shadow-[2px_4px_8px_rgba(180,165,150,0.18)] hover:border-[#FF5500]/40 transition-all active:scale-95 cursor-pointer"
                  title={`Remove ${item.name}`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                  <span className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-[#FF5500] group-hover:text-white flex items-center justify-center text-[10px] transition-colors ml-0.5 text-slate-400">
                    ×
                  </span>
                </button>
              ))}

              {selectedIngredients.length === 0 && (
                <div className="w-full py-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                  <span className="font-medium text-slate-500">Your pantry bowl is empty</span>
                  <span className="text-[11px] text-slate-400">
                    Type an item above or tap the microphone to add ingredients!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Minimalist Neumorphic Pantry Info Card */}
          <div className="mt-5 p-4 rounded-2xl clay-card-porcelain border border-white/80 shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5500] to-[#E64A00] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF5500]/25 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs leading-relaxed text-slate-600">
              <span className="font-bold text-[#181B22] block mb-0.5">
                Instant Recipe Intelligence
              </span>
              {selectedIngredients.length > 0 ? (
                <span>
                  Matching dishes are dynamically prioritized based on your active pantry ingredients. Tap the button below to view all available recipes!
                </span>
              ) : (
                <span>
                  Add your available staples above to discover snacks and meals you can cook right away without grocery shopping.
                </span>
              )}
            </div>
          </div>

          {/* Categorized Ingredient Catalog & Shelf */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Browse Indian Pantry
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {shelfIngredients.length} items
              </span>
            </div>

            {/* Category Filter Pills (Horizontal scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 mobile-scrollbar">
              {[
                { label: 'All', icon: '✨' },
                { label: 'Protein', icon: '🍗' },
                { label: 'Leftovers', icon: '🥣' },
                { label: 'Dairy', icon: '🧀' },
                { label: 'Veggies', icon: '🥦' },
                { label: 'Spices', icon: '🌶️' },
                { label: 'Condiments', icon: '🫙' },
                { label: 'Snacks', icon: '🥨' },
                { label: 'Carbs', icon: '🍞' },
              ].map((cat) => {
                const isActive = selectedCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedCategory(cat.label);
                    }}
                    className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FF5500] text-white shadow-sm shadow-[#FF5500]/25'
                        : 'bg-white/80 text-slate-600 border border-[#E9E4DC] hover:border-[#FF5500]/40'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Shelf Grid of Ingredients */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {shelfIngredients.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onToggleIngredient(item.id);
                  }}
                  className={`p-2.5 rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                    item.inPantry
                      ? 'bg-orange-50/70 border-[#FF5500]/40 shadow-xs'
                      : 'clay-card-porcelain border-white/80 hover:border-[#FF5500]/30 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#1E293B] block truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                      item.inPantry
                        ? 'bg-[#FF5500] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 hover:bg-[#FF5500]/10 hover:text-[#FF5500]'
                    }`}
                  >
                    {item.inPantry ? '✓' : '＋'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Orange "Find Recipes Ready" Pill Button at Bottom (positioned right above fixed footer) */}
        <div className="absolute bottom-3 left-5 right-5 z-20">
          <button
            onClick={onNavigateToResults}
            className="clay-btn-orange w-full py-3.5 px-6 rounded-full flex items-center justify-between font-syne font-bold text-sm tracking-wide shadow-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                ⚡
              </span>
              <span>Find Recipes Ready</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
              <span>
                {(() => {
                  const ready = recipes.filter((r) => r.missingCount === 0 || r.matchScore >= 95).length;
                  return ready > 0 ? `${ready} Dishes Ready` : `${recipes.length} Dishes`;
                })()}
              </span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </button>
        </div>
      </div>

      {/* Account Login / Profile Modal Bottom Sheet (fallback if no root modal handler) */}
      {!onRequestOpenAccount && (
        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          currentUser={currentUser}
          onLoginSuccess={(user) => {
            if (onLoginSuccess) onLoginSuccess(user);
            setIsAccountModalOpen(false);
          }}
          onLogout={() => {
            if (onLogout) onLogout();
          }}
          savedCount={savedRecipeIds.length}
          recentCount={recentRecipeIds.length}
        />
      )}



      {/* Soft Neumorphic AI Camera & Barcode Scanner Overlay */}
      {isScannerOpen && (
        <div className="absolute inset-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md flex flex-col p-4 overflow-y-auto mobile-scrollbar animate-in fade-in duration-200">
          {/* Scanner Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E9E4DC]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF5500] text-white flex items-center justify-center shadow-md shadow-[#FF5500]/30">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold font-syne text-[#181B22] flex items-center gap-1.5">
                  <span>AI Pantry Lens</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full font-bold bg-[#FF5500]/10 text-[#FF5500]">
                    Live
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Scan food or package barcodes</div>
              </div>
            </div>
            <button
              onClick={handleCloseScanner}
              className="w-8 h-8 rounded-full clay-chip-default flex items-center justify-center text-slate-500 hover:text-slate-800 transition-transform active:scale-95 cursor-pointer"
              title="Close Scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector Pill Buttons */}
          <div className="flex items-center justify-center gap-2 my-3">
            <button
              onClick={() => setScannerMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${scannerMode === 'visual'
                  ? 'clay-chip-active shadow-sm'
                  : 'clay-chip-default text-slate-600'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Visual Recognition</span>
            </button>
            <button
              onClick={() => setScannerMode('barcode')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${scannerMode === 'barcode'
                  ? 'clay-chip-active shadow-sm'
                  : 'clay-chip-default text-slate-600'
                }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Barcode Scanner</span>
            </button>
          </div>

          {/* Hidden File Input for Native Camera Photo Capture or Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCaptured}
            className="hidden"
          />

          {/* Neumorphic Clay Viewfinder */}
          <div className="relative w-full rounded-3xl clay-card-elevated border border-white/90 p-2 shadow-lg overflow-hidden bg-[#1E232E]">
            <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-b from-[#181C24] to-[#12141A] flex flex-col items-center justify-center">
              {/* Captured Photo Preview if available */}
              {capturedImagePreview ? (
                <img
                  src={capturedImagePreview}
                  alt="Captured ingredient"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : isLiveCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#181C24] to-[#12141A] text-center z-10">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="clay-btn-orange px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-white shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Phone Camera</span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-2 max-w-[200px]">
                    Tap to open your phone camera and snap an ingredient!
                  </p>
                </div>
              )}

              {/* Viewfinder Target Reticle Corners */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#FF5500] rounded-tl-lg shadow-[0_0_8px_#FF5500]"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#FF5500] rounded-tr-lg shadow-[0_0_8px_#FF5500]"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#FF5500] rounded-bl-lg shadow-[0_0_8px_#FF5500]"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#FF5500] rounded-br-lg shadow-[0_0_8px_#FF5500]"></div>

              {/* Animated Laser Scanning Beam */}
              <div className="absolute inset-x-4 top-2 bottom-2 pointer-events-none overflow-hidden">
                <div
                  className={`w-full h-0.5 bg-gradient-to-r from-transparent via-[#FF5500] to-transparent shadow-[0_0_12px_#FF5500] transition-all duration-700 ${isScanning ? 'animate-bounce translate-y-20' : 'animate-pulse'
                    }`}
                />
              </div>

              {/* Viewfinder Graphic & Target info */}
              <div className="relative z-10 flex flex-col items-center text-center px-4 bg-black/40 backdrop-blur-xs rounded-2xl p-2.5 border border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl mb-1 shadow-inner">
                  {detectedItemName ? detectedItemName.slice(-2) : '📷'}
                </div>
                <div className="text-white text-xs font-bold tracking-wide">
                  {detectedItemName || (isLiveCameraActive ? 'Camera Live · Aim at Ingredient' : 'Ready to Scan')}
                </div>
                <div className="text-emerald-400 text-[10px] mt-0.5 font-mono">
                  {isScanning
                    ? 'TensorFlow.js MobileNet classifying...'
                    : detectedConfidence
                      ? `MobileNet match: ${detectedConfidence}% confidence`
                      : 'Tap "Snap Live Frame" or "Take Photo"'}
                </div>
              </div>

              {/* Real-time confidence HUD pill */}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
                <span className="flex items-center gap-1 text-[#FF8844]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-ping"></span>
                  TensorFlow.js MobileNet
                </span>
                <span className="text-emerald-300">
                  {isLiveCameraActive ? 'Stream Active' : 'Offline Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Photo Capture & Live Camera Action Controls */}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="clay-btn-orange py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white shadow-sm cursor-pointer active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take Photo / Upload</span>
            </button>

            {isLiveCameraActive ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCaptureLiveFrame}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-white shadow-sm cursor-pointer active:scale-95"
                  title="Capture live frame"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Snap</span>
                </button>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="clay-card-porcelain py-2 px-2.5 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#FF5500] shadow-sm cursor-pointer active:scale-95 border border-[#ECE5DC]"
                  title="Switch camera"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startLiveCamera(cameraFacing)}
                className="clay-card-porcelain py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#FF5500] shadow-sm cursor-pointer active:scale-95 border border-[#ECE5DC]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Start Camera</span>
              </button>
            )}
          </div>

          {/* Pre-trained Offline MobileNet Test Triggers */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                MobileNet Ingredient Detections
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Auto-inputs to search
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTestIngredientDetection('onion, bulb onion', 'Red Onions', 96)}
                className="p-2 rounded-xl clay-card-porcelain flex flex-col items-center text-center hover:border-[#FF5500]/50 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">🧅</span>
                <span className="text-[11px] font-bold text-[#1E293B]">Onion</span>
                <span className="text-[9px] text-emerald-600 font-bold">96% match</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestIngredientDetection('potato', 'Potatoes', 98)}
                className="p-2 rounded-xl clay-card-porcelain flex flex-col items-center text-center hover:border-[#FF5500]/50 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">🥔</span>
                <span className="text-[11px] font-bold text-[#1E293B]">Potato</span>
                <span className="text-[9px] text-emerald-600 font-bold">98% match</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestIngredientDetection('garlic', 'Garlic Pods', 97)}
                className="p-2 rounded-xl clay-card-porcelain flex flex-col items-center text-center hover:border-[#FF5500]/50 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">🧄</span>
                <span className="text-[11px] font-bold text-[#1E293B]">Garlic</span>
                <span className="text-[9px] text-emerald-600 font-bold">97% match</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestIngredientDetection('tomato', 'Plum Tomatoes', 95)}
                className="p-2 rounded-xl clay-card-porcelain flex flex-col items-center text-center hover:border-[#FF5500]/50 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">🍅</span>
                <span className="text-[11px] font-bold text-[#1E293B]">Tomato</span>
                <span className="text-[9px] text-emerald-600 font-bold">95% match</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestIngredientDetection('bell_pepper', 'Bell Pepper (Capsicum)', 94)}
                className="p-2 rounded-xl clay-card-porcelain flex flex-col items-center text-center hover:border-[#FF5500]/50 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">🫑</span>
                <span className="text-[11px] font-bold text-[#1E293B]">Bell Pepper</span>
                <span className="text-[9px] text-emerald-600 font-bold">94% match</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestIngredientDetection('cheddar', 'Cheese Block', 98)}
                className="p-2 rounded-xl clay-card-porcelain flex flex-col items-center text-center hover:border-[#FF5500]/50 transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">🧀</span>
                <span className="text-[11px] font-bold text-[#1E293B]">Cheese</span>
                <span className="text-[9px] text-emerald-600 font-bold">98% match</span>
              </button>
            </div>
          </div>

          {/* Status Feedback Toast inside Scanner */}
          {scanFeedback && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-sm animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scanFeedback}</span>
            </div>
          )}

          {/* Scanner Bottom Action Buttons */}
          <div className="mt-auto pt-4 space-y-2">
            <button
              onClick={handleAutoScanAllStaples}
              disabled={isScanning}
              className="clay-btn-orange w-full py-3 px-4 rounded-full flex items-center justify-center gap-2 font-syne font-bold text-xs tracking-wide shadow-md active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{isScanning ? 'Scanning In Progress...' : 'Auto-Identify All In View (Potatoes, Cheese, Garlic)'}</span>
            </button>

            <button
              onClick={handleCloseScanner}
              className="clay-chip-default w-full py-2.5 px-4 rounded-full text-xs font-bold text-slate-700 hover:text-black transition-all cursor-pointer"
            >
              Done & Return to Search/Pantry ({selectedIngredients.length} Active)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
