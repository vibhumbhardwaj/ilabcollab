var request = require('request');

query = 'cat';

var options = {
    url: 'https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=' + query + '%20meme&aspect=square',
    method: 'GET',
    headers: { 'Ocp-Apim-Subscription-Key': '11a457f48752418ab1b8b21ff727aba9' }
};

/*
req(options, function(error, res){
    console.log('error: ' + error);
    console.log(res.statusCode);
    //console.log(res);
    console.log('\n\n\n\n\n');
    console.log(JSON.parse(res.body).value[1].thumbnailUrl);
})*/
request(options, function(err, res){
            //will only give out 5 images. or 10 maybe?
            if(!err && res.statusCode == 200){
                var body = JSON.parse(res.body).value;
                for(i =0 ; i<5; i++)
                    console.log(i+1 +'   '+body[i].thumbnailUrl)
                
                //console.log(body[0].thumbnailUrl);
            }
        });

