# BookPaginatedResponse

Represents a paginated response containing data and pagination metadata.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**Array&lt;Book&gt;**](Book.md) | Gets or sets the items for the current page. | [optional] [default to undefined]
**page** | **number** | Gets or sets the current page number (1-based). | [optional] [default to undefined]
**pageSize** | **number** | Gets or sets the number of items per page. | [optional] [default to undefined]
**totalItems** | **number** | Gets or sets the total number of items across all pages. | [optional] [default to undefined]
**totalPages** | **number** | Gets the total number of pages. | [optional] [readonly] [default to undefined]
**hasPreviousPage** | **boolean** | Gets a value indicating whether there is a previous page. | [optional] [readonly] [default to undefined]
**hasNextPage** | **boolean** | Gets a value indicating whether there is a next page. | [optional] [readonly] [default to undefined]

## Example

```typescript
import { BookPaginatedResponse } from './api';

const instance: BookPaginatedResponse = {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPreviousPage,
    hasNextPage,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
