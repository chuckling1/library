import React from 'react';
import StarRating from './StarRating';
import './StarRatingFilter.scss';

interface StarRatingFilterProps {
  rating: number;
  onRatingChange: (newRating: number) => void;
}

const StarRatingFilter: React.FC<StarRatingFilterProps> = ({
  rating,
  onRatingChange
}) => {
  const handleRatingChange = (newRating: number): void => {
    // If clicking the same rating, clear the filter (set to 0)
    // Otherwise, set the new rating
    if (rating === newRating) {
      onRatingChange(0);
    } else {
      onRatingChange(newRating);
    }
  };

  // Create tooltip text based on current rating
  const getTooltipText = (): string => {
    if (rating === 0) {
      return 'Click a star to filter by rating';
    }
    return `Showing ${rating} star${rating !== 1 ? 's' : ''} books only. Click same star to clear filter.`;
  };

  return (
    <div className="star-rating-filter">
      <label className="star-rating-filter__label">
        Rating
      </label>
      <div 
        className="star-rating-filter__controls"
        title={getTooltipText()}
      >
        <StarRating
          rating={rating}
          onRatingChange={handleRatingChange}
          showLabel={false}
        />
      </div>
    </div>
  );
};

export default StarRatingFilter;