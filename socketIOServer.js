var socketAuth = require('socketio-jwt-auth');
var config = require('./config.js');
var socketHelper = require('./socketHelper.js');

var chatRooms = socketHelper.initialiseChatRooms();
module.exports = function (server) {
    var io = require('socket.io')(server);
    var chatIO = io.of('chat');
    var authIO = io.of('chatAuthorisation');

    authIO.on('connection', function (socket) {

        socket.on('findAvailability', function (chatRoom) {
            console.log('[INFO] finding availability of room --> ' + chatRoom);
            var index;
            var match = chatRoom.match(config.searchQueryRegex)
            if ( match && match.length == 1)
                index = chatRooms.findIndex(function (ele) {
                    return ele.chatRoom == chatRoom;
                });
            if (index < 0)
                socket.emit('availabilityResult', true);
            else
                socket.emit('availabilityResult', false);
            console.log('[INFO] index found as: ' + index + ' <-- undefined means not allowed | 0 is good');
        })

        socket.on('new room', function (chatRoom) {
            console.log('[INFO] Chatroom is just its name. right? And not the whole object --> ' + chatRoom); // yea.
            chatRoom = chatRoom.toLowerCase();
            socketHelper.getChatRoom(chatRoom, function (err, room) {
                if (!err && room) {
                    chatRoom = room._doc;
                    var index = socketHelper.getRoomIndex(chatRooms, chatRoom);
                    if (index < 0) {
                        chatRooms.push(chatRoom);
                        socket.emit('room added');
                    }
                    else {
                        socket.emit('unauthorised', 'Done already!! Have some chill. Go login to room or something');
                    }
                }
                else {
                    console.error('[ERROR] Inconsistency with Database found. Chatroom not added to database successfully.');
                    socket.emit('unauthorised', 'Something\'s not right.');
                }
            })
        });

        socket.on('getAllRooms', function () {
            console.log('[INFO] getting chatroom\'s list...');
            socket.emit('roomsList', socketHelper.getChatRoomList(chatRooms));
        })
    })

    chatIO.use(socketAuth.authenticate({
        secret: config.secretKey,
        algorithm: 'HS256'
    }, function (payload, done) {
        done(null, payload.allowedRooms);
    }));

    /*, function (payload, next){
            console.log(payload);
            next(null, true);
        })*/

    chatIO.on('connection', function (socket) {

        var chatRoom = socket.handshake.query['chatRoom'].toLowerCase();
        var allowedRooms = socket.request.user;
        var globalRoomIndex, userName;
        var localRoomIndex = socketHelper.getRoomIndex(allowedRooms, chatRoom);
        // saving for later getting userName from secure channel 

        if (localRoomIndex >= 0) {
            globalRoomIndex = socketHelper.getRoomIndex(chatRooms, chatRoom);
            /*
            var allowedIndex = 
            userName = 
            Batman - Hey where's username? Pull that out from token.
            Gordon - Fair enough, but I strongly believe that the client will give that to us later.
            Batman - Clients!. Can they be trusted?
            Gordon - Hm. I know where you're going but....
            *Batman has left alreay.
            Gordon - Oh man, he's gone again. I'm such a fool.

            */
            userName = allowedRooms[localRoomIndex].userName;
            socket.join(chatRoom);
            if (chatRooms[globalRoomIndex].showPrevious)
                socket.emit('previousMessages', chatRooms[globalRoomIndex].messages);

        }
        else {
            console.log('catch me');
            socket.emit('unauthorised', '<h1>Uh Oh. Wrong Room I suppose.</h1><br>N.B. You can always access public chat by clicking here: <a href="/ilabcollab/chat" class="w3-button vb-btn">here.</a>');
            socket.disconnect(true);
        }

      
        console.log(userName + '............................im in here.......................' + chatRoom);

        // socket.on('newlyAdded', function (chatRoom) {
        //     var index = socketHelper.getRoomIndex(allowedRooms, chatRoom); // will give username if authorised
        //     if (index>=0) {
        //         console.log('new addition to the room.');
        //         socket.emit('reconnect', chatRooms);
        //     }
        //     else
        //         socket.emit('unauthorised', '<h1>Uh Oh. Wrong Room I suppose.</h1><br>N.B. If you\'re looking for public room, request access from here: <a href="/ilabcollab/chat">here.</a>');
        // });
        socket.on('pastUpdate', (str) => { //done task
            // delete it from present array and push to past array!! give out pastupdate to clients too. they'll delete from present themselves.
            
        })
        socket.on('needCardsUpdate', () =>{
          "use strict";
          let cards = chatRooms[globalRoomIndex].cards;
          socket.emit('getCardsUpdate', cards);
        })
        
        socket.on('futureUpdate', (str) => { //new task
            // add it to future array.
            chatRooms[globalRoomIndex].cards.future.push(str);
            socketHelper.setCardTimeStamp(chatRooms[globalRoomIndex]);
            socketHelper.addToFuture(str, chatRoom);
            socket.broadcast.to(chatRoom).emit('futureUpdate', str);
        })
        socket.on('presentUpdate', (str) => { //working task
            // delete it from future array and push to present array!! give out presentupdate to clients too.
        })
        
      
        socket.on('chat message', function (msg) {
            var index = socketHelper.getRoomIndex(allowedRooms, msg.chatRoom);
            if (index == localRoomIndex && msg.userName == userName) {
                var chatRoom = msg.chatRoom;
                msg.timestamp = Date.now();
                console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> time is ' + new Date(msg.timestamp).toUTCString());
                console.log('................saving message supposedly........................\n' + msg.userName + '@ ' + chatRoom + ' - ' + msg.message + '\n');
                socketHelper.createBackup(msg, chatRoom);

                chatRooms[globalRoomIndex].messages.push(msg);
                socket.broadcast.to(chatRoom).emit('newMessage', msg);
                console.log('updated messages sent to the client.');
            }
            else
                socket.emit('unauthorised', '<h1>Something\s not right.</h1><br>Wow. Were you trying to hack or something? Shame on you mate.');
        });

    });

    return io;
}