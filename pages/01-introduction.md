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
