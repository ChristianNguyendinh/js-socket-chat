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
var rooms = {All: {name: "All", users: {}},
			None: {name: "None", users: {}},
			test: {name: "test", users: {}}};


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
		rooms[room].users[socket.id] = {name: user};
		console.log(user + " joining " + rooms[room].name);

		// use create room because created room will add to the list on client side
		socket.emit('created room', room);

		// Display to everyone in the room that this person has joined
		io.in(room).emit('chat room message', {msg: user + " has joined", user: "SYSTEM", room: room});

		// refresh everyone in the room's list of online users
		console.log("refreshing \'" + room + " Room\' users");
		io.in(room).emit('get room users', rooms[room].users, room);
	});

	socket.on('create room', function(room) {
		rooms[room] = {name: room};
		// Check if room exists
		// NEED TO ALSO HAVE USER JOIN ON CREATION
		console.log(room + " room created.");
		socket.emit('created room', room);
		socket.emit('refresh rooms', rooms);
	});

	socket.on('refresh rooms', function() {
		socket.emit('refresh rooms', rooms);
	});

	// Add the new user to the users object, broadcast to everyone that a new user has joined
	socket.on('add user', function(name) {
		user = name || "Empty Name";
		socket.userName = user;
		users[socket.id] = {name: user};
		console.log(user + " was added " + socket.id);

		// Join the default chat room
		socket.join(rooms['All'].name);
		console.log(user + " joining " + rooms['All'].name);
		rooms['All'].users[socket.id] = {name: user};
		socket.emit('refresh rooms', rooms);
		socket.emit('created room', 'All');

		// Display to everyone in the default All chat room that this person has joined
		io.in("All").emit('chat room message', {msg: user + " has joined", user: "SYSTEM", room: "All"});
	
		// refresh everyone in the room's list of online users
		console.log("refreshing \'All Room\' users");
		io.in("All").emit('get room users', rooms['All'].users, "All");
	});

	// If a user is typing, display on everyone ELSES' screen that they are typing
	socket.on('user typing', function(room) {
		socket.broadcast.to(room).emit('user typing', users[socket.id], room);
	});

	socket.on('user stopped typing', function(room) {
		socket.broadcast.to(room).emit('user stopped typing', users[socket.id]);
	});

	// On user disconnect, remove them from the users object, broadcast to everyone that they
	// left, remove any "X is typing..." text
	socket.on('disconnect', function() {
		var name = socket.userName || "unkown";
		console.log(name + " has disconnected");
		
		// broadcast the new user list. Find the rooms the user was in and broadcast to those rooms
		console.log("refreshing users");
		for (let room in rooms) {
			let r = rooms[room];
			if (r.users.hasOwnProperty(socket.id)) {
				// Remove from users list
				delete r.users[socket.id];
				io.in(r.name).emit('get room users', r.users, r.name);
				io.in(r.name).emit('chat room message', {msg: name + " has disconnected", user: "SYSTEM", room: r.name});
			}
		}
		
		// remove message that user is typing
		if (users[socket.id]) 
			socket.broadcast.emit('user stopped typing', users[socket.id]);

		delete users[socket.id];
	});

});

server.listen(port, function() {
	console.log("Server started on port " + port);
});