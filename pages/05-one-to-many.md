# One to many (Parent & Children)
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
