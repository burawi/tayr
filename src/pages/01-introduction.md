Tayr is an easy on-the-fly MySql ORM for NodeJs developers. No configuration is needed, the schema is made automatically which let you focus on the code without carrying on models, migrations and all that kind of stuff.

# Usage Example

```javascript
var nest = require('Tayr');
var T = new nest({
    host: 'hostname',
    user: 'username',
    password: 'password',
    database: 'databaseName'
});

var user = new T.tayr('user',{
    name: 'Muhamad',
    age: 63,
    registeredAt: new Date()
});

user.store().then(function(){
    console.log(user);
});
//output: { name: 'Muhamad', age: '63', registeredAt: 1467137605631, id: 6 }
```

# Getting Started
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
