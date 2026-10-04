import React, { useState, useEffect } from 'react';
import { Clock, Star, Heart, Flame, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { Recipe } from '../../types/snackhack';
import { fetchPopularWorldRecipes } from '../../services/firebaseService';

interface Props {
  recipes: Recipe[];
  savedRecipeIds: string[];
  onToggleSaveRecipe: (recipeId: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export const PopularRecipesScreen: React.FC<Props> = ({
  recipes,
  savedRecipeIds,
  onToggleSaveRecipe,
  onSelectRecipe,
}) => {
  const [worldRecipes, setWorldRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchPopularWorldRecipes().then((data) => {
      if (data && data.length > 0) {
        setWorldRecipes(data);
      }
    });
  }, []);

  const displayList = worldRecipes.length > 0 ? worldRecipes : recipes;
  const sortedPopular = [...displayList].sort((a, b) => b.rating - a.rating);

  return (
    <div className="relative flex flex-col h-full bg-[#FAF7F2] text-[#1E293B] overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-5 pt-3 pb-2.5 flex items-center justify-between z-10 border-b border-[#ECE7DF] bg-[#FAF7F2]/90 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#FF5500] tracking-wider uppercase">
              Community Favorites
            </span>
          </div>
          <h1 className="text-xl font-syne font-extrabold tracking-tight text-[#181B22] mt-0.5">
            Popular Recipes
          </h1>
        </div>

        <div className="w-9 h-9 rounded-2xl clay-card-porcelain flex items-center justify-center text-[#FF5500] shadow-sm border border-white/60">
          <Flame className="w-4 h-4 fill-[#FF5500]/20 stroke-[2.2]" />
        </div>
      </div>

      {/* Scrollable Feed of Popular Dishes */}
      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-20 space-y-4 mobile-scrollbar">
        {/* Banner Pill */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FFF0E6] to-[#FFE6D5] border border-[#FFD2B8] flex items-center gap-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#FF5500] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs text-[#993300]">
            <span className="font-bold block text-[#662200]">Trending Snacks This Week</span>
            Top-rated pantry recipes loved for fast prep and insane crunch.
          </div>
        </div>

        {/* Recipe Cards List */}
        {sortedPopular.map((recipe, index) => {
          const isSaved = savedRecipeIds.includes(recipe.id);

          return (
            <div
              key={recipe.id}
              className="clay-card-elevated rounded-3xl p-3.5 border border-white/90 shadow-sm transition-all hover:scale-[1.01]"
            >
              {/* Card Image with Badges & Save Heart Icon */}
              <div className="relative h-38 sm:h-42 w-full rounded-2xl overflow-hidden bg-[#ECE6DC] shadow-inner group">
                <img
                  src={recipe.heroImage}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onClick={() => onSelectRecipe(recipe)}
                  loading="lazy"
                />

                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Top Badges: Rank Badge & Cook Time */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-auto">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-syne bg-[#FF5500] text-white shadow-sm flex items-center gap-1">
                    <span>#{index + 1}</span>
                    <span>Trending</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/50 backdrop-blur-md text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#FF9955]" />
                    <span>{recipe.cookTimeMinutes}m</span>
                  </span>
                </div>

                {/* Save (Heart) Icon Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSaveRecipe(recipe.id);
                  }}
                  className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 cursor-pointer shadow-md ${
                    isSaved
                      ? 'bg-white text-[#FF5500] border-white shadow-[#FF5500]/30'
                      : 'bg-black/35 text-white border-white/40 hover:bg-black/50'
                  }`}
                  title={isSaved ? 'Remove from Saved' : 'Save Recipe'}
                  aria-label={isSaved ? 'Remove from Saved' : 'Save Recipe'}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform ${
                      isSaved ? 'fill-[#FF5500] scale-110' : 'hover:scale-110'
                    }`}
                  />
                </button>

                {/* Bottom Overlay on Image: Clay Emoji & Tag */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white pointer-events-none">
                  <span className="text-lg drop-shadow-sm">{recipe.clayEmoji}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                    {recipe.category}
                  </span>
                </div>
              </div>

              {/* Card Meta & Details */}
              <div className="mt-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h2
                      onClick={() => onSelectRecipe(recipe)}
                      className="text-sm sm:text-base font-syne font-bold text-[#181B22] leading-snug hover:text-[#FF5500] transition-colors cursor-pointer"
                    >
                      {recipe.title}
                    </h2>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {recipe.subtitle}
                    </p>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#FFF5E6] border border-[#FFE0B2] text-[#B25900] shrink-0 font-syne text-xs font-extrabold">
                    <Star className="w-3.5 h-3.5 fill-[#FF9900] text-[#FF9900]" />
                    <span>{recipe.rating}</span>
                  </div>
                </div>

                {/* Bottom Row: Quick Stats & Tap to Cook */}
                <div className="mt-3 pt-2.5 border-t border-[#ECE5DC] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span>{recipe.servings} Servings</span>
                    <span>·</span>
                    <span>{recipe.calories} kcal</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-semibold">{recipe.difficulty}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectRecipe(recipe)}
                    className="flex items-center gap-1 text-xs font-syne font-bold text-[#FF5500] hover:text-[#E64A00] transition-colors cursor-pointer group"
                  >
                    <span>Cook</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
