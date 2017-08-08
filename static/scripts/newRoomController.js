app.controller('newRoomController', function ($rootScope, $scope) {

    var socket = io('/chatAuthorisation');
    $scope.showPrevious = true;
    $scope.private = false;
    var datatosend;

    var handleException = function (msg) {
        if (!msg)
            msg = 'Something Happened';
        $scope.invalid = true;
        $scope.errorMessage = msg;
        window.scrollTo(0, 0);
    }

    $scope.findAvailability = function () {
        if ($scope.chatRoom)
            socket.emit('findAvailability', $scope.chatRoom);
        else
            $scope.available = false;
    }

    socket.on('availabilityResult', function (isAvailable) {
        $scope.called = true;
        if (isAvailable)
            $scope.available = true;
        else
            $scope.available = false;
        $scope.$apply();
    });

    $scope.isConfirmed = function () {
        if ($scope.confirmPassword)
            return $scope.password == $scope.confirmPassword;
    }

    $scope.validateAndContinue = function (form) {
        if (form.$valid) {
            $scope.findAvailability();
            if ($scope.called && $scope.available) {
                $scope.invalid = false;
                datatosend = {
                    chatRoom: $scope.chatRoom,
                    private: $scope.private,
                    showPrevious: $scope.showPrevious,
                    password: null
                }
                if ($scope.private && !$scope.passwordRequired)
                    datatosend.password = null;
                else if ($scope.isConfirmed())
                    datatosend.password = $scope.confirmPassword;
                else {
                    handleException('You drunk or something? Check for the password(s) field below');
                }

                if (!$scope.invalid)
                    $rootScope.http({
                        method: 'POST',
                        data: datatosend,
                        url: '/site/gateway/createRoom',
                        datatype: 'json'
                    }).then(function success(res) {
                        if (res.data.success)
                            socket.emit('new room', datatosend.chatRoom);
                        else {
                            handleException(res.data.message);
                        }

                    }, function failure(err) {
                        handleException('Something Really bad happened at the backend. I\'m sorry');
                        console.log('oh man!!');
                    })
            }
            else {

            }
        }
        else {
            handleException('You\'re better than this dude. Please fill up the details correctly...');
        }
    }

    socket.on('room added', function () {
        window.alert('Room Added successfully! Login to continue');
        window.open('/site/collab', '_self');
    });

    socket.on('unauthorised', function (msg) {
        handleException(msg);
    })

})