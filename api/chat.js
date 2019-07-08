const Sequelize = require('sequelize');
const uuidv4 = require('uuid/v4');

const User = require("../models").user;
const ChatRoom = require("../models").chatroom;
const ChatRoomList = require("../models").chatroom_list;
const ChatRoomInfo = require("../models").chatroom_info;
const Chat = require("../models/mongo/chat");
const userApi = require("../api/user");
const redisWork = require("../lib/redisWork");
const socketConnect = require("../connect/socketConnect");

exports.initChatRoom = async (req, res) =>{

    const chatroomId = uuidv4();
    try{
        let {user_id, friend_id} = req.body;
        //console.log("user_id ", user_id);
        //console.log("friend_id ", friend_id);
        let userInfo = await userApi.searchOne({where : {id : user_id}});
        let friendInfo = await userApi.searchOne({where : {id : friend_id}});

        //console.log("userInfo", userInfo);
        //console.log("friendInfo",friendInfo);
        await exports.createChatRoom(chatroomId);
        await exports.insertChatRoomInfo(chatroomId, user_id, userInfo.name + ", " + friendInfo.name);
        await exports.insertChatRoomInfo(chatroomId, friend_id, friendInfo.name + ", " + userInfo.name);

        await exports.createChatRoomList(chatroomId, user_id);
        await exports.createChatRoomList(chatroomId, friend_id);

        let sockets = await redisWork.getUsersSocket(friend_id);
        sockets = socketConnect.split(sockets);
        if(sockets && sockets instanceof Array){
            sockets.forEach(socket => {
                //console.log("sending socket.. ", socket)
                socketConnect.io.sockets.connected[socket].emit('fetchChatList', {});
            });
        }
        res.send({
            result: "success",
            data : {chatroom_id : chatroomId, friends_socket : sockets}
        });
    }catch(err){
        console.warn("ERROR! 채팅방 초기화 중 에러 발생 ! user id = " + req.user_id, err);
        res.send({
            result: "fail",
            failType : "error",
            data : err

        });
    }

};

exports.getChatParticipantInfo = (req, res) => {

    console.log("get chat participant...");
    return ChatRoomList.findAll({
        attributes : ["user_id"],
        where : {chatroom_id : req.query.chatroom_id },
        include : {model: User,  attributes : ["name", "profile"]}}).then(result=>{
        result = result.map(el => {
            return {
                user_id : el.user_id,
                info : el.user.dataValues
            }
        });

        //console.log("get chat participant... result : ", result);
        res.send({result:"success", data : result});
        })
        .catch((err)=>{ console.log("ERROR! ", err); });
}

exports.createChatRoom = (chatroomId) => {
       return ChatRoom.create({chatroom_id : chatroomId})
           .catch((err)=>{ console.log("ERROR! ", err); });
};

exports.createChatRoomList = (chatroomId, userId) => {
       return ChatRoomList.create({chatroom_id : chatroomId , user_id : userId, last_update : new Date()})
           .catch((err)=>{ console.log("ERROR! ", err); });
};

exports.insertChatRoomInfo = (chatroomId, user_id, title) => {
       return ChatRoomInfo.create({chatroom_id : chatroomId, user_id : user_id, chatroom_title : title})
           .catch((err)=>{ console.log("ERROR! ", err); });
};

exports.updateViewTime = (userId, chatroomId) => {
    return ChatRoomInfo.update({last_update: new Date()}, {where : {chatroom_id : chatroomId, user_id : userId}})
        .catch((err)=>{ console.log("ERROR! ", err); });

};


exports.exitChatRoom = (userId, chatroomId) => {
       //console.log(userId + " 님이 나가셨습니다.");
       return ChatRoomList.destroy({where : {user_id : userId, chatroom_id : chatroomId}})
        .catch((err)=>{  console.log("ERROR! ", err); });
};

exports.updateChatRoomTitle = (req, res) => {
    const {info, newTitle} = req.body;
       ChatRoomInfo.update({chatroom_title : newTitle},{where : {chatroom_id : info.chatroom_id,  user_id : info.user_id}})
           .then(()=>{
               res.send({
                   result : "success",
                   data : {chatroom_title : newTitle, chatroom_id : info.chatroom_id,  user_id : info.user_id}
               })
           })
           .catch((err)=>{  console.log("ERROR! ", err); });
};

exports.inviteChatRoom = async (chatroomId, userId, friendId) => {
       //console.log(userId + " 님이 " + friendId + " 님을 초대하셨습니다.");
        let sockets = await redisWork.getUsersSocket(friendId);
        sockets = socketConnect.split(sockets);
        if(sockets && sockets instanceof Array){
            sockets.forEach(socket => {
                socketConnect.io.sockets.connected[socket].emit('fetchChatList', {});
            });
        }
        //console.log("가져온 소켓 정보... ", sockets);
        return exports.createChatRoomList(chatroomId, friendId);
};

exports.dropChatRoom = (req, res) => {
       //console.log(req.query.chatroom_id + " 채팅방 완전 삭제...");
       const {user_id, chatroom_id} = req.query;
       (async ()=>{
           try{
               await ChatRoomInfo.destroy({where : {chatroom_id : chatroom_id, user_id : user_id}});
               await ChatRoomList.destroy({where : {chatroom_id : chatroom_id, user_id : user_id}});
               await ChatRoom.destroy({where : {chatroom_id : chatroom_id}});
               res.send({result : "success", data : {chatroom_id : chatroom_id}});
           }catch(err){
               console.log("error", err);
           }
       })(this);
};

