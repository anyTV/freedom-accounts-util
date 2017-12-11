'use strict';

const config = require('../src/config');
const cache = require('../src/cache');

const chai = require('chai');
const chai_as_promised = require('chai-as-promised');


chai.should();
chai.use(chai_as_promised);

describe('cache', function () {

    beforeEach(function () {
        cache.clear_cache('client');
        cache.clear_cache('server');
        cache.set('client', 'client_key', 'cvalue', 100);
        cache.set('server', 'server_key', 'svalue', 100);
    });

    it('should set and get cached value', function () {
        cache.get('client', 'client_key').should.equal('cvalue');
        cache.get('server', 'server_key').should.equal('svalue');
    });

    it('should get whole cache', function () {
        const client_cache = cache.get_cache('client');
        client_cache.should.have.property('client_key');
        client_cache.client_key.should.have.property('value');
        client_cache.client_key.value.should.equal('cvalue');

        const server_cache = cache.get_cache('server');
        server_cache.should.have.property('server_key');
        server_cache.server_key.should.have.property('value');
        server_cache.server_key.value.should.equal('svalue');
    });

    it('should forget cached value', function () {
        cache.forget('client', 'client_key');
        cache.get('client', 'client_key', 'cfallback').should.equal('cfallback');

        cache.forget('server', 'server_key');
        cache.get('server', 'server_key', 'sfallback').should.equal('sfallback');
    });

    it('should clear whole category cache', function () {
        cache.clear_cache('client');
        cache.get('client', 'client_key', 'cfallback').should.equal('cfallback');
        cache.get('server', 'server_key', 'sfallback').should.equal('svalue');

        cache.clear_cache('server');
        cache.get('client', 'client_key', 'cfallback').should.equal('cfallback');
        cache.get('server', 'server_key', 'sfallback').should.equal('sfallback');

    });

    it('should not cache when disabled', function () {
        config.configure({disable_caching: true});

        cache.set('client', 'client_key', 'cvalue', 100);
        cache.set('server', 'server_key', 'svalue', 100);
        cache.get('client', 'client_key', 'cfallback').should.equal('cfallback');
        cache.get('server', 'server_key', 'sfallback').should.equal('sfallback');

        config.configure({disable_caching: false});
    });

    it('should find key with specified value', function () {
        cache.find_key('client', 'cvalue').should.equal('client_key');
        cache.find_key('server', 'svalue').should.equal('server_key');
    });
});
