let User = require("../models").user;
let Folder_List = require("../models").folder_list;
let Folder = require("../models").folder;
let Note = require("../models").note;
let authToken = require("../lib/token");
let upload = require('../lib/upload');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
require('dotenv').config();

exports.searchOne = data => {
  return User.findOne(data)
    .catch(err => {
      console.log("findOne err : " + err);
    });
};

exports.searchAll = data => {
  return User.findAll(data).catch(err => {
    console.log("findAll err : " + err);
  });
};

exports.getUserList = async (req, res, next) => {
  var query =
    "select a.id, a.name,a.email, a.profile, (select permission from folder_list where folder_id=:id and user_id=a.id ) as isShared  from user a";
  var values = {
    id: req.query.folder_id
  };
  User.sequelize.query(query, { replacements: values }).spread(
    async function(results, metadata) {

       const newResult=await Promise.all(results.map(async (data, index)=>{
           data.profile=await upload.getImage(data.profile);
           //console.log(data);
           return data;
        }));

       //console.log('newResult : '+newResult);

      res.send({
        result: "success",
        data: newResult
      });
    },
    function(err) {console.log("user 목록 가지고 오던 중에 오류 발생.. ", err);}
  );
};

exports.getUserListExceptMyFriend = async (req, res) => {

  let query = 'select user.id, user.name, user.email, user.profile from user where user.id !=:id and user.id not in (select friend_id from friend_list where user_id =:id)';
  let values = {
    id: req.query.user_id
  };
  User.sequelize.query(query, {replacements: values})
      .spread(async function (results, metadata) {0

          const newResult=await Promise.all(results.map(async (data, index)=>{
              data.profile=await upload.getImage(data.profile);
              //console.log(data);
              return data;
          }));

        res.send({
          result: "success",
          data: newResult,
        });
      }, function (err) {
        console.log("친구 제외한 유저 목록 가져오는 중에 오류 발생.. ", err);
      });
};



// 회원가입
// application/json
// name, email, password, profile
exports.register = async (req, res, next) => {

  //console.log('join');

  let userData = await upload.uploadAsFile(req , 'user');

  //console.log('userData', userData);

  let result = await exports.searchOne({
    where: {
      [Op.or]:[{
        name: userData.name,
      },{
        email: userData.email,
      }]
    }
  });

  // console.log('result', result);

  // auth_already_exists check
  if (result) {
    //console.log('auth_already_exists check');
    res.send({
      result: "fail",
      failType: "auth_already_exists"
    });
  }else {

    //insert query
    User.create(userData)
        .then(result => {
          res.send({
            result: "success"
          });
        })
        .catch(err => {
          console.log("[JOIN] create err : " + err);
        });
  }
};

// 로그인
// application/json
// email, password
exports.login = async (req, res, next) => {
  //console.log("login");

  const {email, password} = req.body;

  let fail = null;

  let result = await exports.searchOne({
    where: {
      email: email,
    }
  });

  // auth_not_exist check
  if (!result) fail = "auth_not_exist";

  // password_mismatch check
  if (result && result.dataValues.password !== password)
    fail = "password_mismatch";

  if (fail !== null) {
    res.send({
      result: "fail",
      failType: fail
    });

    return;
  }

  let profile =await upload.getImage(result.dataValues.profile);

  let Authorization=false;

    if(process.env.ADMINEMAIL===email && process.env.ADMINPASSWORD ===password){
      //console.log('ADMIN');
      Authorization=true;
  }

  authToken.createToken({
    _id: result.dataValues.id,
    email: result.dataValues.email,
    password : result.dataValues.password,
    authorizated : Authorization,
  }).then((token) => {

    if(req.body.autoLogin){
      res.cookie('token', token,  {
        expires : new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly : true,
      });
      // res.set('x-access-token' , token);
    }

    res.send({
      result: "success",
      //token: token,
      data: {
        id: result.dataValues.id,
        name: result.dataValues.name,
        profile: profile,
        authorizated : Authorization,
      }
    });

  }).catch((err) => {
    console.log('createToken error : ' + err);
  });
};

exports.autoLogin = async (req, res, next) => {

   if(req.cookies.token) {
    //console.log("autoLogin token : ",req.cookies.token);

    authToken.decodeToken(req.cookies.token)
    .then((data) =>{
      res.send({
        result : "success",
        data: {
          autoLogin : true,
          email : data.email,
          password: data.password,
        }
      })
      res.status(200).redirect('/note');
    })
    .catch((err)=>{
      console.log("autoLogin error : "+ err);
    })
  }
  else {
    res.send({
      result: "success",
      data: {
        autoLogin : false,
      }
    })
  }
}


exports.logout = async (req, res, next) => {
  res.clearCookie('token');
  //console.log("cookie 삭제 : ",req.cookies.token);
  return res.status(200).redirect('/');
}

// Get a list of all user in admin page
exports.getAllUserList = async (req, res, next) => {
  User.findAll({
    attributes: {
      include: [ "User.id", [Sequelize.fn('COUNT', Sequelize.col('User.id')), 'folder_count'] ]
    },
    include: [{ model: Folder_List, }],
    group: [ 'User.id' ],
  }).then(result => {
    res.send({
      result: "success",
      data: result
    })
  }).catch(err => {
    console.error("[getAllUserList] : " + err);
  });
}

// Delete user when administrator clicked a row
exports.deleteUser = async (req, res, next) => {
  User.destroy({
    where: { id: req.params.id }
  }).then(result => {
    res.send({
      result: "success",
      data: result
    });
  }).catch(err => {
    console.error("[deleteUser]: ", err);
  });
};

// Get a list of all folder in admin page
exports.getAllFolderList = async (req, res, next) => {
  var query =
    "SELECT c.id, a.profile, a.name AS u_name, c.name AS f_name, b.permission FROM User a, Folder_List b, Folder c WHERE a.id = b.user_id AND b.folder_id = c.id";
  User.sequelize.query(query).spread(
    function(results, metadata) {
      res.send({
        result: "success",
        data: results
      });
    },
    function(err) {
      console.error("[getAllFolderList]: ", err);
    });
};

// Get a list of all note in admin page
exports.getAllNoteList = async (req, res, next) => {
  var query =
    "SELECT c.id, a.profile, a.name AS u_name, c.name AS n_name, b.permission FROM User a, Folder_List b, Note c WHERE a.id = b.user_id AND b.folder_id = c.folder_id";
  User.sequelize.query(query).spread(
    function(results, metadata) {
      res.send({
        result: "success",
        data: results
      });
    },
    function(err) {
      console.error("[getAllNoteList]: ", err);
    });
};



