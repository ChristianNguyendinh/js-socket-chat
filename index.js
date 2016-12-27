var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var port = process.env.port || 3000;
var path = require('path');

var users = {};
var rooms = {};


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	res.sendFile(__dirname + "/public/old.html");
	console.log("request recieved");
});

io.on('connection', function(socket) {
	socket.on('chat message', function(msg, user){
		console.log((socket.userName || "Unknown")+ ' - message: ' + msg);
		//socket.broadcast.emit('chat message', msg);
		io.emit('chat message', msg, (socket.userName || "Unknown"));
	});
	socket.on('add user', function(name){
		user = name || "Empty Name";
		socket.userName = user;
		users[socket.id] = {name: user};
		console.log(user + " was added " + socket.id);
		io.emit('chat message', user + " has joined", "SYSTEM");
		// broadcast the new user list
		console.log("refreshing users");
		io.emit('get users', users);
	});
	socket.on('user typing', function() {
		socket.broadcast.emit('user typing', users[socket.id]);
	});
	socket.on('user stopped typing', function() {
		socket.broadcast.emit('user stopped typing', users[socket.id]);
	});
	socket.on('disconnect', function() {
		var name = socket.userName || "unkown";
		delete users[socket.id];
		console.log(name + " has disconnected");
		io.emit('chat message', name + " has disconnected", "SYSTEM");
		// broadcast the new user list
		console.log("refreshing users");
		io.emit('get users', users);
		// remove message that user is typing
		socket.broadcast.emit('user stopped typing', users[socket.id]);
	});
});

server.listen(port, function() {
	console.log("Server started on port " + port);
});