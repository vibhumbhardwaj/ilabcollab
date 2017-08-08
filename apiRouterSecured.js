var config = require('./config.js');
var jwt = require('jsonwebtoken');
var express = require('express');
var router = express.Router();
var adapter = require('./mongoadapter');
var serviceHelper = require('./serviceHelper.js');

var loggedInUser;

router.use(function (req, res, next) {
    loggedInUser = req.session.user;
    if (loggedInUser) {
        //next(); // JWT BYPASS. Also, you'll need to comment the rest of the stuff below for it to work.

        if (!req.cookies) {
            console.log('cookies not found.');
            res.json({ sorry: true, regret: false });
            return;

        }
        var tokenFromCookies = req.cookies.Authorization;
        console.log('[INFO]@SECURED ' + req.sessionID + ' @ time: ' + new Date().toLocaleTimeString() + ' accessed this page:  ' + req.method + ' --> ' + req.url.toString());
        console.log('[INFO] Validating Token: ' + tokenFromCookies);
        jwt.verify(tokenFromCookies, config.secretKey, function (err, decodedToken) {
            if (err) {
                console.log('[ERROR] Could not decode token. Token: ' + tokenFromCookies);
                res.json({ success: false, message: 'token can\'t be verified, sorry.' });
            }
            else {
                console.log('[INFO] The User: ' + decodedToken);
                if (decodedToken.userId != loggedInUser._id) {
                    console.log('[ERROR] Token Compromised. Team, Fall Back.');
                    res.json({ success: false, message: 'token can\'t be verified, sorry.' });
                }
                else {
                    console.log('[INFO] User Verified. Can do the secure journey.');
                    next();
                }
            }
        });
    }
    else {
        console.log('[ERROR] User not found in session');
        res.json({ success: false, message: 'User not signed in on server' });
    }
});

router.post('/authoriseChatAccess', function (req, res) {
    var chatRoom = req.body.chatRoom;
    var password = req.body.password;
    var token = req.body.token;
    //hashing the password goes here.
    if (chatRoom && password) {
        adapter.findChatRoom({ chatRoom: chatRoom }, function (err, chatRoomObject) {
            if (chatRoomObject && !(chatRoomObject._doc.password && chatRoomObject._doc.password != password)) {
                if (!err && serviceHelper.isChatAllowed(loggedInUser, chatRoomObject._doc)) {
                    var chatRooms = serviceHelper.addChatRoom(token, chatRoom, loggedInUser.name);
                    token = jwt.sign({ allowedRooms: chatRooms }, config.secretKey, { expiresIn: 1440 * 60 });
                }
                else {
                    serviceHelper.sendUnAuthorisedResponse(res, 'You cannot proceed further.');
                }
            }
            else{
                serviceHelper.sendUnAuthorisedResponse(res, 'Chatroom/Password combination wrong');
            }
        })

    }
});


router.all('/iLikeThis', function (req, res) {
    res.json({ success: true, message: 'token verified, thats good ' + req.userFromToken });
});

router.get('/getProspectList', function (req, res) {

    if (loggedInUser.admin) {
        adapter.getAllUsers(function (err, users) {
            if (!err) {
                var prospectList = [];
                users.forEach(function (element) {
                    prospectList.push({ userId: element._doc._id, userName: element._doc.name });
                }, this);
                res.json({ success: true, prospectList: prospectList });
            }
            else
                res.json({ success: false });
        });
    }
    else
        res.json({ success: false });

})

router.post('/returnTheBook', function (req, res) {
    var bookId = req.body.bookId;
    var userId;
    if (bookId.match(config.mongoIdRegex).length == 1) {
        adapter.getBookDetail(bookId, function (err, book) {
            if (!err && book._doc.who_has_this) {
                userId = book._doc.who_has_this.userId;
                adapter.getUser({ '_id': userId }, function (err, user) {
                    if (!err && user.books_he_has[0] && (userId == loggedInUser._id || loggedInUser.admin)) {
                        user = serviceHelper.getUserAfterReturn(user, bookId);
                        book.who_has_this = null;
                        adapter.saveToDB(book, user, function (err, book, user) {
                            if (!err) {
                                serviceHelper.updateUserSession(req, userId);
                                res.json({ success: true, message: 'Book Returned successfully', user: req.session.user });
                            }
                            else
                                serviceHelper.sendUnAuthorisedResponse(res, 'Contact Customer Support, or not.')

                        });
                    }
                    else
                        serviceHelper.sendUnAuthorisedResponse(res, 'Problem with user provided');
                })
            }
            else
                serviceHelper.sendUnAuthorisedResponse(res, 'Problem with Book Provided');
        })
    }
    else
        serviceHelper.sendUnAuthorisedResponse(res);
});

