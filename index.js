

const config = require('./src/config');
const server = require('./src/server');
const client = require('./src/client');
const cache = require('./src/cache');

module.exports = {
    configure: config.configure,
    verify_scopes: server.verify_scopes,
    generate_token: client.generate_token,
    refresh_token: client.refresh_token,
    clear_cache: cache.clear_cache,
    revoke_token: client.revoke_token,
    remove_cache_only: client.remove_cache_only,
};
