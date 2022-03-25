/**
 * Created by PhpStorm.
 * File: server.js
 * User: konohanaruto
 * Blog: http://www.muyesanren.com
 * QQ: 1039814413
 * Wechat Number: wikitest
 * Date: 1/31/2018
 * Time: 6:50 PM
 */

var config = require('./libraries/config');
var helper = require('./libraries/helper');
// 监听
var app = require('http').createServer().listen('3000');
var io = require('socket.io')(app);


// redis 
var redis = require('redis');
redisClient = redis.createClient('6379', '127.0.0.1');

io.sockets.on('connection', function (socket) {
    socket.on('on_load',function (info) {
        // level
        socket.level = 0;
        socket.username = info.username;
        socket.subscribeRoomId = 'room:' + 1;
        // rediskey for online list
        socket.onlineList = config.appname + ':' + socket.subscribeRoomId + ':onlinelist';
        socket.jsonInfo = JSON.stringify(info);
        // Record variables for user open sessions
        socket.userOpenSessionNumberKey = config.appname + ':open_session_number';
        
        // Determine if a user has been kicked out
        // ...
        
        sendWelcome(info);
    });
    
    // Subscribe to rooms and send messages
    var sendWelcome = function (info) {
        // Subscribe to a channel
        socket.join(socket.subscribeRoomId);
        
        // Create an empty room containing only the current user, and subscribe to the room
        socket.join(socket.subscribeRoomId + ':' + socket.username);
        
        redisClient.hget(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, function (err, res) {
            // User does not have any sessions open
            if (! res) {
                // initialized to 1
                redisClient.hset(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, 1, function () {} );
                // send welcome
                io.sockets.to(socket.subscribeRoomId).emit('welcome', info);
            } else {
                //accumulate
                var number = parseInt(res) + 1;
                redisClient.hset(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, number, function () {} );
            }
        });
        
        // into the hash column
        redisClient.hset(socket.onlineList, socket.username, socket.jsonInfo, function (err, reply) {
            //console.log(reply);
        });
        
        
    }
    
    // In-room messages
    socket.on('room-message', function (msg) {
//        if (msg.type == 'notice') {
//            var content = msg.content;
//        } else {
//            var content = '<span>' + msg.username + ' ' + helper.getNowFormatDate() + ' : </span><br/>' + msg.content;
//        }
        
        var info = {};
        info.fromUsername = msg.username;
        info.toUsername = '';
        info.content = msg.content;
        info.currentTime = helper.getNowFormatDate();
        info.type = 'public';
        io.sockets.to(socket.subscribeRoomId).emit('room-message', info);
    });
    
    // private message
    socket.on('private-msg', function (data) {
        
        var info = {};
        info.fromUsername = socket.username;
        info.toUsername = "toby";
        info.content = data.content;
        info.currentTime = helper.getNowFormatDate();
        info.type = 'private';
        // fromUsername(sender)
        socket.emit('room-message', info);
        // toUsername(recipient of the message), Because when the session starts, each user subscribes to a room that only contains himself, so push messages directly to the room
        io.sockets.in(socket.subscribeRoomId + ':' + info.toUsername).emit('room-message', info);
        
    });
    
    // get the user list from the current room
    // Online user list, can be optimized here, set global variables instead
    
    var realTimeUserlist = function () {
        
        if (socket.onlineList) {
            // get all users
            redisClient.hkeys(socket.onlineList, function (err, list) {
                var number = 0;
                var userlist = {};
                if (list) {
                    for (index in list) {
                        userlist[index] = list[index];
                        ++number;
                    }
                }
                io.sockets.to(socket.subscribeRoomId).emit('online-list', {count: number, users: userlist});
            });
        }
        
    };
    
    // Get messages regularly
    var stopTimer = setInterval(realTimeUserlist, 5000);
    
    // monitor exit
    socket.on('disconnect', function () {
        if (socket.userOpenSessionNumberKey) {
            //Determine the closing problem of multi-tags, if you really leave the room, send a leave message
            redisClient.hget(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, function (err, res) {
               var number = parseInt(res) - 1;
               if (number == 0) {
                   // really quit
                   redisClient.hdel(socket.onlineList, socket.username, function (err, reply) {});
                   //io.sockets.to(socket.subscribeRoomId).emit('room-message', '<span style="color: #ff0000;">system information ' + helper.getNowFormatDate() + ' : <br>' + socket.username + ' leave the room</span>');
                   io.sockets.to(socket.subscribeRoomId).emit('offline', '<span style="color: #ff0000;">system information ' + helper.getNowFormatDate() + ' : <br>' + socket.username + ' leave the room</span>');
                   //Destroy records of sessions opened by this user
                   redisClient.hdel(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, function (err, reply) {});
                   //leave the room
                   socket.leave(socket.subscribeRoomId);
               } else {
                   redisClient.hset(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, number, function () {} );
               }
            });
        }
    });
})