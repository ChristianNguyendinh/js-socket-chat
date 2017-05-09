/*
JS socket and event handlers that will provide the functionality for the chat application.
Modifies the DOM a lot. Probably shouldve used react.
*/

///////////////////////////////////////////////////////////////////////////////
// Global Variable Declarations ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Div where the users in a particular room will be appended
var udiv = document.getElementById('userList');
// Div where the room list will be
var rdiv = document.getElementById('roomList');
// Div that shows <user> is typing...
var typingDiv = document.getElementById('typingDiv');
// Displays the actual chat messages for a particular room
var displayDiv = document.getElementById('display');
// Displays the tabs of each room the user is currently in
var tabList = document.getElementById('tab');
// Pop out modal for room creation
var modal = document.getElementById('roomModal');
// Message input box
var msg = document.getElementById('m');
// Room name input box
var rn = document.getElementById('rName');
// Currently selected chat room
var activeRoom = "All-room";

var socket = io();
// Whether the socket is currently typing something
socket.isTyping = false;

///////////////////////////////////////////////////////////////////////////////
// Event Handlers /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Log the user in with a user name
document.getElementById('loginForm').onsubmit = function(e) {
	let name = document.getElementById('nameInput');
	if (name.value == "") 
		return false;

	document.getElementById('login').hidden = true;
	document.getElementById('content').hidden = false;

	// Emit events of new user
	socket.emit('add user', name.value);
	name.value = '';

	e.preventDefault();
};
// Send the user's message to everyone else
document.getElementById('chatForm').onsubmit = function(e) {
	if (msg.value == "") 
		return false;

	socket.emit('chat room message', {msg: msg.value, room: activeRoom.split("-")[0]});
	msg.value = '';
	socket.isTyping = false;
	socket.emit('user stopped typing', activeRoom.split("-")[0]);

	e.preventDefault();
};
// Create the new chat room
roomForm.onsubmit = function(e) {
	if (rn.value == "") 
		return false;

	socket.emit('create room', rn.value);
	rn.value = '';
	modal.style.display = "none";

	e.preventDefault();
};
// Display if the user is typing or not to everyone else
msg.oninput = function(e) {
	if(e.target.value == "") {
		socket.isTyping = false;
		socket.emit('user stopped typing', activeRoom.split("-")[0]);
	}
	else if (!(socket.isTyping)){
		socket.isTyping = true;
		socket.emit('user typing', activeRoom.split("-")[0]);
	}
};
// Open the form to create a room
document.getElementById('createRoom').onclick = function(e) {
	// Display the modal with the room create form
	modal.style.display = "block"
};
// Refresh the list of rooms
document.getElementById('refreshRooms').onclick = function(e) {
	socket.emit('refresh rooms')
};
// Close the modal when you click outside the box
window.onclick = function(e) {
	if (e.target == modal)
		modal.style.display = "none";
};

///////////////////////////////////////////////////////////////////////////////
// Helper Functions ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Switch to a room. There is most def a better way of doing this :/
function joinRoom(room) {
	// Hide all the other rooms' chat messages and show the selected room's
	let newRoom = document.getElementById(room + "-room");
	let chatRoomList = document.getElementsByClassName("chatBox");
	for (let room of chatRoomList) {
		room.style.display = "none";
	}
	newRoom.style.display = "block";
	
	// Revert background color of old active room tab and update new one
	document.getElementById(activeRoom.split("-")[0] + "-tab").style.backgroundColor = "#f9f9f9";
	activeRoom = room + "-room";
	document.getElementById(room + "-tab").style.backgroundColor = "#dee1e1";

	// Hide all the other rooms' users list and show the selected room's
	let newUser = document.getElementById(room + "-users");
	let userList = document.getElementsByClassName("userElement");
	for (let user of userList) {
		user.style.display = "none";
	}
	newUser.style.display = "block";

	// Hide all the other rooms' typing divs and show the selected room's
	let newTyping = document.getElementById(room + "-typing");
	let typingList = document.getElementsByClassName("typingElement");
	for (let typing of typingList) {
		typing.style.display = "none";
	}
	newTyping.style.display = "block";
}

// Remove "X is typing..." from YOUR screen.
function removeTyping(userName) {
	let typingText = document.getElementById(userName + "_typing");
	if (typingText != null) {
		typingText.parentNode.removeChild(typingText);
	}
}

