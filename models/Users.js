var express = require('express');
var orm = require('orm');
var app = express();
app.use(orm.express("mysql://root:@localhost/hardik", {
    define: function (db, models, next) {
        models.users = db.define("users", {
            email      : String,
            firstname  : String,
            lastname   : String,
            password   : String,
        }, {
            methods: {
                fullName: function () {
                    return this.firstname + ' ' + this.lastname;
                }
            }
        });
        next();
    }
}));