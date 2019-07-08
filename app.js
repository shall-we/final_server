const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const cookieParser = require('cookie-parser');
const mysql_db = require('./models/index');


const redisWork = require("./lib/redisWork");
const redisClient = redisWork.redisClient;
const url = require('url');
const cors = require('cors');


const mongoConnect = require("./connect/mongoConnect");
const socketConnect = require("./connect/socketConnect");

const friend = require("./api/friend");
const chatApi = require("./api/chat");
let upload = require('./lib/upload');

mongoConnect.initMongo();

redisClient.on("error", (err) => console.log('redis 구동중 문제 발생.. ', err));
redisClient.on("connect", ()=>{
  //console.log("redis 준비 완료. 설정 끝..");
  redisClient.flushall((err, result)=>{
    if(result === "OK") console.log("redis key 초기화 완료");

    friend.searchAllFriendByOptions().then(allFriends => {
      allFriends.forEach(el=>{
        redisWork.setObserver(el.dataValues.friend_id, el.dataValues.user_id);
      });
      //console.log("observer list 초기화 완료");
    });

  });
});

const app = express();
const server = require('http').Server(app);
socketConnect.initSocket(server);


const io = socketConnect.io;
io.on('connection',(socket)=>{
  //console.log('사용자 접속::' + socket.client.id);


  socket.on('disconnect', (reason)=>{
    //console.log('사용자 접속 종료 ::',  socket.client.id, reason);

    redisWork.disconnect(io, redisClient, socket.client.id)
        .catch(err => {
          console.warn(err);
        });
  });

  socket.on('exit', (user_id)=>{
    //console.log("접속 종료 명령, ", user_id);
    redisWork.disconnect(io, redisClient, socket.client.id)
        .catch(err => {
          console.warn(err);
        });

  });

  socket.on('joinChatroom', chatroom_id => {
    //console.log("************ 채팅방 들어옴 *********", chatroom_id);
    socket.join(chatroom_id);
  });

  socket.on('leaveChatroom', chatroom_id => {
    //console.log("************ 채팅방 나감 **********", chatroom_id);
    socket.leave(chatroom_id);
  });

  socket.on('broadcastChat', chatObj => {
    chatApi.insertChat(chatObj).then((result)=>{
      socket.to(chatObj.chatroom_id).emit("broadcastChat", result);
      io.sockets.connected[socket.client.id].emit('broadcastChat', result);
    });
  });

  socket.on('join', (msg) => {
    msg.socketId = socket.client.id;
    //사용자의 친구 목록을 뽑아오고, 해당 사용자를 현재 접속자인 activeUser로 설정
    //console.log("msg?", msg);
    msg.friends = friend.searchAllFriend(msg.id).then(friends => {
      //console.log("가져온 친구 목록...");
      //console.log(friends);
      friends = friends.map((friend)=>{
        return friend.id;
      });
      msg.friends = friends;
      redisWork.setActiveUser(io, redisClient, msg);

    });
  });
  socket.on('updateCommentList', (msg) => {
    io.emit('updateCommentList', msg);
  });

  socket.on('updateFolderList',(msg)=>{

    //console.log('메세지::',msg);
    io.emit('updateFolderList',msg);
  });
  socket.on('updateNoticeList',(msg)=>{

    //console.log('메세지::',msg);
    io.emit('updateNoticeList',msg);
  });
  socket.on('updateNoteList',(msg)=>{

    //console.log('메세지::',msg);
    io.emit('updateNoteList',msg);
  });
  socket.on('updateNoteLock',(msg)=>{

    //console.log('메세지::',msg);
    io.emit('updateNoteLock',msg);
  });
  socket.on('updateCommentList', msg=>{
    //console.log(msg);
  io.emit('updateCommentList',msg);
  });
  socket.on('updateShareBox', msg=>{
    //console.log('updateShareBox');
    //console.log(msg);
  io.emit('updateShareBox',msg);
  });

  socket.on('updateShareBox',(msg)=>{

    //console.log('메세지::',msg);
    io.emit('updateShareBox',msg);

  });


  socket.on('getFriendList', (msg) => {

    //console.log("getFriendList", msg);

    friend.searchAllFriend(msg.id).then((result)=>{

      let friendList = result.map(async (el)=>{
        let data = Object.assign({}, el);
        //console.log("friend", el);

        data.profile=await upload.getImage(el.profile);
        //console.log(data.profile);

        data.joined = !!(await redisWork.getActiveUser(redisClient, el.id));
        return data;
      });

      Promise.all(friendList).then((result)=>{
        io.sockets.connected[socket.client.id].emit('getFriendList', result);
      });


    });

  });
});


const indexRouter = require('./api/index');
require('dotenv').config();


app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);
app.use(cookieParser());
app.use(express.json());

// init websockets servers
const wssShareDB = require('./src/wss-sharedb')(server);
const wssCursors = require('./src/wss-cursors')(server);

//api router
app.use('/', indexRouter);

//mysql
mysql_db.sequelize.sync();

server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  if (pathname === '/sharedb') {
    wssShareDB.handleUpgrade(request, socket, head, (ws) => {
      wssShareDB.emit('connection', ws);
    });
  } else if (pathname === '/cursors') {
    wssCursors.handleUpgrade(request, socket, head, (ws) => {
      wssCursors.emit('connection', ws);
    });
  } else {
    socket.destroy();
  }
});

server.listen(4000, () =>
  console.log('Express server is running on localhost:4000')
);
