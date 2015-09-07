var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var orm = require('orm');


var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(session({secret: 'ssshhhhh'}));
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
  if(req.session.user) {
    res.sendFile(__dirname + '/views/home.html');
  } else {
    res.sendFile(__dirname + '/views/index.html');
  }
});
app.get('/signup', function(req, res){
  if(req.session.user) {
    res.sendFile(__dirname + '/views/home.html');
  } else {
    res.sendFile(__dirname + '/views/signup.html');
  }
});

//login user
app.post('/user/login', function(req, res){
  var email = req.body.email;
  var password = req.body.password;
  if(email && password) {
    req.models.users.find({email:email, password:password}, 1, function (err, user) {
      if(err || !user) { 
        console.log(err);
        res.sendFile(__dirname + '/views/index.html');
      } else {
        //creating session
        req.session.user = user[0];
        res.sendFile(__dirname + '/views/home.html');
      }
    })
  } else {
    res.sendFile(__dirname + '/views/index.html');
  }
});

//create user
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
      res.sendFile(__dirname + '/views/index.html')
    }
  });
});

app.get('/user/get', function(req, res){
  res.send({
    firstname:req.session.user.firstname,
    lastname:req.session.user.lastname,
    email:req.session.user.email,
  });
});

//wild card get routing
app.get('/*', function(req, res){
  if(req.session.user) {
    res.sendFile(__dirname + '/views/home.html');
  } else {
    res.sendFile(__dirname + '/views/index.html');
  }
});
//wild card post routing
app.post('/*', function(req, res){
  if(req.session.user) {
    res.sendFile(__dirname + '/views/home.html');
  } else {
    res.sendFile(__dirname + '/views/index.html');
  }
});

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function(socket){
  var addedUser = false;
  socket.on('chat message', function(msg){
    console.log(msg);
    io.emit('chat message', msg);
  });
  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    console.log(username, "username");
    addedUser = true;
    // echo globally (all clients) that a person has connected
    io.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
      onlineUsers: usernames
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
        onlineUsers: usernames
      });
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


http.listen(3000, function(){
  console.log('listening on *:3000');
});


module.exports = app;
