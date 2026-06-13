import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils.js';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
}

export default function StarRating({
  rating,
  onRatingChange,
  readOnly = false,
  size = 'md',
  showValue = false,
  reviewCount,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (value: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readOnly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'transition-all duration-150',
              !readOnly && 'cursor-pointer hover:scale-110',
              readOnly && 'cursor-default'
            )}
            disabled={readOnly}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                star <= displayRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-sm text-gray-500">
          ({reviewCount} 条评价)
        </span>
      )}
    </div>
  );
}
