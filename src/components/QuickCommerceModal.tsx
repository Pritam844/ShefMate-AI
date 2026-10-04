import React from 'react';
import { X, ExternalLink, Zap, Clock, ShieldCheck } from 'lucide-react';
import { QUICK_COMMERCE_STORES, openQuickCommerceStore } from '../services/quickCommerceService';

interface Props {
  isOpen: boolean;
  ingredientName: string;
  quantity?: string;
  onClose: () => void;
}

export const QuickCommerceModal: React.FC<Props> = ({
  isOpen,
  ingredientName,
  quantity = '1 pack',
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/80 animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DF]">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF5500] flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>10-Minute Grocery Delivery</span>
            </div>
            <h2 className="text-base font-syne font-extrabold text-[#181B22]">
              Order Missing Ingredient
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full clay-chip-default flex items-center justify-center text-slate-500 hover:text-slate-800 transition-transform active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Missing Item Highlight Banner */}
        <div className="mt-3 p-3 rounded-2xl bg-white border border-[#E9E4DC] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-xl">
              🛒
            </div>
            <div>
              <div className="text-xs font-bold text-[#181B22]">{ingredientName}</div>
              <div className="text-[11px] text-slate-500">{quantity} · Missing from your pantry</div>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Needed
          </span>
        </div>

        {/* Quick Commerce Options Comparison */}
        <div className="mt-4 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Quick-Commerce Partners In Your Area
          </div>

          {QUICK_COMMERCE_STORES.map((store) => (
            <div
              key={store.id}
              className="p-3 rounded-2xl bg-white border border-[#E9E4DC] hover:border-[#FF5500]/50 transition-all shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${store.logoBg} ${store.logoTextColor} flex items-center justify-center font-black text-sm shadow-xs`}
                >
                  {store.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#181B22]">{store.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700">
                      {store.badge}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">{store.tagline}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  openQuickCommerceStore(store.id, ingredientName);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#E64A00] text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>Order</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Guarantee footer */}
        <div className="mt-4 pt-3 border-t border-[#ECE7DF] flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Direct app deep linking enabled
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
            Avg. 10m delivery
          </span>
        </div>
      </div>
    </div>
  );
};
