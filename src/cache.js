'use strict';

const moment = require('moment');

module.exports = {
    get,
    set,
    clear_cache
};

let cache = {
    server: {},
    client: {}
};

function get (category, key, fallback = null) {
    const cache_record = cache[category][key];

    if (cache_record) {
        if (!moment(cache_record.expiration).isBefore(moment())) {
            return cache_record.value;
        }

        delete cache[category][key];
    }

    return fallback;
}

function set (category, key, value, expiry) {
    cache[category][key] = {
        expiration: moment().add(expiry, 'seconds'),
        value: value
    };
}

function clear_cache (category) {
    cache[category] = {};
}
