'use strict';

var restify=require('restify');
var builder=require('botbuilder');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
  console.log('%s listening on %s', server.name, server.url);
});
var serverurl = process.env.HOST_PREFIX || server.url;

var connector = new builder.ChatConnector({
  appId : process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var savedAddresses = [];

server.use(restify.queryParser());

server.post('/api/messages', connector.listen());

server.get('/api/customAlert?msg=:msg', (req, res, next) => {
  for (var i =0; i < savedAddresses.length; i++){
    sendProactiveMessage(savedAddresses[i], req.query.msg);
    console.log('send msg to %s: %s',savedAddresses[i].id, req.query.msg);
  }
  res.send('triggered');
  next();
});

var bot = new builder.UniversalBot(connector);
/*
var bot = new builder.UniversalBot(connector, function(session){
// return back the message
  session.send("You said: %s", session.message.text);
});
*/

function sendProactiveMessage(address, alert){
    var newMsg=new builder.Message().address(address);
    if (alert != undefined && alert != null)
      newMsg.text(alert);
    else
      newMsg.text("你好, 現在時間是:"+ new Date().toLocaleString('zh-TW'));
    newMsg.textLocale('zh-TW');
    bot.send(newMsg);
}

bot.dialog('/', function(session, args){
  var savedAddress = session.message.address;
  var usrMsg = session.message.text;
  if (usrMsg != undefined && usrMsg != null){
    if ( usrMsg.toLowerCase() == "play" || usrMsg == "玩"){
      session.send("好，"+savedAddress.user.name+"，我們來玩遊戲");
    }
    else if (usrMsg.toLowerCase() == "bye" || usrMsg == "離開"){
      session.endConversation("再見！");
    }
    else {
    var saved = false;
    for (var i =0; i< savedAddresses.length; i++){
      if (savedAddresses[i].user.id == savedAddress.user.id){
  	  saved = true;
	  break;
      }
    } 
    if (saved == false)
      savedAddresses.push(savedAddress);
    var msg = "你是"+savedAddress.user.name+",一分鐘後會有一個報時訊號"; 
    session.send(msg);
    msg = "測試一：你可以輸入'play'或'玩'或'bye'或'離開'";
    session.send(msg);
    msg = "測試二：也可以從 '"+serverurl+"/api/customAlert?msg=訊息' 發佈訊息";
    session.send(msg);
    setTimeout(() => {sendProactiveMessage(savedAddress); }, 60000);
    }
  }
});



