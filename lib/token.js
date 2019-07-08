let jwt = require("jsonwebtoken");
const env = process.env.NODE_ENV || 'development';
const jwt_conf = require(__dirname + '/../config/auth.json')[env];
require('dotenv').config();

/**   < example >
 *
 *  createToken(payload)
 * .then((token) =>{
 *  //success 
 * })
 * .catch((err)=>{
 *  // fail 
 * })
 * 
 */

module.exports.createToken = (payload)=>{
 return new Promise((resolve, reject)=>{ //resolve :success , reject :fail
 jwt.sign(
   payload
   , jwt_conf.secretKey, // secretOrPublicKey
     {
      // options ex ) algorithms, maxAge
     }, (err, token) => {
       if (err) 
         reject(err);

       if(token)
        resolve(token);
     });
})
};

/**   < example >
 *
 *  decodedToken(token)
 * .then((data) =>{
 *  //success 
 *  - data.id , data.email
 * })
 * .catch((err)=>{
 *  // fail 
 * })
 * 
 */

module.exports.decodeToken= (token) =>{
  return new Promise((resolve, reject)=>{
    jwt.verify(
      token,
      jwt_conf.secretKey, 
      (err, decodedToken)=>{
        if(err)
          reject(err);
        
        if(decodedToken)
          resolve(decodedToken);
      }
    )
  })
}