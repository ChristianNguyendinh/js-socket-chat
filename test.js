var net = require('net'); 
var path = require('path');
var express = require('express');
var app = express();
var SOCKET_HOST = '127.0.0.1'; 
var SOCKET_PORT = 6969; // TCP LISTEN port 

var func = null;

// Create an instance of the Server and waits for a connection 
net.createServer(function(sock) { 

	// Receives a connection - a socket object is associated to the connection automatically 
	console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort); 

	// Add a 'data' - "event handler" in this socket instance 
	sock.on('data', function(data) { 
		// data was received in the socket // Writes the received message back to the socket (echo) 
		// {"type":"Buffer","data":[109,101,115,115,97,103,101,49,50,51,10]}
		console.log(JSON.stringify(data));
		sock.write(data); 
	}); 

	// Add a 'close' - "event handler" in this socket instance 
	sock.on('close', function(data) { // closed connection 
		console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort); 
	}); 

	func = function() {
		sock.write(new Buffer([110,101,115,115,97,103,101,49,50,51,10]))
	}
}).listen(SOCKET_PORT, SOCKET_HOST); 

console.log('Server listening on ' + SOCKET_HOST +':'+ SOCKET_PORT);

app.get('/', (req, res) => {
	//func();
	console.log("asdf")
	res.sendFile(path.join(__dirname, 'public/test.html'));
});

app.listen(3000, function() {
	console.log("Server started on port " + 3000);
});

