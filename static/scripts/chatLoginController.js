app.controller('chatLoginController', function ($rootScope, $scope) {
    $scope.private = false;
    var publicRoom = false;
    $scope.chatRooms = [];
    
    var socket = io('/chatAuthorisation');

    $scope.updateList = function(){
        socket.emit('getAllRooms', null);
    }
    $scope.updateList();

    socket.on('roomsList', function(rooms){
        $scope.chatRooms = rooms;
        $scope.chatRooms.sort(function(a,b){
            if( a.chatRoom > b.chatRoom)
                return +1;
            else if( a.chatRoom < b.chatRoom)
                return -1;
            else
                return 0;
        })
        console.log($scope.chatRooms);
        $scope.$apply();
    })

    $scope.gotoPublic = function(){
        if(!$scope.userName)
            $scope.userName = prompt('And what would be your username?');
        $scope.chatRoom = 'public';
        publicRoom = true;
        $scope.getChatToken();
    }

    $scope.getChatToken = function () {
        var token = window.localStorage.chatToken;
        var datatosend;
        var url;
        if (!$scope.private || publicRoom) {
            if (($scope.chatRoom && $scope.password && $scope.userName) || (publicRoom && $scope.userName))
                datatosend = { chatRoom: $scope.chatRoom, password: $scope.password, userName: $scope.userName, token: token };
            url = '/ilabcollab/gateway/authoriseChatAccess';
        }
        else {
            if ($scope.passwordRequired && $scope.chatRoom && $scope.password)
                datatosend = { chatRoom: $scope.chatRoom, password: $scope.password, token: token };
            else if (!$scope.passwordRequired && $scope.chatRoom)
                datatosend = { chatRoom: $scope.chatRoom, token: token };
            url = '/ilabcollab/gateway/secure/authoriseChatAccess';
        }

        if (datatosend)
            $rootScope.http({
                method: 'POST',
                url: url,
                datatype: 'json',
                data: datatosend
            }).then(function success(res) {
                if (res.data.success) {
                    window.localStorage.chatToken = res.data.token;
                    window.open('/ilabcollab/collab/' + $scope.chatRoom.toLowerCase(), '_self');
                }
                else {
                    $scope.invalid = true;
                    $scope.errorMessage = res.data.message;
                    console.log('coudn\'t get the token for chat. sorry.');
                }
            }, function failure(err) {
                $scope.invalid = true;
                $scope.errorMessage = 'Something Really bad happened at the backend. I\'m sorry';
                console.log('oh man!!');
            })
    }
});