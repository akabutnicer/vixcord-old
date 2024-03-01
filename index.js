// Setup basic express server
var express = require("express");
var app = express();
var router = express.Router();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;
var fs = require('node:fs');

app.use(express.static("build"));


app.get('*', (req, res) => {
  if (fs.existsSync(__dirname + "/src" + req.url)) return res.sendFile(__dirname + "/src' + req.url);
  return res.sendFile(__dirname + "/build/index.html")
});

var numUsers = 0;
var userNames = [];

io.on("connection", function (socket) {
  console.log("CONNECTED");
  userNames.push({
    name: socket.id,
    joined: new Date().toUTCString(),
  });
  var addedUser = false;
  socket.emit("connected", {
    userNames: userNames,
    numUsers: numUsers,
  });
  socket.on("get users", (data) => {
    data(userNames);
  });
  socket.on("edit message", (data) => {
    console.log(data);
    io.emit("edit message", {
      newElement: data.newNode,
      element: data.oldNode,
    });
  });
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", {
      username: data.username,
    });
  });
  socket.on("stop typing", (data) => {
    socket.broadcast.emit("stop typing", {
      username: data.username,
    });
  });
  // when the client emits 'new message', this listens and executes
  socket.on("new message", function (data) {
    // we tell the client to execute 'new message'
    io.emit("new message", {
      username: socket.id,
      id: socket.id,
      message: data.value,
    });
  });
  socket.on("get id", (data) => {
    data(socket.id);
  });
  // when the client emits 'add user', this listens and executes
  socket.on("add user", function (username) {
    console.log("ADD USER", username);
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit("login", {
      name: username,
      numUsers: numUsers,
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit("user joined", {
      username: socket.username,
      numUsers: numUsers,
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on("typing", function () {
    socket.broadcast.emit("typing", {
      username: socket.username,
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on("stop typing", function () {
    socket.broadcast.emit("stop typing", {
      username: socket.username,
    });
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit("user left", {
        username: socket.username,
        numUsers: numUsers,
      });
    }
  });
});

server.listen(port, function () {
  console.log("Vixcord listening at port %d", port);
});
