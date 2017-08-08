var mongomodel = require('./mongomodel.js');
var sha2 = require('crypto-js');
var adapter = require('./mongoadapter.js');

var message = {
    message: 'Hi Everyone',
    sender: 'Vibhum',
    userId: '5cd98398498498da',
    room: '9floor',
}

var newBook = new mongomodel.Book({
    book: '2001: A Space Odyssey',
    author: 'Arhur C. Clarke',
    who_has_this: {userId: '595ccc348e5f634a1443a704', userName: 'Vibhum'},
    upvoted_by_users: [],
    points: 0,
});

console.log('HELLO');

console.log(sha2.HmacSHA256('HELLO','DONOTCHANGETHIS___476382____NOHANDLINGDONE__#&$*#&$(____OTHERWISE').toString());
console.log(sha2.HmacSHA256('HELLO','DONOTCHANGETHISNOHANDLINGDONEOTHERWISE').toString());

var someUser = {
    _id:'595decc2f2d4b459686fa660',
    name: 'notVibhum',
    username: 'yoman',
    password: 'password',
    admin: false,
    books_he_voted: [{bookId:'595cccdb459f28462c709a3a', bookName: 'Room 13', upvote: true}],
    books_he_has: []
};

var vbUser = {
    name: 'Vibhum',
    username: 'a@a.com',
    password: '123654',
    admin: true,
    books_he_voted: [],
    books_he_has: []
};

var newUser = new mongomodel.User(someUser);

var updateBook = {
    book: 'Killing Floor',
    author: 'Lee Child',
    who_has_this: {userId: '5933d1d310feaf4a38729553', userName: 'Vibhum'},
    _id: '5933d2d51d402d62d8a7b842'
}
/*
mongomodel.User.findByIdAndUpdate(newUser._id, newUser, function(err, book){
    if (err) throw err;
    console.log('after update -->' + book.books_he_voted[0].bookName);
    //book = updateBook;
    //getBooks();
})
*/
newRoom = {
    chatRoom : "test1",
    password : "blabla",
    accessType : "public",
    allowedUsers : [],
    showPrevious : true,
    currentUsers : [],
    messages : []
}
getroom = function(bc){
    adapter.findChatRoom({chatRoom: 'hahahha'}, function(err, chatRoom){
        if(!err) bc(chatRoom);
        else bc('offo');
    });
}
getroom(function(room){
    console.log(room);
})


/*
var createChatRoom = function(chatRoom, bc){
    mongomodel.ChatRoom.create(newRoom, function(err, res){
        if(!err) console.log(res);
        else console.log(err);
    })
}
createChatRoom();
/*
newBook.save(function(err){
    console.log("start");
    if(err) console.error('shit happens.');
    console.log('o ya.');
});

//C for Create
/*
newUser.save(function(err){
    console.log("init.");
    if(err) console.error('shit happens. this time happened while saving the user you gave me save into the database.');
    console.log('o ya.');
});
*/
//mongomodel.User.findOne({username: 'a@a.com',})


var readBook = function(){
    mongomodel.Book.find({book: 'Killing Floor'},function(err,books){
        console.log(books[0].who_has_this);
    })
}
//readBook();


var resetPoints = function() { // To update all books with points 0;
    mongomodel.Book.find({}, function(err, books){
        books.forEach(function(book) {
            book.update({points: 0}, function(err){
                if(err)console.log('koi na.');
            })
        }, this);
    })
  
}

var useAndThrow = function(){
    mongomodel.User.findByIdAndUpdate('5933d1d310feaf4a38729553', vbUser, function(err, book) {
        console.log('done.');
    });
}


// RU D (you know how to delete. don't act like you don't)
var getBooks = function () {
    mongomodel.Book.findOneAndUpdate({ _id : '5923e920d266fb2134746867' },{book:'Doh'}, function (err, data) { // Only find for reading, then you can do .save or .remove the old fashioned way also..
        if (err) console.error("Shit happens. this time while retrieving current books from database.");
        console.log('Books:\n' + data);
        //data[0].author = 'DANGIT';
        //data[0].save(function(err){
         //   if(err)console.log('shit.');
       // })
    });
}
//getBooks();


/* Apparently, you cannot set the data which is not present in the schema So this saves nothing but _id and _v


var notBook = new mongomodel.Book({
    name: "demons",
    comment: "hey. waddup"
});

notBook.save(function(err){
    if(err) console.error('well sorry.');
    getBooks();
})*/
