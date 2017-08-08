module.exports = function(app){
    app.get('/',function(req,res){
        res.render('index.html');
    });

    app.get('/solve', function(req,res){
        res.render('okay.html');
    });
    //var apiRouter = express.Router();
}