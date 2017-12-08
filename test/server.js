'use strict';

const accounts = require('../index.js');

const chai = require('chai');
const chai_as_promised = require('chai-as-promised');
const nock = require('nock');
const httpMocks = require('node-mocks-http');


chai.should();
chai.use(chai_as_promised);

const configuration = {
    base_url: 'https://accounts.freedom.tm',
    path: '/api/v2',
    client_id: 'devtest',
    client_secret: 'devtest'
};

const scopes = ['https://frnky.api.tm/cms'];


describe('verify_scopes', () => {

    accounts.configure(configuration);

    it('should fail without a provided access token', () => {
        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            params: {}
        });

        return accounts.verify_scopes(scopes)(
            request,
            null,
            error => {
                return error ? Promise.reject(error) : Promise.resolve();
            }
        ).catch(error => {
            error.should.have.property('message');
            error.message.should.be.a('string');
            error.message.should.equal('Access token is required.');
        });
    });

    it('should forward remote failure', () => {
        let accounts_nock = nock(configuration.base_url)
            .get(configuration.path + '/oauth/tokeninfo')
            .query({access_token: 'notjrrtoken'})
            .reply(500, {message: 'random server error'});

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'notjrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request,
            null,
            error => {
                return error ? Promise.reject(error) : Promise.resolve();
            }
        ).catch(error => {
            error.should.have.property('message');
            error.message.should.be.a('string');
            error.message.should.equal('random server error');
            accounts_nock.isDone().should.equal(true);
        });
    });

    it('should fail without returned scopes', () => {
        let accounts_nock = nock(configuration.base_url)
            .get(configuration.path + '/oauth/tokeninfo')
            .query({access_token: 'notjrrtoken'})
            .reply(200, {});

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'notjrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request,
            null,
            error => {
                return error ? Promise.reject(error) : Promise.resolve();
            }
        ).catch(error => {
            error.should.have.property('message');
            error.message.should.be.a('string');
            error.message.should.equal('Something went wrong, server did not return scopes, please try again.');
            accounts_nock.isDone().should.equal(true);
        });
    });

    it('should fail without any of the required scopes', () => {
        let accounts_nock = nock(configuration.base_url)
            .get(configuration.path + '/oauth/tokeninfo')
            .query({access_token: 'notjrrtoken'})
            .reply(200, {scopes: 'http://non.existing/scope'});

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'notjrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request,
            null,
            error => {
                return error ? Promise.reject(error) : Promise.resolve();
            }
        ).catch(error => {
            error.should.have.property('message');
            error.message.should.be.a('string');
            error.message.should.equal(
                'You need at least one of the ff. scopes to access this endpoint: ' + scopes.join(' ')
            );
            accounts_nock.isDone().should.equal(true);
        });
    });

    it('should succeed with proper provided access token', () => {
        let accounts_nock = nock(configuration.base_url)
            .get(configuration.path + '/oauth/tokeninfo')
            .query({access_token: 'jrrtoken'})
            .reply(200, {scopes: scopes.join(' ')});

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'jrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request,
            null,
            error => {
                return error ? Promise.reject(error) : Promise.resolve();
            }
        ).catch(error => {
            error.should.not.exist();
        }).then(() => {
            accounts_nock.isDone().should.equal(true);
        });
    });

    it('should succeed with cached access token info', () => {
        let accounts_nock = nock(configuration.base_url)
            .get(configuration.path + '/oauth/tokeninfo')
            .query({access_token: 'jrrtoken'})
            .reply(200, {scopes: scopes.join(' ')});

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'jrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request,
            null,
            error => {
                return error ? Promise.reject(error) : Promise.resolve();
            }
        ).catch(error => {
            error.should.not.exist();
        }).then(() => {
            accounts_nock.isDone().should.not.equal(true);
        });
    });
});
