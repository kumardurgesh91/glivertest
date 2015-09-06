var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var orm = require('orm');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(orm.express("mysql://root:@localhost/glivertest", {
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

app.get('/', function(req, res){
  res.sendFile(__dirname + '/views/index.html');
});
app.get('/signup', function(req, res){
  res.sendFile(__dirname + '/views/signup.html');
});

app.post('/user/login', function(req, res){
  var email = req.body.email;
  var password = req.body.password;
  if(email && password) {
    req.models.users.find({email:email, password:password}, function (err, user) {
      if(err || !user) { console.log(err);
        res.sendFile(__dirname + '/views/index.html');
      } else {
        res.sendFile(__dirname + '/views/home.html');
      }
    })
  } else {
    res.sendFile(__dirname + '/views/index.html');
  }
});

app.post('/user/create', function(req, res){
  var email = req.body.email;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var password = req.body.password;

  req.models.users.create({
    email      : email,
    firstname  : firstname,
    lastname   : lastname,
    password   : password,
  }, function (err, items) {
    if(err) {
      console.log(err);
      res.sendFile(__dirname + '/views/signup.html');
    }
    else {
      console.log(items);
      res.sendFile(__dirname + '/views/index.html')
    }
  });

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
