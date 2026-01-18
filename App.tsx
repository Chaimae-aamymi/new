
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import { FoodItem, FoodCategory, AppView, Recipe, Language, User } from './types';
import InventoryItem from './components/InventoryItem';
import ReceiptScanner from './components/ReceiptScanner';
import { suggestRecipes, generateRecipeImage, translateIngredients } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('frigozen_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [view, setView] = useState<AppView>('dashboard');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [lang, setLang] = useState<Language>((localStorage.getItem('frigozen_lang') as Language) || 'fr');
  const [isDark, setIsDark] = useState(localStorage.getItem('frigozen_dark') === 'true');
  const [themeColor, setThemeColor] = useState(localStorage.getItem('frigozen_theme') || 'sage');
  
  const isFirstMount = useRef(true);
  const prevLang = useRef(lang);

  const t = translations[lang] || translations.fr;
  const isRtl = lang === 'ar';

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('frigozen_dark', isDark.toString());
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('frigozen_theme', themeColor);
  }, [themeColor]);

  useEffect(() => {
    const performTranslation = async () => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      if (prevLang.current === lang) return;
      if (!items || items.length === 0) {
        prevLang.current = lang;
        return;
      }
      try {
        const namesToTranslate = items.filter(i => i && i.name).map(i => i.name);
        if (namesToTranslate.length === 0) return;
        const translatedMap = await translateIngredients(namesToTranslate, lang);
        setItems(prevItems => prevItems.map(item => ({
          ...item,
          name: (translatedMap && translatedMap[item.name]) || item.name
        })));
        prevLang.current = lang;
      } catch (err) {
        console.error("Translation failed", err);
      }
    };
    performTranslation();
    localStorage.setItem('frigozen_lang', lang);
  }, [lang, items.length]);

  useEffect(() => {
    if (user) localStorage.setItem('frigozen_user', JSON.stringify(user));
    else localStorage.removeItem('frigozen_user');
  }, [user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('frigozen_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(Array.isArray(parsed) ? parsed.filter(i => i && typeof i === 'object') : []);
      }
    } catch (e) {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('frigozen_items', JSON.stringify(items));
  }, [items]);

  const activeItems = useMemo(() => (items || []).filter(i => i && !i.isUsed), [items]);
  const consumedCount = useMemo(() => (items || []).filter(i => i && i.isUsed).length, [items]);
  const totalCount = items?.length || 0;
  
  const consumptionPercentage = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((consumedCount / totalCount) * 100);
  }, [consumedCount, totalCount]);

  const expiringSoon = useMemo(() => {
    const today = new Date();
    return activeItems.filter(item => {
      if (!item || !item.expiryDate) return false;
      const exp = new Date(item.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [activeItems]);

  const handleMarkAsUsed = (id: string, all: boolean = true) => {
    setItems(prev => prev.map(item => {
      if (item && item.id === id) {
        if (all || item.currentQuantity <= 1) {
          return { ...item, isUsed: true, currentQuantity: 0 };
        } else {
          return { ...item, currentQuantity: item.currentQuantity - 1 };
        }
      }
      return item;
    }));
  };

  const handleUpdateDate = (id: string, newDate: string) => {
    setItems(prev => prev.map(item => 
      item && item.id === id ? { ...item, expiryDate: new Date(newDate).toISOString() } : item
    ));
  };

  const handleAddItems = (newItems: FoodItem[]) => {
    const validNew = (newItems || []).filter(i => i && typeof i === 'object');
    setItems(prev => [...validNew, ...prev]);
    setView('fridge');
  };

  const generateRecipesWithImages = async () => {
    if (activeItems.length === 0) return;
    setLoadingRecipes(true);
    setView('recipes');
    try {
      const suggested = await suggestRecipes(activeItems.map(i => i.name), lang);
      const recipesWithImages = await Promise.all(suggested.map(async (recipe: Recipe) => {
        let imageUrl = null;
        try { imageUrl = await generateRecipeImage(recipe.title); } catch(e) {}
        return { ...recipe, imageUrl: imageUrl || `https://picsum.photos/seed/${recipe.title}/800/450` };
      }));
      setRecipes(recipesWithImages);
    } catch (err) {
      console.error("Recipes failed", err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  if (!user) return <Auth onLogin={setUser} lang={lang} />;

  const themeAccentClass = {
    sage: 'bg-sage-600 hover:bg-sage-700',
    sand: 'bg-[#C2B280] hover:bg-[#AB9B6E]',
    sky: 'bg-[#A3B7C9] hover:bg-[#8CA2B5]',
    minimal: 'bg-slate-800 hover:bg-slate-900'
  }[themeColor] || 'bg-emerald-600 hover:bg-emerald-700';

  const themeTextClass = {
    sage: 'text-sage-700',
    sand: 'text-[#918356]',
    sky: 'text-[#6A7E91]',
    minimal: 'text-slate-800'
  }[themeColor] || 'text-emerald-700';

  const themeSoftBgClass = {
    sage: 'bg-sage-50 dark:bg-sage-950/20',
    sand: 'bg-orange-50 dark:bg-orange-950/20',
    sky: 'bg-blue-50 dark:bg-blue-950/20',
    minimal: 'bg-slate-50 dark:bg-slate-900/50'
  }[themeColor] || 'bg-emerald-50';

  const renderContent = () => {
    if (!user) return null;
    
    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <header className="space-y-3">
              <h2 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {(t.welcome || "Bonjour {name}").replace('{name}', user.name || 'Chef')}
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-lg font-semibold tracking-wide">
                {(t.subtitle || "").replace('{count}', activeItems.length.toString())}
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button 
                onClick={() => setView('scan')}
                className={`group ${themeAccentClass} p-12 rounded-6xl text-white flex flex-col justify-between h-72 transition-all duration-500 shadow-2xl transform hover:-translate-y-2`}
              >
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform duration-500">
                  <i className="fa-solid fa-camera-retro"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-3xl font-extrabold mb-2">{t.scanBtn}</h3>
                  <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Digitaliser mon ticket</p>
                </div>
              </button>

              <button 
                onClick={generateRecipesWithImages}
                className={`group ${themeSoftBgClass} p-12 rounded-6xl flex flex-col justify-between h-72 transition-all duration-500 border border-slate-100 dark:border-slate-800 transform hover:-translate-y-2 shadow-sm`}
              >
                <div className={`${themeAccentClass} w-16 h-16 rounded-3xl flex items-center justify-center text-white text-3xl group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                  <i className="fa-solid fa-utensils"></i>
                </div>
                <div className="text-left">
                  <h3 className={`text-3xl font-extrabold mb-2 ${themeTextClass}`}>{t.recipeBtn}</h3>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Cuisiner les restes</p>
                </div>
              </button>
            </div>

            {expiringSoon.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">{t.expiringTitle}</h3>
                  <button onClick={() => setView('fridge')} className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">{t.viewAll}</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {expiringSoon.slice(0, 4).map(item => (
                    <InventoryItem key={item.id} item={item} onMarkAsUsed={handleMarkAsUsed} onUpdateDate={handleUpdateDate} lang={lang} themeTextClass={themeTextClass} />
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white dark:bg-slate-900 rounded-6xl p-12 border border-slate-100 dark:border-slate-800 flex justify-around shadow-soft">
                <div className="text-center group">
                  <span className={`block text-5xl font-black ${themeTextClass} tracking-tighter transition-all group-hover:scale-110`}>{consumptionPercentage}%</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 block">{t.statConsumed}</span>
                </div>
                <div className="w-px h-16 bg-slate-100 dark:bg-slate-800 self-center"></div>
                <div className="text-center group">
                  <span className="block text-5xl font-black text-orange-500 tracking-tighter transition-all group-hover:scale-110">{consumedCount}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 block">{t.statAvoided}</span>
                </div>
            </section>
          </div>
        );

      case 'fridge':
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <h2 className={`text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight ${isRtl ? 'text-right' : 'text-left'}`}>{t.fridgeTitle}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeItems.length > 0 ? activeItems.map(item => (
                <InventoryItem key={item.id} item={item} onMarkAsUsed={handleMarkAsUsed} onUpdateDate={handleUpdateDate} lang={lang} themeTextClass={themeTextClass} />
              )) : (
                <div className="col-span-full py-40 text-center">
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
                     <i className="fa-solid fa-box-open text-3xl text-slate-300"></i>
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest">{t.emptyFridge}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'scan':
        return <ReceiptScanner onItemsAdded={handleAddItems} lang={lang} />;

      case 'recipes':
        return (
          <div className="space-y-12 pb-20 animate-in fade-in duration-500" dir={isRtl ? 'rtl' : 'ltr'}>
            <h2 className={`text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight ${isRtl ? 'text-right' : 'text-left'}`}>{t.recipeTitle}</h2>
            {loadingRecipes ? (
              <div className="py-40 text-center space-y-8">
                <div className="flex justify-center gap-2">
                   <div className={`w-3 h-12 ${themeAccentClass} rounded-full animate-bounce duration-300`}></div>
                   <div className={`w-3 h-12 ${themeAccentClass} rounded-full animate-bounce duration-500`}></div>
                   <div className={`w-3 h-12 ${themeAccentClass} rounded-full animate-bounce duration-700`}></div>
                </div>
                <p className="text-slate-500 font-extrabold uppercase tracking-[0.4em] text-xs">{t.loadingRecipes}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-12">
                {recipes.length > 0 ? recipes.map((recipe, idx) => (
                  <article key={idx} className="bg-white dark:bg-slate-900 rounded-[4rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-soft transition-all duration-500 hover:-translate-y-2">
                    <div className="relative h-[25rem] md:h-[30rem]">
                       <img src={recipe.imageUrl || 'https://picsum.photos/800/600'} className="w-full h-full object-cover" alt={recipe.title} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                       <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 md:right-12">
                          <h3 className={`text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter ${isRtl ? 'text-right' : 'text-left'}`}>{recipe.title}</h3>
                          <div className={`flex gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                             <span className={`${themeAccentClass} text-white text-[10px] font-black px-5 py-2.5 rounded-full uppercase tracking-widest shadow-2xl`}>{recipe.prepTime}</span>
                             <span className="bg-white/10 backdrop-blur-xl text-white text-[10px] font-black px-5 py-2.5 rounded-full uppercase tracking-widest border border-white/20">{recipe.difficulty}</span>
                          </div>
                       </div>
                    </div>
                    <div className="p-8 md:p-16 space-y-12">
                      <p className={`text-slate-500 text-xl font-medium leading-relaxed italic ${isRtl ? 'text-right' : 'text-left'}`}>"{recipe.description}"</p>
                      <div className={`grid md:grid-cols-2 gap-16`}>
                         <div className={isRtl ? 'order-1' : ''}>
                            <h4 className={`text-[10px] font-black uppercase ${themeTextClass} tracking-[0.4em] mb-8 pb-4 border-b border-slate-50 dark:border-slate-800 ${isRtl ? 'text-right' : 'text-left'}`}>{t.ingredientsHead}</h4>
                            <ul className={`space-y-4 mt-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                               {(recipe.ingredients || []).map((ing, i) => (
                                 <li key={i} className={`text-slate-700 dark:text-slate-300 flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                   <div className={`w-2 h-2 ${themeAccentClass} rounded-full flex-shrink-0`}></div> 
                                   <span className="text-base font-semibold">{ing}</span>
                                 </li>
                               ))}
                            </ul>
                         </div>
                         <div className={isRtl ? 'order-2' : ''}>
                            <h4 className={`text-[10px] font-black uppercase ${themeTextClass} tracking-[0.4em] mb-8 pb-4 border-b border-slate-50 dark:border-slate-800 ${isRtl ? 'text-right' : 'text-left'}`}>{t.stepsHead}</h4>
                            <div className="space-y-8 mt-2">
                               {(recipe.instructions || []).map((step, i) => (
                                 <div key={i} className={`flex gap-6 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                                    <span className={`w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black ${themeTextClass} text-xs flex-shrink-0`}>{i+1}</span>
                                    <span className="text-slate-600 dark:text-slate-400 text-base leading-relaxed font-medium">{step}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    </div>
                  </article>
                )) : (
                  <div className="py-20 text-center text-slate-400 italic">Aucune recette trouvée. Ajoutez des produits !</div>
                )}
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
            <h2 className={`text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight ${isRtl ? 'text-right' : 'text-left'}`}>{t.settingsTitle}</h2>
            
            <div className="bg-white dark:bg-slate-900 rounded-6xl p-8 md:p-16 border border-slate-100 dark:border-slate-800 shadow-soft space-y-16">
               <div className={`flex items-center gap-6 md:gap-10 pb-12 border-b border-slate-50 dark:border-slate-800 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                  <div className={`w-20 h-20 md:w-28 md:h-28 ${themeSoftBgClass} rounded-full flex items-center justify-center ${themeTextClass} text-3xl md:text-4xl font-black shadow-inner`}>
                    {(user.name || "C").charAt(0)}
                  </div>
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 md:mb-2">{user.name || 'Chef'}</h3>
                    <p className="text-base md:text-lg text-slate-400 font-semibold">{user.email}</p>
                  </div>
               </div>

               <div className="space-y-12">
                  <div>
                    <label className={`text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] block mb-8 ${isRtl ? 'text-right' : ''}`}>{t.themeChoice}</label>
                    <div className={`flex flex-wrap gap-4 md:gap-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      {[
                        { id: 'sage', color: '#82937E' },
                        { id: 'sand', color: '#C2B280' },
                        { id: 'sky', color: '#A3B7C9' },
                        { id: 'minimal', color: '#1e293b' }
                      ].map(theme => (
                        <button 
                          key={theme.id}
                          onClick={() => setThemeColor(theme.id)}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-3xl transition-all duration-500 transform shadow-xl ${
                            themeColor === theme.id ? 'ring-4 ring-offset-8 ring-slate-200 dark:ring-slate-800 scale-110' : 'opacity-40 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: theme.color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 space-y-4">
                    <button className={`w-full p-6 md:p-8 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-4xl transition-all duration-300 ${isRtl ? 'flex-row-reverse' : ''}`}>
                       <span className="font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">{t.notifExpiry}</span>
                       <div className={`w-14 h-8 ${themeAccentClass} rounded-full relative flex items-center px-1 shadow-inner`}>
                          <div className="w-6 h-6 bg-white rounded-full shadow-lg ml-auto"></div>
                       </div>
                    </button>
                    <button className={`w-full p-6 md:p-8 flex items-center justify-between text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-4xl transition-all duration-300 ${isRtl ? 'flex-row-reverse' : ''}`} onClick={() => { if(confirm(t.confirm)) setItems([]) }}>
                       <span className="font-extrabold tracking-tight">{t.clearFridge}</span>
                       <i className="fa-solid fa-trash-can text-lg"></i>
                    </button>
                    <button className={`w-full p-6 md:p-8 flex items-center justify-between text-slate-400 pt-16 hover:text-slate-900 dark:hover:text-white transition-colors ${isRtl ? 'flex-row-reverse' : ''}`} onClick={() => setUser(null)}>
                       <span className="font-extrabold tracking-tight uppercase text-xs tracking-[0.3em]">{t.logout}</span>
                       <i className="fa-solid fa-power-off text-lg"></i>
                    </button>
                  </div>
               </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <Layout 
      activeView={view} 
      setView={setView} 
      lang={lang} 
      setLang={setLang} 
      isDark={isDark} 
      toggleDark={() => setIsDark(!isDark)}
      expiringSoon={expiringSoon}
      themeColor={themeColor}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
