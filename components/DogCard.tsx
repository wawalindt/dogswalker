
import React, { forwardRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Dog } from '../types';
import { useAppStore } from '../store';

interface DogCardProps {
  dog: Dog;
  compact?: boolean;
  isSidebar?: boolean;
  hasConflict?: boolean; 
}

interface DogCardBaseProps extends DogCardProps {
    style?: React.CSSProperties;
    attributes?: any;
    listeners?: any;
    isOverlay?: boolean;
    onInfoClick?: (id: string) => void;
}

export const DogCardBase = forwardRef<HTMLDivElement, DogCardBaseProps>(({ dog, compact, style, attributes, listeners, isOverlay, onInfoClick, hasConflict }, ref) => {
  const isWalked = dog.walksToday > 0;
  
  const isDangerous = dog.complexity === 'red';
  const isSick = dog.health === 'Лечение';
  const isNoWalk = dog.health === 'Не гуляет';
  
  const isUnavailable = isDangerous || isSick || isNoWalk;
  const isGrayedOut = isUnavailable || hasConflict;
  
  let cardBg = 'bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-700';
  let borderClass = 'border-t-[1px] border-l-[1px] border-white/80 dark:border-white/20 border-b-[2px] border-r-[2px] border-zinc-400 dark:border-black/60';
  let shadowClass = 'shadow-plate';
  
  let textColor = 'text-slate-700 dark:text-slate-300 text-engraved'; 
  let iconFilter = '';

  if (isWalked) {
      cardBg = 'bg-gradient-to-br from-orange-100 via-orange-50 to-orange-200 dark:from-orange-900/40 dark:via-orange-900/30 dark:to-orange-950/50';
      borderClass = 'border-t border-white/50 border-b-2 border-orange-400/50 dark:border-orange-900/50';
      textColor = 'text-orange-950 dark:text-orange-200 text-engraved';
  }

  if (isGrayedOut) {
      cardBg = 'bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-slate-800 dark:to-slate-900';
      borderClass = 'border border-zinc-500 dark:border-slate-700 opacity-80';
      textColor = 'text-zinc-600 dark:text-slate-500 text-pressed';
      iconFilter = 'grayscale opacity-50';
  }

  const overlayClass = isOverlay ? 'shadow-2xl cursor-grabbing ring-2 ring-orange-400 z-50' : 'cursor-grab active:cursor-grabbing hover:brightness-105 active:scale-[0.98]';

  const handleInfoClick = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      if (onInfoClick) onInfoClick(dog.id);
  };

  const complexityIcon = {
    'green': '🟢',
    'yellow': '🟡',
    'orange': '🟠',
    'red': '⚠️',
  }[dog.complexity];

  return (
    <div
      ref={ref}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative flex flex-col justify-between
        w-full min-h-[80px] p-2.5 rounded-2xl
        ${cardBg} 
        ${borderClass}
        ${shadowClass}
        ${overlayClass}
        transition-all duration-200 select-none group overflow-hidden
      `}
    >
        {!isGrayedOut && <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none rounded-2xl" />}
        
        <button
            onClick={handleInfoClick}
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute top-2 right-2 text-lg leading-none z-10 hover:scale-125 transition-transform cursor-pointer drop-shadow-md ${isDangerous ? '' : iconFilter}`}
        >
            {complexityIcon}
        </button>

        <div className="flex flex-col mt-1 mb-1.5 pl-2 pr-6 relative z-10">
            <div className="flex items-center gap-2">
                <span className={`font-black text-lg sm:text-xl leading-tight truncate tracking-tight ${textColor}`} title={dog.name}>
                    {dog.name}
                </span>
                <div className="flex gap-1 shrink-0">
                    {dog.notes && (
                        <button 
                            onClick={handleInfoClick}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`text-[16px] opacity-70 ${textColor} hover:scale-125 transition-transform cursor-pointer`}
                        >
                            💬
                        </button>
                    )}
                    {isSick && <span className="text-sm animate-pulse">💊</span>}
                    {isNoWalk && <span className="text-sm">⛔</span>}
                </div>
            </div>
        </div>

        <div className={`mt-auto pt-1 border-t flex items-center justify-between relative z-10 ${isWalked ? 'border-orange-900/10' : 'border-black/5'}`}>
            <div className={`flex items-center gap-2 ${textColor}`}>
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                    Walks:
                 </span>
                 <span className="text-xs font-mono font-bold opacity-80">{dog.walksToday}</span>
            </div>

            <div className={`flex gap-3 absolute right-1 bottom-0.5`}>
                {dog.pairs.length > 0 && (
                    <button 
                        onClick={handleInfoClick}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`text-lg hover:scale-125 transition-transform cursor-pointer leading-none drop-shadow-sm ${iconFilter}`}
                        title="Есть друзья"
                    >
                        🧩
                    </button>
                )}
                {dog.conflicts.length > 0 && (
                     <button 
                        onClick={handleInfoClick}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`text-lg hover:scale-125 transition-transform cursor-pointer leading-none drop-shadow-sm ${hasConflict ? 'opacity-100 scale-125 animate-pulse text-red-600' : `opacity-80 ${iconFilter}`}`}
                        title="Есть конфликты"
                    >
                        ⚡
                    </button>
                )}
            </div>
        </div>
    </div>
  );
});

export const DogCard: React.FC<DogCardProps> = ({ dog, compact, isSidebar, hasConflict }) => {
  const { setInfoDogId } = useAppStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dog.id,
    data: { dog },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0 : 1, 
    touchAction: 'pan-y' as const, 
  };

  return (
      <DogCardBase 
          ref={setNodeRef}
          dog={dog}
          compact={compact}
          style={style}
          attributes={attributes}
          listeners={listeners}
          onInfoClick={(id) => setInfoDogId(id)}
          hasConflict={hasConflict}
      />
  );
};

export const DogCardOverlay: React.FC<DogCardProps> = ({ dog, compact }) => {
    return (
        <div className="w-[calc(50vw-24px)] max-w-[calc(50vw-24px)]">
            <DogCardBase 
                dog={dog}
                compact={compact}
                isOverlay={true}
                style={{ pointerEvents: 'none' }} 
            />
        </div>
    );
};