exports.insertChat = (chatObj) => {
    //console.log("***insert chats...");
       //console.log(chatObj);
       return new Chat.chatModel(chatObj).save();
};

exports.getChats = (req, res) => {
    Chat.chatModel
           .find({})
           .where({chatroom_id : req.query.chatroom_id})
           .exec()
           .then((result)=>{
               console.log("채팅 결과 전송...");
               console.log(result);
               res.send({chats : result});
           });
};


exports.getSingleChat = (req, res) => {
       //console.log("getSingleChat");
       let queryStr = 'select chatroom_id from (' +
           ' select dino.chatroom_id from chatroom_list dino where dino.chatroom_id in (select chatroom_id from chatroom_list where user_id =:userId) and user_id =:friendId ) dino2' +
           ' where (select count(*) from chatroom_list dino3 where dino3.chatroom_id = dino2.chatroom_id) < 3';
       let values = {
              userId: req.query.user_id,
              friendId : req.query.friend_id
       };
            ChatRoomList
           .sequelize.query(queryStr, {replacements: values, type: Sequelize.QueryTypes.SELECT})
           .then(result=>{
                  let resultObj = {};
                  if(result.length === 1) {
                         resultObj = {
                                result: "success",
                                data : result
                         };

                  }else if(result.length === 0){
                         resultObj = {result: "notExist"};

                  }else{
                         resultObj = {result: "fail"};
                  }

                  res.send(resultObj);

           })
           .catch(err => console.log("친구 채팅 목록 조회 중 에러 발생", err));
};

exports.getPrivateChatroomList = (req, res) => {
    //console.log("getPrivateChatroomList");

    let queryStr = 'select info.chatroom_id, info.chatroom_title, list.user_id, list.last_update as view_time, ' +
        '(select max(last_update) from chatroom_list inn where inn.chatroom_id = list.chatroom_id) as last_update ' +
        'from chatroom_info info, chatroom_list list ' +
        'where info.chatroom_id = list.chatroom_id and info.user_id =:userId and list.user_id =:userId';

    let values = {
        userId: req.query.user_id
    };

        ChatRoomList
        .sequelize.query(queryStr, {replacements: values, type: Sequelize.QueryTypes.SELECT})
        .then(result=>{
            //console.log("getPrivateChatroomList response");
            //console.log(result);


            res.send(result);
        })
        .catch(err => console.log("개인 채팅 목록 조회 중 에러 발생", err));

};

exports.countChatroom = (req, res) => {
    const {chatroom_id} = req.query;
   ChatRoomList.findOne(
        {   attributes: ['chatroom_id', [ChatRoomList.sequelize.fn('count', '*'), 'count']],
            group: 'chatroom_id',
            where : {chatroom_id : chatroom_id}
        }).then(result => {
       res.send({
           result : "success",
           data : {data : result.dataValues.count}
       });

   }).catch(err=>{
            console.log("채팅방 개수 세는 중에 에러 발생.. , ", chatroom_id, err);
    });

};

exports.inviteMultiChatroom = (req, res) => {

    (async ()=>{
        //console.log("inviteMultiChatroom 진입");
        const {participants, master_id, chatroom_id} = req.body;
        //console.log(participants);
        let roomCount = await ChatRoomList.findOne(
            {   attributes: ['chatroom_id', [ChatRoomList.sequelize.fn('count', '*'), 'count']],
                group: 'chatroom_id',
                where : {chatroom_id : chatroom_id}
            });
        //console.log("roomCount", roomCount);
        roomCount = roomCount.dataValues.count;
        if(roomCount > 2){
            participants.forEach((friend)=>{
                 exports.inviteChatRoom(chatroom_id, master_id, friend.value);
            });
        }else if(roomCount < 3){
            let roomName = '';
            participants.map(el=>{
                roomName += el.label + " ,";
                if(roomName.length > 10) {
                    roomName = roomName.slice(0, 10);
                    roomName += "...";
                    return false;
                }
            });
            const newChatroomId = uuidv4();
            await exports.createChatRoom(newChatroomId);
            await exports.insertChatRoomInfo(newChatroomId, master_id, roomName);
            await exports.createChatRoomList(newChatroomId, master_id);
            participants.forEach( (friend)=> {
                 exports.inviteChatRoom(newChatroomId, master_id, friend.value);
                (async()=>{
                    let sockets = await redisWork.getUsersSocket(friend.value);
                    sockets = socketConnect.split(sockets);
                    if(sockets && sockets instanceof Array){
                        sockets.forEach(socket => {
                            console.log("sending socket.. ", socket)
                            socketConnect.io.sockets.connected[socket].emit('fetchChatList', {});
                        });
                    }

                })();
            });

            (async()=>{
                let sockets = await redisWork.getUsersSocket(master_id);
                sockets = socketConnect.split(sockets);
                if(sockets && sockets instanceof Array){
                    sockets.forEach(socket => {
                        //console.log("sending socket.. ", socket)
                        socketConnect.io.sockets.connected[socket].emit('fetchChatList', {});
                    });
                }

            })();


        }else{
            throw new Error("유효하지 않은 채팅방 입니다.");
        }

        res.send({
            result : "success"
        });

    })();

};

exports.updateChatCheckTime = (req, res) => {

    const {chatroom_id, user_id} = req.body;
    (async() => {
        ChatRoomList.update({last_update : new Date()}, {where : {user_id : user_id, chatroom_id : chatroom_id}}).then(result => {
            //console.log("success!", result);
            res.send({result : "success"});
        });
    })();

};


