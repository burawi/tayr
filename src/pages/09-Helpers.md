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
