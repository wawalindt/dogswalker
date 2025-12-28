
import React, { useEffect } from 'react';
import { useAppStore } from '../store';

export const InfoPopup: React.FC = () => {
  const { infoDogId, setInfoDogId, dogs } = useAppStore();

  useEffect(() => {
    if (infoDogId) {
        const closePopup = () => setInfoDogId(null);
        
        // Задержка перед добавлением слушателя, чтобы текущий клик не закрыл попап сразу
        const timer = setTimeout(() => {
            window.addEventListener('pointerdown', closePopup);
        }, 100);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('pointerdown', closePopup);
        };
    }
  }, [infoDogId, setInfoDogId]);

  if (!infoDogId) return null;

  const dog = dogs.find(d => d.id === infoDogId);
  if (!dog) return null;

  const getNames = (ids: string[]) => {
      if (!ids || ids.length === 0) return null;
      return ids.map(id => {
          const d = dogs.find(dog => dog.id === id);
          return d ? d.name : id;
      }).join(', ');
  };

  const friendNames = getNames(dog.pairs);
  const conflictNames = getNames(dog.conflicts);

  const complexityConfig = {
      'green': { icon: '🟢', label: 'Спокойный' },
      'yellow': { icon: '🟡', label: 'С особенностями' },
      'orange': { icon: '🟠', label: 'Сложный' },
      'red': { icon: '⚠️', label: 'Опасный' },
  }[dog.complexity];

  return (
    <div 
        className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
    >
      <div className="bg-slate-800/95 backdrop-blur-xl text-slate-100 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-6 pb-8 border-2 border-slate-600 ring-1 ring-black/20 pointer-events-auto relative">
         
         <div className="flex items-start justify-between mb-4 border-b border-slate-600 pb-3">
            <h3 className="font-black text-2xl leading-tight text-engraved">
                {dog.name}
                {dog.health === 'Лечение' && (
                    <span className="text-base ml-2 text-red-400 font-bold whitespace-nowrap">
                         На лечении 💊
                    </span>
                )}
                {dog.health === 'Не гуляет' && (
                    <span className="text-base ml-2 text-slate-400 font-bold whitespace-nowrap">
                         Не гуляет ⛔
                    </span>
                )}
            </h3>
            <span className="text-xs uppercase font-bold tracking-widest opacity-60 shrink-0 ml-2 mt-1.5 font-mono">ID: {dog.id}</span>
         </div>

         <div className="space-y-4">
             {/* Complexity */}
             <div className="flex gap-3 items-center p-2 bg-black/20 rounded-lg shadow-inner">
                 <span className="text-2xl leading-none">{complexityConfig.icon}</span>
                 <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-black opacity-60 tracking-wider text-slate-400">Характер</span>
                     <span className="font-bold text-lg leading-none">{complexityConfig.label}</span>
                 </div>
             </div>

             {dog.notes && (
                 <div className="flex gap-3 items-start">
                     <span className="text-2xl mt-0.5 grayscale opacity-70">💬</span>
                     <div>
                        <span className="text-[10px] uppercase font-black opacity-60 tracking-wider text-slate-400">Заметки</span>
                        <p className="text-base font-medium leading-relaxed italic opacity-90">{dog.notes}</p>
                     </div>
                 </div>
             )}

             {friendNames && (
                 <div className="flex gap-3 items-start">
                     <span className="text-2xl mt-0.5 grayscale opacity-70">🧩</span>
                     <div>
                         <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Друзья</span>
                         <p className="text-base font-bold leading-tight">{friendNames}</p>
                     </div>
                 </div>
             )}

             {conflictNames && (
                 <div className="flex gap-3 items-start">
                     <span className="text-2xl mt-0.5 grayscale opacity-70">⚡</span>
                     <div>
                        <span className="text-[10px] uppercase font-black text-red-400 tracking-wider">Конфликты</span>
                        <p className="text-base font-bold leading-tight">{conflictNames}</p>
                     </div>
                 </div>
             )}
         </div>

         {/* Row Indicator (Bottom Right) */}
         {dog.row && (
            <div className="absolute bottom-2 right-4 text-xs uppercase font-bold tracking-widest opacity-40 font-mono">
                Вольер: {dog.row}
            </div>
         )}
      </div>
    </div>
  );
};
