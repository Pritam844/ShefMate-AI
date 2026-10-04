import React, { useState, useEffect } from 'react';
import { Home, Flame, Clock } from 'lucide-react';
import { ScreenId, Ingredient, Recipe, UserAccount } from './types/snackhack';
import { INITIAL_INGREDIENTS, RECIPES } from './data/mockData';
import { fetchSearchRecipes, subscribeToAuth, logoutUser } from './services/firebaseService';
import {
  toggleRecipeSave,
  removeRecipeFromSaved,
  addRecipeToRecent,
} from './services/userService';
import { Screen1IngredientInput } from './components/screens/Screen1IngredientInput';
import { Screen2RecipeResults } from './components/screens/Screen2RecipeResults';
import { Screen5RecipeDetailCooking } from './components/screens/Screen5RecipeDetailCooking';
import { PopularRecipesScreen } from './components/screens/PopularRecipesScreen';
import { RecentRecipesScreen } from './components/screens/RecentRecipesScreen';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(RECIPES[0]);

  // Current active screen in the Android app: screen1 (Input), screen2 (Results), screen5 (Cooking Detail)
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('screen1');

  // Bottom Navigation State for mobile: 'home' | 'popular' | 'recent'
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'popular' | 'recent'>('home');

  // Real Firebase User Account & Session State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to live Firebase Auth state changes (persists across reloads & sessions)
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setCurrentUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Sync recipes with Firebase DB1 (project-e1f20) based on active pantry ingredients
  useEffect(() => {
    const activeNames = ingredients.filter((i) => i.inPantry).map((i) => i.name);
    fetchSearchRecipes(activeNames).then((fetched) => {
      if (fetched) {
        setRecipes(fetched);
      }
    });
  }, [ingredients]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Ingredient Handlers
  const handleToggleIngredient = (id: string) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inPantry: !item.inPantry } : item))
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
    setIngredients((prev) => [newIng, ...prev]);
    showToast(`Added "${name}" to pantry bowl!`);
  };

  // User Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name || user.email}!`);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout warning:', err);
    }
    setCurrentUser(null);
    showToast('Logged out from account');
  };

  const handleToggleSaveRecipe = (recipeId: string) => {
    const { updatedUser, isSaved } = toggleRecipeSave(currentUser, recipeId);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      showToast(isSaved ? 'Saved to your recipes' : 'Removed from your recipes');
    }
  };

  const handleRemoveSavedRecipe = (recipeId: string) => {
    if (!currentUser) return;
    const updatedUser = removeRecipeFromSaved(currentUser, recipeId);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      const recipe = recipes.find((r) => r.id === recipeId);
      const title = recipe ? `"${recipe.title}"` : 'Recipe';
      showToast(`Removed ${title} from saved recipes`);
    }
  };

  const handleSelectRecipe = (r: Recipe) => {
    setSelectedRecipe(r);
    setCurrentScreen('screen5');
    if (currentUser) {
      const updatedUser = addRecipeToRecent(currentUser, r.id);
      if (updatedUser) setCurrentUser(updatedUser);
    }
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-[#FAF7F2] flex flex-col items-center justify-start overflow-hidden select-none">
      {/* Pure Mobile App Container - Sized to exact dynamic viewport height */}
      <main className="w-full max-w-md h-full flex flex-col relative overflow-hidden bg-[#FAF7F2]">
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeNavTab === 'home' && (
            <>
              {currentScreen === 'screen1' && (
                <Screen1IngredientInput
                  ingredients={ingredients}
                  onToggleIngredient={handleToggleIngredient}
                  onAddCustomIngredient={handleAddCustomIngredient}
                  onNavigateToResults={() => setCurrentScreen('screen2')}
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
                />
              )}

              {currentScreen === 'screen2' && (
                <Screen2RecipeResults
                  recipes={recipes}
                  onSelectRecipe={handleSelectRecipe}
                  onBackToInput={() => setCurrentScreen('screen1')}
                  activePantryNames={ingredients.filter((i) => i.inPantry).map((i) => i.name)}
                />
              )}

              {currentScreen === 'screen5' && (
                <Screen5RecipeDetailCooking
                  recipe={selectedRecipe}
                  onBack={() => setCurrentScreen('screen2')}
                  isSaved={currentUser ? currentUser.savedRecipeIds.includes(selectedRecipe.id) : false}
                  onToggleSave={handleToggleSaveRecipe}
                />
              )}
            </>
          )}

          {activeNavTab === 'popular' && (
            <PopularRecipesScreen
              recipes={recipes}
              savedRecipeIds={currentUser ? currentUser.savedRecipeIds : []}
              onToggleSaveRecipe={handleToggleSaveRecipe}
              onSelectRecipe={handleSelectRecipe}
            />
          )}

          {activeNavTab === 'recent' && (
            <RecentRecipesScreen
              recipes={recipes}
              savedRecipeIds={currentUser ? currentUser.savedRecipeIds : []}
              recentRecipeIds={currentUser ? currentUser.recentRecipeIds : []}
              onToggleSaveRecipe={handleToggleSaveRecipe}
              onRemoveSavedRecipe={handleRemoveSavedRecipe}
              onSelectRecipe={handleSelectRecipe}
              onNavigateToPopular={() => setActiveNavTab('popular')}
              onNavigateToHome={() => {
                setActiveNavTab('home');
                setCurrentScreen('screen1');
              }}
            />
          )}
        </div>

        {/* Persistent Mobile Bottom Navigation Bar (HOME, POPULAR, RECENT) */}
        {currentScreen !== 'screen5' && (
          <nav className="w-full h-16 shrink-0 bg-white/95 backdrop-blur-md border-t border-[#ECE7DF] px-4 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            {/* Tab 1: Home */}
            <button
              type="button"
              onClick={() => {
                setActiveNavTab('home');
                setCurrentScreen('screen1');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                activeNavTab === 'home' && currentScreen === 'screen1'
                  ? 'text-[#FF5500]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Pantry Home"
              aria-label="Pantry Home"
            >
              <Home
                className={`w-5 h-5 transition-transform ${
                  activeNavTab === 'home' && currentScreen === 'screen1'
                    ? 'scale-110 stroke-[2.5]'
                    : 'stroke-[2]'
                }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  activeNavTab === 'home' && currentScreen === 'screen1'
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
              onClick={() => setActiveNavTab('popular')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                activeNavTab === 'popular'
                  ? 'text-[#FF5500]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Popular Recipes"
              aria-label="Popular Recipes"
            >
              <Flame
                className={`w-5 h-5 transition-transform ${
                  activeNavTab === 'popular'
                    ? 'scale-110 fill-[#FF5500] stroke-[2.5]'
                    : 'stroke-[2]'
                }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  activeNavTab === 'popular' ? 'font-extrabold text-[#FF5500]' : 'font-medium'
                }`}
              >
                Popular
              </span>
            </button>

            {/* Tab 3: Recent */}
            <button
              type="button"
              onClick={() => setActiveNavTab('recent')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                activeNavTab === 'recent'
                  ? 'text-[#FF5500]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Recent & Saved"
              aria-label="Recent & Saved"
            >
              <Clock
                className={`w-5 h-5 transition-transform ${
                  activeNavTab === 'recent' ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  activeNavTab === 'recent' ? 'font-extrabold text-[#FF5500]' : 'font-medium'
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
    </div>
  );
}
