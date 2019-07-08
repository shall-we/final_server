const redis = require("redis");
module.exports.redisClient = redis.createClient();

   const ACTIVE_USER_PREFIX = "activeUser:";
   const OBSERVER_PREFIX = "observers:";
   const SOCKET_PREFIX = "socket:";
   const SOCKET_COUNT_PREFIX = "socketCount:";

   const socketCounter = {
           increment : (redisClient, socketId, userId) => { return socketCount(redisClient, socketId, userId, "up")},
           decrement : (redisClient, socketId, userId) => { return socketCount(redisClient, socketId, userId, "down")}
   };

   //특정 유저의 친구의 옵저버로 추가하는 함수
   module.exports.setObserver = (friendId, userId) => {
       const {redisClient} = module.exports;
       //console.log("setObserver", friendId, userId);
       redisClient.sadd(OBSERVER_PREFIX+friendId, userId);
    };
   //특정 유저의 친구의 옵저버를 삭제하는 함수

   module.exports.delObserver = (friendId, userId) => {
       const {redisClient} = module.exports;

       //console.log("delObserver", friendId, userId);
       redisClient.srem(OBSERVER_PREFIX+friendId, userId);

   };

   //현재 사용자의 상태를 구독하고 있는 observer들에게 변경 사항을 전파해 주는 함수
   module.exports.broadcast = (io, redisClient, userId, action) => {
       return new Promise((resolve, reject)=>{

           //현재 해당 사용자의 observers를 불러온다.
           redisClient.smembers(OBSERVER_PREFIX + userId , (err, items) =>{
               //console.log("items... ", items);
               if(!items || items.length < 1) return reject("observer가 존재하지 않거나 observer의 배열값이 존재하지 않습니다..");
               items.forEach(el => {
                   //옵저버의 소켓 id들을 가져옴
                   redisClient.hget(ACTIVE_USER_PREFIX+el, "socketId", (err, socketIds)=>{
                       //소켓 id를 분리하여 배열로 만들어 처리 가능하게 함
                       if(!socketIds) return;
                       let ids = socketIds.length > 1 ? socketIds.split(",") : socketIds;

                       //현재 접속중인 소켓에 소식을 전파한다.
                            ids.forEach(el => {
                                module.exports.isKeyExists(redisClient, SOCKET_PREFIX + el).then((result)=>{
                                   if(io.sockets.connected[el] && result){
                                        io.sockets.connected[el].emit(action, userId);
                                   }
                                });
                            });
                       });
                       return resolve();
                   });
               });
           });
   };


   // 주어진 키가 redis에 존재하는지 구분하는 함수
   module.exports.isKeyExists = (redisClient, key) => {

       return new Promise((resolve, reject)=>{
           redisClient.exists(key, (err, result)=>{
              if(err) return reject(err);
              if(result > 0) return resolve(true);
              else if(result === 0) return resolve(false);
              else return reject("ERROR! exists result not vaild");
           });
       });

   };

   //현재 접속 중인 사용자로 설정
    module.exports.setActiveUser = (io, redisClient, obj) => {
        return new Promise((resolve, reject) => {
            if(obj){
                //만약 현재 설정된 Active User key가 있는지 확인한다..
                    module.exports.isKeyExists(redisClient, ACTIVE_USER_PREFIX + obj.id).then((result)=>{
                        redisClient.hmset(SOCKET_PREFIX + obj.socketId, 'userId', obj.id, 'loginTime', new Date().getTime());

                        // 만약 기존에 설정된 키가 있다면,
                        // 아직 접속이 완전히 종료되지는 않았고 다른 브라우저에서 활동중이기 때문에 SocketCount를 1개 늘린 후에
                        // 기존의 ActiveUser의 socketId에 현재 접속한 socket의 id값을 추가한다.
                        if(result){
                            socketCounter.increment(redisClient, obj.socketId, obj.id).then(count => {
                                redisClient.set(SOCKET_COUNT_PREFIX+ obj.id, count);
                                redisClient.hget(ACTIVE_USER_PREFIX+ obj.id, "socketId", (err, socketId)=>{
                                    if(socketId){
                                        socketId += "," + obj.socketId;
                                        redisClient.hmset(ACTIVE_USER_PREFIX + obj.id, "socketId", socketId);
                                        return resolve();
                                    }
                                });
                            });
                            // 기존에 설정된 키가 없다면, 완전히 새로운 접속이므로
                            // ActiveUser 키를 새로 설정하고, 사용자를 구독하고 있는 접속자들에게 접속을 알린다.
                        }else{
                            redisClient.set(SOCKET_COUNT_PREFIX+obj.id, 1);
                            redisClient.hmset(ACTIVE_USER_PREFIX+obj.id, ...(parseObjToArr(obj)));
                            module.exports.broadcast(io, redisClient, obj.id, "friendJoin");
                            return resolve();
                        }
                    });
            }else{
                return reject("ERROR! User not exists!");
            }

        });
    };

   //현재 접속 중인 사용자 정보 가져오기
    module.exports.getActiveUser = (redisClient, userId) => {

            return new Promise((resolve, reject)=>{
                //만약 해당 유저
                if(userId) {
                    redisClient.hgetall(ACTIVE_USER_PREFIX + userId, (err, obj) => {
                        return resolve(obj);
                    });
                }else{
                    reject("ERROR! user's ID not exists!");
                }
            });

    };

    module.exports.getUsersSocket = (userId) => {
        const redisClient = module.exports.redisClient;
        return new Promise((resolve, reject)=>{
            if(!redisClient) reject("redisClient가 존재하지 않습니다.");
            if(userId) {
                //console.log("?", ACTIVE_USER_PREFIX + userId);
                redisClient.hget(ACTIVE_USER_PREFIX + userId, "socketId", (err, socketIds)=>{
                    //console.log("가져온 socket id.... ", socketIds);
                    return resolve(socketIds);
                });
            }else{
                reject("user id가 존재하지 않습니다.");
            }
        });
    };

   module.exports.disconnect = (io, redisClient, socketId) =>{

       return new Promise((resolve, reject)=> {
           redisClient.hgetall(SOCKET_PREFIX + socketId, (err, obj) => {
               if(!socketId) {
                   return reject("ERROR! socket's ID not exist!");
               }
               if(!obj) {
                  return reject("ERROR! socket not exists!");
               }

               if(err){
                   reject("ERROR! -> ", err);
               }else{
                   socketCounter.decrement(redisClient, socketId, obj.userId).then(count => {
                       if(count < 1){
                           module.exports.broadcast(io, redisClient, obj.userId,  "friendOut").then(()=>{
                               module.exports.delActiveUser(redisClient, obj.userId, socketId).then(()=> {
                                   return resolve();
                               });
                           });
                       }else{
                           redisClient.set(SOCKET_COUNT_PREFIX+obj.userId, count);
                           redisClient.hget(ACTIVE_USER_PREFIX + obj.userId, "socketId", (err, socketIds)=>{

                               let reg = "("+ socketId + "|,"+ socketId +")";
                               let newStr = socketIds.replace(new RegExp(reg), "");
                             redisClient.hset(ACTIVE_USER_PREFIX + obj.userId, "socketId", newStr);


                           });
                           redisClient.del(SOCKET_PREFIX + socketId);
                           return resolve();
                       }
                   });
               }
           });
       });
   };

    module.exports.delActiveUser = (redisClient, userId, socketId) => {
        return new Promise((resolve, reject) => {
            if(!userId) return reject("ERROR! user's ID not exist");
                redisClient.del(ACTIVE_USER_PREFIX + userId);
                redisClient.del(SOCKET_PREFIX + socketId);
                redisClient.del(SOCKET_COUNT_PREFIX + userId);
                return resolve();
        });


    };

function socketCount(redisClient, socketId, userId, direct){
    return new Promise((resolve, reject) => {
        redisClient.get(SOCKET_COUNT_PREFIX + userId, (err, count) => {
            count = new Number(count);
            if(direct === "up")
                count++;
            else if(direct === "down")
                count--;
            return resolve(count);
        });
    })

}

function parseObjToArr(obj){
    let paredObjArr = [];
    for( let key in obj){
        paredObjArr.push(key);
        paredObjArr.push(obj[key]);
    }
    return paredObjArr;
}




