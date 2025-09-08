# Genre

Represents a genre that can be associated with books.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Gets or sets the name of the genre (primary key). | [optional] [default to undefined]
**isSystemGenre** | **boolean** | Gets or sets a value indicating whether this is a system-defined genre. | [optional] [default to undefined]
**createdAt** | **string** | Gets or sets the timestamp when the genre was created. | [optional] [default to undefined]
**bookGenres** | [**Array&lt;BookGenre&gt;**](BookGenre.md) | Gets or sets the collection of books associated with this genre. | [optional] [default to undefined]

## Example

```typescript
import { Genre } from './api';

const instance: Genre = {
    name,
    isSystemGenre,
    createdAt,
    bookGenres,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
