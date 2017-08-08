app.controller('loginController', function($rootScope, $scope){
    $scope.username = "";
    $scope.password = "";
    
    $scope.loginUser = function(){
        if(!checkIfUserGood()) return;
        var datatosend = {username: $scope.username, password: $scope.password};
        $rootScope.http({
            method: 'POST',
            url: '/site/gateway/authenticate',
            datatype: 'json',
            data: datatosend,
            headers: {
                'Content-Type' : 'application/json'
            }
        }).then(function success(res) {
            console.log(res);
            if(res.data.success){
                console.log('Looks like I just got a token buddy!! Saving it now.');
                window.localStorage.token = res.data.token;
                //window.localStorage.name = res.data.user.name;
                $scope.chill = false;
                console.log('saved token as ' + window.localStorage.token);
                window.open("/site/books", "_self");
            }
            if(res.data.removeCacheRequired)
                window.localStorage.clear();
        }, function failure(err) {
            console.log('shit happened at API');
            $scope.error = true;
        })

    }

    checkIfUserGood = function(){
        return true;
        if(!window.localStorage.token)
            return true;
        console.log('user is logged in already dude... Have some chill.');
        $scope.chill = true;
        return false;
    }


})