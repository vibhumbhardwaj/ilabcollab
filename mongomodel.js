var mongoose = require('mongoose');
var config = require('./config.js');

mongoose.connect(config.connectionString);
var db = mongoose.connection;

db.addListener('error',function(err){
    console.error('[ERROR]\n' + err);
    console.error('[ERROR] shit happened at Database Level');
    //console.log(err);
});

db.on('open',function(){
    console.log('[STARTUP]Database\'s up. We\'re up buddy.');
});
var Schema = mongoose.Schema;

var inlineBookSchema = new Schema({
    bookName: String,
    bookId: String
});

var inlineUserSchema = new Schema({
    userId: String,
    userName: String
})

var bookVotingSchema = new Schema({
    bookId: String,
    bookName: String,
    upvote: Boolean
})

var schemaForUsers = new Schema({
    name: String,
    username: {type: String, unique: true},
    password: String,
    books_he_has: [inlineBookSchema],
    books_he_voted: [bookVotingSchema],
    admin: Boolean
});

var schemaForBooks = new Schema({
    book: String,
    author: String,
    who_has_this: inlineUserSchema,
    points: Number,
    upvoted_by_users: [inlineUserSchema],
    downvoted_by_users: [inlineUserSchema]
});

var schemaForChatRooms = new Schema({
    chatRoom: {type: String, unique: true},
    password: String,
    private: Boolean,
    allowedUsers: [inlineUserSchema],
    showPrevious: Boolean,
    currentUsers: [],
    messages: []
})

var ChatRoom = mongoose.model('ChatRoom', schemaForChatRooms);
var Book = mongoose.model('Book', schemaForBooks);
var User = mongoose.model('User', schemaForUsers);

module.exports = {
    User: User,
    Book: Book,
    ChatRoom: ChatRoom
};
