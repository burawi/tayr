var mysql = require('mysql');


module.exports = function(dbData) {

    var T = this;
    dbData.multipleStatements = true;


    var dbSchema = {};
    var tablesRefreshed = false;

    function waitForSchema(fn) {
        if(tablesRefreshed){
            fn();
        }else{
            setTimeout(function () {
                waitForSchema(fn);
            }, 100);
        }
    }

    // Tayr Class Declaration constructor and methods

    T.tayr = function(table, data) {
        var tayr = this;
        if (data !== undefined) tayr = Object.assign(tayr, data);
        Object.defineProperty(tayr, "table", {
            enumerable: false,
            writable: true
        });
        tayr.table = table;
    }

    T.tayr.prototype.store = function() {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            if (!isValidTayr(tayr)) reject('ERR: this parameter is not a valid tayr: \n' + tayr);

            createTable(tayr).then(function() {
                createCols(tayr).then(function() {
                    var sql = getInsertSql(tayr);
                    tayr.mendValues();
                    var values = Object.keys(tayr).map(key => tayr[key]);
                    T.exec(sql, values.concat(values)).then(function(res) {
                        if(res.insertId != 0) tayr.id = res.insertId;
                        resolve();
                    });
                });
            });
        });
    }

    T.tayr.prototype.findOrCreate = function(data) {
        data = data || {};
        if(data.by === undefined) data.by = Object.keys(tayr);
        if(data.onCreate === undefined) {};
        var tayr = this;
        var request = {
            sql: data.by.map(key => key + ' = ? ').join(' AND '),
            vals: data.by.map(key => tayr[key])
        };

        return new Promise(function(resolve, reject) {
            createTable(tayr).then(function() {
                createCols(tayr).then(function() {
                    T.findOne(tayr.table, request).then(function(res) {
                        if (!res) {
                            for (var key in data.onCreate) {
                                if (data.onCreate.hasOwnProperty(key)) {
                                    tayr[key] = data.onCreate[key];
                                }
                            }
                        } else {
                            tayr.id = res.id;
                        }
                        tayr.store().then(function(){
                            resolve();
                        });
                    },function(err){ reject(err); });
                });
            });
        });
    }

    T.tayr.prototype.getChildren = function(table) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            T.find(table,{sql: tayr.table + 'Id = ?', vals: tayr.id}).then(function(children) {
                resolve(children);
            });
        });
    }

    T.tayr.prototype.addChildren = function(table,array) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            for (var i = 0; i < array.length; i++) {
                array[i][tayr.table+'Id'] = tayr.id;
            }
            T.storeRows(table,array).then(function(res){
                resolve(res);
            });
        });
    }

    T.tayr.prototype.getCousins = function(table) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            var uncleTable = T.getUncleTableName(tayr.table,table);
            var sql = 'SELECT c.* FROM '+uncleTable+' as ut, '+table+' as c WHERE ut.'+tayr.table+'Id = ? and ut.'+table+'Id = c.id';
            T.exec(sql, tayr.id).then(function(cousins) {
                resolve(T.arrayToTayrs(table,cousins));
            });
        });
    }

    T.tayr.prototype.setCousins = function(table,array) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            T.storeRows(table,array).then(function(cousins){
                var uncleTable = T.getUncleTableName(table,tayr.table);
                var uncles = [];
                for (var i = 0; i < cousins.length; i++) {
                    var uncle = {};
                    uncle[tayr.table+'Id'] = tayr.id;
                    uncle[table+'Id'] = cousins[i].id;
                    uncles.push(uncle);
                }
                uncles = T.arrayToTayrs(uncleTable,uncles);
                if(tableExists(uncleTable)){
                    T.delete(uncleTable,{sql: tayr.table+'Id = ?', vals: tayr.id}).then(function(){
                        T.storeRows(uncleTable,uncles).then(function(){
                            resolve(cousins);
                        });
                    });
                }else{
                    T.storeRows(uncleTable,uncles).then(function(){
                        resolve(cousins);
                    });
                }
            });
        });
    }

    T.tayr.prototype.addCousins = function(table,array) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            T.storeRows(table,array).then(function(cousins){
                var uncleTable = T.getUncleTableName(table,tayr.table);
                var uncles = [];
                for (var i = 0; i < cousins.length; i++) {
                    var uncle = {};
                    uncle[tayr.table+'Id'] = tayr.id;
                    uncle[table+'Id'] = cousins[i].id;
                    uncles.push(uncle);
                }
                T.storeRows(uncleTable,uncles).then(function(){
                    resolve(cousins);
                });
            });
        });
    }

    T.tayr.prototype.addCousin = function(cousin) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            cousin.store().then(function(){
                var uncleTable = T.getUncleTableName(cousin.table,tayr.table);
                var uncle = new T.tayr(uncleTable);
                uncle[tayr.table+'Id'] = tayr.id;
                uncle[cousin.table+'Id'] = cousin.id;
                uncle.store().then(function() {
                    resolve(cousin);
                });
            });
        });
    }

    T.tayr.prototype.removeCousin = function(cousin) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            var uncleTable = T.getUncleTableName(tayr.table,cousin.table);
            var condition = tayr.table+'Id = ? AND '+cousin.table+'Id = ?';
            T.delete(uncleTable,{sql:condition,vals:[tayr.id,cousin.id]}).then(function(){
                resolve(true);
            });
        });
    }

    T.tayr.prototype.getParent = function(table) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            T.findOne(table, {sql:'id = ?',vals: tayr[table + 'Id']}).then(function(parent) {
                resolve(parent);
            },function(err){ reject(err); });
        });
    }

    T.tayr.prototype.setParent = function(parent) {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            parent.store().then(function(){
                tayr[parent.table+'Id'] = parent.id;
                tayr.store().then(function(){
                    resolve(true);
                });
            });
        });
    }

    T.tayr.prototype.delete = function() {
        var tayr = this;
        return new Promise(function(resolve, reject) {
            if (!isValidTayr(tayr)) reject('ERR: this is not a valid tayr!')
            var sql = "DELETE FROM "+tayr.table+" WHERE id = ?";
            T.exec(sql,[tayr.id]).then(function(res) {
                resolve(true);
            });
        });
    }

    T.tayr.prototype.mendValues = function() {
        for (var colName in this) {
            if (this.hasOwnProperty(colName)) {
                this[colName] = mendValue(this[colName]);
            }
        }
    }

    // End Tayr Class Declaration

    T.storeMultiple = function(tayrs) {
        return new Promise(function(resolve, reject) {
            var res = [];
            function step(i) {
                if (i < tayrs.length) {
                    tayrs[i].store().then(function() {
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

    T.storeRows = function(table,array) {
        return new Promise(function(resolve, reject) {
            var res = [];
            var tayrInstance = new T.tayr(table,{});
            for (var i = 0; i < array.length; i++) {
                tayrInstance = Object.assign(tayrInstance,array[i]);
            }
            createTable(tayrInstance).then(function() {
                createCols(tayrInstance).then(function() {
                    var sql = [];
                    var values = [];
                    for (var i = 0; i < array.length; i++) {
                        var tayr = new T.tayr(table,array[i]);
                        res.push(tayr);
                        sql.push(getInsertSql(tayr));
                        tayr.mendValues();
                        tayrVals = Object.keys(tayr).map(key => tayr[key]);
                        values = values.concat(tayrVals).concat(tayrVals);
                    }
                    T.exec(sql.join('; '), values.concat(values)).then(function(rows) {
                        for (var i = 0; i < res.length; i++) {
                            res[i].id = rows[i].insertId;
                        }
                        res = T.arrayToTayrs(table,res);
                        resolve(res);
                    },function (err) {
                        reject(err);
                    });
                });
            });
        });
    }

    T.load = function(table, id, parents) {
        return new Promise(function(resolve, reject) {
            if(id === undefined) reject('Err: An id must be given!');
            if(!Number.isInteger(id)) reject('Err: id must be an Integer!');

            T.findOne(table, {sql: table+'.id = ?',vals:id, parents: parents}).then(function(res) {
                if(res.id !== undefined){
                    resolve(new T.tayr(table, toSimpleObject(res)));
                } else {
                    resolve(false);
                }
            },function(err){ reject(err); });
        });
    }

    // T.query
    //     request => {
    //         action: delete | select ... default: select
    //         select: optional sql to put after select
    //         manualSelect: if set to true request will not select all table columns automatically
    //         sql: without writing WHERE
    //         vals: values that will replace the "?" in sql
    //         parents: parents to join
    //     }

    T.query = function(table, request) {
        request = mendQueryRequest(request);
        return new Promise(function (resolve, reject) {
            if(table === undefined) reject('Err: A table name must be given!');
            if(typeof table !==  "string") reject('Err: table name must be a String!');
            if(typeof request.sql !==  "string") reject('Err: sql must be a String!');
            if(!Array.isArray(request.parents) && typeof request.parents !==  "string") reject('Err: parents must be an Array or a String!');
            waitForSchema(function () {
                var sql = getQuerySql(table,request);
                // console.log(request);
                // console.log(sql);

                T.exec(sql,request.vals).then(function(res) {
                    resolve(res)
                },function(err){ reject(err + '\n Request Given: ' + JSON.stringify(request)); });
            })
        });
    }

    T.find = function(table,request) {
        return new Promise(function(resolve, reject) {
            T.query(table,request).then(function(res) {
                if (res.length > 0) {
                    res = formatJoinsArray(res);
                    resolve(T.arrayToTayrs(table, res));
                } else {
                    resolve(false);
                }
            });
        });
    }

    T.findOne = function(table, request) {
        request = mendQueryRequest(request);
        request.sql += ' LIMIT 1';

        return new Promise(function(resolve, reject) {
            T.find(table, request).then(function(res) {
                if (res.length > 0) {
                    resolve(new T.tayr(table, toSimpleObject(res[0])));
                } else {
                    resolve(false);
                }
            },function(err){ reject(err); });
        });
    }

    T.findByFecundity = function(table, data) {
        return new Promise(function(resolve, reject) {
            if (table === undefined) reject('Err: A table name must be given!');

            var countProp = data.as || data.children+'s';
            var tayrize = data.tayrize || false;
            var order = (data.poorest) ? 'ASC' : 'DESC';
            var sql = 'SELECT t.*, COUNT(*) as '+countProp+' FROM '+table+' t JOIN '+data.children+' c ON c.'+table+'Id = t.id GROUP BY t.id ORDER BY '+countProp+' '+order;
            if(data.limit !== undefined){
                sql += ' LIMIT '+ data.limit;
            }
            T.exec(sql).then(function(res) {
                if(data.as !== undefined && data.as == ''){
                    for (var i = 0; i < res.length; i++) {
                        delete res[i][countProp];
                        tayrize = true;
                    }
                }
                if (tayrize) {
                    res = T.arrayToTayrs(table,res);
                }
                resolve(res);
            });
        });
    }

    T.findByCousinity = function(table, data) {
        return new Promise(function(resolve, reject) {
            if (table === undefined) reject('Err: A table name must be given!');

            data.children = T.getUncleTableName(table,data.cousin);
            if(data.as === undefined) data.as = data.cousin+'s';
            T.findByFecundity(table,data).then(function (res) {
                resolve(res);
            });
        });
    }

    T.count = function(table, request) {
        return new Promise(function(resolve, reject) {
            request = request || {};
            request.select = 'COUNT(*)';
            request.manualSelect = true;
            T.find(table,request).then(function(res) {
                resolve(res[0]['COUNT(*)']);
            });
        });
    }

    T.delete = function(table, request){
        return new Promise(function(resolve, reject) {
            request = request || {};
            request.action = 'DELETE';
            request.parents = [];
            request.select = '';
            request.manualSelect = true;
            T.query(table,request).then(function(res) {
                resolve(res);
            });
        });
    }

    T.exec = function(sql, vals) {
        vals = vals || [];

        return new Promise(function(resolve, reject) {

            if(typeof sql !==  "string") reject('Err: sql must be a String!');
            if(!Array.isArray(vals) && typeof vals ===  "object") reject('Err: vals must be an Array or a simple variable!');
            waitForSchema(function () {
                connection.query(sql,vals, function(err, res) {
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

    T.arrayToTayrs = function(table, array) {
        var res = [];
        for (var i = 0; i < array.length; i++) {
            if (!isValidTayr(array[i])) {
                array[i] = new T.tayr(table, toSimpleObject(array[i]));
            }
            res.push(array[i]);
        }
        return res;
    }

    function getQuerySql(table,request) {
        var sql = request.action;
        var selects = []

        if(request.select != '') selects.push(request.select);

        for (var i = 0; i < request.parents.length; i++) {
            var parent = request.parents[i];
            var cols = dbSchema[parent];
            for (var colName in cols) {
                selects.push(parent + '.' + colName + ' AS J_' + parent + '_' + colName);
            }
        }

        if(!request.manualSelect) selects.push(table+'.*');
        sql += ' ' + selects.join(', ');
        sql += ' FROM ' + table;

        for (var i = 0; i < request.parents.length; i++) {
            var parent = request.parents[i];
            sql += ' JOIN ' + parent + ' ON ' + parent + '.id = ' + table + '.' + parent + 'Id';
        }

        var wheresBlock = getWheresBlock(request.sql);
        if(/(=|>|<|LIKE|REGEXP|BETWEEN|IS|IN|LEAST|COALESCE|INTERVAL|GRETEST|STRCMP)/i.test(wheresBlock)){
            sql += ' WHERE ' + request.sql;
        } else {
            sql += ' '+request.sql;
        }
        return sql;
    }

    function mendQueryRequest(data) {
        var req = data || {};
        req.action = req.action || 'SELECT';
        req.sql = req.sql || '';
        req.select = req.select || '';
        req.manualSelect = req.manualSelect || false;
        req.vals = req.vals || [];
        req.parents = req.parents || [];
        if(typeof req.parents ===  "string") req.parents = [req.parents];
        return req;
    }

    function getWheresBlock(sql) {
        var wheresEnd = sql.length - 1;
        var keyWords = ['order by','limit','group by','join'];
        for (var i = 0; i < keyWords.length; i++) {
            var regex = new RegExp(keyWords[i],'i');
            var match = regex.exec(sql);
            if(match && match.index < wheresEnd){
                wheresEnd = match.index;
            }
        }
        var wheresBlock = sql.slice(0,wheresEnd);
        return wheresBlock;
    }

    function formatJoins(obj) {
        var res = {};
        for(var prop in obj){
            if(prop.substr(0,2) == 'J_'){
                var parts = prop.split('_');
                var parent = parts[1];
                var col = parts[2];
                if(!res.hasOwnProperty(parent)) res[parent] = {};
                res[parent][col] = obj[prop];
            }else{
                res[prop] = obj[prop];
            }
        }
        return res;
    }

    function formatJoinsArray(array) {
        var res = [];
        for (var i = 0; i < array.length; i++) {
            res.push(formatJoins(array[i]));
        }
        return res;
    }

    function getInsertSql(tayr) {
        var keysPart = Object.keys(tayr).join(' = ?,') + ' = ?';
        return 'INSERT INTO ' + tayr.table + ' SET ' + keysPart + ' ON DUPLICATE KEY UPDATE ' + keysPart;
    }

    function isValidTayr(tayr) {
        return (tayr !== undefined && tayr.table !== undefined && tayr instanceof T.tayr);
    }

    T.getUncleTableName = function(t1,t2){
        var array = [t1,t2];
        return array.sort().join('_');
    }

    function createTable(tayr) {
        return new Promise(function(resolve, reject) {
            var sql = ' CREATE TABLE IF NOT EXISTS ' + tayr.table + ' ( id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY )';
            T.exec(sql).then(function(res) {
                tablesRefreshed = false;
                refreshTables().then(function (res) { dbSchema = res; tablesRefreshed = true; });
                resolve();
            });
        });
    }

    function createCols(tayr) {
        return new Promise(function(resolve, reject) {
            var cols = Object.keys(tayr);
            function handleCol(i) {
                if (i < cols.length) {
                    var colName = cols[i];
                    if (tayr.hasOwnProperty(colName)) {
                        var datatype = getDataType(tayr[colName]);
                        tayr[colName] = mendValue(tayr[colName]);
                        var sql = 'ALTER TABLE ' + tayr.table + ' ADD ' + colName + ' ' + datatype;
                        whatActionToCol(tayr, colName, function(resSql) {
                            if (resSql !== false) {
                                T.exec(resSql).then(function(res) {
                                    tablesRefreshed = false;
                                    refreshTables().then(function (res) {
                                        dbSchema = res;
                                        tablesRefreshed = true;
                                        handleCol(i + 1);
                                    });
                                });
                            } else {
                                handleCol(i + 1);
                            }
                        });
                    }
                } else {
                    resolve();
                }
            }
            handleCol(0);
        });
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

    function whatActionToCol(tayr, colName, callback) {
        getDBColumn(tayr.table, colName, function(dbColumn) {
            var skip = true;
            var resSql = 'ALTER TABLE ' + tayr.table + ' ';
            var datatype = getDataType(tayr[colName]);
            if (dbColumn === undefined) { // If column does not exist
                resSql += 'ADD ' + colName + ' ' + datatype;
                skip = false;
            } else {
                if (dbColumn.name == 'varchar') {
                    if (datatype == 'TEXT') {
                        resSql += 'MODIFY COLUMN ' + colName + ' ' + datatype;
                        skip = false;
                    } else {
                        var newEntry = String(mendValue(tayr[colName]));
                        if (newEntry.length > dbColumn.length) {
                            resSql += 'MODIFY COLUMN ' + colName + ' VARCHAR(' + newEntry.length + ')';
                            skip = false;
                        }
                    }
                } else if (dbColumn.name == 'int' && datatype == 'DOUBLE') {
                    resSql += 'MODIFY COLUMN ' + colName + ' DOUBLE';
                    skip = false;
                }
            }
            if (skip) callback(false);
            else callback(resSql);
        });
    }

    function getDBColumn(table, colName, callback) {
        if(dbSchema.hasOwnProperty(table)){
            if(dbSchema[table].hasOwnProperty(colName)){
                var res = dbSchema[table][colName];
                var typeRegex = /(\w+)(\((\d+)\))?/g.exec(res);
                res = {
                    name: typeRegex[1],
                    length: typeRegex[3]
                }
                callback(res)
            }else{
                callback(undefined)
            }
        }else{
            callback(undefined)
        }
    }

    function tableExists(table) {
        return dbSchema.hasOwnProperty(table);
    }

    function refreshTables(){
        return new Promise(function(resolve, reject) {
            var resSchema = {};
            connection.query('SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ?',dbData.database, function(err, res){
                if(err) throw err;
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
        return new Promise(function(resolve, reject) {
            if(dbData.database === undefined) reject('ERR: A database must be given!');
            var dbName = dbData.database;
            delete dbData.database;
            connection = mysql.createConnection(dbData);
            connection.connect();
            connection.query('CREATE DATABASE IF NOT EXISTS '+dbName+' CHARACTER SET utf8 COLLATE utf8_general_ci', function () {
                connection.query('USE ' + dbName, function () {
                    dbData.database = dbName;
                    resolve();
                });
            });
        });
    }

    createDb().then(function () {
        refreshTables().then(function (res) {
            dbSchema = res;
            tablesRefreshed = true;
        });
    },function (err) {
        console.log(err);
    });
};
