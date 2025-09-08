# CreateBookRequest

Request model for creating a new book.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **string** | Gets or sets the title of the book. | [default to undefined]
**author** | **string** | Gets or sets the author of the book. | [default to undefined]
**genres** | **Array&lt;string&gt;** | Gets or sets the list of genres for the book. | [default to undefined]
**publishedDate** | **string** | Gets or sets the published date of the book as a string.  Can be a year (e.g., \&quot;2020\&quot;), year-month (e.g., \&quot;2020-05\&quot;), or full date (e.g., \&quot;2020-05-15\&quot;). | [default to undefined]
**rating** | **number** | Gets or sets the user\&#39;s rating of the book. | [optional] [default to undefined]
**edition** | **string** | Gets or sets the edition of the book. | [optional] [default to undefined]
**isbn** | **string** | Gets or sets the ISBN of the book. | [optional] [default to undefined]

## Example

```typescript
import { CreateBookRequest } from './api';

const instance: CreateBookRequest = {
    title,
    author,
    genres,
    publishedDate,
    rating,
    edition,
    isbn,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
