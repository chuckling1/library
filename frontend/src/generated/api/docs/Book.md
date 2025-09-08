# Book

Represents a book in the library collection.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Gets or sets the unique identifier for the book. | [optional] [default to undefined]
**title** | **string** | Gets or sets the title of the book. | [default to undefined]
**author** | **string** | Gets or sets the author of the book. | [default to undefined]
**publishedDate** | **string** | Gets or sets the published date of the book as a string.  Can be a year (e.g., \&quot;2020\&quot;), year-month (e.g., \&quot;2020-05\&quot;), or full date (e.g., \&quot;2020-05-15\&quot;). | [default to undefined]
**rating** | **number** | Gets or sets the user\&#39;s rating of the book (1-5). | [optional] [default to undefined]
**edition** | **string** | Gets or sets the edition information of the book. | [optional] [default to undefined]
**isbn** | **string** | Gets or sets the ISBN of the book. | [optional] [default to undefined]
**createdAt** | **string** | Gets or sets the timestamp when the book was created. | [optional] [default to undefined]
**updatedAt** | **string** | Gets or sets the timestamp when the book was last updated. | [optional] [default to undefined]
**userId** | **string** | Gets or sets the unique identifier of the user who owns this book. | [default to undefined]
**user** | [**User**](User.md) |  | [optional] [default to undefined]
**bookGenres** | [**Array&lt;BookGenre&gt;**](BookGenre.md) | Gets or sets the collection of genres associated with this book. | [optional] [default to undefined]

## Example

```typescript
import { Book } from './api';

const instance: Book = {
    id,
    title,
    author,
    publishedDate,
    rating,
    edition,
    isbn,
    createdAt,
    updatedAt,
    userId,
    user,
    bookGenres,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
