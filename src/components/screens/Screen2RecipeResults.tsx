import React, { useState, useMemo } from 'react';
import { Clock, Flame, ChevronRight, ArrowLeft, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Recipe } from '../../types/snackhack';

interface Props {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onBackToInput: () => void;
  activePantryNames?: string[];
}

export const Screen2RecipeResults: React.FC<Props> = ({
  recipes,
  onSelectRecipe,
  onBackToInput,
  activePantryNames = [],
}) => {
  const [filterMode, setFilterMode] = useState<'All' | 'Ready' | 'Missing1' | 'Under10m' | 'Catalog'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const hasActivePantry = activePantryNames.length > 0;

  // Dishes strictly made with the ingredients selected by the user (missing 0 non-staples)
  const readyCount = useMemo(
    () => recipes.filter((r) => r.missingCount === 0 || r.matchScore >= 95).length,
    [recipes]
  );
  const missing1Count = useMemo(
    () => recipes.filter((r) => r.missingCount >= 1 && r.missingCount <= 2).length,
    [recipes]
  );
  const under10Count = useMemo(
    () =>
      recipes.filter(
        (r) =>
          r.cookTimeMinutes <= 10 &&
          (hasActivePantry && readyCount > 0 ? r.missingCount === 0 || r.matchScore >= 95 : true)
      ).length,
    [recipes, hasActivePantry, readyCount]
  );

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q);
        const matchesCategory = r.category.toLowerCase().includes(q);
        const matchesIng = r.ingredients.some((ing) => ing.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesIng) return false;
      }

      // Filter modes
      // When in 'All' section: If user selected pantry ingredients, ONLY show dishes made with their selected ingredients!
      if (filterMode === 'All') {
        if (hasActivePantry && readyCount > 0) {
          return r.missingCount === 0 || r.matchScore >= 95;
        }
        return true;
      }
      if (filterMode === 'Ready') {
        return r.missingCount === 0 || r.matchScore >= 95;
      }
      if (filterMode === 'Missing1') {
        return r.missingCount >= 1 && r.missingCount <= 2;
      }
      if (filterMode === 'Under10m') {
        if (hasActivePantry && readyCount > 0) {
          return r.cookTimeMinutes <= 10 && (r.missingCount === 0 || r.matchScore >= 95);
        }
        return r.cookTimeMinutes <= 10;
      }
      if (filterMode === 'Catalog') {
        return true;
      }
      return true;
    });
  }, [recipes, filterMode, searchQuery, hasActivePantry, readyCount]);

  return (
    <div className="relative flex flex-col h-full bg-[#FAF7F2] text-[#1E293B] overflow-hidden select-none">
      {/* Top Mobile Bar */}
      <div className="px-5 pt-3 pb-2.5 z-10 border-b border-[#ECE7DF] bg-[#FAF7F2]/90 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToInput}
              className="w-8 h-8 rounded-xl clay-card-porcelain flex items-center justify-center text-slate-700 hover:text-[#FF5500] transition-colors cursor-pointer"
              title="Back to pantry"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="text-[10px] font-bold text-[#FF5500] tracking-wider uppercase">
                {hasActivePantry ? 'Selected Ingredients Only' : 'Instant Matches'}
              </div>
              <h1 className="text-base sm:text-lg font-syne font-extrabold text-[#181B22] leading-tight">
                {filteredRecipes.length} {filteredRecipes.length === 1 ? 'Recipe' : 'Recipes'} Available
              </h1>
            </div>
          </div>
        </div>

        {/* Quick Search within Results */}
        <div className="relative flex items-center w-full rounded-xl bg-white border border-[#E9E4DC] px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-[#FF5500]/40 transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter dishes (e.g. toast, noodles, poppers)..."
            className="w-full bg-transparent text-xs text-[#1E293B] placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar with Live Accurate Counts */}
      <div className="px-5 py-2.5 flex items-center gap-1.5 overflow-x-auto mobile-scrollbar">
        {[
          {
            id: 'All',
            label: hasActivePantry && readyCount > 0
              ? `All (${readyCount})`
              : `All (${recipes.length})`,
          },
          { id: 'Missing1', label: `Missing 1-2 Items (${missing1Count})` },
          { id: 'Under10m', label: `⚡ Under 10 mins (${under10Count})` },
          ...(hasActivePantry && recipes.length > readyCount
            ? [{ id: 'Catalog', label: `Explore All (${recipes.length})` }]
            : []),
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilterMode(item.id as any)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              filterMode === item.id
                ? 'clay-chip-active shadow-sm'
                : 'clay-chip-default text-slate-600 hover:text-[#FF5500]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Feed of Recipe Cards or Empty State */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 mobile-scrollbar pt-1">
        {filteredRecipes.length === 0 && (
          <div className="clay-card-porcelain rounded-3xl p-6 text-center mt-4 border border-white/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF5500] mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-syne font-bold text-sm text-[#181B22]">
              {filterMode === 'All' && hasActivePantry
                ? 'No recipes match ONLY your selected ingredients'
                : 'No recipes found for this filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {filterMode === 'All' && hasActivePantry
                ? 'Try adding more pantry staples (like potatoes, bread, or eggs), or view delicious recipes missing just 1-2 items below!'
                : filterMode === 'Ready'
                ? 'No recipes have 100% ingredients in your pantry. Try "Missing 1-2 Items" to order missing staples fast!'
                : filterMode === 'Under10m'
                ? 'No recipes under 10 minutes match your current ingredients.'
                : 'Try clearing your search or switching filter tabs.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              {missing1Count > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('Missing1');
                    setSearchQuery('');
                  }}
                  className="clay-btn-orange py-2 px-4 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer active:scale-95"
                >
                  View Missing 1-2 Items ({missing1Count})
                </button>
              )}
              <button
                type="button"
                onClick={onBackToInput}
                className="clay-chip-default py-2 px-4 rounded-xl text-xs font-bold text-slate-700 hover:text-black cursor-pointer active:scale-95"
              >
                + Add More Ingredients
              </button>
            </div>
          </div>
        )}
        {filteredRecipes.map((recipe) => {
          const isFullMatch = recipe.missingCount === 0;
          const missingItem = recipe.ingredients.find((i) => !i.isAvailable);

          return (
            <div
              key={recipe.id}
              className="group clay-card-elevated rounded-3xl p-3.5 transition-all hover:scale-[1.01] border border-white/80"
            >
              {/* Card Hero Image with Clay Overlay & Match Badge */}
              <div
                onClick={() => onSelectRecipe(recipe)}
                className="relative h-40 sm:h-44 w-full rounded-2xl overflow-hidden cursor-pointer shadow-inner bg-[#EBE5DC]"
              >
                <img
                  src={recipe.heroImage}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Subtle gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
                  {isFullMatch ? (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-extrabold backdrop-blur-md shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>100% Match · Ready to Cook</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecipe(recipe);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5500] text-white text-[11px] font-extrabold shadow-[0_4px_12px_rgba(255,85,0,0.5)] border border-white/40 hover:scale-105 transition-transform"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      <span>Missing {recipe.missingCount} Item</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}

                  <div className="px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] font-bold backdrop-blur-md">
                    ★ {recipe.rating}
                  </div>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-[#FF8540]" />
                      {recipe.cookTimeMinutes} mins
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Flame className="w-3.5 h-3.5 text-[#FF8540]" />
                      {recipe.calories} kcal
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold backdrop-blur-xs">
                    {recipe.category}
                  </span>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="mt-3 px-1">
                <div className="flex items-start justify-between gap-2">
                  <div onClick={() => onSelectRecipe(recipe)} className="cursor-pointer">
                    <h3 className="font-syne font-bold text-base text-[#181B22] group-hover:text-[#FF5500] transition-colors leading-snug">
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {recipe.subtitle}
                    </p>
                  </div>
                </div>

                {/* Missing Item Notification with Quick Commerce Links */}
                {!isFullMatch && missingItem && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-[#FFF5EE] border border-[#FFD9C2] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#9E3400]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]"></span>
                        <span className="font-medium">Need:</span>
                        <span className="font-bold text-[#1E293B]">{missingItem.name}</span>
                      </div>

                      <button
                        onClick={() => onSelectRecipe(recipe)}
                        className="px-2.5 py-1 rounded-lg bg-[#FF5500] hover:bg-[#E64400] text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Quick-commerce Instant Delivery Direct Links */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-[#FFD9C2]/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                        ⚡ Quick Order:
                      </span>
                      <a
                        href={`https://www.zeptonow.com/search?query=${encodeURIComponent(missingItem.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 rounded-md bg-[#5B1082] text-white text-[10px] font-bold hover:opacity-90 flex items-center gap-1 shadow-xs"
                      >
                        Zepto
                      </a>
                      <a
                        href={`https://blinkit.com/s/?q=${encodeURIComponent(missingItem.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 rounded-md bg-[#F8CB46] text-black text-[10px] font-bold hover:opacity-90 flex items-center gap-1 shadow-xs"
                      >
                        Blinkit
                      </a>
                      <a
                        href={`https://www.swiggy.com/instamart/search?query=${encodeURIComponent(missingItem.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 rounded-md bg-[#FC8019] text-white text-[10px] font-bold hover:opacity-90 flex items-center gap-1 shadow-xs"
                      >
                        Instamart
                      </a>
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="mt-3 pt-2.5 border-t border-[#ECE5DC] flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-medium">
                    {isFullMatch ? 'All ingredients in pantry' : 'Simple recipe substitutions available'}
                  </div>

                  <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="flex items-center gap-1 text-xs font-bold text-[#FF5500] hover:underline"
                  >
                    <span>View Recipe</span>
                    <ChevronRight className="w-4 h-4" />
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
