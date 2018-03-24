import fetchMock from 'fetch-mock';
import { ERROR, FETCHING, SUCCESS } from '../../../constants/Statuses';
import buildStore from '../../helpers/buildStore';
import resources from '../../../index';
import { RESOURCES } from '../../../constants/DataStructures';

describe('Show reducers:', function () {
  beforeAll(function() {
    const { reducers, fetchUser } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id',
    }, {
      show: true
    });

    this.fetchUser = fetchUser;
    this.reducers = reducers;

  });

  describe('when no actions have come before it', () => {
    describe('and the API request succeeds', function() {
      beforeAll(function () {
        fetchMock.get('http://test.com/users/1', {
          body: { id: 1, username: 'Bob' },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
        this.store.dispatch(this.fetchUser(1));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then adds a new item with a status of FETCHING', function() {
          expect(this.users.items[1].status.type).toEqual(FETCHING);
        });

        it('then adds a new item with empty values', function() {
          expect(this.users.items[1].values).toEqual({});
        });

        it('then does NOT add the item to the default collection', function() {
          expect(this.users.collections).toEqual({});
        });
      });

      describe('when the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then changes the items\'s status type to SUCCESS', function() {
          expect(this.users.items[1].status.type).toEqual(SUCCESS);
        });

        it('then sets the item\'s values from the response', function() {
          expect(this.users.items[1].values).toEqual({ id: 1, username: 'Bob' });
        });
      })

    });

    describe('when the API request errors', function() {
      beforeAll(function () {
        fetchMock.get('http://test.com/users/1', {
          body: { error: 'Not Found' },
          status: 404
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
        this.store.dispatch(this.fetchUser(1));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then adds a new item with a status of FETCHING', function() {
          expect(this.users.items[1].status.type).toEqual(FETCHING);
        });

        it('then adds a new item with empty values', function() {
          expect(this.users.items[1].values).toEqual({});
        });

        it('then does NOT add the item to the default collection', function() {
          expect(this.users.collections).toEqual({});
        });
      });

      describe('when the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then changes the items\'s status type to ERROR', function() {
          expect(this.users.items[1].status.type).toEqual(ERROR);
        });

        it('then updates the item\'s status httpCode', function() {
          expect(this.users.items[1].status.httpCode).toEqual(404);
        });

        it('then sets the item\'s status error from the response', function() {
          expect(this.users.items[1].status.error).toEqual('Not Found');
        });

        it('then does NOT set the item\'s values from the response', function() {
          expect(this.users.items[1].values).toEqual({ });
        });
      });
    });

  });

  describe('when another show action has come before it', function () {
    beforeAll(function () {
      this.resourceBefore = {
        ...RESOURCES,
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          }
        }
      };
    });

    describe('and the API request succeeds', () => {
      beforeAll(function () {
        fetchMock.get('http://test.com/users/1', {
          body: { id: 1, username: 'Robert' },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store = buildStore({
          users: this.resourceBefore
        }, { users: this.reducers } );

        this.store.dispatch(this.fetchUser(1));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then sets the status of the item to FETCHING', function() {
          expect(this.users.items[1].status.type).toEqual(FETCHING);
        });

        it('then does NOT clear the item\'s values', function() {
          expect(this.users.items[1].values).toEqual({ id: 1, username: 'Bob' });
        });

        it('then does NOT add the item to the default collection', function() {
          expect(this.users.collections).toEqual({});
        });
      });

      describe('when the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then changes the items\'s status type to SUCCESS', function() {
          expect(this.users.items[1].status.type).toEqual(SUCCESS);
        });

        it('then sets the item\'s values from the response', function() {
          expect(this.users.items[1].values).toEqual({ id: 1, username: 'Robert' });
        });
      })
    });

    describe('when the API request errors', function() {
      beforeAll(function () {
        fetchMock.get('http://test.com/users/1', {
          body: { error: 'Not Found' },
          status: 404
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store = buildStore({
          users: this.resourceBefore
        }, { users: this.reducers } );

        this.store.dispatch(this.fetchUser(1));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then sets the status of the item to FETCHING', function() {
          expect(this.users.items[1].status.type).toEqual(FETCHING);
        });

        it('then does NOT clear the item\'s values', function() {
          expect(this.users.items[1].values).toEqual({ id: 1, username: 'Bob' });
        });

        it('then does NOT add the item to the default collection', function() {
          expect(this.users.collections).toEqual({});
        });
      });

      describe('when the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then changes the items\'s status type to ERROR', function() {
          expect(this.users.items[1].status.type).toEqual(ERROR);
        });

        it('then updates the item\'s status httpCode', function() {
          expect(this.users.items[1].status.httpCode).toEqual(404);
        });

        it('then sets the item\'s status error from the response', function() {
          expect(this.users.items[1].status.error).toEqual('Not Found');
        });

        it('then does NOT set the item\'s values from the response', function() {
          expect(this.users.items[1].values).toEqual({ id: 1, username: 'Bob' });
        });
      });
    })
  });
});
