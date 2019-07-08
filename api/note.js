let Note = require("../models").note;
let Status = require("../models").status;
const Sequelize = require('sequelize');
const uuid4=require('uuid4');


const uuid = () => {
    const tokens = uuid4().split('-')
    return tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4]
  }


exports.getNoteList = async (req, res, next) => {
    var query = 'SELECT * FROM note as a, status as b where a.id=b.id and a.folder_id=:id and b.status <> "DELETED"';
    var values = {
      id: req.query.folder_id
    };
    Note.sequelize.query(query, {replacements: values})
    .spread(function (results, metadata) {
       
        res.send({
            result: "success",
            data: results
        });
      }, function (err) {
  
  
      });
};

exports.getSearchNoteList = async (req, res, next) => {
    var query = "SELECT * FROM note as a, status as b where a.id=b.id and a.folder_id=:id and b.status <> 'DELETED' and name like :search";
    var values = {
      id: req.query.folder_id,
      search : req.query.search,
    };
    Note.sequelize.query(query, {replacements: values})
    .spread(function (results, metadata) {

        res.send({
            result: "success",
            data: results
        });
      }, function (err) {


      });
};

exports.getDeletedNoteList = async (req, res, next) => {
    var query = 'SELECT * FROM note as a, status as b where a.id=b.id and a.folder_id=:id and b.status = "DELETED"';
    var values = {
      id: req.query.folder_id
    };
    Note.sequelize.query(query, {replacements: values})
    .spread(function (results, metadata) {

        res.send({
            result: "success",
            data: results
        });
      }, function (err) {


      });
};

exports.register = async (req, res, next) => {
    //console.log("create");

    //insert query
    const id = await Note.create({
        name: req.body.name,
        folder_id: req.body.folder_id,
        content: uuid()
    }).then(result => {
            return result.dataValues.id;
        })
        .catch(err => {
            console.log("[Note] create err : " + err);
        });

    Status.create({
        id: parseInt(id),
        reg_date: Sequelize.fn('NOW'),
        status_date: Sequelize.fn('NOW'),
        status: "ACTIVED",
        lock: 'UNLOCK',
    })
        .then(result => {
            res.send({
                result: "success",
                data: result
            });
        })
        .catch(err => {
            console.log("[Note] create err : " + err);
        });
};

exports.updateNoteName = async (req, res, next) => {
  
    Note.update({name: req.params.name},
    {
        where: {id: req.params.id}, returning: true})
        .then(function(result) {
        res.json(result[1][0]);
    }).catch(function(err) {
        console.log("데이터 수정 실패");
    });
};

exports.setStatus=async (req, res, next) => {
    Status.update({status: req.params.status, status_date: Sequelize.fn('NOW')},
    {
        where: {id: req.params.id}, returning: true})
        .then(function(result) {
        res.json(result[1][0]);
    }).catch(function(err) {
        console.log("Note데이터 수정 실패");
    });
}

exports.setLock=async (req, res, next) => {
    Status.update({lock : req.params.lock},
    {
        where: {id: req.params.id}, returning: true})
        .then(function(result) {
            //console.log("lock test : ",req.params.lock);
        res.json(result[1][0]);
    }).catch(function(err) {
        console.log("lock 수정 실패");
    });
}

exports.noteStateCheck= async (req, res, next) => {
    var query = "SELECT a.id, b.lock, b.status FROM note as a, status as b where a.id=b.id and a.content=:uuid";
    var values = {
      uuid: req.query.uuid,
    };
    Note.sequelize.query(query, {replacements: values})
    .spread(function (results, metadata) {

        res.send({
            result: "success",
            data: results
        });
      }, function (err) {

      });
}

exports.permanentDeleteNote = async (req, res, next) => {
  Note.destroy({
    where: { id: req.params.id }
  })
//   Note.sequelize
    // .query("SET FOREIGN_KEY_CHECKS = 0", { raw: true })
    .then(result => {
    //   Note.sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { raw: true });
      res.send({
        result: "success",
        data: result
      });
    })
    .catch(err => {
      console.error("[Note - delete]: ", err);
    });
};