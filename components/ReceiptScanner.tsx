
import React, { useState, useRef } from 'react';
import { parseReceipt } from '../services/geminiService';
import { FoodItem, FoodCategory, Language } from '../types';
import { translations } from '../translations';

interface ReceiptScannerProps {
  onItemsAdded: (items: FoodItem[]) => void;
  lang: Language;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onItemsAdded, lang }) => {
  const t = translations[lang];
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Form States
  const [mName, setMName] = useState('');
  const [mDate, setMDate] = useState('');
  const [mQty, setMQty] = useState(1);
  const [mCat, setMCat] = useState<FoodCategory>(FoodCategory.OTHER);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setPreview(base64Data);
      setScanning(true);
      
      try {
        const base64Image = base64Data.split(',')[1];
        const results = await parseReceipt(base64Image, lang);
        
        const today = new Date();
        const newItems: FoodItem[] = results.map((r: any) => {
          const expiry = new Date();
          expiry.setDate(today.getDate() + (r.shelfLifeDays || 7));
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: r.name,
            category: (Object.values(FoodCategory).includes(r.category) ? r.category : FoodCategory.OTHER) as FoodCategory,
            purchaseDate: today.toISOString(),
            expiryDate: expiry.toISOString(),
            quantity: r.quantity || '1 unit',
            currentQuantity: typeof r.numericQuantity === 'number' ? r.numericQuantity : 1,
            isUsed: false
          };
        });

        onItemsAdded(newItems);
      } catch (error) {
        console.error("Scan failed", error);
      } finally {
        setScanning(false);
        setPreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName || !mDate) return;

    const newItem: FoodItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: mName,
      category: mCat,
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(mDate).toISOString(),
      quantity: `${mQty} unit`,
      currentQuantity: mQty,
      isUsed: false
    };

    onItemsAdded([newItem]);
    // Reset
    setMName('');
    setMDate('');
    setMQty(1);
    setShowManual(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in zoom-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center text-center gap-8">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl transition-all ${
          scanning ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 animate-pulse' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
        }`}>
          {scanning ? <i className="fa-solid fa-wand-sparkles"></i> : <i className="fa-solid fa-receipt"></i>}
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">{t.scanTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">
            {t.scanDesc}
          </p>
        </div>

        {preview && (
          <div className="relative w-full max-w-xs aspect-[4/5] rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-700 shadow-2xl">
             <img src={preview} alt="Preview" className="w-full h-full object-cover" />
             {scanning && (
               <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-full h-2 bg-white/80 animate-scan-line"></div>
               </div>
             )}
          </div>
        )}

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className={`w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
              scanning ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200/50 dark:shadow-none'
            }`}
          >
            <i className="fa-solid fa-camera-retro"></i>
            {scanning ? t.analyzing : t.takePhoto}
          </button>

          <button
            onClick={() => setShowManual(!showManual)}
            disabled={scanning}
            className="w-full py-4 rounded-[2rem] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            {t.manualAddTitle}
          </button>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
      </div>

      {showManual && (
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-700 shadow-xl animate-in slide-in-from-top duration-300">
           <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <i className="fa-solid fa-plus-circle text-emerald-500"></i>
              {t.manualAddTitle}
           </h3>
           <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.nameLabel}</label>
                 <input 
                    required
                    type="text" 
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    placeholder="Ex: Lait, Fromage..."
                    className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-6 py-4 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20"
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.expiryLabel}</label>
                   <input 
                      required
                      type="date" 
                      value={mDate}
                      onChange={(e) => setMDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-6 py-4 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.qtyLabel}</label>
                   <input 
                      required
                      type="number" 
                      min="1"
                      value={mQty}
                      onChange={(e) => setMQty(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-6 py-4 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20"
                   />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Catégorie</label>
                 <select 
                    value={mCat}
                    onChange={(e) => setMCat(e.target.value as FoodCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-6 py-4 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20 appearance-none"
                 >
                    {Object.values(FoodCategory).map(cat => (
                      <option key={cat} value={cat}>{t.categories[cat]}</option>
                    ))}
                 </select>
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 mt-4 transition-all active:scale-95">
                 {t.addBtn}
              </button>
           </form>
        </div>
      )}

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-150px); }
          100% { transform: translateY(250px); }
        }
        .animate-scan-line { animation: scan-line 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ReceiptScanner;
