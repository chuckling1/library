# BookStatsResponse

Response model for book statistics.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**totalBooks** | **number** | Gets or sets the total number of books. | [optional] [default to undefined]
**genreDistribution** | [**Array&lt;GenreCount&gt;**](GenreCount.md) | Gets or sets the distribution of books by genre. | [optional] [default to undefined]
**averageRating** | **number** | Gets or sets the average rating across all books. | [optional] [default to undefined]

## Example

```typescript
import { BookStatsResponse } from './api';

const instance: BookStatsResponse = {
    totalBooks,
    genreDistribution,
    averageRating,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
