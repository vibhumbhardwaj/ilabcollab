var app = angular.module('booksApp', []);

app.run(function ($rootScope, $http) {
    if(!Array.prototype.findIndex){
        window.document.body.innerHTML = '<h1>Sorry not sorry.</h1><br>Looks like your browser doesn\'t support 2015\'s ES6.0 standards. Looking at today\'s date, I can only advise you to upgrade your browser.<br>' 
    }

    $rootScope.http = $http;
    $rootScope.http.defaults.headers.post['Authorization'] = window.localStorage.token;
    //$rootScope.token = "";
    $rootScope.setHeader = function () {
        console.log('[INFO] setting up the headers, at least trying to!')
        if (window.localStorage.token)
            $rootScope.http.defaults.headers.common.Authorization = window.localStorage.token;
    }

    $rootScope.visitCreateRoom = function(){
        window.open('/ilabcollab/createRoom', '_self');
    }

    $rootScope.visitChat = function(){
        window.open('/ilabcollab/collab', '_self');
    }

    $rootScope.visitBooks = function(){
        window.open('/ilabcollab/books');
    }

    $rootScope.logoutUser = function () {
        $http({
            method: 'GET',
            url: '/ilabcollab/gateway/logout'
        }).then(function success(res){
            if(res.data.success)
                window.localStorage.clear();
        }, function failure(err){
            console.error(err);
        });
        console.log('signed out.');
    }

    $rootScope.getUserId = function(){
        token = parseJwt(window.localStorage.token);
        if(token)
            return token.userId;
    }

    $rootScope.getUserName = function(){
        token = parseJwt(window.localStorage.token);
        if(token)
            return token.userName;
    }

    $rootScope.getAllowedRooms = function(){
        token = parseJwt(window.localStorage.chatToken);
        if(!token)
            return;
        allowedRooms.forEach(function(element) {
            element.count = 0;
        }, this);
        return allowedRooms;
    }

    $rootScope.getNameForChat = function(chatRoom){
        token = parseJwt(window.localStorage.chatToken);
        if(!token)
            return;
        allowedRooms = token.allowedRooms;
        
        index = allowedRooms.findIndex(function(ele){
            return ele.chatRoom == chatRoom;
        });
        if(index < 0)
            return $rootScope.getUserName();
        else
            return allowedRooms[index].userName;
    }

    $rootScope.isAdmin = function(){
        token = parseJwt(window.localStorage.token);
        if(token)
            return token.admin;
    }

    var parseJwt = function (token) {
        if(!token)
            return;
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(window.atob(base64));
    };

    $rootScope.dummySendRequest = function () {
        /*     if(window.localStorage.token)
                 $rootScope.http.defaults.headers.common.Authorization = window.localStorage.token;   */
        console.log('sending the secure request. with token: ' + window.localStorage.token);
        //  $rootScope.setHeader();
        $rootScope.http({
            method: 'POST',
            url: '/ilabcollab/gateway/secure/iLikeThis',
            datatype: 'json',
            headers: {
                'Content-Type': 'application/json'
            }

        }).then(function success(res) {
            if (res.data.success)
                console.log('o ya. baby.');
            else
                console.log('oh no.');
        }, function failure(err) {
            console.log('shit happened ' + err);
        })
    }
})