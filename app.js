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

function sendProactiveMessage(address, alert){
    var newMsg=new builder.Message().address(address);
    if (alert != undefined && alert != null)
      newMsg.text(alert);
    else
      newMsg.text("你好, 現在時間是:"+ new Date().toLocaleString('zh-TW'));
    newMsg.textLocale('zh-TW');
    bot.send(newMsg);
}

function saveBroadcastUser(savedAddress){
  var saved = false;
  // savedAddress.conversation = undefined;

  for (var i =0; i< savedAddresses.length; i++){
    if (savedAddresses[i].user.id == savedAddress.user.id){
      saved = true;
      break;
    }
  } 
  if (saved == false)
    savedAddresses.push(savedAddress);
}

function stopBroadcastUser(savedAddress){
  for (var i =0; i< savedAddresses.length; i++){
    if (savedAddresses[i].user.id == savedAddress.user.id){
      savedAddresses.splice(i,1);
      break;
    }
  } 
}
var playGameOption='玩遊戲';
var sendBroadcastOption='接收廣播訊息';
var stopBroadcastOption='停止接收訊息';
var sendTimeAlarmOption='報時訊號';
var exitOption='離開';
var bot = new builder.UniversalBot(connector, [
  (session) => {
 
    /*
    var usrMsg = session.message.text;
    if (usrMsg != undefined && usrMsg != null){
      if ( usrMsg.toLowerCase() == "play" || usrMsg == "玩"){
        session.send("好，"+savedAddress.user.name+"，我們來玩遊戲");
      }
      else if (usrMsg.toLowerCase() == "bye" || usrMsg == "離開"){
        session.endConversation("再見！");
      }
      else {
    */
    builder.Prompts.choice(session, '你好，'+session.message.address.user.name+'，你要做什麼？',
      [playGameOption,sendBroadcastOption,stopBroadcastOption,sendTimeAlarmOption,exitOption],
      { listStyle: builder.ListStyle.button});
  },
  (session, result) => {
    if (result.response){
      var savedAddress = session.message.address;

      switch(result.response.entity){
        case playGameOption:
          session.send("對不起，"+savedAddress.user.name+"，我們的遊戲功能尚在開發中");
          session.reset();
          // to implement game dialog
          break;
        case sendBroadcastOption:
          saveBroadcastUser(savedAddress);
          session.send("已將你加入訊息接收群組，你將會收到由 '"+serverurl+"/api/customAlert?msg=訊息' 發佈訊息");
          session.reset();
          break;
        case stopBroadcastOption:
          stopBroadcastUser(savedAddress);
          session.send("已將你從訊息接收群組");
          session.reset();
          break;
        case sendTimeAlarmOption:
          session.send(savedAddress.user.name+"，一分鐘後會有一個報時訊號"); 
          setTimeout(() => {sendProactiveMessage(savedAddress); }, 60000);
          session.reset();
          break;
        case exitOption:
          session.endConversation("結束對話，再見");
          break;
      }
    } else{
        session.send('你說什麼？我不明白，請你選擇一個項目');
    }
  }
]);
    
    // msg = "測試一：你可以輸入'play'或'玩'或'bye'或'離開'";
    // session.send(msg);
//     msg = "測試二：也可以從 '"+serverurl+"/api/customAlert?msg=訊息' 發佈訊息";
//     session.send(msg);
//     }
//   }
// });



