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
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)' }}
      className={cn(
        "bg-[var(--color-card-bg)] rounded-[12px] overflow-hidden flex flex-col group transition-all duration-300",
        "border border-[var(--color-card-border)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
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

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-[#111111] line-clamp-1 mb-1">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-2">
            {subtitle}
          </p>
        )}
        {description && (
          <div 
            className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        
        <div className="flex flex-col gap-2 mt-auto pt-2">
          {price !== undefined && (
            <div className="text-[#111111] font-bold text-lg mb-1">
              ৳{price}
            </div>
          )}
          <div className="flex items-center gap-2">
            {secondaryButtonText && onSecondaryClick && (
              <button
                onClick={onSecondaryClick}
                className={cn(
                  "flex-1 bg-gray-100 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200",
                  "hover:bg-gray-200 active:scale-95 duration-200"
                )}
              >
                {secondaryButtonText}
              </button>
            )}
            <button
              onClick={onClick}
              className={cn(
                "flex-1 bg-[var(--color-button-bg)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-[var(--color-button-hover)] active:scale-95 duration-200"
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
