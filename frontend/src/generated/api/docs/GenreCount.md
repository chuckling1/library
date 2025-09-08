# GenreCount

Represents the count and statistics for a specific genre.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**genre** | **string** | Gets or sets the genre name. | [optional] [default to undefined]
**count** | **number** | Gets or sets the count of books in this genre. | [optional] [default to undefined]
**averageRating** | **number** | Gets or sets the average rating for books in this genre. | [optional] [default to undefined]

## Example

```typescript
import { GenreCount } from './api';

const instance: GenreCount = {
    genre,
    count,
    averageRating,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
