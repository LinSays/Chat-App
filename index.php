<?php 

/**
 * Created by PhpStorm.
 * File: index.php
 * User: konohanaruto
 * Blog: http://www.muyesanren.com
 * QQ: 1039814413
 * Wechat Number: wikitest
 * Date: 1/31/2018
 * Time: 10:29 PM
 */

if (! isset($_GET['uid']) || ! isset($_GET['username'])) {
    echo 'Parameter error';
    exit;
}

$uid = intval($_GET['uid']);
$username = $_GET['username'];

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Document</title>
	<link rel="stylesheet" href="assets/css/style.css">
	<script src="assets/js/functions.js"></script>
	<script src="assets/js/jquery.js"></script>
    <script src="http://localhost:3000/socket.io/socket.io.js"></script>
</head>
<body>
	<div class="container">
		<div class="room-message"></div>
		<div class="control-component">
			<span class="input-control input-bar">
				<input type="text" name="msg-content">
			</span>
			<span class="input-control input-btn">
				<button type="submit" class="send-btn" name="send-btn">send</button>
			</span>
		</div>
	</div>

<div class="online-userlist">
<h2 class="title-info">online users: <span class="online-number" style="color: red;"></span> 人</h2>
</div>

<!-- Private chat dialog box start -->
<div class="private-chat-box">
    <div class="input-message-box">
    <div class="close-box"><i>X</i></div>
    <h2>send message to <span class="to-username-span"></span></h2>
    <p>
    <input type="hidden" name="to_username" value="">
    <input class="send-private-msg-text"  />
    </p>
    <p><button class="send-private-msg-btn" value="send">send</button></p>
    </div>
</div>
<!-- /Private chat dialog box ends -->
</body>
</html>
<script type="text/javascript">
    var uid = '<?php echo $uid;?>';
    var username = '<?php echo $username;?>';
</script>
<script type="text/javascript" src="assets/js/core.js"></script>