import React, { useState, useEffect } from 'react';
import { Home, Flame, Clock, Volume2, VolumeX } from 'lucide-react';
import { ScreenId, Ingredient, Recipe, UserAccount } from './types/snackhack';
import { INITIAL_INGREDIENTS } from './data/mockData';
import { fetchSearchRecipes, subscribeToAuth, logoutUser } from './services/firebaseService';
import {
  toggleRecipeSave,
  removeRecipeFromSaved,
  addRecipeToRecent,
} from './services/userService';
import { sounds } from './services/soundService';
import { Screen1IngredientInput } from './components/screens/Screen1IngredientInput';
import { Screen2RecipeResults } from './components/screens/Screen2RecipeResults';
import { Screen5RecipeDetailCooking } from './components/screens/Screen5RecipeDetailCooking';
import { PopularRecipesScreen } from './components/screens/PopularRecipesScreen';
import { RecentRecipesScreen } from './components/screens/RecentRecipesScreen';
import { AccountModal } from './components/AccountModal';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Active navigation tracking
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('screen1');
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'popular' | 'recent'>('home');
  const [returnNavState, setReturnNavState] = useState<{
    tab: 'home' | 'popular' | 'recent';
    screen: ScreenId;
  }>({
    tab: 'home',
    screen: 'screen1',
  });

  // Sound FX Mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());

  // Real Firebase User Account & Session State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Account / Login Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Pending recipe ID to save after login (persisted in state & localStorage)
  const [pendingRecipeIdToSave, setPendingRecipeIdToSave] = useState<string | null>(() => {
    try {
      return localStorage.getItem('chefmate_pending_recipe_save');
    } catch {
      return null;
    }
  });

  // Subscribe to live Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      if (firebaseUser) {
        try {
          const pendingId = localStorage.getItem('chefmate_pending_recipe_save');
          if (pendingId) {
            const { updatedUser } = toggleRecipeSave(firebaseUser, pendingId);
            localStorage.removeItem('chefmate_pending_recipe_save');
            setPendingRecipeIdToSave(null);
            setCurrentUser(updatedUser || firebaseUser);
            showToast('Pending recipe saved to favorites! ❤️');
            return;
          }
        } catch { }
      }
      setCurrentUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Sync recipes with Firebase DB1 (project-e1f20) based on active pantry ingredients
  useEffect(() => {
    const activeNames = ingredients.filter((i) => i.inPantry).map((i) => i.name);
    fetchSearchRecipes(activeNames).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setRecipes(fetched);
        if (!selectedRecipe) {
          setSelectedRecipe(fetched[0]);
        }
      }
    });
  }, [ingredients]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Sound FX Muted' : 'Sound FX Enabled 🔊');
  };

  // Ingredient Handlers
  const handleToggleIngredient = (id: string) => {
    setIngredients((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newState = !item.inPantry;
          if (newState) {
            sounds.playPop();
          } else {
            sounds.playPopDown();
          }
          return { ...item, inPantry: newState };
        }
        return item;
      })
    );
  };

  const handleAddCustomIngredient = (name: string) => {
    const newIng: Ingredient = {
      id: `custom_${Date.now()}`,
      name,
      category: 'Veggies',
      icon: '🥗',
      clayColor: '#81C784',
      inPantry: true,
    };
    sounds.playPop(520);
    setIngredients((prev) => [newIng, ...prev]);
    showToast(`Added "${name}" to pantry bowl!`);
  };

  // User Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    sounds.playSuccessFanfare();
    let userToSet = user;
    // Step 3: Upon successful login, automatically trigger the save action for the pending recipe
    const pendingId = pendingRecipeIdToSave || localStorage.getItem('chefmate_pending_recipe_save');
    if (pendingId) {
      const { updatedUser } = toggleRecipeSave(user, pendingId);
      if (updatedUser) {
        userToSet = updatedUser;
      }
      setPendingRecipeIdToSave(null);
      try {
        localStorage.removeItem('chefmate_pending_recipe_save');
      } catch { }
      const savedRec = recipes.find((r) => r.id === pendingId);
      showToast(savedRec ? `"${savedRec.title}" saved to your collection! ❤️` : 'Recipe saved to favorites! ❤️');
    } else {
      showToast(`Welcome back, ${user.name || user.email}!`);
    }
    setCurrentUser(userToSet);
    setIsAccountModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout warning:', err);
    }
    setCurrentUser(null);
    sounds.playTabSwitch();
    showToast('Logged out from account');
  };

  const handleToggleSaveRecipe = (recipeId: string) => {
    // Step 1: Check user's authentication state
    if (!currentUser) {
      // Step 2: If user is not logged in, intercept action, save intended recipe ID to temporary state & localStorage, and redirect to login
      setPendingRecipeIdToSave(recipeId);
      try {
        localStorage.setItem('chefmate_pending_recipe_save', recipeId);
      } catch { }
      setIsAccountModalOpen(true);
      showToast('Please log in to save recipes to your favorites ❤️');
      return;
    }

    // Step 4: If user is already logged in, execute the save action immediately as usual
    const { updatedUser, isSaved } = toggleRecipeSave(currentUser, recipeId);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      if (isSaved) {
        sounds.playHeart();
      } else {
        sounds.playPopDown();
      }
      showToast(isSaved ? 'Saved to your recipes ❤️' : 'Removed from your recipes');
    }
  };

  const handleRemoveSavedRecipe = (recipeId: string) => {
    if (!currentUser) return;
    const updatedUser = removeRecipeFromSaved(currentUser, recipeId);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      sounds.playUnsave();
      const recipe = recipes.find((r) => r.id === recipeId);
      const title = recipe ? `"${recipe.title}"` : 'Recipe';
      showToast(`Removed ${title} from saved recipes`);
    }
  };

  const handleSelectRecipe = (r: Recipe) => {
    sounds.playRecipeOpen();
    setReturnNavState({
      tab: activeNavTab,
      screen: currentScreen,
    });
    setSelectedRecipe(r);
    setCurrentScreen('screen5');

    if (currentUser) {
      const updatedUser = addRecipeToRecent(currentUser, r.id);
      if (updatedUser) setCurrentUser(updatedUser);
    }
  };

  const handleBackFromRecipeDetail = () => {
    sounds.playBack();
    setActiveNavTab(returnNavState.tab);
    setCurrentScreen(returnNavState.screen);
  };

  const handleNavigateToTab = (tab: 'home' | 'popular' | 'recent') => {
    if (tab === 'home') {
      sounds.playHomeTab();
      setActiveNavTab('home');
      setCurrentScreen('screen1');
    } else if (tab === 'popular') {
      sounds.playFlameTab();
      setActiveNavTab('popular');
      if (currentScreen === 'screen5') setCurrentScreen('screen1');
    } else if (tab === 'recent') {
      sounds.playClockTab();
      setActiveNavTab('recent');
      if (currentScreen === 'screen5') setCurrentScreen('screen1');
    }
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-[#FAF7F2] flex flex-col items-center justify-start overflow-hidden select-none">
      {/* Pure Mobile App Container - Sized to exact dynamic viewport height */}
      <main className="w-full max-w-md h-full flex flex-col relative overflow-hidden bg-[#FAF7F2]">
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {/* If currentScreen is screen5 (Recipe Detail / Cooking), show it with proper back handling */}
          {currentScreen === 'screen5' && selectedRecipe ? (
            <Screen5RecipeDetailCooking
              recipe={selectedRecipe}
              onBack={handleBackFromRecipeDetail}
              isSaved={currentUser ? currentUser.savedRecipeIds.includes(selectedRecipe.id) : false}
              onToggleSave={handleToggleSaveRecipe}
            />
          ) : (
            <>
              {/* Tab 1: Home Screens */}
              {activeNavTab === 'home' && (
                <>
                  {currentScreen === 'screen1' && (
                    <Screen1IngredientInput
                      ingredients={ingredients}
                      onToggleIngredient={handleToggleIngredient}
                      onAddCustomIngredient={handleAddCustomIngredient}
                      onNavigateToResults={() => {
                        sounds.playSizzle();
                        setCurrentScreen('screen2');
                      }}
                      onSelectScreen={setCurrentScreen}
                      recipes={recipes}
                      onSelectRecipe={handleSelectRecipe}
                      currentUser={currentUser}
                      onLoginSuccess={handleLoginSuccess}
                      onLogout={handleLogout}
                      onToggleSaveRecipe={handleToggleSaveRecipe}
                      onRemoveSavedRecipe={handleRemoveSavedRecipe}
                      savedRecipeIds={currentUser ? currentUser.savedRecipeIds : []}
                      recentRecipeIds={currentUser ? currentUser.recentRecipeIds : []}
                      onRequestOpenAccount={() => setIsAccountModalOpen(true)}
                    />
                  )}

                  {currentScreen === 'screen2' && (
                    <Screen2RecipeResults
                      recipes={recipes}
                      onSelectRecipe={handleSelectRecipe}
                      onBackToInput={() => {
                        sounds.playTabSwitch();
                        setCurrentScreen('screen1');
                      }}
                      activePantryNames={ingredients.filter((i) => i.inPantry).map((i) => i.name)}
                      savedRecipeIds={currentUser ? currentUser.savedRecipeIds : []}
                      onToggleSaveRecipe={handleToggleSaveRecipe}
                    />
                  )}
                </>
              )}

              {/* Tab 2: Popular Recipes Screen */}
              {activeNavTab === 'popular' && (
                <PopularRecipesScreen
                  recipes={recipes}
                  savedRecipeIds={currentUser ? currentUser.savedRecipeIds : []}
                  onToggleSaveRecipe={handleToggleSaveRecipe}
                  onSelectRecipe={handleSelectRecipe}
                />
              )}

              {/* Tab 3: Recent & Saved Screen */}
              {activeNavTab === 'recent' && (
                <RecentRecipesScreen
                  recipes={recipes}
                  savedRecipeIds={currentUser ? currentUser.savedRecipeIds : []}
                  recentRecipeIds={currentUser ? currentUser.recentRecipeIds : []}
                  onToggleSaveRecipe={handleToggleSaveRecipe}
                  onRemoveSavedRecipe={handleRemoveSavedRecipe}
                  onSelectRecipe={handleSelectRecipe}
                  onNavigateToPopular={() => handleNavigateToTab('popular')}
                  onNavigateToHome={() => handleNavigateToTab('home')}
                />
              )}
            </>
          )}
        </div>

        {/* Persistent Mobile Bottom Navigation Bar (HOME, POPULAR, RECENT) */}
        {currentScreen !== 'screen5' && (
          <nav className="w-full h-16 shrink-0 bg-white/95 backdrop-blur-md border-t border-[#ECE7DF] px-4 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            {/* Tab 1: Home */}
            <button
              type="button"
              onClick={() => handleNavigateToTab('home')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${activeNavTab === 'home' && currentScreen === 'screen1'
                ? 'text-[#FF5500]'
                : 'text-slate-400 hover:text-slate-600'
                }`}
              title="Pantry Home"
              aria-label="Pantry Home"
            >
              <Home
                className={`w-5 h-5 transition-transform ${activeNavTab === 'home' && currentScreen === 'screen1'
                  ? 'scale-110 stroke-[2.5]'
                  : 'stroke-[2]'
                  }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${activeNavTab === 'home' && currentScreen === 'screen1'
                  ? 'font-extrabold text-[#FF5500]'
                  : 'font-medium'
                  }`}
              >
                Home
              </span>
            </button>

            {/* Tab 2: Popular Recipes */}
            <button
              type="button"
              onClick={() => handleNavigateToTab('popular')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${activeNavTab === 'popular'
                ? 'text-[#FF5500]'
                : 'text-slate-400 hover:text-slate-600'
                }`}
              title="Popular Recipes"
              aria-label="Popular Recipes"
            >
              <Flame
                className={`w-5 h-5 transition-transform ${activeNavTab === 'popular'
                  ? 'scale-110 fill-[#FF5500] stroke-[2.5]'
                  : 'stroke-[2]'
                  }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${activeNavTab === 'popular' ? 'font-extrabold text-[#FF5500]' : 'font-medium'
                  }`}
              >
                Popular
              </span>
            </button>

            {/* Tab 3: Recent */}
            <button
              type="button"
              onClick={() => handleNavigateToTab('recent')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${activeNavTab === 'recent'
                ? 'text-[#FF5500]'
                : 'text-slate-400 hover:text-slate-600'
                }`}
              title="Recent & Saved"
              aria-label="Recent & Saved"
            >
              <Clock
                className={`w-5 h-5 transition-transform ${activeNavTab === 'recent' ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                  }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${activeNavTab === 'recent' ? 'font-extrabold text-[#FF5500]' : 'font-medium'
                  }`}
              >
                Recent
              </span>
            </button>
          </nav>
        )}
      </main>

      {/* Global Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 z-50 clay-card-elevated px-4 py-2.5 rounded-2xl border border-white flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 bg-white/95">
          <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping" />
          <span className="text-xs font-bold text-[#181B22]">{toastMessage}</span>
        </div>
      )}

      {/* Global Account / Login Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        savedCount={currentUser ? currentUser.savedRecipeIds.length : 0}
        recentCount={currentUser ? currentUser.recentRecipeIds.length : 0}
      />
    </div>
  );
}
