# BulkImportResponse

Response model for bulk import operations.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**jobId** | **string** | Gets or sets the unique identifier of the import job. | [optional] [default to undefined]
**totalRows** | **number** | Gets or sets the total number of rows in the import file. | [optional] [default to undefined]
**validRows** | **number** | Gets or sets the number of valid rows that were successfully imported. | [optional] [default to undefined]
**errorRows** | **number** | Gets or sets the number of rows that had validation errors. | [optional] [default to undefined]
**status** | **string** | Gets or sets the current status of the import operation. | [optional] [default to undefined]
**errorSummary** | **string** | Gets or sets a summary of validation errors, if any occurred. | [optional] [default to undefined]

## Example

```typescript
import { BulkImportResponse } from './api';

const instance: BulkImportResponse = {
    jobId,
    totalRows,
    validRows,
    errorRows,
    status,
    errorSummary,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
