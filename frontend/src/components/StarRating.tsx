import React from 'react';
import './StarRating.scss';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (newRating: number) => void;
  readOnly?: boolean;
  maxRating?: number;
  showLabel?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readOnly = false,
  maxRating = 5,
  showLabel = true
}) => {
  const handleStarClick = (starValue: number): void => {
    if (!readOnly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent, starValue: number): void => {
    if (!readOnly && onRatingChange && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onRatingChange(starValue);
    }
  };

  return (
    <div className={`star-rating ${readOnly ? 'star-rating--readonly' : 'star-rating--interactive'}`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        
        return (
          <button
            key={index}
            type="button"
            className={`star-button ${isFilled ? 'filled' : 'empty'}`}
            onClick={() => handleStarClick(starValue)}
            onKeyPress={(e) => handleKeyPress(e, starValue)}
            disabled={readOnly}
            tabIndex={readOnly ? -1 : 0}
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
          >
            ★
          </button>
        );
      })}
      {showLabel && (
        <span className="rating-text" aria-live="polite">
          ({rating}/{maxRating})
        </span>
      )}
    </div>
  );
};

export default StarRating;