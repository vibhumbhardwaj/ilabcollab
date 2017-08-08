app.controller('chatController', function ($rootScope, $scope, $window) {
    $scope.authorised = true;
    $scope.messages = [];
    var chatRoom = location.href.split("/").pop();
    var primaryIndex;
    $scope.userName = $rootScope.getNameForChat(chatRoom);
    $scope.imageResult = [];
    $scope.memeShow = false;


    //var socketPrimary = io({ 'chatRoom': chatRoom, query: "auth_token=" + window.localStorage.chatToken + "&chatRoom=" + chatRoom, forceNew: true });
    //socketPrimary.emit('newlyAdded', chatRoom);
    /**initialisation complete.**/
    var socketArray = [];

    $scope.allowedRooms = $rootScope.getAllowedRooms();
    $scope.allowedRooms.forEach(function (room, index) {
        if (room.chatRoom == chatRoom)
            primaryIndex = index;
        socketArray.push({ index: index, chatRoom: room.chatRoom, socket: io('/chat',{ query: "auth_token=" + window.localStorage.chatToken + "&chatRoom=" + room.chatRoom, forceNew: true }) });
    });

    socketArray.forEach(function (socketObject) {
        socketObject.socket.on('newMessage', function (msg) {
            console.log('new message in ' + socketObject.chatRoom + ' --> ' + msg.message);
            if (socketObject.index != primaryIndex) {
                $scope.allowedRooms[socketObject.index].count++;
                $scope.$apply();
                document.getElementById('chatSideBar').style.display = 'none';
                document.getElementById('chatSideBar').style.display = 'block';
            }
        });
    });

    $scope.toggleSideBar = function () {
        var sidebar = document.getElementById('chatSideBar');
        if (sidebar.style.display == 'none')
            sidebar.style.display = 'block';
        else
            sidebar.style.display = 'none';
    }

    $scope.toggleMemeSearch = function(){
        var memeDiv = document.getElementById('memeDiv');
        if(memeDiv.style.display == 'none')
            memeDiv.style.display = '';
        else
            memeDiv.style.display = 'none';
    }



    $scope.sendImage = function(imagePath) {
        $scope.currentMessage = imagePath;
        $scope.send(true);
        $scope.hideMemeSearch();
    }

    $scope.send = function (imageBoolean) {
        if ($scope.currentMessage) {
            var msg = {
                image: imageBoolean,
                message: $scope.currentMessage,
                chatRoom: chatRoom,
                userName: $scope.userName
            }
            socketArray[primaryIndex].socket.emit('chat message', msg);
            $scope.messages.push(msg);
            $scope.currentMessage = "";
        }
    }


    socketArray[primaryIndex].socket.on('newMessage', function (msg) {
        $scope.messages.push(msg);
        $scope.$apply();

        if (!document.hasFocus())
            if ($scope.alertCount)
                $scope.alertCount++;
            else
                $scope.alertCount = 1;

        if ($scope.notificationEnabled)
            window.alert('new Message!');
    });

    socketArray[primaryIndex].socket.on('unauthorised', function (err) {
        $scope.authorised = false;
        document.getElementById('errorMessage').innerHTML = err;
        $scope.$apply();
    });

    socketArray[primaryIndex].socket.on('previousMessages', function (msg) {
        //msg.chatRoom
        $scope.messages = msg.messages;
        $scope.messages.push({ userName: '', message: '::::::::::::::::::::::::::::::::::  Previous Messages >>>' });
        $scope.$apply();
    });

    $window.onfocus = function () {
        delete $scope.alertCount;
    }

    $scope.memeSearch = function () {
        query = $scope.memeInput;
        if(!query){
            $scope.imageResult = [];
            return;
        }
        $rootScope.http({
            method: 'GET',
            url: '/site/gateway/memeSearch?q=' + query,
            datatype: 'json'
        }).then(function success(res) {
            if (res.data.success && res.data.data)
                $scope.imageResult = res.data.data;
            else{
                $scope.imageResult = [];
                document.getElementById('memes').innerHTML = '<h1>Uh. Oh.</h1>' + res.data.message;    
            }
        }, function failure(err) {
            $scope.imageResult = [];
            document.getElementById('memes').innerHTML = '<h1>Uh. Oh.</h1>Something Really bad happened at the backend. I\'m sorry';
        })
    }

});