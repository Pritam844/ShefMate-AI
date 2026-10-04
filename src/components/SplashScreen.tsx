import React, { useState, useEffect } from 'react';
import { ChefMateLogo } from './ChefMateLogo';

interface Props {
  onComplete: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  // Animation Sequence Phase States
  const [logoPop, setLogoPop] = useState(false);
  const [isHopping, setIsHopping] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isCheeksGlowing, setIsCheeksGlowing] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1. Logo pops in at center with soft bounce
    const t1 = setTimeout(() => {
      setLogoPop(true);
    }, 100);

    // 2. Chef hat gives a small happy hop, and eyes blink once
    const t2 = setTimeout(() => {
      setIsHopping(true);
    }, 800);

    const t3 = setTimeout(() => {
      setIsBlinking(true);
    }, 1050);

    const t4 = setTimeout(() => {
      setIsBlinking(false);
      setIsHopping(false);
    }, 1250);

    // 3. Peach cheeks glow softly for a moment
    const t5 = setTimeout(() => {
      setIsCheeksGlowing(true);
    }, 1300);

    const t6 = setTimeout(() => {
      setIsCheeksGlowing(false);
    }, 1850);

    // 4. Name "ChefMate AI" fades & slides up beneath icon
    const t7 = setTimeout(() => {
      setTitleVisible(true);
    }, 1600);

    // 5. Small tagline fades in: "Cook smart with what you have."
    const t8 = setTimeout(() => {
      setTaglineVisible(true);
    }, 2050);

    // Progress bar smooth advance
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    // Fade out splash into Home screen at ~2.9s - 3.0s
    const tFade = setTimeout(() => {
      setIsFadingOut(true);
    }, 2900);

    const tEnd = setTimeout(() => {
      onComplete();
    }, 3350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(t8);
      clearTimeout(tFade);
      clearTimeout(tEnd);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div
      className={`absolute inset-0 z-50 bg-[#FAF7F2] flex flex-col items-center justify-between p-6 select-none transition-opacity duration-450 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top spacing */}
      <div className="w-full flex justify-end">
        <button
          type="button"
          onClick={onComplete}
          className="text-[10px] font-mono font-bold text-slate-400 hover:text-[#FF5500] px-2 py-1 rounded-md transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Center Hero Logo & Sequence Container */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Step 1: Logo icon pops in at center with soft bounce */}
        <div
          className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            logoPop
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-60 opacity-0 translate-y-4'
          }`}
        >
          <div className="p-3 rounded-[32px] clay-card-elevated border border-white/90 shadow-xl">
            <ChefMateLogo
              size={92}
              isHopping={isHopping}
              isBlinking={isBlinking}
              isCheeksGlowing={isCheeksGlowing}
            />
          </div>
        </div>

        {/* Step 4: Name "ChefMate AI" fades & slides up beneath icon */}
        <div
          className={`mt-4 text-center transition-all duration-600 ${
            titleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
        >
          <h1 className="text-2xl font-syne font-extrabold text-[#181B22] tracking-tight">
            ChefMate <span className="text-[#FF5500]">AI</span>
          </h1>
        </div>

        {/* Step 5: Small tagline fades in */}
        <div
          className={`mt-1.5 transition-all duration-600 ${
            taglineVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="text-xs text-slate-500 font-medium">
            Cook smart with what you have.
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress & Pulsing Dots */}
      <div className="w-full max-w-[190px] flex flex-col items-center gap-3 pb-4">
        {/* Three orange pulsing dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-bounce" />
        </div>

        {/* Thin orange progress bar */}
        <div className="w-full h-1 bg-[#EBE4DC] rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#FF6A00] to-[#FF4400] rounded-full transition-all duration-150 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
