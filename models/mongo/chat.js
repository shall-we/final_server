const mongoose = require('mongoose');

const chatSchema =  new mongoose.Schema({
    chatroom_id : String,
    sender : Number,
    content : String,
    viewer : Array,
    send_date : Date});

module.exports.chatModel = mongoose.model('Chat', chatSchema, 'chat');