router.post('/issueTheBook', function (req, res) {
    /*  if (!req.session.user)
          req.session.user = {
              "_id": "595ccc348e5f634a1443a704",
              "name": "Vibhum",
              "username": "a@a.com",
              "password": "123654",
              "admin": true,
              "books_he_voted": [
                  {
                      "upvote": true,
                      "bookName": "Room 13",
                      "bookId": "595dec1b22e6e426042150a2",
                      "_id": "5965cd83c1072f26d412c6e9"
                  }
              ],
              "books_he_has": []
          };
      else
          console.log('\n\n\n************\nprevious user: ' + req.session.user.books_he_has);
  */
    var bookId = req.body.bookId;
    var userId = req.body.userId;
    console.log((bookId.match(config.mongoIdRegex).length == 1 && userId.match(config.mongoIdRegex).length == 1));
    console.log(userId == loggedInUser._id || loggedInUser.admin);
    console.log();
    if (bookId.match(config.mongoIdRegex).length == 1 && userId.match(config.mongoIdRegex).length == 1 && (userId == loggedInUser._id || loggedInUser.admin)) {
        adapter.getBookDetail(bookId, function (err, book) {
            if (!err && !book._doc.who_has_this) {
                adapter.getUser({ '_id': userId }, function (err, user) {
                    var issuedBooks = user._doc.books_he_has;
                    if (!err && issuedBooks.length < 2 && !(issuedBooks.length == 1 && issuedBooks[0].bookId == bookId)) {
                        var insertBook = { 'bookId': bookId, 'bookName': book._doc.book };
                        var insertUser = { 'userId': userId, 'userName': user._doc.name };
                        book._doc.who_has_this = insertUser;
                        user._doc.books_he_has.push(insertBook);
                        adapter.saveToDB(book, user, function (err, book, user) {
                            if (!err) {
                                serviceHelper.updateUserSession(req, userId);
                                res.json({ success: true, message: 'Book Issued successfully', user: req.session.user });
                            }
                            else {
                                console.log('[error] trace- ' + err);
                                serviceHelper.sendUnAuthorisedResponse(res, 'Contact customer support, or not.');
                            }
                        })
                    }
                    else
                        serviceHelper.sendUnAuthorisedResponse(res, 'This user just cannot.');
                })
            }
            else
                serviceHelper.sendUnAuthorisedResponse(res, 'Problem with the book provided.');
        });
    }
    else
        serviceHelper.sendUnAuthorisedResponse(res);
})


router.post('/toggleUpvote', function (req, res) {
    console.log('BEFORE>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' + req.session.user.books_he_voted[0] + '\n');
    var id = req.body.bookId;
    if (id.match(config.mongoIdRegex).length == 1) {
        adapter.getBookDetail(id, function (err, book) {
            if (err) {
                res.json({ success: false, message: 'Error getting book details..', book: null });
                return;
            }
            var loggedInUser = req.session.user;
            var currentUpvote = serviceHelper.getUpVoteStatus(book, loggedInUser);

            if (currentUpvote == 0) {
                book._doc.upvoted_by_users.push({ userId: loggedInUser._id, userName: loggedInUser.name });
                loggedInUser.books_he_voted.push({ bookId: book._id, bookName: book.book, upvote: true });
                book._doc.points++;
            }

            if (currentUpvote == 1) {
                deleteThisUser = book._doc.upvoted_by_users.findIndex(function (ele) {
                    return ele.userId == loggedInUser._id;
                });
                deleteThisBook = book._doc.upvoted_by_users.findIndex(function (ele) {
                    return ele.bookId == book._id;
                });

                book._doc.upvoted_by_users.splice(deleteThisUser, 1);
                loggedInUser.books_he_voted.splice(deleteThisBook, 1);
                book._doc.points--;
            }

            if (currentUpvote == -1) {
                res.json({ success: false, message: 'Upvote is disabled, You need to unflag it first.' });
                return;
            }

            console.log('[INFO] Saving upvote details to the database...');
            adapter.saveToDB(book._doc, loggedInUser, function (err, book, user) {
                if (err) {
                    handleUpvoteError(err);
                    return;
                }
                serviceHelper.updateUserSession(req, user);
                console.log('AFTER>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' + req.session.user.books_he_voted[0] + '\n');
                res.json({ success: true });
            });
        });
    }
    else {
        serviceHelper.sendUnAuthorisedResponse(res);
        return;
    }
});

function handleUpvoteError(err) {
    console.log('[ERROR] trace- ' + err);
    res.json({ success: false, message: 'Sorry, couldn\'t upvote.' });
}




module.exports = router;