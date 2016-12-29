var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var port = process.env.port || 3000;
var path = require('path');

// Object containing list of users. Each property identified by socket id.
// Every socket id maps to an object, currently only having a name property
var users = {};
// Suppose to be alist of rooms, not implemented yet.
var rooms = {All: {name: "All"},
			None: {name: "None"},
			test: {name: "test"}};


app.use(express.static(path.join(__dirname, 'public')));

/* Add in if you want to use views or something later, no real need right now
app.get('/', function(req, res) {
	res.sendFile(__dirname + "/public/old.html");
	console.log("request recieved");
}); */

io.on('connection', function(socket) {

	socket.on('chat room message', function(msgInfo) {
		console.log(socket.userName + " - message: " + msgInfo.msg + " in room: " + msgInfo.room);
		// validate room here? make sure user is in the room?
		io.in(msgInfo.room).emit('chat room message', {msg: msgInfo.msg, user: (socket.userName || "Unknown"), room: msgInfo.room});
	});

	socket.on('request join room', function(room) {
		user = socket.userName || "Unknown";
		// Check that the room exists and if user already in the room
		socket.join(rooms[room].name);
		// maybe append to list of users here?
		console.log(user + " joining " + rooms[room].name);
		// io.in(room).emit(user joinging or whatever)
		// use create room because created room will add to the list on client side
		socket.emit('created room', room);
	});

	socket.on('create room', function(room) {
		rooms[room] = {name: room};
		// Check if room exists
		console.log(room + " room created.");
		socket.emit('created room', room);
		socket.emit('refresh rooms', rooms);
	});

	socket.on('refresh rooms', function() {
		socket.emit('refresh rooms', rooms);
	});
	


	// If user sent a chat message, broadcast it to everyone
	socket.on('chat message', function(msg) {
		console.log((socket.userName || "Unknown")+ ' - message: ' + msg);
		//socket.broadcast.emit('chat message', msg);
		io.emit('chat message', msg, (socket.userName || "Unknown"));
	});

	// Add the new user to the users object, broadcast to everyone that a new user has joined
	socket.on('add user', function(name) {
		user = name || "Empty Name";
		socket.userName = user;
		users[socket.id] = {name: user};
		console.log(user + " was added " + socket.id);
		io.emit('chat message', user + " has joined", "SYSTEM");
		// refresh everyone's list of online users
		console.log("refreshing users");
		io.emit('get users', users);

		// Join the default chat room
		socket.join(rooms['None'].name);
		console.log(user + " joining " + rooms['None'].name);
	});

	// If a user is typing, display on everyone ELSES' screen that they are typing
	socket.on('user typing', function() {
		socket.broadcast.emit('user typing', users[socket.id]);
	});

	socket.on('user stopped typing', function() {
		socket.broadcast.emit('user stopped typing', users[socket.id]);
	});

	// On user disconnect, remove them from the users object, broadcast to everyone that they
	// left, remove any "X is typing..." text
	socket.on('disconnect', function() {
		var name = socket.userName || "unkown";
		console.log(name + " has disconnected");
		io.emit('chat message', name + " has disconnected", "SYSTEM");
		// broadcast the new user list
		console.log("refreshing users");
		io.emit('get users', users);
		// remove message that user is typing
		if (users[socket.id]) 
			socket.broadcast.emit('user stopped typing', users[socket.id]);

		delete users[socket.id];
	});

});

server.listen(port, function() {
	console.log("Server started on port " + port);
});