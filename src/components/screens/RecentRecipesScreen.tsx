import React, { useState } from 'react';
import {
  Clock,
  Heart,
  Trash2,
  Star,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Recipe } from '../../types/snackhack';

interface Props {
  recipes: Recipe[];
  savedRecipeIds: string[];
  recentRecipeIds: string[];
  onToggleSaveRecipe: (recipeId: string) => void;
  onRemoveSavedRecipe: (recipeId: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onNavigateToPopular: () => void;
  onNavigateToHome: () => void;
}

export const RecentRecipesScreen: React.FC<Props> = ({
  recipes,
  savedRecipeIds,
  recentRecipeIds,
  onToggleSaveRecipe,
  onRemoveSavedRecipe,
  onSelectRecipe,
  onNavigateToPopular,
  onNavigateToHome,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'recent' | 'saved'>('recent');

  // Map IDs to full Recipe objects
  const recentRecipes = recentRecipeIds
    .map((id) => recipes.find((r) => r.id === id))
    .filter((r): r is Recipe => Boolean(r));

  const savedRecipes = savedRecipeIds
    .map((id) => recipes.find((r) => r.id === id))
    .filter((r): r is Recipe => Boolean(r));

  return (
    <div className="relative flex flex-col h-full bg-[#FAF7F2] text-[#1E293B] overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-5 pt-3 pb-2 z-10 border-b border-[#ECE7DF] bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse"></span>
              <span className="text-[10px] font-bold text-[#FF5500] tracking-wider uppercase">
                Your Kitchen Journal
              </span>
            </div>
            <h1 className="text-xl font-syne font-extrabold tracking-tight text-[#181B22] mt-0.5">
              Recent & Saved
            </h1>
          </div>

          <div className="w-9 h-9 rounded-2xl clay-card-porcelain flex items-center justify-center text-[#FF5500] shadow-sm border border-white/60">
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>

        {/* Two Tabs Inside: "Recently Viewed" and "Saved Recipes" */}
        <div className="mt-3 flex items-center p-1 rounded-2xl bg-[#EDE7DF] border border-[#DDD5C8] shadow-inner">
          <button
            type="button"
            onClick={() => setActiveSubTab('recent')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-syne font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'recent'
                ? 'bg-white text-[#FF5500] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recently Viewed</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'recent'
                  ? 'bg-[#FF5500]/10 text-[#FF5500]'
                  : 'bg-black/5 text-slate-500'
              }`}
            >
              {recentRecipes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('saved')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-syne font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'saved'
                ? 'bg-white text-[#FF5500] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Saved Recipes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'saved'
                  ? 'bg-[#FF5500]/10 text-[#FF5500]'
                  : 'bg-black/5 text-slate-500'
              }`}
            >
              {savedRecipes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content List */}
      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-20 space-y-3 mobile-scrollbar">
        {/* SUBTAB 1: RECENTLY VIEWED */}
        {activeSubTab === 'recent' && (
          <>
            {recentRecipes.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center clay-card-porcelain rounded-3xl border border-white/80 my-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF2E8] text-[#FF5500] flex items-center justify-center mb-3 shadow-xs">
                  <Clock className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="font-syne font-bold text-sm text-[#181B22]">
                  No recently viewed recipes yet
                </h3>
                <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                  Browse matches from your pantry or explore popular community dishes to view them here.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={onNavigateToPopular}
                    className="clay-btn-orange px-4 py-2 rounded-full font-syne font-bold text-xs tracking-wide shadow-sm cursor-pointer"
                  >
                    Browse Popular
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateToHome}
                    className="clay-chip-default px-4 py-2 rounded-full font-syne font-bold text-xs text-slate-700 cursor-pointer"
                  >
                    Go to Pantry
                  </button>
                </div>
              </div>
            ) : (
              recentRecipes.map((recipe) => {
                const isSaved = savedRecipeIds.includes(recipe.id);

                return (
                  <div
                    key={recipe.id}
                    className="clay-card-elevated rounded-2xl p-2.5 border border-white/80 flex items-center gap-3 transition-all hover:scale-[1.01]"
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => onSelectRecipe(recipe)}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-[#ECE6DC] relative shrink-0 cursor-pointer shadow-xs"
                    >
                      <img
                        src={recipe.heroImage}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-1 right-1 text-xs">
                        {recipe.clayEmoji.slice(0, 2)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase">
                        <Clock className="w-3 h-3 text-[#FF5500]" />
                        <span>{recipe.cookTimeMinutes} mins</span>
                        <span>·</span>
                        <div className="flex items-center gap-0.5 text-amber-600">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{recipe.rating}</span>
                        </div>
                      </div>

                      <h4
                        onClick={() => onSelectRecipe(recipe)}
                        className="text-xs sm:text-sm font-syne font-bold text-[#181B22] truncate hover:text-[#FF5500] cursor-pointer mt-0.5"
                      >
                        {recipe.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {recipe.subtitle}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 bg-black/5 px-2 py-0.5 rounded-full">
                          {recipe.category}
                        </span>

                        <button
                          type="button"
                          onClick={() => onToggleSaveRecipe(recipe.id)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-orange-50 border-orange-200 text-[#FF5500]'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-[#FF5500]'
                          }`}
                          title={isSaved ? 'Remove from Saved' : 'Save Recipe'}
                          aria-label={isSaved ? 'Remove from Saved' : 'Save Recipe'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#FF5500]' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* SUBTAB 2: SAVED RECIPES (Users can remove saved items) */}
        {activeSubTab === 'saved' && (
          <>
            {savedRecipes.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center clay-card-porcelain rounded-3xl border border-white/80 my-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF2E8] text-[#FF5500] flex items-center justify-center mb-3 shadow-xs">
                  <Heart className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="font-syne font-bold text-sm text-[#181B22]">
                  No saved recipes yet
                </h3>
                <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                  Tap the heart icon on any recipe card to save your favorite dishes here for fast access.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToPopular}
                  className="mt-4 clay-btn-orange px-5 py-2.5 rounded-full font-syne font-bold text-xs tracking-wide shadow-sm cursor-pointer"
                >
                  Explore Popular Recipes
                </button>
              </div>
            ) : (
              savedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="clay-card-elevated rounded-2xl p-2.5 border border-white/80 flex items-center gap-3 transition-all hover:scale-[1.01]"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => onSelectRecipe(recipe)}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-[#ECE6DC] relative shrink-0 cursor-pointer shadow-xs"
                  >
                    <img
                      src={recipe.heroImage}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1 right-1 text-xs">
                      {recipe.clayEmoji.slice(0, 2)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase">
                      <Clock className="w-3 h-3 text-[#FF5500]" />
                      <span>{recipe.cookTimeMinutes} mins</span>
                      <span>·</span>
                      <div className="flex items-center gap-0.5 text-amber-600">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{recipe.rating}</span>
                      </div>
                    </div>

                    <h4
                      onClick={() => onSelectRecipe(recipe)}
                      className="text-xs sm:text-sm font-syne font-bold text-[#181B22] truncate hover:text-[#FF5500] cursor-pointer mt-0.5"
                    >
                      {recipe.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {recipe.subtitle}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onSelectRecipe(recipe)}
                        className="text-[11px] font-syne font-bold text-[#FF5500] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>Start Cooking</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      {/* Remove saved item button */}
                      <button
                        type="button"
                        onClick={() => onRemoveSavedRecipe(recipe.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold transition-colors cursor-pointer border border-red-200"
                        title="Remove from saved recipes"
                        aria-label={`Remove ${recipe.title} from saved`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
