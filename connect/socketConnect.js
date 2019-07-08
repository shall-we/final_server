//소켓통신
const socketio=require('socket.io');
exports.io;

exports.initSocket = (server) =>{
    exports.io=socketio.listen(server);
    exports.io.origins('*:*'); // for latest version
}

exports.split = (rawStr) => {
    if(rawStr){
        return new String(rawStr).split(",");
    }else{
        return;
    }
}