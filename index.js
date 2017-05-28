var mysql = require('mysql');
var echasync = require('echasync');


module.exports = function (dbData) {

  var T = this;
  dbData.multipleStatements = true;

  var connection;
  var dbSchema = {};
  var tablesRefreshed = false;

  function waitForSchema(fn) {
    if (tablesRefreshed) {
      fn();
    } else {
      setTimeout(function () {
        waitForSchema(fn);
      }, 100);
    }
  }

  function onReject(err) {
    console.log(err);
  }

  // Tayr Class Declaration constructor and methods

  T.tayr = function (table, data) {
    var tayr = this;
    if (data !== undefined) tayr = Object.assign(tayr, data);
    Object.defineProperty(tayr, "table", {
      enumerable: false,
      writable: true
    });
    tayr.table = table;
  }

  T.tayr.prototype.store = function () {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      if (!T.isValidTayr(tayr)) throw 'not a valid tayr';

      createTable(tayr).then(() => {
        return createCols(tayr);
      }).then(() => {
        var sql = getInsertSql(tayr);
        tayr.mendValues();
        var values = Object.keys(tayr).map(key => tayr[key]);
        return T.exec(sql, values.concat(values));
      }).then((res) => {
        if (res.insertId != 0) tayr.id = res.insertId;
        resolve();
      })
    }).catch(err => {
      console.log('Store Err: ', err);
    });
  }

  // TODO: Docs
  T.tayr.prototype.findOrCreate = function (data) {
    data = data || {};
    if (data.by === undefined) data.by = Object.keys(tayr);
    if (data.onCreate === undefined) { };
    var tayr = this;
    var request = {
      sql: data.by.map(key => key + ' = ? ').join(' AND '),
      vals: data.by.map(key => tayr[key])
    };

    return new Promise(function (resolve, reject) {
      createTable(tayr).then(function () {
        createCols(tayr).then(function () {
          T.findOne(tayr.table, request).then(function (res) {
            if (!res) {
              for (var key in data.onCreate) {
                if (data.onCreate.hasOwnProperty(key)) {
                  tayr[key] = data.onCreate[key];
                }
              }
            } else {
              tayr.id = res.id;
            }
            tayr.store().then(function () {
              resolve();
            });
          }, function (err) { reject(err); });
        });
      });
    });
  }

  T.tayr.prototype.getChildren = function (table) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      T.find(table, tayr.table + 'Id = ?', tayr.id).then(function (children) {
        resolve(children);
      });
    });
  }

  T.tayr.prototype.attachChildren = function (table) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      tayr.getChildren(table).then(function (children) {
        tayr[table] = children;
        resolve();
      })
    });
  }

  T.tayr.prototype.addChildren = function (table, array) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      for (var i = 0; i < array.length; i++) {
        array[i][tayr.table + 'Id'] = tayr.id;
      }
      T.storeRows(table, array).then(function (res) {
        resolve(res);
      });
    });
  }

  T.tayr.prototype.getCousins = function (table) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      var uncleTable = T.getUncleTableName(tayr.table, table);
      if (tableExists(uncleTable)) {
        var sql = 'SELECT c.* FROM ' + uncleTable + ' as ut, ' + table + ' as c WHERE ut.' + tayr.table + 'Id = ? and ut.' + table + 'Id = c.id';
        T.exec(sql, tayr.id).then(function (cousins) {
          resolve(T.arrayToTayrs(table, cousins));
        });
      } else {
        console.warn('Tayr: uncle table %s does not exist', uncleTable);
        resolve([]);
      }
    });
  }

  T.tayr.prototype.attachCousins = function (table) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      tayr.getCousins(table).then(function (cousins) {
        tayr[table] = cousins;
        resolve();
      })
    });
  }

  T.tayr.prototype.setCousins = function (table, array) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      T.storeRows(table, array).then(function (cousins) {
        var uncleTable = T.getUncleTableName(table, tayr.table);
        var uncles = [];
        for (var i = 0; i < cousins.length; i++) {
          var uncle = {};
          uncle[tayr.table + 'Id'] = tayr.id;
          uncle[table + 'Id'] = cousins[i].id;
          uncles.push(uncle);
        }
        uncles = T.arrayToTayrs(uncleTable, uncles);
        if (tableExists(uncleTable)) {
          T.delete(uncleTable, tayr.table + 'Id = ?', tayr.id).then(function () {
            T.storeRows(uncleTable, uncles).then(function () {
              resolve(cousins);
            });
          });
        } else {
          T.storeRows(uncleTable, uncles).then(function () {
            resolve(cousins);
          });
        }
      });
    });
  }

  T.tayr.prototype.addCousins = function (table, array) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      T.storeRows(table, array).then(function (cousins) {
        var uncleTable = T.getUncleTableName(table, tayr.table);
        var uncles = [];
        for (var i = 0; i < cousins.length; i++) {
          var uncle = {};
          uncle[tayr.table + 'Id'] = tayr.id;
          uncle[table + 'Id'] = cousins[i].id;
          uncles.push(uncle);
        }
        T.storeRows(uncleTable, uncles).then(function () {
          resolve(cousins);
        });
      });
    });
  }

  T.tayr.prototype.addCousin = function (cousin) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      cousin.store().then(function () {
        var uncleTable = T.getUncleTableName(cousin.table, tayr.table);
        var uncle = new T.tayr(uncleTable);
        uncle[tayr.table + 'Id'] = tayr.id;
        uncle[cousin.table + 'Id'] = cousin.id;
        uncle.store().then(function () {
          resolve(cousin);
        });
      });
    });
  }

  T.tayr.prototype.removeCousin = function (cousin) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      var uncleTable = T.getUncleTableName(tayr.table, cousin.table);
      var condition = tayr.table + 'Id = ? AND ' + cousin.table + 'Id = ?';
      T.delete(uncleTable, condition, [tayr.id, cousin.id]).then(function () {
        resolve(true);
      });
    });
  }

  T.tayr.prototype.getParent = function (table) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      T.load(table, tayr[table + 'Id']).then(function (parent) {
        resolve(parent);
      }, function (err) { reject(err); });
    });
  }

  // TODO: Docs
  T.tayr.prototype.attachParent = function (table) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      tayr.getParent(table).then(function (parent) {
        tayr[table] = parent;
        resolve();
      }, function (err) { reject(err); });
    });
  }

  T.tayr.prototype.setParent = function (parent) {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      parent.store().then(function () {
        tayr[parent.table + 'Id'] = parent.id;
        tayr.store().then(function () {
          resolve(true);
        });
      });
    });
  }

  T.tayr.prototype.delete = function () {
    var tayr = this;
    return new Promise(function (resolve, reject) {
      if (!T.isValidTayr(tayr)) throw 'DEL ERR: this is not a valid tayr!';
      var sql = "DELETE FROM " + tayr.table + " WHERE id = ?";
      T.exec(sql, [tayr.id]).then(res => {
        resolve(true);
      });
    });
  }

  T.tayr.prototype.mendValues = function () {
    for (var colName in this) {
      if (this.hasOwnProperty(colName)) {
        this[colName] = mendValue(this[colName]);
      }
    }
  }

  // End Tayr Class Declaration

  T.storeMultiple = function (tayrs) {
    return new Promise(function (resolve, reject) {
      var res = [];
      function step(i) {
        if (i < tayrs.length) {
          tayrs[i].store().then(function () {
            res.push(tayrs[i]);
            step(i + 1);
          });
        } else {
          resolve(res);
        }
      }
      step(0);
    });
  }

  T.storeRows = function (table, array) {
    return new Promise(function (resolve, reject) {
      var res = [];
      var tayrInstance = new T.tayr(table, {});
      for (var i = 0; i < array.length; i++) {
        tayrInstance = Object.assign(tayrInstance, array[i]);
      }
      createTable(tayrInstance).then(function () {
        createCols(tayrInstance).then(function () {
          var sql = [];
          var values = [];
          for (var i = 0; i < array.length; i++) {
            var tayr = new T.tayr(table, array[i]);
            res.push(tayr);
            sql.push(getInsertSql(tayr));
            tayr.mendValues();
            tayrVals = Object.keys(tayr).map(key => tayr[key]);
            values = values.concat(tayrVals).concat(tayrVals);
          }
          T.exec(sql.join('; '), values.concat(values)).then(function (rows) {
            if (!Array.isArray(rows)) {
              rows = [rows];
            }
            for (var i = 0; i < res.length; i++) {
              res[i].id = rows[i].insertId;
            }
            res = T.arrayToTayrs(table, res);
            resolve(res);
          }, function (err) {
            reject(err);
          });
        });
      });
    });
  }

  function JoinRelatives(tayrs, more, type) {
    return new Promise(function (resolve, reject) {
      var attachFns = {
        parents: 'attachParent',
        children: 'attachChildren',
        cousins: 'attachCousins'
      };
      if (more === undefined) {
        more = {};
      }
      if (typeof more[type] === "string") {
        more[type] = [more[type]];
      }
      if (Array.isArray(more[type])) {
        echasync.do(tayrs, function (nextTayr, tayr, index) {
          echasync.do(more[type], function (nextRelative, relativeName) {
            attachFn = attachFns[type];
            tayrs[index][attachFn](relativeName).then(function () {
              nextRelative();
            })
          }, function () {
            nextTayr();
          })
        }, function () {
          resolve(tayrs);
        });
      } else {
        resolve(tayrs);
      }
    });
  }

  function attachJoins(tayrs, more) {
    return new Promise(function (resolve, reject) {
      JoinRelatives(tayrs, more, 'parents').then(function (tayrs) {
        JoinRelatives(tayrs, more, 'cousins').then(function (tayrs) {
          JoinRelatives(tayrs, more, 'children').then(function (tayrs) {
            resolve(tayrs);
          })
        })
      })
    });
  }

  T.find = function (table, restSql, vals, more) {
    return new Promise(function (resolve, reject) {
      waitForSchema(function () {
        if (tableExists(table)) {
          var sql = getSelectSql(table, restSql, vals, more);
          // console.log(sql);

          T.exec(sql, vals).then(function (res) {
            if (res.length > 0) {
              var tayrs = T.arrayToTayrs(table, res);
              attachJoins(tayrs, more).then(function (tayrs) {
                resolve(tayrs);
              })
            } else {
              resolve([]);
            }
          });
        } else {
          resolve([]);
        }
      })
    });
  }

  T.findOne = function (table, restSql, vals, more) {
    return new Promise(function (resolve, reject) {
      T.find(table, restSql, vals, more).then(function (res) {
        if (res.length > 0) {
          resolve(new T.tayr(table, toSimpleObject(res[0])));
        } else {
          resolve(false);
        }
      }, function (err) { reject(err); });
    });
  }

  T.load = function (table, id, more) {
    return new Promise(function (resolve, reject) {
      if (id === undefined) throw 'An id must be given!';
      if (!Number.isInteger(id)) throw 'id must be an Integer!';

      T.findOne(table, table + '.id = ?', id, more).then(function (found) {
        var res = (found.id) ? new T.tayr(table, toSimpleObject(found)) : false;
        resolve(res);
      });
    }).catch(err => {
      console.log('Load Err:', err);
    });
  }

  T.findByFecundity = function (table, data) {
    return new Promise(function (resolve, reject) {
      if (table === undefined) reject('Err: A table name must be given!');

      var countProp = data.as || data.children + 's';
      var tayrize = data.tayrize || false;
      var order = (data.poorest) ? 'ASC' : 'DESC';
      var sql = 'SELECT t.*, COUNT(*) as ' + countProp + ' FROM ' + table + ' t JOIN ' + data.children + ' c ON c.' + table + 'Id = t.id GROUP BY t.id ORDER BY ' + countProp + ' ' + order;
      if (data.limit !== undefined) {
        sql += ' LIMIT ' + data.limit;
      }
      T.exec(sql).then(function (res) {
        if (data.as !== undefined && data.as == '') {
          for (var i = 0; i < res.length; i++) {
            delete res[i][countProp];
            tayrize = true;
          }
        }
        if (tayrize) {
          res = T.arrayToTayrs(table, res);
        }
        resolve(res);
      });
    });
  }

  T.findByCousinity = function (table, data) {
    return new Promise(function (resolve, reject) {
      if (table === undefined) reject('Err: A table name must be given!');

      data.children = T.getUncleTableName(table, data.cousin);
      if (data.as === undefined) data.as = data.cousin + 's';
      T.findByFecundity(table, data).then(function (res) {
        resolve(res);
      });
    });
  }

  T.count = function (table, restSql, vals) {
    return new Promise(function (resolve, reject) {
      var more = {
        fields: ['COUNT(*)']
      };
      waitForSchema(function () {
        if (tableExists(table)) {
          T.find(table, restSql, vals, more).then(function (res) {
            resolve(res[0]['COUNT(*)']);
          });
        } else {
          resolve(0)
        }
      })
    });
  }

  T.delete = function (table, restSql, vals) {
    return new Promise(function (resolve, reject) {
      var sql = "DELETE FROM " + table + " WHERE " + restSql;
      T.exec(sql, vals).then(function (res) {
        resolve(res)
      });
    });
  }

  T.exec = function (sql, vals) {
    vals = giveValsCorrectLength(sql, vals);

    return new Promise(function (resolve, reject) {

      if (typeof sql !== "string") reject('Err: sql must be a String!');
      if (!Array.isArray(vals) && typeof vals === "object") reject('Err: vals must be an Array or a simple variable!');
      waitForSchema(function () {
        connection.query(sql, vals, function (err, res) {
          if (err) throw err;
          resolve(res);
        });
      })
    });
  }

  /*
   * Private Functions
   */

  /*
  Because mysql returns object in RowDataPack type, This function make it normal object
  */
  function toSimpleObject(object) {
    var res = {};
    for (var colName in object) {
      if (object.hasOwnProperty(colName)) {
        res[colName] = object[colName];
      }
    }
    return res;
  }

  T.arrayToTayrs = function (table, array) {
    var res = [];
    for (var i = 0; i < array.length; i++) {
      if (!T.isValidTayr(array[i])) {
        array[i] = new T.tayr(table, toSimpleObject(array[i]));
      }
      res.push(array[i]);
    }
    return res;
  }

  function giveValsCorrectLength(sql, vals) {
    vals = vals || [];
    var questionMarks = sql.match(/\?/g);
    var length = (questionMarks != null) ? questionMarks.length : 0;
    for (var i = vals.length; i < length; i++) {
      vals[i] = '';
    }
    return vals;
  }

  function getInsertSql(tayr) {
    var keysPart = Object.keys(tayr).join(' = ?,') + ' = ?';
    return 'INSERT INTO ' + tayr.table + ' SET ' + keysPart + ' ON DUPLICATE KEY UPDATE ' + keysPart;
  }

  function getSelectSql(table, restSql, vals, more) {
    if (restSql === undefined) {
      restSql = ' ';
    }
    var sql = 'SELECT';
    var selects = (more === undefined || more.fields === undefined) ? '*' : more.fields.join(', ');

    sql += ' ' + selects;
    sql += ' FROM ' + table;

    var wheresBlock = getWheresBlock(restSql);
    if (/(=|>|<|LIKE|REGEXP|BETWEEN|IS|IN|LEAST|COALESCE|INTERVAL|GRETEST|STRCMP)/i.test(wheresBlock)) {
      sql += ' WHERE ' + restSql;
    } else {
      sql += ' ' + restSql;
    }
    return sql;
  }

  function getWheresBlock(sql) {
    var wheresEnd = sql.length - 1;
    var keyWords = ['order by', 'limit', 'group by', 'join'];
    for (var i = 0; i < keyWords.length; i++) {
      var regex = new RegExp(keyWords[i], 'i');
      var match = regex.exec(sql);
      if (match && match.index < wheresEnd) {
        wheresEnd = match.index;
      }
    }
    var wheresBlock = sql.slice(0, wheresEnd);
    return wheresBlock;
  }

  T.isValidTayr = function (tayr) {
    return (tayr !== undefined && tayr.table !== undefined && tayr instanceof T.tayr);
  }

  T.getUncleTableName = function (t1, t2) {
    var array = [t1, t2];
    return array.sort().join('_');
  }

  function createTable(tayr) {
    return new Promise(function (resolve, reject) {
      var sql = ' CREATE TABLE IF NOT EXISTS ' + tayr.table + ' ( id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY )';
      T.exec(sql).then(function (res) {
        tablesRefreshed = false;
        refreshTables().then(function (res) { dbSchema = res; tablesRefreshed = true; });
        resolve();
      });
    }).catch(onReject);
  }

  function createCol(tayr, colName) {
    tayr[colName] = mendValue(tayr[colName]);
    return new Promise((resolve, reject) => {
      whatActionToCol(tayr, colName).then(resSql => {
        if (!resSql) resolve();
        else {
          return T.exec(resSql);
        }
      }).then(execResponse => {
        tablesRefreshed = false;
        resolve();
      });
    }).catch(onReject);
  }

  function createCols(tayr) {
    return new Promise((resolve, reject) => {
      var cols = Object.keys(tayr);
      return Promise.all(cols.map(colName => {
        return createCol(tayr, colName);
      })).then(() => {
        return refreshTables();
      }).then(newSchema => {
        dbSchema = newSchema;
        tablesRefreshed = true;
        resolve();
      });
    }).catch(onReject);
  }

  function getDataType(v) {
    switch (typeof v) {
      case "number":
        if (String(v).indexOf(".") > -1) return "DOUBLE";
        if (v > 2147483647) return "BIGINT";
        return "INT";
        break;
      case "string":
        if (v.length <= 255) return "VARCHAR(" + v.length + ")";
        return "TEXT";
        break;
      case "boolean":
        return "BOOL";
        break;
      case "object":
        if (v instanceof Date) return "BIGINT";
        break;
      default:

    }
  }

  function mendValue(v) {
    switch (typeof v) {
      case "object":
        if (v instanceof Date) return v.getTime();
        break;
      default:
        return v;
    }
  }

  function whatActionToCol(tayr, colName) {
    return new Promise((resolve, reject) => {
      getDBColumn(tayr.table, colName).then(dbColumn => {
        var skip = true;
        var res = ' ALTER TABLE ' + tayr.table;
        var datatype = getDataType(tayr[colName]);
        var command = (dbColumn) ? ' MODIFY COLUMN ' : ' ADD ';
        res += command + colName + ' ' + datatype;
        var newEntry = String(mendValue(tayr[colName]));
        if (
          dbColumn === undefined
          || (dbColumn.name == 'varchar' && datatype == 'TEXT')
          || (dbColumn.name == 'varchar' && newEntry.length > dbColumn.length)
          || (dbColumn.name == 'int' && datatype == 'DOUBLE')
        ) {
          skip = false;
        }
        if (skip) res = false;
        resolve(res);
      });
    }).catch(onReject);
  }

  function getDBColumn(tableName, colName) {
    return new Promise((resolve, reject) => {
      var table = dbSchema[tableName];
      var res;
      if (table && table.hasOwnProperty(colName)) {
        res = dbSchema[tableName][colName];
        var typeRegex = /(\w+)(\((\d+)\))?/g.exec(res);
        res = {
          name: typeRegex[1],
          length: typeRegex[3]
        }
      }
      resolve(res);
    });
  }

  function tableExists(table) {
    return dbSchema.hasOwnProperty(table);
  }

  function refreshTables() {
    return new Promise(function (resolve, reject) {
      var resSchema = {};
      connection.query('SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ?', dbData.database, function (err, res) {
        if (err) throw err;
        for (var i = 0; i < res.length; i++) {
          var tableName = res[i].TABLE_NAME;
          var colName = res[i].COLUMN_NAME;
          var type = res[i].COLUMN_TYPE;
          if (resSchema.hasOwnProperty(tableName)) {
            resSchema[tableName][colName] = type;
          } else {
            resSchema[tableName] = {};
            resSchema[tableName][colName] = type;
          }
        }
        resolve(resSchema);
      });
    });
  }

  function createDb() {
    return new Promise(function (resolve, reject) {
      if (dbData.database === undefined) throw 'ERR: A database must be given!';
      var dbName = dbData.database;
      delete dbData.database;
      connection = mysql.createConnection(dbData);
      connection.connect();
      connection.query('CREATE DATABASE IF NOT EXISTS ' + dbName + ' CHARACTER SET utf8 COLLATE utf8_general_ci', function () {
        connection.query('USE ' + dbName, () => {
          dbData.database = dbName;
          resolve();
        });
      });
    });
  }

  createDb().then(() => {
    return refreshTables()
  }).then(res => {
    dbSchema = res;
    tablesRefreshed = true;
  }).catch(onReject);
};
