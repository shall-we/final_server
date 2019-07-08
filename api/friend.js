const redisWork = require("../lib/redisWork");
const FriendList = require('../models').friend_list;
const User = require('../models').user;
const Sequelize = require('sequelize');
let upload = require('../lib/upload');

exports.insertFriend = (req,res) => {
    const {user_id, friend_id} = req.body;

    FriendList.create({user_id : user_id, friend_id : friend_id})
        .then(() => {
            //console.log("친구 추가 완료");
            redisWork.setObserver(friend_id, user_id);
            res.send({result : "success", data : {user_id : user_id, friend_id : friend_id} });
        })
        .catch(err => console.log("삽입 중 에러 발생", err));
};

exports.deleteFriend = (req, res) => {
    //console.log("******* delete friend");
    const {user_id, friend_id} = req.query;
    //console.log(JSON.stringify(req.query, null, 2));
    return FriendList.destroy({where : {user_id : user_id, friend_id : friend_id}})
        .then(result=>{//console.log(result); 
            redisWork.delObserver(friend_id, user_id); res.send({result : "success", data : {friend_id : friend_id}})})
        .catch(err => {
            res.send({result : "fail", data : err});
            console.log("삭제 중 에러 발생", err)});
};

exports.searchAllFriendByOptions = data => {
    return FriendList.findAll(data)
        .catch(err => console.log("친구 조회 중 에러 발생", err));
};

exports.searchAllFriend = (user_id) => {
    const query = "select b.id, b.name, b.profile from friend_list a, user b where a.friend_id = b.id and a.user_id = :id";
    return FriendList.sequelize.query(query,{replacements : {id : user_id}, type: Sequelize.QueryTypes.SELECT })
        .catch(err => console.log("친구 조회 중 에러 발생", err));
};

exports.searchAllFriendWithInfoAPI = (req, res) => {
    exports.searchAllFriend(req.query.user_id).then(async results=>{

        const newResult=await Promise.all(results.map(async (data, index)=>{
            //console.log("is it data?");
            //console.log(data);
            data.profile=await upload.getImage(data.profile);
            //console.log(data);
            return data;
        }));
        res.send(newResult);
    });
}





