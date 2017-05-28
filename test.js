const nest = require('./index.js');
const assert = require('assert');
const should = require('should');
const mysql = require('mysql');

var dbData = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'tayrtest'
};
function dropDB(callback) {
  var dbName = dbData.database;
  delete dbData.database;
  connection = mysql.createConnection(dbData);
  connection.connect();
  connection.query('DROP DATABASE IF EXISTS ' + dbName, () => {
    dbData.database = dbName;
    callback();
  });
}

var T;
var user;

describe('TAYR', function () {
  describe('CREATE', function () {
    this.timeout(15000);
    it("drop db", done => {
      dropDB(() => {
        T = new nest(dbData);
        user = new T.tayr('user', {
          name: 'Mohammed',
          age: 20,
          score: 17.5,
          freeUser: true,
          createdAt: new Date()
        });
        done();
      })
    })
    it('should add id property to tayr', done => {
      user.store().then(() => {
        user.should.have.property('id');
        console.log('      Insert id: ', user.id);
        done();
      });
    });
  });
  describe('READ', function () {
    it('should return the created user', done => {
      T.load('user', user.id).then((loadedUser) => {
        assert.deepEqual(user, loadedUser);
        console.log('      Insert id: ', loadedUser.id);
        done();
      });
    });
  });
  describe('UPDATE', function () {
    it('should return the updated user', done => {
      user.age = 50;
      user.store().then(() => {
        return T.load('user', user.id);
      }).then(loadedUser => {
        assert.equal(loadedUser.age, 50);
        console.log('      new age: ', loadedUser.age);
        done();
      });
    });
    it('should add new property to user', done => {
      user.updatedAt = new Date();
      user.store().then(() => {
        return T.load('user', user.id);
      }).then(loadedUser => {
        loadedUser.should.have.property('updatedAt');
        done();
      });
    });
  });
  describe('DELETE', function () {
    it('should return false', done => {
      user.age = 50;
      user.delete().then(() => {
        return T.load('user', user.id);
      }).then(loadedUser => {
        assert.equal(loadedUser, false);
        done();
      });
    });
  });
});