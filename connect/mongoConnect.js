const MONGO_URL = 'mongodb://localhost:27017/wespace';
exports.mongoose = require('mongoose');
exports.initMongo = () =>{
    exports.mongoose.connect(MONGO_URL, {
        useNewUrlParser:true,
        autoReconnect : true
    }, 60000)
        .then((msg) => {
            console.log("mongodb 접속 성공!");
        })
        .catch((err) => {
            console.log("mongodb 접속 실패..");
            console.log(err);
        });
}
