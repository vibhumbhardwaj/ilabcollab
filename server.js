var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var session = require('express-session')({secret:"oye"});
var cookieParser = require('cookie-parser');
var server = require('http').Server(app);
var markupRead = require('express-markdown');

var io = require('./socketIOServer.js')(server);

app.use(markupRead({directory: __dirname}));

app.set('views', [__dirname + '/web', __dirname]);
app.set('view engine', 'ejs');
app.engine('html',require('ejs').renderFile);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.use(morgan('dev'));
app.use(cookieParser('O yea mofo'));
app.use(session);

app.use(express.static('./static'));
/*
var router = require('./router.js');
var apiRouter = require('./apiRouter.js');
router(app);
apiRouter(express,app);
*/
var viewRouter = require('./viewRouter.js');
var apiRouter = require('./apiRouter.js');
var apiRouterSecured = require('./apiRouterSecured.js');
app.get('/', function(req, res){
    res.render('chatLogin.html');
})
app.get('/changelog', (req, res) =>{
    res.redirect('/README.md');
})

app.use('/site',viewRouter);
app.use('/site/gateway', apiRouter);
app.use('/site/gateway/secure', apiRouterSecured);
router.get('/',function(req,res){
    res.render('login.html');
});

server.listen(process.env.PORT || 80, function(){
    console.log('STARTED>');
});
