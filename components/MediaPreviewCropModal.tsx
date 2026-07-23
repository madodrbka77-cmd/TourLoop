import React, { useState, useRef, useEffect } from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCw, Check, Move, Sliders, RefreshCw, Image as ImageIcon, Sparkles 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { playAudio } from '../utils/audio';

interface MediaPreviewCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  type: 'avatar' | 'cover';
  onClose: () => void;
  onConfirm: (processedImage: string) => void;
}

type FilterType = 'normal' | 'grayscale' | 'sepia' | 'brightness' | 'warm' | 'cool';

export const MediaPreviewCropModal: React.FC<MediaPreviewCropModalProps> = ({
  isOpen,
  imageSrc,
  type,
  onClose,
  onConfirm
}) => {
  const { t, language } = useLanguage();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<FilterType>('normal');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when a new image or type is provided
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setFilter('normal');
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc, type]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    playAudio('pop');
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    playAudio('pop');
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setFilter('normal');
  };

  const getFilterCSS = (f: FilterType) => {
    switch (f) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(80%)';
      case 'brightness': return 'brightness(120%) contrast(110%)';
      case 'warm': return 'sepia(30%) saturate(130%)';
      case 'cool': return 'hue-rotate(180deg) saturate(90%)';
      default: return 'none';
    }
  };

  const handleSave = () => {
    setIsProcessing(true);
    playAudio('pop');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const outputWidth = type === 'avatar' ? 500 : 1200;
        const outputHeight = type === 'avatar' ? 500 : 450;

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, outputWidth, outputHeight);

          // Apply Filter
          if (filter === 'grayscale') ctx.filter = 'grayscale(100%)';
          else if (filter === 'sepia') ctx.filter = 'sepia(80%)';
          else if (filter === 'brightness') ctx.filter = 'brightness(120%) contrast(110%)';
          else if (filter === 'warm') ctx.filter = 'sepia(30%) saturate(130%)';
          else if (filter === 'cool') ctx.filter = 'hue-rotate(180deg) saturate(90%)';

          ctx.save();
          ctx.translate(outputWidth / 2 + position.x * (outputWidth / 300), outputHeight / 2 + position.y * (outputHeight / 300));
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(zoom, zoom);

          // Calculate aspect scale to fit container nicely
          const scale = Math.max(outputWidth / img.width, outputHeight / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;

          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          playAudio('notification');
          onConfirm(dataUrl);
        } else {
          onConfirm(imageSrc);
        }
      } catch (err) {
        console.error('Error rendering image crop:', err);
        onConfirm(imageSrc);
      } finally {
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      onConfirm(imageSrc);
      setIsProcessing(false);
    };

    img.src = imageSrc;
  };

  const title = type === 'avatar' 
    ? (language === 'ar' ? 'معاينة وضبط صورة الملف الشخصي' : 'Preview & Adjust Profile Picture')
    : (language === 'ar' ? 'معاينة وضبط صورة الغلاف' : 'Preview & Adjust Cover Photo');

  const filtersList: { id: FilterType; label: string; labelEn: string }[] = [
    { id: 'normal', label: 'عادي', labelEn: 'Original' },
    { id: 'warm', label: 'دافئ', labelEn: 'Warm' },
    { id: 'cool', label: 'بارد', labelEn: 'Cool' },
    { id: 'brightness', label: 'مشرق', labelEn: 'Vibrant' },
    { id: 'sepia', label: 'كلاسيكي', labelEn: 'Sepia' },
    { id: 'grayscale', label: 'أسود وأبيض', labelEn: 'B&W' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-3 sm:p-4 animate-fadeIn backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 dark:border-gray-700">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'قم بسحب وتكبير الصورة لمعاينتها وتنسيقها بشكل متناسق' : 'Drag, zoom, and adjust your photo before confirming'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { playAudio('pop'); onClose(); }} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700 p-2 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Preview Canvas Window */}
        <div className="p-4 sm:p-6 bg-gray-900 flex-1 flex flex-col items-center justify-center relative overflow-hidden select-none min-h-[280px]">
          
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center transition-all ${
              type === 'avatar' 
                ? 'w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-white/90 dark:border-gray-800 shadow-2xl ring-4 ring-emerald-500/30' 
                : 'w-full h-52 sm:h-64 rounded-xl border-2 border-white/80 shadow-2xl ring-2 ring-emerald-500/20'
            }`}
          >
            <div
              className="absolute w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                filter: getFilterCSS(filter),
                transition: isDragging ? 'none' : 'transform 0.15s ease-out, filter 0.2s ease-out'
              }}
            >
              <img 
                src={imageSrc} 
                alt="Preview" 
                className="max-w-none w-full h-full object-cover pointer-events-none"
              />
            </div>

            {/* Instruction Overlay Tag */}
            <div className="absolute bottom-3 bg-black/60 text-white text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-md pointer-events-none flex items-center gap-1.5 border border-white/20">
              <Move className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ar' ? 'اسحب للتحريك والتوسيط' : 'Drag to reposition'}</span>
            </div>
          </div>

        </div>

        {/* Toolbar & Controls */}
        <div className="p-4 sm:p-5 bg-white dark:bg-gray-800 space-y-4 border-t border-gray-100 dark:border-gray-700">
          
          {/* Zoom Slider & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[220px] bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-xl border border-gray-200/60 dark:border-gray-600/50">
              <ZoomOut className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <input 
                type="range" 
                min="0.8" 
                max="2.5" 
                step="0.05"
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-10 text-center">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleRotate}
                title={language === 'ar' ? 'تدوير 90 درجة' : 'Rotate 90°'}
                className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition flex items-center gap-1.5 text-xs"
              >
                <RotateCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">{language === 'ar' ? 'تدوير' : 'Rotate'}</span>
              </button>

              <button 
                onClick={handleReset}
                title={language === 'ar' ? 'إعادة ضبط التكبير والموضع' : 'Reset Position & Zoom'}
                className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition flex items-center gap-1.5 text-xs"
              >
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">{language === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            </div>
          </div>

          {/* Filters List */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ar' ? 'التأثيرات والفلاتر الضوئية:' : 'Color & Light Filters:'}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {filtersList.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { playAudio('pop'); setFilter(f.id); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 border ${
                    filter === f.id
                      ? 'bg-emerald-600 hover:bg-blue-600 text-white border-emerald-600 hover:border-blue-600 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {language === 'ar' ? f.label : f.labelEn}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={() => { playAudio('pop'); onClose(); }}
            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm transition"
          >
            {t.common_cancel || 'إلغاء'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-blue-600 dark:bg-emerald-600 dark:hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-colors duration-200 shadow-lg shadow-emerald-600/20 hover:shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{language === 'ar' ? 'اعتماد وحفظ الصورة' : 'Apply & Save Photo'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
