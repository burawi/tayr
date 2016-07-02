# Introduction
## Install
Install the module with:

    npm install Tayr

## Connect to DB
The way to connect to DB is quite similar to mysql module:

```javascript
    var tayr = require('Tayr');
    var T = new tayr({
        host: 'hostname',
        user: 'username',
        password: 'password',
        database: 'databaseName'
    });
```
# CRUD
## Initialize a tayr
You decalre a tayr using two arguments:

1. table: *[string]* the table name in which you want to store the tayr *(required)*
2. data: *[object]* an object with the tayr properties *(optional)*


```javascript
    var user = new T.tayr('user',{
        name: 'Muhamad',
        age: '63',
        registeredAt: new Date()
    });
```
## Create/Update
Creating and updating is done using `.store()` function, if the tayr has an `id` that exists in the table it will update the row, else it will add a new row and affect an `id` to the tayr.
```javascript
    user.store(function(){
        console.log(user);+
    });
    //output: { name: 'Muhamad', age: '63', registeredAt: 1467137605631, id: 6 }
```
You can now modify the user tayr and store it to update the row:

```javascript
    user.store(function(){
        user.name = 'Omar';
        user.age = 53;
        user.store(function(){
            console.log(user);
        });
    });
    //output: { name: 'Omar', age: '53', registeredAt: 1467137605631, id: 6 }
```
### Store multiple tayrs
There are two ways to store multiple tayrs at the same time:

- `storeMultiple(tayrs,callback)`: takes an array of tayrs as first argument and returns the stored tayrs in the callback:

    ```javascript
        var tayrs = [
            new T.tayr('tag',{text:'orm'}),
            new T.tayr('user',{name:'AbuBakr',age:36}),
            new T.tayr('user',{name:'Ussama',age:44}),
        ];
        T.storeMultiple(tayrs,function(res){
            console.log(res);
        });
        //output: [ { text: 'orm', id: 1 }, { name: 'AbuBakr', age: 36, id: 7 }, { name: 'Ussama', age: 44, id: 8 } ]
    ```
- `storeRows(table,array,callback)`: this function is faster but it stores the rows in one table, that means that the tayrs can't have different tables:

    ```javascript
        var comments = [
            {text: 'I like it',posted: new Date()},
            {text: 'wonderful',posted: new Date()},
        ];
        T.storeRows('comment',comments,function(res){
            console.log(res);
        });
        // output: [ { text: 'I like it', posted: 1467397814583, id: 1 },
        // { text: 'wonderful', posted: 1467397814583, id: 2 } ]
    ```
*Note That: In Both Functions if any row exists it will be updated*

## Read
To read data from DB there are 3 ways:

- `load(table,id,callback)`: this function loads a tayr by its id:

    ```javascript
        T.load('user',6,function(user){
            console.log(user);
        });
        // output: { name: 'Omar', age: '53', registeredAt: 1467137605631, id: 6 }
    ```
- `find(table,condition([sql,data]),callback)`: this function returns an array of tayrs from the given table with the given conditions:

    ```javascript
        T.find('user',['age > ?',40],function(users) {
            console.log(users);
        });
        // output: [ { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 },
        // { id: 8, name: 'Ussama', age: '44', registeredAt: null } ]
    ```
    If you want to **find all** rows, don't put conditions:

    ```javascript
        T.find('user',function(users) {
            console.log(users);
        });
        // output: [ { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 },
        // { id: 7, name: 'AbuBakr', age: '36', registeredAt: null },
        // { id: 8, name: 'Ussama', age: '44', registeredAt: null } ]
    ```
- `findOne(table,condition([sql,data]),callback)`: this function works the same as `find` but returns only one tayr:

    ```javascript
        T.findOne('user',['age > ?',40],function(users) {
            console.log(users);
        });
        // output: { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 }
    ```
## Delete
There are two ways to delete records from DB:

- `.delete(callback)`: this function deletes the tayr:

    ```javascript
        // user = { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 }
        user.delete();
        // And it's done(gone)!
    ```
- `delete(table,condition([sql,data]),callback)`: this function deletes from the given table with the given conditions:

    ```javascript
        T.delete('user',['age > ?',40],function() {
            T.find('user',function(users) {
                console.log(users);
            });
        });
        // output: [ { id: 7, name: 'AbuBakr', age: '36', registeredAt: null } ]
    ```
