
import React, { useState } from 'react';
import { AppView, Language, FoodItem } from '../types';
import { translations } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setView: (view: AppView) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isDark: boolean;
  toggleDark: () => void;
  expiringSoon: FoodItem[];
  themeColor: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, lang, setLang, isDark, toggleDark, expiringSoon, themeColor }) => {
  const t = translations[lang] || translations.fr;
  const isRtl = lang === 'ar';
  const [showNotifs, setShowNotifs] = useState(false);

  const themeAccentClass = {
    sage: 'bg-sage-500',
    sand: 'bg-[#C2B280]',
    sky: 'bg-[#A3B7C9]',
    minimal: 'bg-slate-800'
  }[themeColor] || 'bg-emerald-600';

  const themeTextClass = {
    sage: 'text-sage-700',
    sand: 'text-[#918356]',
    sky: 'text-[#6A7E91]',
    minimal: 'text-slate-800'
  }[themeColor] || 'text-emerald-700';

  const navItems: { id: AppView; icon: string; label: string }[] = [
    { id: 'dashboard', icon: 'fa-house', label: t.navHome },
    { id: 'fridge', icon: 'fa-box-archive', label: t.navFridge },
    { id: 'scan', icon: 'fa-plus', label: t.navScan },
    { id: 'recipes', icon: 'fa-utensils', label: t.navRecipes },
    { id: 'settings', icon: 'fa-sliders', label: t.navSettings },
  ];

  const validNotifications = (expiringSoon || []).filter(item => item && item.name);

  return (
    <div className={isRtl ? 'rtl' : 'ltr'} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-500">
        
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 px-4 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className={`w-10 h-10 md:w-11 md:h-11 ${themeAccentClass} rounded-2xl flex items-center justify-center text-white shadow-xl transition-all group-hover:rotate-6`}>
              <i className="fa-solid fa-leaf"></i>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              FrigoZen
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-8">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 md:px-4 md:py-2 rounded-full">
               <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-transparent text-[10px] md:text-[11px] font-bold border-none outline-none cursor-pointer text-slate-600 dark:text-slate-300 uppercase tracking-widest"
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
                <option value="ar">AR</option>
              </select>
            </div>
            
            <button 
              onClick={toggleDark}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <i className="fa-solid fa-bell"></i>
                {validNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </button>

              {showNotifs && (
                <div className={`absolute top-12 ${isRtl ? 'left-0' : 'right-0'} w-72 md:w-80 glass rounded-4xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300`}>
                   <div className="p-6 border-b border-white/20 flex justify-between items-center">
                      <h4 className="font-extrabold text-[10px] uppercase tracking-[0.2em] text-slate-400">{t.expiringTitle}</h4>
                      <button onClick={() => setShowNotifs(false)}><i className="fa-solid fa-xmark text-slate-400"></i></button>
                   </div>
                   <div className="max-h-80 overflow-y-auto">
                      {validNotifications.length > 0 ? validNotifications.map(item => (
                        <div key={item.id} className="p-6 border-b border-white/10 last:border-0 hover:bg-white/20 transition-colors">
                           <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.name}</span>
                              <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest">
                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : ""}
                              </span>
                           </div>
                        </div>
                      )) : (
                        <div className="p-10 text-center text-slate-400 text-xs italic">
                           Tout est parfait ! 🎉
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          <nav className={`hidden md:flex flex-col w-80 p-10 gap-10 border-x border-slate-100 dark:border-slate-800`}>
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-5 px-8 py-5 rounded-3xl transition-all duration-300 group ${
                    activeView === item.id 
                      ? `${themeAccentClass} text-white shadow-2xl shadow-${themeColor}-500/20 translate-x-2` 
                      : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} text-lg`}></i>
                  <span className="text-sm font-extrabold tracking-wide">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <main className="flex-1 max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 w-full mb-32 md:mb-0">
            {children}
          </main>
        </div>

        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 px-8 py-4 flex justify-between items-center z-50 rounded-6xl shadow-2xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                activeView === item.id ? `${themeTextClass} scale-125` : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
