import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { LucideIcon } from 'lucide-react';
import { getThumbnailUrl } from '@/src/lib/drive';

interface CardProps {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: number;
  image?: string;
  badge?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  buttonText?: string;
  onSecondaryClick?: () => void;
  secondaryButtonText?: string;
  className?: string;
  imageClassName?: string;
  [key: string]: any;
}

export function Card({
  title,
  subtitle,
  description,
  price,
  image,
  badge,
  icon: Icon,
  onClick,
  buttonText = 'Enroll Now',
  onSecondaryClick,
  secondaryButtonText,
  className,
  imageClassName,
}: CardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)' }}
      className={cn(
        "bg-white rounded-[24px] overflow-hidden flex flex-col group transition-all duration-500",
        "border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)]",
        className
      )}
    >
      <div className={cn("relative aspect-video overflow-hidden", imageClassName)}>
        {image ? (
          <img
            src={getThumbnailUrl(image)}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            {Icon && <Icon className="w-12 h-12 text-gray-400" />}
          </div>
        )}
        {badge && (
          <div className="absolute top-3 left-3 bg-[#0EA5E9] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            {badge}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-sm sm:text-lg font-bold text-[#111111] line-clamp-2 mb-1 leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-blue-500 font-bold uppercase tracking-wider mb-2">
            {subtitle}
          </p>
        )}
        
        {description && showFullDescription && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-gray-500 text-xs sm:text-sm mb-4 break-words hyphens-auto text-left"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        
        <div className="flex flex-col gap-2 sm:gap-3 mt-auto pt-3 sm:pt-4">
          {price !== undefined && (
            <div className="text-black font-black text-lg sm:text-2xl tracking-tight mb-1">
              ৳{price}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {(secondaryButtonText || description) && (
              <button
                onClick={(e) => {
                  if (description && (showFullDescription || !onSecondaryClick)) {
                    setShowFullDescription(!showFullDescription);
                    return;
                  }
                  onSecondaryClick?.();
                }}
                className={cn(
                  "flex-1 bg-gray-50 text-gray-400 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border border-gray-100",
                  "hover:bg-gray-100 hover:text-black active:scale-95 duration-300"
                )}
              >
                {showFullDescription ? 'Hide' : (secondaryButtonText || 'Details')}
              </button>
            )}
            <button
              onClick={onClick}
              className={cn(
                "flex-1 bg-black text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                "hover:bg-gray-800 active:scale-95 duration-300 shadow-lg shadow-black/10"
              )}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
