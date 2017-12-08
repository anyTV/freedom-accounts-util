# Freedom! Accounts Util
A utility helper for OAuth2.0 calls to Freedom! Accounts that supports caching.

## Installation:
With NPM:
```
npm install freedom-accounts-util --save
```

With Yarn:
```
yarn add freedom-accounts-util
```

## Setup:
```
const accounts = require('freedom-accounts-util');

accounts.configure({base_url: '', path: '', client_id: '', client_secret: ''});
// or
accounts.configure(config.ACCOUNTS);
```

## Usage:
For Express Servers:
```
accounts.verify_scopes([...scopes]); // Express middleware
```
For calls to 
```
accounts.generate_token([...scopes]); // Returns promise
accounts.refresh_token('refresh_token'); // Returns promise
```

## Caching:
Caching works in the following way:
* Access tokens with the same scopes are cached together (regardless of order)
* Refreshing an access token will look for a cached scopes with that refresh token and update that key to contain the new access token
* The verify_scopes middleware caches the output of tokeninfo with the access token as the key
