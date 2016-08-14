# Create & Update
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

## Store/Update
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
