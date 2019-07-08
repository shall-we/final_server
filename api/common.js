const authToken =require('../lib/token');
require('dotenv').config();

exports.checkToken= async(req,res,next)=>{
    //console.log(req.url);

    const {token} = req.cookies;

     if(!token){
    //     token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    //       if (token.startsWith('Bearer ')) {
    //       // Remove Bearer from string
    //       token = token.slice(7, token.length);
    //     }
        next();
    }else{

    let decodedToken = await authToken.decodeToken(token).catch(err=>{
        //console.log(err);
        res.send({result : 'fail', failType : "It's error for decodeToken"});
        return;
    });
    req.user=decodedToken;
    next();
}
};

//if it has token , check email matches admin's.
exports.checkAdmin=async(req,res,next)=>{
    //console.log('checkAdmin');
    //console.log(req.user);
    const adminPassword = 'admin1234';

    if(!req.user || req.url==='/admin/announcement') {
        next();
        return;
    }

   if(req.user.authorizated){
            //console.log('this is admin');
            next();
        }else{
            //console.log('this is not admin');
            res.send({result : 'fail', failType : "THIS IS NOT ADMIN"});
            return;
        }
};
