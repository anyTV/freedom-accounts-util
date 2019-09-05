Version 1.1.3:
 - delta-703-allow-direct-file-upload-of-identifications
 - Removed res param on remove cache only.
 - Added remove cache only feature - Does not remove token data from db records
 - Refactored revoke_token function; Forget cache on the right category;
 - Moved keys near on actual usage. Also updated the condition since 'key' is not existing - used 'client_key' and 'server_key' instead.
 - Refactored payload data initialization according to PR review suggestion.
 - Changed param on forgetting the token cache. Instead of token itself, we should use the assigned key from the cache.
 - Added forget cache to server as well.
 - Updated parameters passed on cache.forget, it only requires category and key. Added unit testing.
 - Added header authorization for revoke function
 - Added revoke function to be used for public file upload feature. Although this method is dynamic.
 - Merge pull request #9 from anyTV/dev-2640-eslint-migration-freedom-accounts-util
 - Dev-2640 initial commit, remove jshint, setup eslint, and resolve linting errors

