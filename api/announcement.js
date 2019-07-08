let Announcement = require("../models").announcement;
let newDate = require("date-utils");

// Get notification list
exports.getAnnouncementList = async (req, res, next) => {
  Announcement.findAll({
    order: [[ "id", "DESC" ]]
  }).then(result => {
    res.send({
      result: "success",
      data: result
    })
  }).catch(err => {
    console.log("[ERROR] getAnnouncementList : " + err);
  });
};

exports.register = async (req, res, next) => {
  const { title, content } = req.body;
  newDate = new Date();

  Announcement.create({
    title: title,
    content: content,
    reg_date: newDate,
    start_date: newDate,
    end_date: newDate
  }).then(result => {
    res.send({
      result: "success",
      data: result
    })
  }).catch(err => {
    console.log("[ERROR] register : " + err);
  });
};

// Get notification
exports.getAnnouncement = async (req, res, next) => {
  Announcement.findOne({
    where: { id: req.params.id }
  })
  .then(result => {
    res.send({
      result: "success",
      data: result
    })
  }).catch(err => {
    console.log("[ERROR] getAnnouncement : " + err);
  });
};

exports.updateAnnouncement = async (req, res, next) => {
  Announcement.update({
    title: req.body.title,
    content: req.body.content
  }, {
    where: { id: req.params.id }
  }).then(result =>  {
      res.send({
        result: "success",
        data: result
      })
  }).catch(err => {
      console.log("[ERROR] updateAnnouncement: ", err);
  });
};

exports.deleteAnnouncement = async (req, res, next) => {
  Announcement.destroy({
    where: { id: req.params.id }
  }).then(result => {
    res.send({
      result: "success",
      data: result
    });
  }).catch(err => {
    console.log("[ERROR] deleteAnnouncement: ", err);
  });
};
