
import React from 'react';
import { FoodItem, FoodCategory, Language } from '../types';
import { translations } from '../translations';

interface InventoryItemProps {
  item: FoodItem;
  onMarkAsUsed: (id: string, all: boolean) => void;
  onUpdateDate: (id: string, newDate: string) => void;
  lang: Language;
  themeTextClass: string;
}

const categoryIcons: Record<FoodCategory, string> = {
  [FoodCategory.FRUITS_VEGGIES]: 'fa-apple-whole text-emerald-500',
  [FoodCategory.DAIRY]: 'fa-cheese text-amber-500',
  [FoodCategory.MEAT_FISH]: 'fa-drumstick-bite text-red-400',
  [FoodCategory.PANTRY]: 'fa-jar text-orange-400',
  [FoodCategory.BEVERAGES]: 'fa-bottle-water text-sky-400',
  [FoodCategory.FROZEN]: 'fa-snowflake text-blue-300',
  [FoodCategory.OTHER]: 'fa-box text-slate-300',
};

const InventoryItem: React.FC<InventoryItemProps> = ({ item, onMarkAsUsed, onUpdateDate, lang, themeTextClass }) => {
  if (!item) return null;
  
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const expiryDate = new Date(item.expiryDate);
  const today = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const getStatusInfo = () => {
    if (diffDays < 0) return { color: 'text-slate-400 bg-slate-100 dark:bg-slate-800', label: t.expired };
    if (diffDays === 0) return { color: 'text-orange-600 bg-orange-100 dark:bg-orange-500/10', label: t.expiresToday };
    if (diffDays === 1) return { color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/5', label: t.expiresTomorrow };
    return { color: 'text-slate-500 bg-slate-100 dark:bg-slate-800/50', label: t.expiresIn.replace('{days}', diffDays.toString()) };
  };

  const status = getStatusInfo();
  const translatedCategory = t.categories[item.category] || item.category;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-4xl p-6 border border-slate-100 dark:border-slate-800 flex items-center gap-6 transition-all duration-500 ${item.isUsed ? 'opacity-30 grayscale' : 'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none group shadow-soft'}`}>
      <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-500">
        <i className={`fa-solid ${categoryIcons[item.category] || categoryIcons[FoodCategory.OTHER]}`}></i>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 dark:text-white truncate text-base mb-1 tracking-tight">{item.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest truncate">
            {item.currentQuantity > 0 ? `${item.currentQuantity} x ` : ''}{item.quantity} • {translatedCategory}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <label className="cursor-pointer group/date relative">
          <input 
            type="date" 
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => onUpdateDate(item.id, e.target.value)}
          />
          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${status.color}`}>
            {status.label}
          </span>
        </label>
        
        {!item.isUsed && (
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
             {item.currentQuantity > 1 && (
               <button 
                onClick={(e) => { e.stopPropagation(); onMarkAsUsed(item.id, false); }}
                className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <i className="fa-solid fa-minus text-[10px]"></i>
              </button>
             )}
            <button 
              onClick={(e) => { e.stopPropagation(); onMarkAsUsed(item.id, true); }}
              className={`text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 uppercase transition-all`}
            >
              {t.used}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryItem;
