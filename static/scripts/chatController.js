app.controller('chatController', function ($rootScope, $scope, $window) {
  try{
    $scope.authorised = true;
    $scope.messages = [];
    var chatRoom = location.href.split("/").pop();
    var primaryIndex;
    $scope.userName = $rootScope.getNameForChat(chatRoom);
    $scope.imageResult = [];
    $scope.memeShow = false;
    $scope.cards = {
      future: [],
      present: [],
      past: [],
      timestamp: 0
    }
    var $ = ( id )=> { return document.getElementById( id ) }

    $scope.simpleTime = "";
    $scope.getTime = (stamp) => {
        let d = new Date(stamp);
        $scope.simpleTime = d.toDateString() + ' | ' + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        //$scope.simpleTime = new Date(stamp).toUTCString();
        // $scope.$apply();
    }

    var handleOops = (err) => {
        $scope.authorised = false;
        $scope.errorMessage = err;
    }
    //var socketPrimary = io({ 'chatRoom': chatRoom, query: "auth_token=" + window.localStorage.chatToken + "&chatRoom=" + chatRoom, forceNew: true });
    //socketPrimary.emit('newlyAdded', chatRoom);
    /**initialisation complete.**/
    var socketArray = [];

    $scope.allowedRooms = $rootScope.getAllowedRooms();
    $scope.allowedRooms.forEach(function (room, index) {
        if (room.chatRoom == chatRoom)
            primaryIndex = index;
        socketArray.push({ index: index, chatRoom: room.chatRoom, socket: io('/chat', { query: "auth_token=" + window.localStorage.chatToken + "&chatRoom=" + room.chatRoom, forceNew: true }) });
    });

    if (primaryIndex === undefined) {
      
      if($scope.allowedRooms)
        primaryIndex = 0;
      else{
        handleOops('Please login to atleast one of the rooms');
        //window.alert('Please login to atleast one of the rooms');
        $rootScope.pause(2000);
        window.open('/','_self');
      }
    }

    socketArray.forEach(function (socketObject) {
        socketObject.socket.on('newMessage', function (msg) {
            console.log('new message in ' + socketObject.chatRoom + ' --> ' + msg.message);
            if (socketObject.index != primaryIndex) {
                $scope.allowedRooms[socketObject.index].count++;
                $scope.$apply();
                document.getElementById('chatSideBar').style.display = 'none';
                document.getElementById('chatSideBar').style.display = 'block';
            }
            else {
                $scope.messages.push(msg);
                $scope.$apply();

                if (!document.hasFocus())
                    if ($scope.alertCount)
                        $scope.alertCount++;
                    else
                        $scope.alertCount = 1;

                if ($scope.notificationEnabled)
                    window.alert('new Message!');
            }            
        })
        socketObject.socket.on('unauthorised', function (err) {
            handleOops(err);
        })
        socketObject.socket.on('previousMessages', (msges)=>{
          "use strict";
          if(socketObject.index == primaryIndex)  {
            //window.open('http://google.com');
            $scope.messages = msges;
            let spliceAt = $scope.messages.length - $scope.allowedRooms[primaryIndex].count;
            $scope.messages.splice(spliceAt, 0, { userName: '', message: '::::::::::::::::::::::::::::::::::  Previous Messages >>>' });
            $scope.allowedRooms[primaryIndex].count = 0;
            $scope.$apply();
          }
        })
        socketObject.socket.on('getCardsUpdate', (cards) =>{
          //window.alert('updated cards for ' + chatRoom);
          $scope.cards = cards;
          //$scope.$apply(); Do I really really need this one.?
        })   
    });
  
    $scope.switchRoom = (newRoom) =>{
      //window.document.body.innerHTML = $scope.messages[0].message;
      chatRoom = newRoom;
      $scope.messages = [];
      //write here (username)
     // $scope.messages.push({ userName: '', message: '::::::::::::::::::::::::::::::::::  Requesting server for messages' });
      //better check if show prebvious is enabled, if not customise the error message...
      primaryIndex = $scope.allowedRooms.findIndex((x)=>{
        return x.chatRoom == newRoom;
      })
      if($scope.allowedRooms[primaryIndex].showPrevious)
        $scope.messages.push({ userName: '', message: '::::::::::::::::::::::::::::::::::  Requesting server for messages' });
      $scope.refreshCards();
      socketArray[primaryIndex].socket.emit('needMessagesUpdate');
      //window.alert(`all done.`);
    }

    $scope.toggleSideBar = function () {
        var sidebar = document.getElementById('chatSideBar');
        if (sidebar.style.display == 'none')
            sidebar.style.display = 'block';
        else
            sidebar.style.display = 'none';
    }
    
    $scope.toggleTasksDiv = () => {
      var tasksDiv = $('tasksDiv');
      if (tasksDiv.style.display == 'none')
            tasksDiv.style.display = '';
        else
            tasksDiv.style.display = 'none'; 
    }

    $scope.toggleMemeSearch = () => {
        var memeDiv = document.getElementById('memeDiv');
        if (memeDiv.style.display == 'none')
            memeDiv.style.display = '';
        else
            memeDiv.style.display = 'none';
    }

    $scope.sendImage = (imagePath) => {
        $scope.currentMessage = imagePath;
        $scope.send(true);
        $scope.toggleMemeSearch();
        $scope.imageResult = [];
        $scope.memeInput = '';
    }

    $scope.addFuture = () => {
      if($scope.newTask){
        socketArray[primaryIndex].socket.emit('futureUpdate', $scope.newTask);
        $scope.cards.future.push($scope.newTask);
        $scope.newTask = '';
      }
    }
    
    socketArray[primaryIndex].socket.on('getFuture', function (str) {
      $scope.cards.future.push(str);
      $scope.$apply();
    })
    
    $scope.refreshCards = () =>{
      //window.alert('m here inside refresh cards.. ' + socketArray[primaryIndex].chatRoom);
      socketArray[primaryIndex].socket.emit('needCardsUpdate');
    }
    

    $scope.send = function (imageBoolean) {
        if ($scope.currentMessage) {
            var msg = {
                image: imageBoolean,
                message: $scope.currentMessage,
                chatRoom: chatRoom,
                userName: $scope.userName,
                timestamp: Date.now()
            }
            socketArray[primaryIndex].socket.emit('chat message', msg);
            $scope.messages.push(msg);
            $scope.currentMessage = "";
        }
    };
    
    
    (()=>{
      "use strict";
      $scope.refreshCards();
      window.onload = ()=>{
        let height = $('memeButton').offsetTop;
        let card1 = $('card1').offsetTop;
        let card2 = $('card2').offsetTop;
        let card3 = $('card3').offsetTop;
        $('messagesDiv').style.top = $('memeDiv').style.top = $('tasksDiv').style.top = height;
      }
    })();

    $window.onfocus = function () {
        delete $scope.alertCount;
    }

    $scope.memeSearch = function () {
        query = $scope.memeInput;
        if (!query) {
            $scope.imageResult = [];
            return;
        }
        $rootScope.http({
            method: 'GET',
            url: '/ilabcollab/gateway/memeSearch?q=' + query,
            datatype: 'json'
        }).then(function success(res) {
            if (res.data.success && res.data.data)
                $scope.imageResult = res.data.data;
            else {
                $scope.imageResult = [];
                document.getElementById('memes').innerHTML = '<h1>Uh. Oh.</h1>' + res.data.message;
            }
        }, function failure(err) {
            $scope.imageResult = [];
            document.getElementById('memes').innerHTML = '<h1>Uh. Oh.</h1>Something Really bad happened at the backend. I\'m sorry';
        })
    }
}
 catch(err){
        console.error(err);
      }
      finally{
        //window.alert(`please say something happened`);
      }
});
