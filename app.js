'use strict';

var restify=require('restify');
var builder=require('botbuilder');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
  console.log('%s listening to %s', server.name, server.port);
});

var APP_ID = "b3ed4a56-9376-4b77-ae85-a0d88635e0e6";
var PASSWORD = "pie8n96MQYdcrWLPDJj5N0N";
var connector = new builder.ChatConnector({
  appId : APP_ID, 				//process.env.MICROSOFT_APP_ID,
  appPassword: PASSWORD				//process.env.MICROSOFT_APP_PASSWORD
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
  var saved = false;
  for (var i =0; i< savedAddresses.length; i++){
    if (savedAddresses[i].id == savedAddress.id){
	saved = true;
	break;
    }
  } 
  if (saved == false)
    savedAddresses.push(savedAddress);
  var msg = "你的username:"+savedAddress.user.name+",每分鐘會有一報時訊號"; 
  session.send(msg);
  setInterval(() => {sendProactiveMessage(savedAddress);
  }, 60000);
});


