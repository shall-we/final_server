let Folder = require("../models").folder;
let Folder_List = require("../models").folder_list;


// 회원가입
// application/json
// user_id, name
exports.register = async (req, res, next) => {
    console.log("create");

    //if has token, check valid token
    if(req.user){
        if(req.user._id !== req.body.user_id){
            //console.log(req.user._id);
            //console.log(req.body.user_id);
            res.send({result : "fail", failType : "notValidateToken"});
            return;
        }
    }

    //insert query
    const id = await Folder.create({
        name: req.body.name
    }).then(result => {
            return result.dataValues.id;
        })
        .catch(err => {
            console.log("[Folder] create err : " + err);
        });

    Folder_List.create({
        user_id: parseInt(req.body.user_id),
        folder_id: parseInt(id),
        permission: "OWNER"
    })
        .then(result => {
            res.send({
                result: "success",
                data: result
            });
        })
        .catch(err => {
            console.log("[Folder] create err : " + err);
        });
};

exports.getPrivateList = async (req, res, next) => {

    //if has token, check valid token
    if(req.user){
        if(req.user._id !== parseInt(req.query.user_id)){
            res.send({result : "fail", failType : "notValidateToken"});
            return;
        }
    }

    var query = 'select b.name, a.permission,a.folder_id, (select count(*) from note , status where a.folder_id=note.folder_id and note.id = status.id and status.status <> "DELETED") as count from FOLDER_LIST a,FOLDER b where a.folder_id =b.id and a.folder_id IN(select folder_id as p_id from FOLDER_LIST group by folder_id having count(folder_id)< 2) and user_id=:id';
    var values = {
      id: req.query.user_id
    };
    Folder_List.sequelize.query(query, {replacements: values})
    .spread(function (results, metadata) {
        res.send({
            result: "success",
            data: results,
        });
      }, function (err) {
  
  
      });
};

exports.delete = async (req, res, next) => {
  Folder.destroy({
    where: { id: req.params.id }
  })
  Folder_List.destroy({
    where: { folder_id: req.params.id }
  })
//   Folder.sequelize
    // .query("SET FOREIGN_KEY_CHECKS = 0", { raw: true })
    .then(result => {
    //   Folder.sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { raw: true });
      res.send({
        result: "success",
        data: result
      });
    })
    .catch(err => {
      console.error("데이터 삭제 실패: ", err);
    });
};

exports.getSharedList = async (req, res, next) => {

    //if has token, check valid token
    if(req.user){
        if(req.user._id !== parseInt(req.query.user_id)){
            res.send({result : "fail", failType : "notValidateToken"});
            return;
        }
    }
    
    var query = 'select b.name, a.permission,a.folder_id, (select count(*) from note , status where a.folder_id=note.folder_id and note.id = status.id and status.status <> "DELETED") as count from FOLDER_LIST a,FOLDER b where a.folder_id =b.id and a.folder_id IN(select folder_id as p_id  from FOLDER_LIST  group by folder_id having count(folder_id)>1) and user_id=:id';
    var values = {
      id: req.query.user_id
    };
    Folder_List.sequelize.query(query, {replacements: values})
    .spread(function (results, metadata) {
       
        res.send({
            result: "success",
            data: results,
        });
      }, function (err) {
  
  
      });
};

exports.share = async (req, res, next) => {
    Folder_List.create({
        user_id: parseInt(req.body.user_id),
        folder_id: parseInt(req.body.folder_id),
        permission: req.body.permission
    })
        .then(result => {
            res.send({
                result: "success",
                data: result
            });
        })
        .catch(err => {
            console.log("[Folder] share err : " + err);
        });
};
exports.unshare = async (req, res, next) => {
    Folder_List.destroy({
        where: {folder_id:req.params.folder_id,user_id:req.params.user_id}
    })
    .then( result => {
        res.send({
            result: "success",
            data: result
        });
    })
    .catch( err => {
        console.log("데이터 삭제 실패");
    });
};

exports.updateFolderName = async (req, res, next) => {
    Folder.update({name: req.params.name},
    {
        where: {id: req.params.id}, returning: true})
        .then(function(result) {
        res.json(result[1][0]);
    }).catch(function(err) {
        console.log("데이터 수정 실패");
    });
};