///////////////////////////////////////////////////////////////////////////////
// Socket Handler /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Send a chat message to all other users in a room
socket.on('chat room message', function(msgInfo) {
	let mBox = document.getElementById(msgInfo.room + "-room");
	let newText = document.createElement('p');
	newText.innerHTML = msgInfo.user + ": " + msgInfo.msg;
	mBox.appendChild(newText);
});
// Recieved when you created a room and/or when request to join a room granted
socket.on('created room', function(room) {
	let newRoom;
	// Create the required DOM nodes
	if (document.getElementById(room + '-room') == null) {
		// Div to show chat messages
		newRoom = document.createElement('div');
		newRoom.id = room + "-room";
		newRoom.className = "chatBox"
		displayDiv.appendChild(newRoom);

		// Tab to switch to room
		let newTab = document.createElement('li');
		newTab.id = room + "-tab";
		newTab.className = "tabElement";
		newTab.innerHTML = room;
		tabList.appendChild(newTab);
		newTab.onclick = function(e) {
			joinRoom(e.target.id.split("-")[0]);
		};

		// List of users for the room
		let uList = document.createElement('div');
		uList.id = room + "-users";
		uList.className = "userElement";
		udiv.appendChild(uList);

		// <user> is typing for the room
		let typing = document.createElement('div');
		typing.id = room + "-typing";
		typing.className = "typingElement";
		typingDiv.appendChild(typing);

		// Switch the 'join' button for the room to a 'leave' button
		let join = document.getElementById(room + '-join');
		join.innerHTML = "leave";
		join.onclick = function(e) {
			socket.emit('leave room', e.target.id.split("-")[0]);
		}
	}
	// Switch to the room
	joinRoom(room);
});
// Refresh the room list
socket.on('refresh rooms', function(rooms) {
	// Get a list of the rooms currently joined
	let listRooms = document.getElementsByClassName('tabElement');
	let joinedRooms = [];
	for (let i = 0; i < listRooms.length; i++) {
		joinedRooms.push(listRooms[i].id.split("-")[0]);
	}
	// Clear the roomlist and repopulate the DOM nodes
	rdiv.innerHTML = "";
	for (let room in rooms) {
		let div = document.createElement('div');
		let name = document.createElement('p');
		let button = document.createElement('button');
		name.innerHTML = rooms[room].name;
		name.style.display = "inline-block";
		button.id = room + "-join"

		// Functionality of the button changes whether user is currently in the room or not
		let inRoom = joinedRooms.includes(room) ? true : false;
		if (inRoom) {
			button.innerHTML = "leave";
			button.onclick = function(e) {
				socket.emit('leave room', e.target.id.split("-")[0]);
			}
		} 
		else {
			button.innerHTML = "join";
			button.onclick = function(e) {
				socket.emit('request join room', e.target.id.split("-")[0]);
			}
		}

		div.appendChild(name);
		div.appendChild(button);
		rdiv.appendChild(div);
	}
});
// Refresh the users in the current room
socket.on('get room users', function(users, room) {
	// Users should only get this if they joined the room, so this should exist
	let uList = document.getElementById(room + '-users');
	uList.innerHTML = "";
	for (let id in users) {
		let user = document.createElement('p');
		user.innerHTML = users[id].name;
		uList.appendChild(user);
	}
});
// Display that a user is typing
socket.on('user typing', function(user, room) {
	let tdiv = document.getElementById(room + "-typing");
	let newDiv = document.createElement("div");
	newDiv.innerHTML = (user.name || "Unknown") + " is typing..."
	newDiv.style.display = "inline-block";
	newDiv.id = (user.name || "Unknown") + "_typing"
	tdiv.appendChild(newDiv);
});
// Remove notification that a user is typing
socket.on('user stopped typing', function(user) {
	// Theoretically, you can only be typing in one room at a time, so just remove 
	// the div with the username id
	removeTyping(user.name);
});	
// If a user leaves a room, remove the DOM nodes and send a message that the user 
// has left to the other users in the room
socket.on('left room', function(room) {
	let newRoom = document.getElementById(room + "-room");
	newRoom.parentNode.removeChild(newRoom);

	let newTab = document.getElementById(room + "-tab");
	newTab.parentNode.removeChild(newTab);

	let uList = document.getElementById(room + "-users");
	uList.parentNode.removeChild(uList);

	let typing = document.getElementById(room + "-typing");
	typing.parentNode.removeChild(typing);

	let join = document.getElementById(room + '-join');
	join.innerHTML = "join";
	join.onclick = function(e) {
		socket.emit('request join room', e.target.id.split("-")[0]);
	}
	// Change active room to the default ALL room.
	// TODO: make all room not leavable...
	activeRoom = "All-room";
});	