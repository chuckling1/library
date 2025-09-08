# BulkImportApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiBulkImportBooksPost**](#apibulkimportbookspost) | **POST** /api/BulkImport/books | Imports books in bulk from a CSV file.|
|[**apiBulkImportExportBooksGet**](#apibulkimportexportbooksget) | **GET** /api/BulkImport/export/books | Exports books to CSV format.|
|[**apiBulkImportJobsJobIdGet**](#apibulkimportjobsjobidget) | **GET** /api/BulkImport/jobs/{jobId} | Gets the status of a bulk import job.|

# **apiBulkImportBooksPost**
> BulkImportResponse apiBulkImportBooksPost()


### Example

```typescript
import {
    BulkImportApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BulkImportApi(configuration);

let file: File; //The CSV file containing book data. (optional) (default to undefined)

const { status, data } = await apiInstance.apiBulkImportBooksPost(
    file
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **file** | [**File**] | The CSV file containing book data. | (optional) defaults to undefined|


### Return type

**BulkImportResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**413** | Content Too Large |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBulkImportExportBooksGet**
> File apiBulkImportExportBooksGet()


### Example

```typescript
import {
    BulkImportApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BulkImportApi(configuration);

const { status, data } = await apiInstance.apiBulkImportExportBooksGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**File**

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

# **apiBulkImportJobsJobIdGet**
> BulkImportResponse apiBulkImportJobsJobIdGet()


### Example

```typescript
import {
    BulkImportApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BulkImportApi(configuration);

let jobId: string; //The bulk import job identifier. (default to undefined)

const { status, data } = await apiInstance.apiBulkImportJobsJobIdGet(
    jobId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **jobId** | [**string**] | The bulk import job identifier. | defaults to undefined|


### Return type

**BulkImportResponse**

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

