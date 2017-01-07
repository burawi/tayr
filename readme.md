# OUTDATED
This documentation is outdated. We're working on a new version
And We're so Sorry
# Introduction
- Feeling that you are are wasting a lot of time writing database schema ?
- Bored of making migrations for every little change in the database ?
- Feeling that there is an other way simpler to manage a database ?
- Wanting an orm that does all the configuration for you ?

Tayr is what you're looking for. It's a MySql ORM that needs "zero-config", It makes the database schema and updates automatically, and let you focus on your code without carrying on models and migrations...

## Install
Install the module with:

    npm install Tayr

## Connect to DB
The way to connect to DB is quite similar to mysql module:

```javascript
    var nest = require('Tayr');
    var T = new nest({
        host: 'hostname',
        user: 'username',
        password: 'password',
        database: 'databaseName'
    });
```
# CRUD
## Initialize a tayr
To declare a tayr:

- `tayr(table,properties)`

    **Arguments:**

    table: *[string] --required* the table name in which you want to store the tayr.

    properties: *[object]* an object with the tayr properties.

    ```javascript
    var user = new T.tayr('user',{
        name: 'Muhamad',
        age: 63,
        registeredAt: new Date()
    });
    ```
### Change tayr table
You can access and change a tayr table by its `table` property:
```javascript
console.log(user.table);
// output: user
```

## Create/Update
Creating and updating is done using `.store()` function, if the tayr has an `id` that exists in the table it will update the row, else it will add a new row and affect an `id` to the tayr.
```javascript
    user.store().then(function(){
        console.log(user);
    });
    //output: { name: 'Muhamad', age: '63', registeredAt: 1467137605631, id: 6 }
```
You can now modify the user tayr and store it to update the row:

