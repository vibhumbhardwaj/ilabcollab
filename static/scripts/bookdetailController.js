app.controller('bookdetailController', function($rootScope, $scope){
    var bookId = location.href.split("/").pop();
    
    $scope.book = {
        issued: false,
        issuedTo: "Please Wait...",
        issuedToCurrent: false,
        book: "Please Wait...",
    };
    $scope.prospectList = [];

    $scope.hitIt = function(){
        $rootScope.http({
            method: 'GET',
            url: '/site/gateway/books/' + bookId,
            datatype: 'json'
        }).then(function success(res){
            if(res.data.success)
                $scope.book = res.data.book;
        }, function failure(err){
            console.log('shit happened at API');
            $scope.error = true;
        })
    }

    $scope.hitIt();

    $scope.issue = function(){
        if($rootScope.isAdmin()){
            $rootScope.http({
                url: '/site/gateway/secure/getProspectList',
                method: 'GET'
            }).then(function success(res){
                if(res.data.success)
                    $scope.prospectList = res.data.prospectList;
            }, function failure(err){
                console.log('Contact Customer Support, error getting prospects\' list');
                $scope.error = true;
            });
        }
        else
            $scope.issueForThis(prospect);
    }
    $scope.issueForThis = function(prospect){
        if(!prospect){
            prospect = $rootScope.getUserId();
        }
        $rootScope.http({
            url: '/site/gateway/secure/issueTheBook',
            data: {bookId: $scope.book._id, userId: prospect},
            method: 'POST'
        }).then(function success(res){
            if(res.data.success)
                $scope.hitIt();
        }, function failure(err){
            alert('Couldn\'t issue the book. Try again later. Or not.');
            console.log(err);
        });
    }

    $scope.returnBack = function() {
        $rootScope.http({
            url: '/site/gateway/secure/returnTheBook',
            data: {bookId: $scope.book._id},
            method: 'POST'
        }).then(function success(res){
            if(res.data.success)
                $scope.hitIt();
        }, function failure(err){
            alert('Couldn\'t return the book. Try again later. Or not.');
            console.log(err);
        });
    }

    $scope.toggleUpvote = function(){
        $rootScope.http({
            url: '/site/gateway/secure/toggleUpvote',
            data: {bookId: $scope.book._id},
            datatype: 'json',
            method: 'POST'
        }).then(function success(yoman){
            $scope.hitIt();
        }, function failure(err){
            console.log(err);
        })
    }

});