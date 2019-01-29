

const moment = require('moment');
const _ = require('lodash');

const config = require('./config');

module.exports = {
    get,
    set,
    forget,
    get_cache,
    clear_cache,
    find_key
};

const cache = {
    server: {},
    client: {}
};

function get (category, key, fallback = null) {
    const cache_record = cache[category][key];

    if (!config.disable_caching && cache_record) {
        if (!moment(cache_record.expiration).isSameOrBefore(moment())) {
            return cache_record.value;
        }

        delete cache[category][key];
    }

    return fallback;
}

function set (category, key, value, expiry) {
    if (!config.disable_caching) {
        cache[category][key] = {
            expiration: moment().add(expiry, 'seconds'),
            value: value
        };
    }
}

function forget (category, key) {
    delete cache[category][key];
}

function get_cache (category) {
    return cache[category];
}

function clear_cache (category) {
    cache[category] = {};
}

function find_key (category, value) {
    return _.findKey(cache[category], {value});
}