```javascript
    user.store().then(function(){
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

- `storeMultiple(tayrs)`: Stores the given tayr.

    **Arguments:**

    tayrs: *[arrayOfTayrs]* The tayrs to be stored.

    ```javascript
    var tayrs = [
        new T.tayr('tag',{text:'orm'}),
        new T.tayr('user',{name:'AbuBakr',age:36}),
        new T.tayr('user',{name:'Ussama',age:44}),
    ];
    T.storeMultiple(tayrs).then(function(res){
        console.log(res);
    });
    //output: [ { text: 'orm', id: 1 }, { name: 'AbuBakr', age: 36, id: 7 }, { name: 'Ussama', age: 44, id: 8 } ]
    ```
- `storeRows(table,array)`: This function is faster but it stores the rows in one table, that means that the tayrs can't have different tables:

    **Arguments:**

    table: *[string]* The table in which tayrs will be stored.

    array: *[array]* The objects to be stored.

    ```javascript
        var comments = [
            {text: 'I like it',posted: new Date()},
            {text: 'wonderful',posted: new Date()},
        ];
        T.storeRows('comment',comments).then(function(res){
            console.log(res);
        });
        // output: [ { text: 'I like it', posted: 1467397814583, id: 1 },
        // { text: 'wonderful', posted: 1467397814583, id: 2 } ]
    ```
*Note That: In Both Functions if any row exists it will be updated*

## Read
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
## Delete
There are two ways to delete records from DB:

- `.delete()`: this function deletes the tayr:

    ```javascript
        // user = { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 }
        user.delete().then(function () {
            console.log('done!');
        });
        // And it's done(gone)!
    ```
- `delete(table,data)`: this function deletes from a table.

    **Arguments:**

    table: *[string] --required* The wanted table.

    data: *[object]*
    - sql: *[string]* All the sql you want to put after "WHERE" *(It's recommended to not put variables in this string, write `?` instead)*
    - vals: *[array|simple]* The values that will replace the `?`s in order

    ```javascript
        T.delete('user',{sql: 'age > ?',vals: 40},function() {
            T.find('user',function(users) {
                console.log(users);
            });
        });
        // output: [ { id: 7, name: 'AbuBakr', age: '36', registeredAt: null } ]
    ```
# Relations (Family)
## One to many (Parent & Children)
You can add a property `tableName+'Id'` manually to make a tayr belong to another tayr. Or you can use this function:

- `.setParent(parent)`: Sets a parent to tayr.

    **Arguments:**

    parent: *[tayr] --required* The tayr to be set as parent.

    ```javascript
        // comment = { id: 1, text: 'I like it', posted: 2147483647 }
        // user = { id: 7, name: 'AbuBakr', age: '36', registeredAt: null }
        comment.setParent(user).then(function() {
            console.log(comment);
        });
        // output: { id: 1, text: 'I like it', posted: 2147483647, userId: 7 }
    ```
And you can get the parent using this:

- `.getParent(table)`: Returns the parent tayr.

    **Arguments:**

    table: *[string] --required* The parent tayr table.

    ```javascript
        // comment = { id: 1, text: 'I like it', posted: 2147483647, userId: 7 }
        comment.getParent('user').then(function(user) {
            console.log(user);
        });
        // output: { id: 7, name: 'AbuBakr', age: '36', registeredAt: null }
    ```
If you have the parent and you want to append children to it do that:

- `.addChildren(table,array)`: Adds children to tayr.

    **Arguments:**

    table: *[string] --required* The children's table.

    array: *[array] --required*  The objects to be stored as children.

    ```javascript
    // user = { id: 7, name: 'AbuBakr', age: '36', registeredAt: null }
    // comments = [ { id: 1, text: 'I like it', posted: 2147483647, userId: 7 },
    // { id: 2, text: 'wonderful', posted: 2147483647, userId: null } ]
    user.addChildren('comment',comments).then(function(res) {
        comments = res;
        console.log(comments);
    });
    // output: [ { id: 0, text: 'I like it', posted: 2147483647, userId: 7 },
    // { id: 2, text: 'wonderful', posted: 2147483647, userId: 7 } ]
    ```
And to get children:

- `getChildren(table)`: Returns children of tayr.

    **Arguments:**

    table: *[string] --required*  The children's table.

    ```javascript
        // user = { id: 7, name: 'AbuBakr', age: '36', registeredAt: null }
        user.getChildren('comment').then(function(comments) {
            console.log(comments);
        });
        // output: [ { id: 0, text: 'I like it', posted: 2147483647, userId: 7 },
        // { id: 2, text: 'wonderful', posted: 2147483647, userId: 7 } ]
    ```
## Many to many (Cousins)

*For the rest of the docs, we used an adapted copy of sakila database.*

In Tayr the many to many related tables are called cousins:

- `.getCousins(cousinsTable)`: Returns the cousins list.

    **Arguments:**

    cousinsTable: *[string] --required* The cousins table name.

    ```javascript
    T.load('film',790).then(function (film) {
        film.getCousins('actor').then(function (actors) {
            console.log(actors);
        });
    });
    // output: [ { id: 28, first_name: 'WOODY', last_name: 'HOFFMAN' },
    // { id: 47, first_name: 'JULIA', last_name: 'BARRYMORE' },
    // { id: 55, first_name: 'FAY', last_name: 'KILMER' } ]
    ```
- `.setCousins(cousinsTable,newCousins)`: Replace all the current cousins by the given cousins in array.

    **Arguments:**

    cousinsTable: *[string] --required* The cousins table name.

    newCousins: *[array] --required* An array of objects(not required to be tayrs).

    ```javascript
    T.load('film',790).then(function (film) {
        var array = [
            { first_name: 'JOHN', last_name: 'CENA' },
            { first_name: 'GARRY', last_name: 'LEWIS' },
        ];
        film.setCousins('actor',array).then(function (actors) {
            console.log(actors);
        });
    });
    // output: [ { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' } ]
    ```
- `.addCousins(cousinsTable,newCousins)`: Works the same as `.setCousins` but without deleting the recorded cousins.

    **Arguments:**

    cousinsTable: *[string] --required* The cousins table name.

    newCousins: *[array] --required* An array of objects(not required to be tayrs).

    ```javascript
    T.load('film',790).then(function (film) {
        var array = [
            { first_name: 'PETER', last_name: 'MALCOLM' },
            { first_name: 'SAMUEL', last_name: 'HADINBOURG' },
        ];
        film.addCousins('actor',array).then(function (newActors) {
            film.getCousins('actor').then(function (actors) {
                console.log(actors);
            });
        });
    });
    // output: [ { id: 215, first_name: 'PETER', last_name: 'MALCOLM' },
    // { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' },
    // { id: 216, first_name: 'SAMUEL', last_name: 'HADINBOURG' } ]
    ```
- `.addCousin(cousin)`: Add a single cousin to a tayr.

    **Arguments:**

    cousin: *[tayr] --required* The cousin to be added.

    ```javascript
    T.load('film',790).then(function (film) {
        var actor = new T.tayr('actor',{ first_name: 'FRED', last_name: 'HAMILTON' });
        film.addCousin(actor).then(function () {
            film.getCousins('actor').then(function (actors) {
                console.log(actors);
            });
        });
    });
    // output: [ { id: 215, first_name: 'PETER', last_name: 'MALCOLM' },
    // { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' },
    // { id: 216, first_name: 'SAMUEL', last_name: 'HADINBOURG' },
    // { id: 217, first_name: 'FRED', last_name: 'HAMILTON' } ]
    ```
- `.removeCousin(cousin)`: Removes the cousinity(relation) between the two tayrs.

    **Arguments:**

    cousin: *[tayr] --required* The cousin to be unrelated.

    ```javascript
    T.load('film',790).then(function (film) {
        T.load('actor',217).then(function (actor) {
            film.removeCousin(actor).then(function () {
                film.getCousins('actor').then(function (actors) {
                    console.log(actors);
                });
            });
        });
    });
    // output: [ { id: 215, first_name: 'PETER', last_name: 'MALCOLM' },
    // { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' },
    // { id: 216, first_name: 'SAMUEL', last_name: 'HADINBOURG' } ]
    ```

*Note: In case you want to know whats the intermediate table name between two tables you can use this:*
```javascript
T.getUncleTableName(table1,table2);
// for table1 = 'film' and table2 = 'actor'
// it returns 'actor_film'
```

## Family Helpers
- **findByParent**: Finds rows according to parent's attribute.

    *This is not a function, but it's a feature that can be unkown by some people*

    ```javascript
    T.find('city',{sql:'country.country = ?',vals:'India',parents:'country'}).then(function (cities) {
        console.log(cities);
    })
    ```

- `findByFecundity(table,data)`: Finds rows ordered by children's number.

    **Arguments:**

    table: *[string] --required* The table wanted.

    data: *[object]*
    - children: *[string] --required* The children table name
    - as: *[string]* The property name that contains the children's number *|| Default: children+'s'*
    - limit: *[integer]* The limit number of returned rows
    - poorest: *[boolean]* If true the order will be ascending *|| Default: false*
    - tayrize: *[boolean]* Force result as tayrs

    ```javascript
    T.findByFecundity('country',{children:'city',limit:3}).then(function (countries) {
        console.log(countries);
    });
    // output: [ RowDataPacket { id: 44, country: 'India', citys: 60 },
    // RowDataPacket { id: 23, country: 'China', citys: 53 },
    // RowDataPacket { id: 103, country: 'United States', citys: 35 } ]
    ```
    To inverse the order:
    ```javascript
    T.findByFecundity('country',{children:'city',limit:3,order:'less'}).then(function (countries) {
        console.log(countries);
    });
    // output:  [ RowDataPacket { id: 84, country: 'Slovakia', citys: 1 },
    // RowDataPacket { id: 81, country: 'Saint Vincent and the Grenadines', citys: 1 },
    // RowDataPacket { id: 11, country: 'Bahrain', citys: 1 } ]
    ```
    With `as`:
    ```javascript
        T.findByFecundity('country',{children:'city',as:'cities',limit:3}).then(function (countries) {
            console.log(countries);
        });
        // output: [ RowDataPacket { id: 44, country: 'India', cities: 60 },
        // RowDataPacket { id: 23, country: 'China', cities: 53 },
        // RowDataPacket { id: 103, country: 'United States', cities: 35 } ]
    ```
    If you don't want the children' number property to be returned:
    ```javascript
    T.findByFecundity('country',{children:'city',as:'',limit:3}).then(function (countries) {
        console.log(countries);
    });
    // output: [ { id: 44, country: 'India' },
    // { id: 23, country: 'China' },
    // { id: 103, country: 'United States' } ]
    ```
    You can see now that the returned result is an array of tayrs, that was not the case before, because the children's number property does not exist in the original table. But if you want to force result to be an array of tayrs even if the children's number property is returned:
    ```javascript
    T.findByFecundity('country',{children:'city',as:'cities',limit:3,tayrize:true}).then(function (countries) {
        console.log(countries);
    });
    // output: [ { id: 44, country: 'India', cities: 60 },
    // { id: 23, country: 'China', cities: 53 },
    // { id: 103, country: 'United States', cities: 35 } ]
    ```
- `findByCousinity(table,data)`: Finds rows ordered by cousins's number.

    **Arguments:**

    *(Same as `findByFecundity`)* But, write `data.cousin` instead of `data.children`.

    ```javascript
    T.findByCousinity('category',{cousin:'film',limit:4}).then(function (categories) {
        console.log(categories);
    });
    // output: [ RowDataPacket { id: 15, name: 'Sports', films: 74 },
    // RowDataPacket { id: 9, name: 'Foreign', films: 73 },
    // RowDataPacket { id: 8, name: 'Family', films: 69 },
    // RowDataPacket { id: 6, name: 'Documentary', films: 68 } ]
    ```

# Datatypes
These are the supported types, any other type can cause errors.
- `integer`: INT *(convertible to DOUBLE automatically)*
- `decimal`: DOUBLE
- `boolean`: BOOL
- `string` : VARCHAR (if length < 256) | TEXT (if length > 255)
- `Date`   : BIGINT (in milliseconds)

# Helpers

## Counting

- `count(table,data)`: Returns the number of rows found.

    **Arguments:**

    table: *[string] --required* The table from which it will count.

    data: *[object]*
    - sql: *[string]* Filter
    - vals: *[array|simple]*  Values that will replace `?` in `sql` property

    ```javascript
    T.count('film',{sql: 'length > ?',vals: 60}).then(function(res) {
        console.log(res);
    });
    // output: 896
    ```

## Executing MySQL

- `exec(sql,vals)`: Allows you to execute any MySql request.

    **Arguments:**

    sql: *[string] --required* SQL code.

    vals: *[array|simple]*  Values that will replace `?` in `sql` property

    ```javascript
    T.exec('SELECT title FROM film WHERE length < ?',47).then(function(res) {
        console.log(res);
    });
    // output: [ RowDataPacket { title: 'ALIEN CENTER' },
    // RowDataPacket { title: 'IRON MOON' },
    // RowDataPacket { title: 'KWAI HOMEWARD' },
    // RowDataPacket { title: 'LABYRINTH LEAGUE' },
    // RowDataPacket { title: 'RIDGEMONT SUBMARINE' } ]
    ```

## Converting to tayrs

- `arrayToTayrs(table,array)`: Transforms an array of simple objects to an array of tayrs.

    **Arguments:**

    table: *[string] --required* The table of the future tayrs.

    array: *[array] --required* The array of object to be transformed.

    ```javascript
        var comments = [
            {text: 'First comment!', postedAt: new Date()},
            {text: 'Stop these stupid comments please!', postedAt: new Date()},
            {text: 'Keep Calm', postedAt: new Date()},
        ];
        console.log(comments[0].table); // output: undefined
        comments = T.arrayToTayrs('comment',comments);
        console.log(comments[0].table); // output: comments
    ```
