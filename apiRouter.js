var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var adapter = require('./mongoadapter');
var config = require('./config.js');
var serviceHelper = require('./serviceHelper.js');
var request = require('request');
var crypto = require('crypto-js');

var findthis = {};

//Implement that loggedin User here also.
router.use(function (req, res, next) {
    console.log('[INFO]@API ' + req.sessionID + ' @ time: ' + new Date().toLocaleTimeString() + ' accessed this page:  ' + req.method + ' --> ' + req.url.toString());
    next();
})


router.post('/createRoom', function(req, res){
    
    var newRoom = req.body; // the request comes in open form right now, you can decide to have it in further packages later.
    if(newRoom){
        var private = newRoom.private;
        console.log('[INFO] initialising chat room creation--> ' + newRoom.chatRoom);
        if(newRoom.chatRoom && (newRoom.password || private)){
            newRoom.chatRoom = newRoom.chatRoom.toLowerCase();
            if(newRoom.password) // hashing the password.
                newRoom.password = crypto.SHA256(newRoom.password).toString();
            if(!newRoom.showPrevious){
                newRoom.showPrevious = false;
                console.log('[INFO] Setting show Previous messages to default value of false because none was provided.');
            }
            if(!private || (allowedUsers && allowedUsers.length > 1 )){
                adapter.createChatRoom(newRoom, function(err, response){
                    if(!err && response.chatRoom == newRoom.chatRoom){
                        res.json({success: true});
                    }
                    else
                        serviceHelper.sendUnAuthorisedResponse(res, 'Couldn\'t create a new chat room into the database. Most Probably, the name is already taken.');
                });
            }
            else
                serviceHelper.sendUnAuthorisedResponse(res);
        }
        else
            serviceHelper.sendUnAuthorisedResponse(res);
    }
    else
        serviceHelper.sendUnAuthorisedResponse(res, 'WTF Dude, least you can do is send data in a proper format.');
});



router.get('/memeSearch', function (req, res) {
    console.log('[INFO] initiating meme search');
    var options;
    var resArray = [];
    if (req.query.q && req.query.q.match(config.searchQueryRegex).length == 1)
        options = {
            url: 'https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=' + req.query.q + '%20meme&aspect=square&imageType=Clipart&color=Monochrome&count=8',
            method: 'GET',
            headers: { 'Ocp-Apim-Subscription-Key': config.ImageAPIKey }
        };
    else{
        res.json({success: false, message: 'You know what you\'re sending. Right?'});
    }    
    if(options)
        request(options, function(err, response){
            if(!err && response.statusCode == 200){
                var result = JSON.parse(response.body).value;
                result.forEach(function(element) {
                    resArray.push(element.thumbnailUrl);
                });
                res.json({success:true, data: resArray});
                console.log('[INFO] MEMEs sent to the client.');
            }
            else{
                console.log('[ERROR] trace- ' + err );
                res.json({success: false, message: 'Couldn\'t find images. Sorry.'});
            }
        });
})


router.get('/logout', function (req, res) {
    console.log('[INFO] Deleting User Session...');
    req.session.destroy();
    res.clearCookie('Authorization');
    //test:
    if (!req.session)
        res.send({ success: true, message: 'logout complete' });
    else
        console.log('[ERROR] @LOGOUT--> please dont print please. por favor. Sil Vous Plait !!!!');
});

router.get('/books/:id', function (req, res) {
    var id = req.params.id;
    if (id.match(config.mongoIdRegex).length == 1) {
        adapter.getBookDetail(id, function (err, book) {
            if (err || !book) {
                res.send({ success: false, message: 'Error getting book details..', book: null });
                return;
            }

            if (req.session.user) {
                console.log('[INFO] User logged in, so mixing user data to the book also..');
                book = serviceHelper.mapUserToBook(book, req.session.user);
            }
            else {
                console.log('[INFO] User not logged in.');
                book = serviceHelper.mapUserToBook(book);
            } // todo: no if else. Merge the logic.
            res.json({ success: true, book: book });
        })
    }
    else {
        res.json({ success: false, message: 'I don\'t like your intentions mate. I\'m not sending you any data.', book: null });
    }
})

router.get('/getBooks', function (req, res) {
    var q = req.query.q;
    if (q) {
        if (!(q.match(config.alphaNumericRegex).length == 1)) {
            res.send({ success: false, message: 'I don\'t like your intentions mate. I\'m not sending you any data.', books: null });
            return;
        }
        var reg = RegExp(q);
        findthis = { book: reg };
    }
    else {
        findthis = {};
    }
    adapter.getBooks(findthis, parseInt(req.query.v), function (err, books) {
        if (err) { console.log('[ERROR] shit happened at Service. books: ' + books); res.json({ success: false }); return; }
        if (req.session.user) {
            console.log('[INFO] User logged in, so mixing user data to the book also..');
            books = serviceHelper.mapUserToBooks(books, req.session.user);
        }
        else {
            console.log('[INFO] User is just an enquirer.');
            books = serviceHelper.mapUserToBooks(books);
        }
        res.json({ success: true, books: books });
    });
});
console.log('[STARTUP] Setting up APIs');

router.post('/authoriseChatAccess', function (req, res) {
    var userName = req.body.userName;
    var chatRoom = req.body.chatRoom;
    var password = req.body.password;
    var token = req.body.token;
    //hashing the password goes here.
    if (chatRoom && password || chatRoom == 'public' && userName) {
        chatRoom = chatRoom.toLowerCase();
        password = crypto.SHA256(password).toString();
        adapter.findChatRoom({ chatRoom: chatRoom }, function (err, chatRoomObject) {
            if (chatRoomObject && !(chatRoomObject._doc.password && chatRoomObject._doc.password != password)) {
                if (!(err || chatRoomObject._doc.private)) {
                    var chatRooms = serviceHelper.addChatRoomForToken(token, chatRoom, userName);
                    token = jwt.sign({ allowedRooms: chatRooms }, config.secretKey, { expiresIn: 1440 * 60 });
                    res.json({ success: true, token: token });
                }
                else {
                    serviceHelper.sendUnAuthorisedResponse(res, 'You cannot proceed further.');
                }
            }
            else
                serviceHelper.sendUnAuthorisedResponse(res, 'Password wrong');
        })
    }
});


router.post('/authenticate', function (req, res) {
    console.log(req.body);

    var username = req.body.username;
    var password = req.body.password;
    if (username && password) {
        adapter.getUser({ username: username, password: password }, function (err, user) {
            if (err || !user) {
                if (err)
                    console.log('[ERROR] Authentication Error ' + err);
                else
                    console.log('U madafakaa are not registered here. get off of this site.');
                res.send({ success: false, message: 'LOGIN ERROR' });
            }
            else {
                // console.log(user);
                // console.log('only data; ' + user.username);
                var token = jwt.sign({ userId: user._id, userName: user.name, admin: user.admin }, config.secretKey, { expiresIn: 1440 * 60 });
                console.log('[INFO] I just gave someone a token');
                req.session.user = user;
                res.cookie('Authorization', token, {
                    httpOnly: true,
                    maxAge: 1440 * 60 * 1000
                });
                console.log(user);
                res.json({ success: true, token: token, user: user, message: 'Ash with cash.' });
            }
        });
    }
    else {
        res.send('[ERROR] WHAT THE FUCK MATE? @ Authentication Service');
    }
})


module.exports = router;