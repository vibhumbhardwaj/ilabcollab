var adapter = require('./mongoadapter.js');
var atob = require('atob');

var mapUserToBooks = function (books, user) {
    books.forEach(function (book) {
        book = mapUserToBook(book, user);
    });
    return books;
}

var parseJwt = function (token) {
    if(!token)
        return;
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(atob(base64));
};

var addChatRoomForToken = function (token, chatRoom, userName) {
    var chatRooms;
    if (token)
        chatRooms = parseJwt(token).allowedRooms;
    else
        chatRooms = [];

    index = chatRooms.findIndex(function (ele) {
        return ele.chatRoom == chatRoom;
    });

    if ( index < 0 ) {
        chatRooms.push({chatRoom: chatRoom, userName: userName});
    }

    return chatRooms;

}

var isChatAllowed = function (user, chatRoom, password) {
    if (chatRoom.private){ 
        userPresent = chatRoom.allowedUsers.findIndex(function (ele) {
            return user._id == ele.userId;
        });
        if (userPresent == -1) {
            return false;
        }
    }
    return true;
}


var getIssueStatusForBooks = function (books) {
    books.forEach(function (book) {
        book = getIssueStatusForBook(book);
    });
    return book;
}

var getIssueStatusForBook = function (book) {
    if (book._doc.who_has_this[0])
        book._doc.issued = true;
    else
        book._doc.issued = false;
    return book;
}

var mapUserToBook = function (book, user) {
    var upvoteStatus = 0;
    if (book._doc.who_has_this) {
        book._doc.issued = true;
        book._doc.issuedTo = book.who_has_this.userName;
        if (user && (book._doc.who_has_this.userId == user._id))
            book._doc.issuedToCurrentUser = true;
        else
            book._doc.issuedToCurrentUser = false;
    }
    else
        book._doc.issued = false;
    if (user) {
        upvoteStatus = getUpVoteStatus(book, user);
    }

    console.log('[INFO] Got this upvoteStatus--> ' + upvoteStatus + ' <--for book-->' + book.book + ' -- ' + book._id);
    book._doc.upvoteStatus = upvoteStatus;
    console.log('[INFO]. Book generated: \n' + book);
    return book;
}
/*
var user = {
    _id: 'vbid',
    name: 'Vibhum',
    username: 'vibhum@hotmail.com',
    password: 'thisispass',
    books_he_has: [],
    books_he_voted: [{bookId: 'id_of_angels_demons', bookName: 'Angels', upVote : false}, {bookId: 'id_of_angels_blabla', bookName: 'Angels', upVote : false}],
    admin: true
}


var book = {
    _id: 'id_of_angels_demons',
    book: 'Angels',
    author: 'Dan brown',
    who_has_this: {},
    points: 5,
    upvoted_by_users: [{userName: 'Vibhum', userId: 'vbid'}],
    downvoted_by_users: []
}

*/

var getPointsAfterDownvote = function (book) {
    var points = book.points;
    if (points > 0) {
        points--;
    }
    return points;
}


var getUpVoteStatus = function (book, user) {
    console.log('Getting upvote status for user: ' + user.name);
    var returnval = 0;
    user.books_he_voted.forEach(function (bookFromUser) {
        console.log('\n\n\n\n' + book._doc._id + '\n\n\n' + bookFromUser.bookId);
        if (book._doc._id == bookFromUser.bookId) {
            if (bookFromUser.upvote)
                returnval = 1;
            else
                returnval = -1;
        }
    });
    return returnval;
}

var getUserAfterReturn = function (user, bookId) {
    bookToReturn = user.books_he_has.findIndex(function (ele) {
        return bookId == ele.bookId;
    })
    user.books_he_has.splice(bookToReturn, 1);

    return user;
}

var updateUserSession = function (req, userId) {
    adapter.getUser({ _id: userId }, function (err, updatedUser) {
        if (err) {
            handleUpvoteError(err);
            return;
        }
        //saving updated User to the session for later use.
        req.session.user = updatedUser;

        //Why haven't I removed this code already?
        if (req.session.user.books_he_has[0]) //null pointer if last is returned. fixed.
            console.log('\n\n\n\n**********************\n' + req.session.user.books_he_has[0].bookName + '\n****************************\n\n\n')
        req.session.save();
    });
}

var sendUnAuthorisedResponse = function(res, message) {
    if (!message)
        message = 'I don\'t like your intentions mate. I\'m not sending you any data.';
    res.json({ success: false, message: message, data: null });
    //res.end();
}

module.exports = {
    mapUserToBooks: mapUserToBooks,
    mapUserToBook: mapUserToBook,
    getUpVoteStatus: getUpVoteStatus,
    updateUserSession: updateUserSession,
    getUserAfterReturn: getUserAfterReturn,
    getIssueStatusForBooks: getIssueStatusForBooks,
    isChatAllowed: isChatAllowed,
    addChatRoomForToken: addChatRoomForToken,
    parseJwt: parseJwt,
    sendUnAuthorisedResponse: sendUnAuthorisedResponse
}