
let formidable = require('formidable');
var fs = require('fs-extra');
let path = require('path');
let base64Img = require('base64-img');
// [ way to upload image in request ]
// server : base64 dataUrl -> upload to server directory as image file

module.exports.uploadAsFile=async(req , uploadDir)=>{
 let form = new formidable.IncomingForm();
 form.uploadDir=path.join(__dirname, '..',uploadDir);
 form.encoding='utf8';
 form.keepExtensions =true;
 form.multiples=true;

 //console.log('uploadDir', uploadDir);

 if(uploadDir==="user"){ 
  return profileUpload(req, form);
 }else if(uploadDir==="uploads"){
  return attachmentUpload(req, form);
 }

};

profileUpload =(req, form)=>{
  let userInfo={};

  return new Promise((resolve, reject)=>{
    form
    .on('field', function(name, value){
      //console.log('field');
      userInfo[name]=value;
      //console.log(name+': '+value);
      //console.log(userInfo);

    })
    .on('file', function(name,value) {
      //console.log('file');
      //console.log(name+':',value);
    })
    .on('error', function(err){
      console.log('[uploadAsFile] '+ err);
    })
    .on('progress', function(bytesReceived, bytesExpected){
      var percent_complete = (bytesReceived / bytesExpected) * 100;
            //console.log(percent_complete.toFixed(2));
    })

    form.parse(req,function(err, fields, files){
      //console.log('profileUpload');
      if(err) reject(err);

      if(userInfo.email){
        if(files&& files.profile){
          const {profile} = files;
          const type = profile.name.split('.');
          const targetPath= path.join(form.uploadDir, userInfo.email+'.'+type[type.length-1]);
          //console.log('type :'+type);
          //console.log('targetPath : '+ targetPath);
          //console.log('size :'+ profile.size);
          fs.renameSync(profile.path, targetPath);
          //console.log(type[type.length-1]);
          userInfo.profile='user/'+ userInfo.email+'.'+type[type.length-1];
          resolve(userInfo);
        }else {
          resolve(userInfo);
        }
      }
    });
  });
};

attachmentUpload =(req, form)=>{
  return new Promise((resolve, reject)=>{
    let uploadList=[];
    const note_id = req.params.note_id;
   
    form.on('file', function(field, file) {
      //console.log('test file uplaod');
      //console.log('file'+ file);
      file.path=file.path.split(path.join(__dirname, '..'))[1];
      //console.log(file.path);
      const fileInfo=file.name.split('.');
      const type=fileInfo[fileInfo.length-1];
      //console.log('type :' + type);
      const title = file.name.split('.'+type)[0];
      //console.log('title : '+ title);
   
      let info = {
        note_id: note_id,
        title : title,
        type : type.toLowerCase(),
        url : file.path,
      };
      
      uploadList.push(info);
   })
   .on('error', function(err){
     console.log('[uploadAsFile] '+ err);
   })
   .on('progress', function(bytesReceived, bytesExpected){
     var percent_complete = (bytesReceived / bytesExpected) * 100;
           //console.log(percent_complete.toFixed(2));
   });
   
     form.parse(req,function(err, fields, files){
       //console.log('attachmentUpload parse');
       if(files){
        //console.log(uploadList.length);
         resolve(uploadList);
       }
       if(err){
         reject(err);
       }
     });
   })
};


module.exports.getbase64Img = (url)=>{
  return new Promise((resolve, reject)=>{
    const paths = path.join(__dirname, '..', url);
    base64Img.base64(paths, function(err, data) {
      if(err) reject(err);
      if(data) resolve(data);
    })
  })
};

module.exports.getImage = async(targetProfile)=>{
    let profile = (targetProfile!=='/static/media/default_profile.002ff40d.png')?await this.getbase64Img(targetProfile)
        .catch(err=>{console.log('[GETBASE64IMG] '+err); return '/static/media/default_profile.002ff40d.png';}):targetProfile;
    return profile;
};