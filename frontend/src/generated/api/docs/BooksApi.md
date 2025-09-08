# BooksApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiBooksDebugInspectGet**](#apibooksdebuginspectget) | **GET** /api/Books/debug/inspect | TEMP DEBUG: Shows raw database state for debugging.|
|[**apiBooksDebugWhoamiGet**](#apibooksdebugwhoamiget) | **GET** /api/Books/debug/whoami | TEMP DEBUG: Shows current user from JWT token.|
|[**apiBooksGet**](#apibooksget) | **GET** /api/Books | Gets all books with optional filtering and pagination (returns paginated response with metadata).|
|[**apiBooksIdDelete**](#apibooksiddelete) | **DELETE** /api/Books/{id} | Deletes a book by its ID.|
|[**apiBooksIdGet**](#apibooksidget) | **GET** /api/Books/{id} | Gets a specific book by its ID.|
|[**apiBooksIdPut**](#apibooksidput) | **PUT** /api/Books/{id} | Updates an existing book.|
|[**apiBooksPost**](#apibookspost) | **POST** /api/Books | Creates a new book.|
|[**apiBooksStatsGet**](#apibooksstatsget) | **GET** /api/Books/stats | Gets statistics about the book collection.|

# **apiBooksDebugInspectGet**
> string apiBooksDebugInspectGet()


### Example

```typescript
import {
    BooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BooksApi(configuration);

const { status, data } = await apiInstance.apiBooksDebugInspectGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**string**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBooksDebugWhoamiGet**
> string apiBooksDebugWhoamiGet()


### Example

```typescript
import {
    BooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BooksApi(configuration);

const { status, data } = await apiInstance.apiBooksDebugWhoamiGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**string**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBooksGet**
> BookPaginatedResponse apiBooksGet()


### Example

```typescript
import {
    BooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BooksApi(configuration);

let genres: Array<string>; //Optional list of genres to filter by. (optional) (default to undefined)
let rating: number; //Optional exact rating to filter by. (optional) (default to undefined)
let search: string; //Optional search term for title/author. (optional) (default to undefined)
let sortBy: string; //Optional field to sort by. (optional) (default to undefined)
let sortDirection: string; //Optional sort direction (asc/desc). (optional) (default to 'asc')
let page: number; //Page number (default: 1). (optional) (default to 1)
let pageSize: number; //Page size (default: 20, max: 100). (optional) (default to 20)

const { status, data } = await apiInstance.apiBooksGet(
    genres,
    rating,
    search,
    sortBy,
    sortDirection,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **genres** | **Array&lt;string&gt;** | Optional list of genres to filter by. | (optional) defaults to undefined|
| **rating** | [**number**] | Optional exact rating to filter by. | (optional) defaults to undefined|
| **search** | [**string**] | Optional search term for title/author. | (optional) defaults to undefined|
| **sortBy** | [**string**] | Optional field to sort by. | (optional) defaults to undefined|
| **sortDirection** | [**string**] | Optional sort direction (asc/desc). | (optional) defaults to 'asc'|
| **page** | [**number**] | Page number (default: 1). | (optional) defaults to 1|
| **pageSize** | [**number**] | Page size (default: 20, max: 100). | (optional) defaults to 20|


### Return type

**BookPaginatedResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBooksIdDelete**
> apiBooksIdDelete()


### Example

```typescript
import {
    BooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BooksApi(configuration);

let id: string; //The book ID. (default to undefined)

const { status, data } = await apiInstance.apiBooksIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | The book ID. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | No Content |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBooksIdGet**
> Book apiBooksIdGet()


### Example

```typescript
import {
    BooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BooksApi(configuration);

let id: string; //The book ID. (default to undefined)

const { status, data } = await apiInstance.apiBooksIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | The book ID. | defaults to undefined|


### Return type

**Book**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBooksIdPut**
> Book apiBooksIdPut()


### Example

```typescript
import {
    BooksApi,
    Configuration,
    UpdateBookRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BooksApi(configuration);

let id: string; //The book ID. (default to undefined)
let updateBookRequest: UpdateBookRequest; //The book update request. (optional)

const { status, data } = await apiInstance.apiBooksIdPut(
    id,
    updateBookRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateBookRequest** | **UpdateBookRequest**| The book update request. | |
| **id** | [**string**] | The book ID. | defaults to undefined|


### Return type

**Book**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBooksPost**
> Book apiBooksPost()


### Example

```typescript
import {
    BooksApi,
    Configuration,
    CreateBookRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BooksApi(configuration);

let createBookRequest: CreateBookRequest; //The book creation request. (optional)

const { status, data } = await apiInstance.apiBooksPost(
    createBookRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createBookRequest** | **CreateBookRequest**| The book creation request. | |


### Return type

**Book**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBooksStatsGet**
> BookStatsResponse apiBooksStatsGet()


### Example

```typescript
import {
    BooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BooksApi(configuration);

const { status, data } = await apiInstance.apiBooksStatsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**BookStatsResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

