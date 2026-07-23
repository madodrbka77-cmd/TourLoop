import React, { useState, useRef, useMemo } from 'react';
import { Eye, ImageIcon, MapPin, Plus, X, Camera as CameraIcon, DollarSign, Loader2 } from 'lucide-react';
import { User, Product } from '../../types';
import { getCategories, getCountriesConfig, getConditions } from '../../data/marketplaceData';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface SellModalProps {
  onClose: () => void;
  currentUser: User;
  onProductCreated: (product: Product) => void;
  showNotification: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const SellModal: React.FC<SellModalProps> = ({ onClose, currentUser, onProductCreated, showNotification }) => {
  const { t, dir, language } = useLanguage();

  // Dynamic Data
  const categories = getCategories(t as any).filter(c => c.id !== 'all');
  const countriesConfig = getCountriesConfig(t as any);
  const conditions = getConditions(t as any);

  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('electronics');
  const [newCondition, setNewCondition] = useState<'new' | 'used_good' | 'used_fair'>('new');
  const [newImages, setNewImages] = useState<string[]>([]);
  
  // Initialize with translated first country
  const countryKeys = Object.keys(countriesConfig);
  const [newCountry, setNewCountry] = useState(countryKeys[0] || '');
  const [newCity, setNewCity] = useState('');
  const [newCurrency, setNewCurrency] = useState(countriesConfig[countryKeys[0]]?.symbol || '');
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 8 - newImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      if (files.length > remainingSlots) {
          playAudio('notification');
          showNotification(language === 'ar' ? `يمكنك إضافة 8 صور كحد أقصى. تم اختيار أول ${remainingSlots} صور فقط.` : `Maximum 8 photos allowed. Only first ${remainingSlots} selected.`, 'info');
      }

      filesToProcess.forEach(file => {
          if (!file.type.startsWith('image/')) {
            playAudio('notification');
            showNotification(`${t.errors.unsupported_file}: ${file.name}`, 'error');
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            playAudio('notification');
            showNotification(`${t.errors.file_too_large}: ${file.name}`, 'error');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            setNewImages(prev => [...prev, reader.result as string]);
            playAudio('pop');
          };
          reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
      playAudio('pop');
      setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCountryChange = (country: string) => {
      playAudio('pop');
      setNewCountry(country);
      setNewCity('');
      if (countriesConfig[country]) {
          setNewCurrency(countriesConfig[country].symbol);
      }
  };

  const sanitizeInput = (input: string) => {
    return input.replace(/<[^>]*>?/gm, '').trim();
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanTitle = sanitizeInput(newTitle);
    const cleanDesc = sanitizeInput(newDescription);
    const cleanPrice = parseFloat(newPrice);

    if (!cleanTitle || cleanTitle.length < 3) {
        playAudio('notification');
        showNotification(language === 'ar' ? 'يرجى إدخال عنوان صحيح (3 أحرف على الأقل)' : 'Please enter a valid title (min 3 chars)', 'error');
        return;
    }
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
        playAudio('notification');
        showNotification(language === 'ar' ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price', 'error');
        return;
    }
    if (newImages.length === 0) {
        playAudio('notification');
        showNotification(language === 'ar' ? 'يرجى إضافة صورة واحدة على الأقل للمنتج' : 'Please add at least one photo', 'error');
        return;
    }
    if (!newCity) {
        playAudio('notification');
        showNotification(t.errors.required, 'error');
        return;
    }

    playAudio('pop');
    setIsLoading(true);

    setTimeout(() => {
      const newProduct: Product = {
        id: `p_${Date.now()}`,
        title: cleanTitle,
        price: cleanPrice,
        currency: newCurrency,
        category: newCategory,
        image: newImages[0],
        images: newImages,
        location: newCity,
        seller: currentUser,
        description: cleanDesc,
        condition: newCondition,
        date: t.date_now || 'Now',
        timestamp: Date.now(),
        isSaved: false,
        comments: []
      };

      onProductCreated(newProduct);
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" dir={dir}>
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-full md:h-[90vh] overflow-hidden animate-scaleIn flex flex-col md:flex-row border border-white/20 dark:border-gray-700 transition-colors duration-300">
              
              {/* Preview Side */}
              <div className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex flex-col items-center justify-center border-b md:border-b-0 border-l-0 md:border-l rtl:md:border-l-0 rtl:md:border-r border-gray-200 dark:border-gray-700 overflow-y-auto min-h-[250px] md:min-h-0 relative">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 w-full text-start flex items-center gap-2 sticky top-0">
                      <Eye className="w-4 h-4" /> {t.market.preview}
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-xs transition-all duration-300">
                      <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden group">
                          {newImages.length > 0 ? (
                             <img src={newImages[0]} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                             <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center animate-pulse">
                                <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                <span className="text-xs font-medium">{t.market.add_photos}</span>
                             </div>
                          )}
                          {newImages.length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                                  1 / {newImages.length} {t.market.photos}
                              </div>
                          )}
                      </div>
                      <div className="p-4">
                          <div className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                             {newPrice ? `${parseFloat(newPrice).toLocaleString()} ${newCurrency}` : t.market.price}
                          </div>
                          <h3 className="text-base text-gray-700 dark:text-gray-300 font-medium mb-1 line-clamp-1">
                             {newTitle || t.market.title_label}
                          </h3>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                             <MapPin className="w-3 h-3" />
                             {newCity || t.market.location}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Form Side */}
              <div className="w-full md:w-1/2 flex flex-col h-full bg-white dark:bg-gray-800">
                  <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky top-0 z-10">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                          <Plus className="w-6 h-6 text-fb-blue" /> {t.market.create_listing}
                      </h3>
                      <button 
                        onClick={() => { playAudio('pop'); onClose(); }} 
                        className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-600 dark:text-gray-300 active:scale-95"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-white dark:bg-gray-800 custom-scrollbar">
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              {t.market.photos} ({newImages.length}/8)
                          </label>
                          <div className="grid grid-cols-4 gap-2 mb-3">
                              {newImages.map((img, idx) => (
                                  <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                      <img src={img} className="w-full h-full object-cover" alt="Selected" />
                                      <button 
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full hover:bg-red-500 transition active:scale-90"
                                      >
                                          <X className="w-3 h-3" />
                                      </button>
                                  </div>
                              ))}
                              {newImages.length < 8 && (
                                  <div 
                                    onClick={() => { playAudio('pop'); fileInputRef.current?.click(); }}
                                    className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition active:scale-95"
                                  >
                                      <CameraIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                  </div>
                              )}
                          </div>
                          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.market.title_label}</label>
                          <input 
                             type="text" 
                             className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none transition placeholder-gray-400" 
                             placeholder={t.market.title_label} 
                             value={newTitle} 
                             onChange={(e) => setNewTitle(e.target.value)} 
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.market.country}</label>
                              <select 
                                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none transition appearance-none cursor-pointer"
                                  value={newCountry}
                                  onChange={(e) => handleCountryChange(e.target.value)}
                              >
                                  {countryKeys.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.market.city}</label>
                              <select 
                                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none transition appearance-none cursor-pointer"
                                  value={newCity}
                                  onChange={(e) => setNewCity(e.target.value)}
                                  disabled={!newCountry}
                              >
                                  <option value="">{t.placeholders.select_option}</option>
                                  {newCountry && countriesConfig[newCountry]?.cities.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.market.price} ({newCurrency})</label>
                              <div className="relative">
                                  <input 
                                    type="number" 
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 pl-8 rtl:pr-8 rtl:pl-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none transition" 
                                    placeholder="0.00" 
                                    value={newPrice} 
                                    onChange={(e) => setNewPrice(e.target.value)} 
                                  />
                                  <DollarSign className={`absolute ${dir === 'rtl' ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.market.condition}</label>
                              <select 
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none transition appearance-none cursor-pointer" 
                                value={newCondition} 
                                onChange={(e) => setNewCondition(e.target.value as any)}
                              >
                                  {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.common_category}</label>
                          <select 
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none transition appearance-none cursor-pointer" 
                            value={newCategory} 
                            onChange={(e) => setNewCategory(e.target.value)}
                          >
                              {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}
                                  </option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.market.description}</label>
                          <textarea 
                             className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none resize-none h-28 transition" 
                             placeholder={t.market.description} 
                             value={newDescription} 
                             onChange={(e) => setNewDescription(e.target.value)} 
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end sticky bottom-0">
                      <button 
                        onClick={handleCreateListing} 
                        disabled={!newTitle || !newPrice || newImages.length === 0 || !newCity || isLoading}
                        className="w-full md:w-auto px-8 py-2.5 bg-fb-blue text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                      >
                          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          {t.market.publish_listing}
                      </button>
                  </div>
              </div>
           </div>
        </div>
  );
};

export default SellModal;