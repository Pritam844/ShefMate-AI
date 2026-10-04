import React from 'react';
import { Eye, Layers, Sparkles, Smartphone, RotateCcw } from 'lucide-react';
import { ScreenId } from '../types/snackhack';
import { ChefMateLogo } from './ChefMateLogo';

interface Props {
  activePreset: 'hero' | 'cooking';
  onSelectPreset: (preset: 'hero' | 'cooking') => void;
  is3DTiltEnabled: boolean;
  onToggle3DTilt: () => void;
  onFocusScreen: (screenId: ScreenId) => void;
  onResetShowcase: () => void;
}

export const ShowcaseHeader: React.FC<Props> = ({
  activePreset,
  onSelectPreset,
  is3DTiltEnabled,
  onToggle3DTilt,
  onFocusScreen,
  onResetShowcase,
}) => {
  return (
    <header className="w-full bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#ECE5DC] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-lg font-extrabold tracking-tight text-[#181B22] font-syne flex items-center gap-2"
          >
            <ChefMateLogo size={28} />
            <span>
              ChefMate <span className="text-[#FF5500]">AI</span>
            </span>
          </a>
          <span className="hidden md:inline-block text-xs font-semibold text-slate-400">
            · Futuristic 3D Claymorphic UI/UX Showcase
          </span>
        </div>

        {/* Zone 2: Clean navigation links to jump / assign */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onFocusScreen('screen1')}
            className="hover:text-[#FF5500] transition-colors cursor-pointer"
          >
            01. Ingredient Input
          </button>
          <button
            onClick={() => onFocusScreen('screen2')}
            className="hover:text-[#FF5500] transition-colors cursor-pointer"
          >
            02. Recipe Results
          </button>
          <button
            onClick={() => onFocusScreen('screen5')}
            className="hover:text-[#FF5500] transition-colors cursor-pointer"
          >
            03. Recipe Detail & Cooking
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          {/* Preset Flow Switcher */}
          <div className="flex items-center bg-[#EDE7DF] p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => onSelectPreset('hero')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activePreset === 'hero'
                  ? 'bg-white text-[#FF5500] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show 3-Screen App Flow (Input, Results, Cooking)"
            >
              1 · 2 · 3 Full Flow
            </button>
            <button
              onClick={() => onSelectPreset('cooking')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activePreset === 'cooking'
                  ? 'bg-white text-[#FF5500] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Focus on Results & Cooking"
            >
              Cooking Focus
            </button>
          </div>

          {/* 3D Perspective Tilt Button */}
          <button
            onClick={onToggle3DTilt}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              is3DTiltEnabled
                ? 'bg-[#FF5500] text-white shadow-sm'
                : 'clay-card-porcelain text-slate-700 hover:text-[#FF5500]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D Tilt</span>
          </button>

          {/* Reset */}
          <button
            onClick={onResetShowcase}
            className="p-2 rounded-xl clay-card-porcelain text-slate-600 hover:text-[#FF5500] transition-colors"
            title="Reset Showcase"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
