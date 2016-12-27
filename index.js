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
var rooms = {};


app.use(express.static(path.join(__dirname, 'public')));

/* Add in if you want to use views or something later, no real need right now
app.get('/', function(req, res) {
	res.sendFile(__dirname + "/public/old.html");
	console.log("request recieved");
}); */

io.on('connection', function(socket) {

	// If user sent a chat message, broadcast it to everyone
	socket.on('chat message', function(msg, user){
		console.log((socket.userName || "Unknown")+ ' - message: ' + msg);
		//socket.broadcast.emit('chat message', msg);
		io.emit('chat message', msg, (socket.userName || "Unknown"));
	});

	// Add the new user to the users object, broadcast to everyone that a new user has joined
	socket.on('add user', function(name){
		user = name || "Empty Name";
		socket.userName = user;
		users[socket.id] = {name: user};
		console.log(user + " was added " + socket.id);
		io.emit('chat message', user + " has joined", "SYSTEM");
		// refresh everyone's list of online users
		console.log("refreshing users");
		io.emit('get users', users);
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