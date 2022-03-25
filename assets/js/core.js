var active = true;
    $(function () {

        window.onblur = function () {
            active = false;
        }
        
        // onfocus
        window.onfocus = function () {
            active = true;
            document.title = document.title.replace("【You have new news】", "");
        };
        
        var socket = io.connect('http://localhost:3000');

        // info
        // var uid = '<?php echo $uid;?>';
        // var username = '<?php echo $username;?>';
        // var roomId = '<?php echo $roomId;?>';

        var info = {"uid": uid, "username": username};
        
        socket.emit('on_load', info);
        socket.on('welcome', function (msg) {
            $('.room-message').append('<p style="color: #ff0000;">System Message ' + getNowFormatDate() + ': <br>' + msg.username + ' joined room</p>');
        });

        socket.on('offline', function (msg) {
            $('.room-message').append(msg);
        });

        socket.on('room-message', function (msg) {

            //console.log(msg);
            var content = '';
            if (msg.type == 'private') {
                if (msg.fromUsername == username) {
                    msg.fromUsername = 'You';
                }
                if (msg.toUsername == username) {
                    msg.toUsername = 'You';
                }
                content = '<span>' + msg.fromUsername + ' right ' + msg.toUsername + ' Say: ' + getNowFormatDate() + ' </span><br/>' + msg.content;
            } else if (msg.type == 'public') {
                content = '<span>' + msg.fromUsername + ' Say: ' + getNowFormatDate() + '</span><br/>' + msg.content;
            }
			$('.room-message').append('<p>' + content + '</p>');

            // Scrollbar stays stuck to the bottom
            $('.room-message').scrollTop(function() { return this.scrollHeight; });
            if (! active && document.title.indexOf('【You have new news】') < 0) {
                document.title = '【You have new news】' + document.title;
            }
            
        });

        // Refresh online user list
        socket.on('online-list', function (result) {

            // User list on the right
            $('.online-number').html(result.count);
            
            if (result.users) {
                
                // List of users in the current dom tree
                var domUserList = new Array();
                $('.online-userlist .username-span').each(function (i, n) {
                    domUserList.push($(n).html());
                });

                
                var realUserList = new Array();
                var content = '';
                jQuery.each(result.users, function (i, value) {
                    content += '<p><span class="username-span">' + value + '</span><span class="action-js-buttons"><button type="button" class="private-chat-btn">private chat</button></span></p>';
                    realUserList.push(value);
                });

                // first load
                if (domUserList.length == 0) {
                    if (content) {
                        $('.online-userlist').append(content);
                    }
                } else {
                    for (var j in domUserList) {
                        if (realUserList.indexOf(domUserList[j]) < 0) {
                            $('.online-userlist .username-span:contains("'+domUserList[j]+'")').parent().remove(); 
                        } else {
                            // Remove the same as the page, to do this, get the index first
                            var index = realUserList.indexOf(domUserList[j]);
                            realUserList.splice(index, 1);
                        }
                    }
                    
                    // If there are remaining elements, representing the new user, append it to the page
                    if (realUserList.length > 0) {
	                    var content = '';
	                    for (var k in realUserList) {
	                    	content += '<p><span class="username-span">' + realUserList[k] + '</span><span class="action-js-buttons"><button type="button" class="private-chat-btn">private chat</button></span></p>';
	                    }
	                    $('.online-userlist').append(content);
                    }
                    
                }
            }

        });

        // jquery event.
        $("input[name='msg-content']").keydown(function (event) {
            var msg = $(this).val();
            if (msg && event.keyCode == 13) {
                sendMsgToRoom(msg);
            }
        });

        $('.send-btn').on('click', function () {
            var msg = $("input[name='msg-content']").val();
            if (msg) {
                sendMsgToRoom(msg);
            }
        });

        var sendMsgToRoom = function (msg) {
            // clear the content
            $("input[name='msg-content']").val('');
            var type = 'public';
            socket.emit('room-message', {type: type, username: username, content: msg});
        };

        $(document).on('click', '.private-chat-btn', function () {
            $('.private-chat-box').show();
            $('.input-message-box').slideDown(500);
            // get target username
            var toUsername = $(this).parent().prev().html();
            $(".private-chat-box input[name='to_username']").val(toUsername);
            // Set prompt text
            $(".private-chat-box .to-username-span").html(toUsername);
        });

        $('.close-box').on('click', function () {
            $('.input-message-box').slideUp(500);
            $('.private-chat-box').hide();
        });

        $('.send-private-msg-btn').on('click', function () {
            var msg = $(".send-private-msg-text").val();
            var toUsername = $(".private-chat-box input[name='to_username']").val();
            
            if (msg) {
                // empty
                $(".send-private-msg-text").val('');
                /*
                1. target username
                2. Message content
                */
                socket.emit('private-msg', {to_username: toUsername, content: msg});
            }
            
        });
        $('input.send-private-msg-text').keydown(function (event) {
            var msg = $(this).val();
            var toUsername = $(".private-chat-box input[name='to_username']").val();
            if (msg && event.keyCode == 13) {
                $(".send-private-msg-text").val('');
                socket.emit('private-msg', {to_username: toUsername, content: msg});
            }
        });
        
    });