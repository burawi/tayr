var mysql = require('mysql');


module.exports = function(dbData) {

    var T = this;
    dbData.multipleStatements = true;
    var connection = mysql.createConnection(dbData);
    connection.connect();

    var tables = [];

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

    T.tayr.prototype.store = function(callback) {
        var tayr = this;
        if (isValidTayr(tayr)) {
            createTable(tayr, function() {
                createCols(tayr, function() {
                    var sql = getInsertSql(tayr);
                    tayr.mendValues();
                    var values = Object.keys(tayr).map(key => tayr[key]);
                    connection.query(sql, values.concat(values), function(err, res) {
                        if (err) throw err;
                        if (callback !== undefined) {
                            tayr.id = res.insertId;
                            callback();
                        }
                    });
                });
            });
        } else {
            console.log('ERROR: this parameter is not a valid tayr: \n' + tayr);
        }
    }

    T.tayr.prototype.getChildren = function(table, callback) {
        var tayr = this;
        T.find(table, tayr.table + 'Id = ' + tayr.id, function(children) {
            callback(children);
        });
    }

    T.tayr.prototype.addChildren = function(table,array, callback) {
        var tayr = this;
        for (var i = 0; i < array.length; i++) {
            array[i][tayr.table+'Id'] = tayr.id;
        }
        T.storeRows(table,array,function(res){
            callback(res);
        })
    }

    T.tayr.prototype.getCousins = function(table, callback) {
        var tayr = this;
        var uncleTable = T.getUncleTableName(tayr.table,table);
        var sql = 'SELECT c.* FROM '+uncleTable+' as ut, '+table+' as c WHERE ut.'+tayr.table+'Id = ? and ut.'+table+'Id = c.id';
        T.exec(sql, [tayr.id], function(cousins) {
            callback(T.arrayToTayrs(table,cousins));
        });
    }

    T.tayr.prototype.setCousins = function(table,array, callback) {
        var tayr = this;
        T.storeRows(table,array,function(cousins){
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
                T.delete(uncleTable,[tayr.table+'Id = ?', [tayr.id]],function(){
                    T.storeRows(uncleTable,uncles,function(){
                        callback(cousins);
                    });
                });
            }else{
                T.storeRows(uncleTable,uncles,function(){
                    callback(cousins);
                });
            }
        });
    }

    T.tayr.prototype.addCousins = function(table,array, callback) {
        var tayr = this;
        T.storeRows(table,array,function(cousins){
            var uncleTable = T.getUncleTableName(table,tayr.table);
            var uncles = [];
            for (var i = 0; i < cousins.length; i++) {
                var uncle = {};
                uncle[tayr.table+'Id'] = tayr.id;
                uncle[table+'Id'] = cousins[i].id;
                uncles.push(uncle);
            }
            T.storeRows(uncleTable,uncles,function(){
                callback(cousins);
            });
        });
    }

    T.tayr.prototype.addCousin = function(cousin, callback) {
        var tayr = this;
        cousin.store(function(){
            var uncleTable = T.getUncleTableName(cousin.table,tayr.table);
            var uncle = new T.tayr(uncleTable);
            uncle[tayr.table+'Id'] = tayr.id;
            uncle[cousin.table+'Id'] = cousin.id;
            uncle.store(function() {
                callback(cousin);
            });
        });
    }

    T.tayr.prototype.removeCousin = function(cousin, callback) {
        var tayr = this;
        var uncleTable = T.getUncleTableName(tayr.table,cousin.table);
        var condition = tayr.table+'Id = ? AND '+cousin.table+'Id = ?';
        T.delete(uncleTable,[condition,[tayr.id,cousin.id]],function(){
            callback();
        });
    }

    T.tayr.prototype.getParent = function(table, callback) {
        var tayr = this;
        T.findOne(table, 'id = ' + tayr[table + 'Id'], function(parent) {
            callback(parent);
        });
    }

    T.tayr.prototype.setParent = function(parent, callback) {
        var tayr = this;
        tayr[parent.table+'Id'] = parent.id;
        tayr.store(function(){
            callback();
        });
    }

    T.tayr.prototype.delete = function(callback) {
        var tayr = this;
        if (isValidTayr(tayr)) {
            var sql = 'DELETE FROM ' + tayr.table + ' WHERE id = ' + tayr.id;
            connection.query(sql, function(err, res) {
                if (err) throw err;
                if (callback !== undefined)
                    callback(true);
            });
        }
    }

    T.tayr.prototype.mendValues = function() {
        for (var colName in this) {
            if (this.hasOwnProperty(colName)) {
                this[colName] = mendValue(this[colName]);
            }
        }
    }

    // End Tayr Class Declaration

    T.storeMultiple = function(tayrs, callback) {
        var res = [];
        function step(i) {
            if (i < tayrs.length) {
                tayrs[i].store(function() {
                    res.push(tayrs[i]);
                    step(i + 1);
                });
            } else {
                callback(res);
            }
        }
        step(0);
    }

    T.storeRows = function(table,array, callback) {
        var res = [];
        var tayrInstance = new T.tayr(table,{});
        for (var i = 0; i < array.length; i++) {
            tayrInstance = Object.assign(tayrInstance,array[i]);
        }
        createTable(tayrInstance, function() {
            createCols(tayrInstance, function() {
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
                connection.query(sql.join('; '), values.concat(values), function(err, rows) {
                    if (err) throw err;
                    for (var i = 0; i < res.length; i++) {
                        res[i].id = rows[i].insertId;
                    }
                    res = T.arrayToTayrs(table,res);
                    callback(res);
                });
            });
        });
    }

    T.load = function(table, id, callback) {
        if (table !== undefined && id !== undefined) {
            var sql = 'SELECT * FROM ' + table + ' WHERE id = ?';
            connection.query(sql, [id], function(err, res) {
                if (err) throw err;
                if (res.length > 0) {
                    callback(new T.tayr(table, toSimpleObject(res[0])));
                } else {
                    callback(null);
                }
            });
        }
    }

    T.find = function(table, condition, callback) {
        if (table !== undefined) {
            var sql = 'SELECT * FROM ' + table;
            if (Array.isArray(condition) && condition[0] != '') {
                var wheresBlock = getWheresBlock(condition[0]);
                if(/(=|>|<|LIKE|BETWEEN|IS|IN|LEAST|COALESCE|INTERVAL|GRETEST|STRCMP)/i.test(wheresBlock)){
                    sql += ' WHERE ' + condition[0];
                } else {
                    sql += ' '+condition[0];
                }
            } else if (condition !== undefined && typeof condition == "function") {
                callback = condition;
            }
            console.log(sql);
            connection.query(sql,condition[1], function(err, res) {
                if (err) throw err;
                if (res.length > 0) {
                    callback(T.arrayToTayrs(table, res));
                } else {
                    callback(null);
                }
            });
        }
    }

    T.findOne = function(table, condition, callback) {
        if (table !== undefined) {
            var sql = 'SELECT * FROM ' + table;
            if (Array.isArray(condition) && condition[0] != '') {
                var wheresBlock = getWheresBlock(condition[0]);
                if(/(=|>|<|LIKE|BETWEEN|IS|IN|LEAST|COALESCE|INTERVAL|GRETEST|STRCMP)/i.test(wheresBlock)){
                    sql += ' WHERE ' + condition[0];
                } else {
                    sql += ' '+condition[0];
                }
            } else if (condition !== undefined && typeof condition == "function") {
                callback = condition;
            }
            sql += ' LIMIT 1';
            T.exec(sql,condition[1], function(res) {
                if (res.length > 0) {
                    callback(new T.tayr(table, toSimpleObject(res[0])));
                } else {
                    callback(null);
                }
            });
        }
    }

    T.findMostFecund = function(table, data, callback) {// TODO: add to documentation
        if (table !== undefined) {
            var countProp = data.children+'s';
            var sql = 'SELECT t.*, COUNT(*) as '+countProp+' FROM '+table+' t JOIN '+data.children+' c ON c.'+table+'Id = t.id GROUP BY t.id ORDER BY '+countProp+' DESC';
            if(data.limit !== undefined){
                sql += ' LIMIT '+ data.limit;
            }
            T.exec(sql,[],function(res) {
                callback(res);
            });
        }
    }

    T.findMostCousined = function(table, data, callback) {// TODO: add to documentation
        if (table !== undefined) {
            var uncleTable = T.getUncleTableName(table,data.cousin);
            var countProp = data.cousin+'s';
            var sql = 'SELECT t.*, COUNT(*) as '+countProp+' FROM '+table+' t JOIN '+uncleTable+' c ON c.'+table+'Id = t.id GROUP BY t.id ORDER BY '+countProp+' DESC';
            if(data.limit !== undefined){
                sql += ' LIMIT '+ data.limit;
            }
            T.exec(sql,[],function(res) {
                callback(res);
            });
        }
    }

    T.count = function(table, condition, callback) {
        if (table !== undefined) {
            var sql = 'SELECT COUNT(*) FROM ' + table;
            if (Array.isArray(condition) && condition[0] != '') {
                sql += ' WHERE ' + condition[0];
            } else if (condition !== undefined && typeof condition == "function") {
                callback = condition;
            }
            connection.query(sql,condition[1], function(err, res) {
                if (err) throw err;
                callback(res[0]['COUNT(*)']);
            });
        }
    }

    T.delete = function(table, condition, callback){
        if (table !== undefined) {
            var sql = 'DELETE IGNORE FROM ' + table;
            if (Array.isArray(condition) && condition[0] != '') {
                sql += ' WHERE ' + condition[0];
            } else if (condition !== undefined && typeof condition == "function") {
                callback = condition;
            }
            T.exec(sql,condition[1], function(res) {
                callback(res);
            });
        }
    }

    T.exec = function(sql, data, callback) {
        connection.query(sql,data, function(err, res) {
            if (err) throw err;
            callback(res);
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

    function getWheresBlock(condition) {
        var wheresEnd = condition.length - 1;
        var reOrderBy = /order by/i;
        var reLimit = /limit/i;
        var orderByMatch = reOrderBy.exec(condition);
        var limitMatch = reLimit.exec(condition);
        if(orderByMatch){
            wheresEnd = orderByMatch.index;
        }else if(limitMatch){
            wheresEnd = limitMatch.index;
        }
        var wheresBlock = condition.slice(0,wheresEnd);
        return wheresBlock;
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

    function createTable(tayr, callback) {
        var sql = ' CREATE TABLE IF NOT EXISTS ' + tayr.table + ' ( id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY )';
        connection.query(sql, function(err, res) {
            if (err) throw err;
            refreshTables();
            callback();
        });
    }

    function createCols(tayr, callback) {
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
                            connection.query(resSql, function(err, res) {
                                if (err) throw err;
                                handleCol(i + 1)
                            });
                        } else {
                            handleCol(i + 1);
                        }
                    });
                }
            } else {
                callback();
            }
        }
        handleCol(0);
    }

    function getDataType(v) {
        switch (typeof v) {
            case "number":
                if (String(v).indexOf(".") > -1) return "DOUBLE";
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
                if (dbColumn.Type.name == 'varchar') {
                    if (datatype == 'TEXT') {
                        resSql += 'MODIFY COLUMN ' + colName + ' ' + datatype;
                        skip = false;
                    } else {
                        var newEntry = String(mendValue(tayr[colName]));
                        if (newEntry.length > dbColumn.Type.length) {
                            resSql += 'MODIFY COLUMN ' + colName + ' VARCHAR(' + newEntry.length + ')';
                            skip = false;
                        }
                    }
                }
            }
            if (skip) callback(false);
            else callback(resSql);
        });
    }

    function getDBColumn(table, colName, callback) {
        var sql = 'DESCRIBE ' + table + ' ' + colName;
        connection.query(sql, function(err, res) {
            if (err) throw err;
            res = res[0];
            if (res !== undefined) {
                var typeRegex = /(\w+)(\((\d+)\))?/g.exec(res.Type);
                res.Type = {
                    name: typeRegex[1],
                    length: typeRegex[3]
                }
            }
            callback(res)
        });
    }

    function tableExists(table) {
        return tables.indexOf(table) > -1;
    }

    function refreshTables(){
        T.exec('SHOW TABLES',[],function(res){
            for (var i = 0; i < res.length; i++) {
                var row = res[i];
                for (var prop in row) {
                    if (row.hasOwnProperty(prop)) {
                        tables.push(row[prop]);
                    }
                }
            }
        });
    }
    refreshTables();
};
