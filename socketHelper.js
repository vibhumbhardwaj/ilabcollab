var adapter = require('./mongoadapter.js');
var serviceHelper = require('./serviceHelper.js');

var getChatRoomList = function(chatRooms){
    var roomNames = [];
    chatRooms.forEach(function(room){
        roomNames.push({chatRoom: room.chatRoom, private: room.private});
    })
    return roomNames;
}

var initialiseChatRooms = function () {
    var chatRooms = [];
    adapter.getChatRooms(function (err, chatRoomsDB){
        if(!err)
            chatRoomsDB.forEach(function (room) {
                room = room._doc;
                chatRooms.push({ chatRoom: room.chatRoom, messages: room.messages, showPrevious: room.showPrevious, private: room.private, past: room.past, future: room.future, present: room.present });
            }, this);
    });

    return chatRooms;
}

var isAllowed = function(allowedRooms, chatRoom){
    if(getRoomIndex(allowedRooms, chatRoom) >=0)
        return true;
    else
        return false;
}

var getRoomIndex = function(chatRooms, chatRoom){
    return  chatRooms.findIndex(function(x){
        return x.chatRoom == chatRoom;
    });
    
}

var getChatRoom = function(chatRoom, bc) {
    adapter.findChatRoom({'chatRoom': chatRoom}, function(err, chatRoom){
        return bc(err, chatRoom);
    })
}

var verifyToken = function(encryptedToken, chatRoom){
    token = serviceHelper.parseJwt(encryptedToken);
    if(token){
        return getRoomIndex(token.allowedRooms, chatRoom)
    }
    return;
}

var saveMessageToDB = (msg, chatRoom) => {
    adapter.saveChatMessage(chatRoom, msg, (err, chatRoom) =>{
        if(!err) console.log('[INFO] ALL good man. Database updated.');
        else console.error('[ERROR] shit happened while updating db with new messages -->' + error.toString());
    })
}

module.exports = {
    initialiseChatRooms: initialiseChatRooms,
    getChatRoom: getChatRoom,
    getRoomIndex: getRoomIndex,
    isAllowed: isAllowed,
    getChatRoomList: getChatRoomList,
    createBackup: saveMessageToDB
}