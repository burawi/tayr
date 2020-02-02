# Many to many (Cousins)

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
