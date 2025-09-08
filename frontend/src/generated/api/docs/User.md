# User

Represents a user account in the library system.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Gets or sets the unique identifier for the user. | [optional] [default to undefined]
**email** | **string** | Gets or sets the email address used for login. | [default to undefined]
**passwordHash** | **string** | Gets or sets the hashed password for the user. | [default to undefined]
**createdAt** | **string** | Gets or sets the timestamp when the user account was created. | [optional] [default to undefined]
**books** | [**Array&lt;Book&gt;**](Book.md) | Gets or sets the collection of books owned by this user. | [optional] [default to undefined]

## Example

```typescript
import { User } from './api';

const instance: User = {
    id,
    email,
    passwordHash,
    createdAt,
    books,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
