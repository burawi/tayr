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
