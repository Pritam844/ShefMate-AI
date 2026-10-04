import React from 'react';
import { Wifi, Battery, Maximize2, RotateCw } from 'lucide-react';
import { ScreenId } from '../types/snackhack';

interface Props {
  phoneIndex: number;
  activeScreenId: ScreenId;
  screenTitle: string;
  screenDescription: string;
  isFocused?: boolean;
  onFocus?: () => void;
  onChangeScreen: (screenId: ScreenId) => void;
  children: React.ReactNode;
}

export const PhoneMockup: React.FC<Props> = ({
  phoneIndex,
  activeScreenId,
  screenTitle,
  screenDescription,
  isFocused,
  onFocus,
  onChangeScreen,
  children,
}) => {
  const screensList: { id: ScreenId; label: string }[] = [
    { id: 'screen1', label: 'Screen 1: Ingredient Input' },
    { id: 'screen2', label: 'Screen 2: Recipe Results' },
    { id: 'screen5', label: 'Screen 3: Recipe Detail & Cooking' },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Phone Header / Screen Picker Affordance */}
      <div className="w-full max-w-[340px] sm:max-w-[360px] mb-3 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px] font-black font-syne shadow-sm">
            {phoneIndex}
          </span>
          <span className="text-xs font-syne font-bold text-[#181B22] truncate max-w-[190px]">
            {screenTitle}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Screen Switcher Menu */}
          <select
            value={activeScreenId}
            onChange={(e) => onChangeScreen(e.target.value as ScreenId)}
            className="text-[10px] font-bold bg-white/80 border border-[#DDD5CA] rounded-lg px-2 py-1 text-slate-700 outline-none hover:border-[#FF5500] cursor-pointer shadow-xs"
            title="Switch Screen on this Phone"
          >
            {screensList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {onFocus && (
            <button
              onClick={onFocus}
              className="p-1 rounded-lg bg-white/80 border border-[#DDD5CA] text-slate-600 hover:text-[#FF5500] hover:border-[#FF5500] transition-colors"
              title="Expand / Focus Phone"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Flagship Phone Chassis Frame */}
      <div
        className={`relative w-[320px] sm:w-[350px] h-[670px] sm:h-[700px] phone-chassis transition-all duration-300 ${
          isFocused ? 'ring-4 ring-[#FF5500]/60 scale-102 shadow-2xl' : 'hover:scale-[1.01]'
        }`}
      >
        {/* Hardware details: Side buttons & antenna lines */}
        <div className="absolute -left-[12px] top-28 w-[3px] h-9 bg-[#4A4E58] rounded-l-sm" />
        <div className="absolute -left-[12px] top-40 w-[3px] h-12 bg-[#4A4E58] rounded-l-sm" />
        <div className="absolute -left-[12px] top-56 w-[3px] h-12 bg-[#4A4E58] rounded-l-sm" />
        <div className="absolute -right-[12px] top-36 w-[3px] h-16 bg-[#4A4E58] rounded-r-sm" />

        {/* Glossy Screen Rim Bezel */}
        <div className="w-full h-full phone-screen flex flex-col justify-between shadow-inner">
          {/* Dynamic Island / Hardware Notch */}
          <div className="relative pt-2.5 px-6 flex items-center justify-between z-30 bg-transparent">
            {/* Clock */}
            <span className="text-[11px] font-bold text-[#181B22] font-mono-tabular tracking-tight">
              9:41
            </span>

            {/* Dynamic Island Pill */}
            <div className="h-5 px-3 rounded-full bg-black flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#181B22] ring-1 ring-white/20"></span>
              <span className="text-[9px] font-bold text-white/90 tracking-wider">
                ChefMate AI
              </span>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 text-[#181B22]">
              <span className="text-[10px] font-bold font-mono">5G</span>
              <Wifi className="w-3 h-3 stroke-[2.5]" />
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-bold font-mono">98%</span>
                <Battery className="w-3.5 h-3.5 stroke-[2.5] fill-current" />
              </div>
            </div>
          </div>

          {/* Screen Content Slot */}
          <div className="flex-1 w-full h-[calc(100%-42px)] relative overflow-hidden">
            {children}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="h-4 w-full bg-transparent flex items-center justify-center z-30 pointer-events-none">
            <div className="w-28 h-1 rounded-full bg-black/30" />
          </div>

          {/* Glass Glare Highlight */}
          <div className="phone-glare-overlay" />
        </div>
      </div>

      {/* Screen Subtitle Caption */}
      <p className="text-[11px] font-medium text-slate-500 mt-2.5 text-center max-w-[320px]">
        {screenDescription}
      </p>
    </div>
  );
};
