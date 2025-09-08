# AuthResponse

Response model for authentication operations.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**token** | **string** | Gets or sets the JWT token for authenticated requests. | [optional] [default to undefined]
**email** | **string** | Gets or sets the user\&#39;s email address. | [optional] [default to undefined]
**userId** | **string** | Gets or sets the user\&#39;s unique identifier. | [optional] [default to undefined]
**expiresAt** | **string** | Gets or sets the token expiration date. | [optional] [default to undefined]

## Example

```typescript
import { AuthResponse } from './api';

const instance: AuthResponse = {
    token,
    email,
    userId,
    expiresAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
