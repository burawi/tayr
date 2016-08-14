# Read
To read data from DB there are 3 ways:

- `load(table,id)`: Loads a tayr.

    **Arguments:**

    table: *[string] --required* The table of the wanted tayr.

    id: *[integer] --required* The id of the wanted tayr.

    ```javascript
        T.load('user',6).then(function(user){
            console.log(user);
        });
        // output: { name: 'Omar', age: '53', registeredAt: 1467137605631, id: 6 }
    ```
    *If no record found it returns false*
- `find(table,data)`: this function returns an array of tayrs from a table.

    **Arguments:**

    table: *[string] --required* The table of the wanted tayr.

    data: *[object]*
    - sql: *[string]* All the sql you want to put after "WHERE" *(It's recommended to not put variables in this string, write `?` instead)*
    - vals: *[array|simple]* The values that will replace the `?`s in order
    - parents: *[array|string]* The parents to join with the tayr
    - select: *[string]* String added after "SELECT"
    - manualSelect: *[boolean]* If set to true request will not select all table columns automatically *|| Default: children+'s'*

    ```javascript
        T.find('user',{sql:'age > ?',vals: 40}).then(function(users) {
            console.log(users);
        });
        // output: [ { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 },
        // { id: 8, name: 'Ussama', age: '44', registeredAt: null } ]
    ```
    If you want to **find all** rows, don't put conditions:

    ```javascript
        T.find('user').then(function(users) {
            console.log(users);
        });
        // output: [ { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 },
        // { id: 7, name: 'AbuBakr', age: '36', registeredAt: null },
        // { id: 8, name: 'Ussama', age: '44', registeredAt: null } ]
    ```
    To get only some columns:

    ```javascript
        T.find('user',{sql:'age > ?',vals: 40,select: 'name,id',manualSelect: true}).then(function(users) {
            console.log(users);
        });
        // output: [ { id: 6, name: 'Omar' },
        // { id: 8, name: 'Ussama' } ]
    ```
- `findOne(table,data)`: this function works the same as `find` but returns only one tayr:

    ```javascript
        T.findOne('user',{sql:'age > ?',vals: 40}).then(function(user) {
            console.log(user);
        });
        // output: { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 }
    ```
