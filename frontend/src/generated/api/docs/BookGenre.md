# BookGenre

Junction table for the many-to-many relationship between books and genres.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**bookId** | **string** | Gets or sets the book identifier. | [optional] [default to undefined]
**genreName** | **string** | Gets or sets the genre name. | [optional] [default to undefined]
**book** | [**Book**](Book.md) |  | [optional] [default to undefined]
**genre** | [**Genre**](Genre.md) |  | [optional] [default to undefined]

## Example

```typescript
import { BookGenre } from './api';

const instance: BookGenre = {
    bookId,
    genreName,
    book,
    genre,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
