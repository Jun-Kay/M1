var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var path    = require('path');

app.use(express.static(path.join(__dirname,"public")));

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log("server on!: http://localhost:3000/");
});

var SETTINGS = require("./2d pingpong/SETTINGS.js");

var lobbyManager = new (require('./2d pingpong/LobbyManager.js'))(io);
var roomManager = new (require('./2d pingpong/RoomManager.js'))(io);
var gameManager = new (require('./2d pingpong/GameManager.js'))(io, roomManager);

io.on('connection', function(socket){
  console.log('user connected: ', socket.id);
  io.to(socket.id).emit('connected', SETTINGS.CLIENT_SETTINGS);
  socket.broadcast.emit('new user entered');
  io.emit('total user count updated', socket.server.eio.clientsCount);

  socket.on('waiting', function(){
    lobbyManager.push(socket);
    lobbyManager.dispatch(roomManager);
  });
  socket.on('disconnect', function(){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.destroy(roomIndex);
    lobbyManager.kick(socket);
    console.log('user disconnected: ', socket.id);
    io.emit('total user count updated', socket.server.eio.clientsCount);
  });
  socket.on('keydown', function(keyCode){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.rooms[roomIndex].objects[socket.id].keypress[keyCode] = true;
  });
  socket.on('ready', function(){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.rooms[roomIndex].objects[socket.id].ready = true;
  });
  socket.on('keyup', function(keyCode){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) delete roomManager.rooms[roomIndex].objects[socket.id].keypress[keyCode];
  });
  socket.on('click', function(x,y){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.rooms[roomIndex].objects[socket.id].mouse.click={x:x,y:y};
  });
});
