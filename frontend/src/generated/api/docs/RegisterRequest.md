# RegisterRequest

Request model for user registration.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**email** | **string** | Gets or sets the user\&#39;s email address. | [default to undefined]
**password** | **string** | Gets or sets the user\&#39;s password. | [default to undefined]
**confirmPassword** | **string** | Gets or sets the password confirmation. | [default to undefined]

## Example

```typescript
import { RegisterRequest } from './api';

const instance: RegisterRequest = {
    email,
    password,
    confirmPassword,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
