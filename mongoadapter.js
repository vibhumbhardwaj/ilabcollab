var model = require('./mongomodel.js');

var newBook;
var newUser;

var getbooks = function (findthis, limit, bc) {
    model.Book.find(findthis).limit(limit).exec(function (err, books) {
        bc(err, books);
    })

}


var getUser = function (findthis, bc) {
    model.User.findOne(findthis, function (err, user) {
        bc(err, user);
    })
}

var getBookDetail = function (findthis, bc) {
    model.Book.findById(findthis, function (err, book) {
        bc(err, book);
    })
}

var getAllUsers = function(bc) {
    model.User.find(function(err, users){
        bc(err, users);
    })
}

var getChatRooms = function(bc) {
    model.ChatRoom.find(function(err, chatRooms){
        bc(err, chatRooms);
    })
}

var createChatRoom = function(chatRoom, bc){
    chatRoom.cards = {
      past : [],
      present : [],
      future: [],
      timestamp: Date.now()
    }
    model.ChatRoom.create(chatRoom, function(err, createdRoom){
        bc(err,createdRoom);
    })
}

var findChatRoom = function (findthis, bc) {
    model.ChatRoom.findOne(findthis, function (err, chatRoom){
        bc(err, chatRoom);
    })
}

var addToFuture = (str, chatRoom, bc) => {
  model.ChatRoom.findOneAndUpdate({'chatRoom': chatRoom}, {$push: {"cards.future": str}, $set: {"cards.timestamp": Date.now()}}, {new: true}, (err, updatedChatRoom) => {
    if(err)
      console.error('[ERROR] Couldn\'t add to future card. was saving this --> ' + str + ' @' + chatRoom);
    else
      console.log('[INFO] Future task added successfully to ' + chatRoom);
    bc(err, updatedChatRoom);
  })
}

var saveChatMessage = (chatRoom, msg, bc) => {
    model.ChatRoom.findOneAndUpdate({'chatRoom': chatRoom}, {$push: {messages: msg}}, (err, updatedChatRoom) =>{
        if(err) 
            console.error('[ERROR] Couldn\'t save message to the database. was saving this --> ' + msg.message + ' @' + chatRoom);
        else
            console.log('message saved successfully.');
        bc(err, updatedChatRoom);
    });
}

var saveUserOnly = function (book, user, bc) {
    model.User.findByIdAndUpdate(user._id, user, function (err, updatedUser) {
        if (err) {
            console.log('[ERROR] Cannot update the User details to database. was saving this--> ' + user);
            bc(err, book, updatedUser);
        }
        else {
            console.log('[INFO] User details got updated to the database.');
            bc(err, book, updatedUser);
        }
    });
}

var saveToDB = function (book, user, bc) {
    console.log('\n\n\n' + book._id + ' \n' + user._id + '\n\n\n\n');

    if (user && !book) {
        saveUserOnly(book, user, bc);
    }
    else if (book)
        model.Book.findByIdAndUpdate(book._id,book, function (err, updatedBook) {
            if (err) {
                console.log('[ERROR] Cannot update the book details to database. was saving this--> ' + book);
                bc(err, updatedBook, user);
            }
            else {
                console.log('[INFO] Book details got updated to the database.');

                if (user) {
                    saveUserOnly(book, user, bc);
                }
                else
                    bc(err, updatedBook, user);
            }
        });

}

module.exports = {
    getBooks: getbooks,
    getUser: getUser,
    getBookDetail: getBookDetail,
    saveToDB: saveToDB,
    getAllUsers: getAllUsers,
    findChatRoom: findChatRoom,
    getChatRooms: getChatRooms,
    createChatRoom: createChatRoom,
    saveChatMessage: saveChatMessage,
    addToFuture: addToFuture
}
