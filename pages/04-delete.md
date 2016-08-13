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
