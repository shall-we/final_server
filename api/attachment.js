let Attachment = require('../models').attachment;
let upload=require('../lib/upload');
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
// createAttachment 
// note_id, filelist
module.exports.create = async(req, res, next)=>{
    console.log('create');
 let list = await upload.uploadAsFile(req, 'uploads')
                .catch(err=>(console.log('[uploadAsFile]'+err)));

    //console.log(list);

    Attachment.bulkCreate(list,{returning :true})
    .then(result=>{
        if(result)
        res.send({result : 'success'});
    })
    .catch(err=>{
        //console.log('[Attachment bulkCreate]'+err);
        res.status(500).send({result : 'fail'});
    })

   
    
}

// deleteAttachment
// attachment_id
module.exports.delete = (req, res, next)=>{

    Attachment.destroy({
        where : {
            id : req.params.id,
        }
    })
    .then(result=>{
        res.send({
            result : 'success'
        });
    })
    .catch(err=>{
        res.send({
            result : 'fail'
        });

       // console.log('[attachment delete] Error : '+ err);
    });
};

// getAttachmentList
// note_id
// list
// file list ->  server directory -> url list 
module.exports.getAttachmentList = (req, res, next)=>{
    const {note_id} = req.query;

    Attachment.findAll({
        where :{
            note_id : note_id,
        }
    }).then(async (results)=>{

        const newResult=await Promise.all(results.map(async (data, index)=>{
            data.url=await upload.getImage(data.url);
            //console.log(data);
            return data;
        }));


        res.send({
            result : 'success', 
            attachmentList : newResult,
        })
    }).catch((err)=>{
        //console.log('[getAttachmentList] ERROR : '+err);
        res.send({
            result : 'fail',
        })
    });
};


// downloadAttachment
// fil url -> res.sendFile or res.download
module.exports.downloadAttachment =  async(req, res, next)=>{
    console.log('downloadAttachment');
    const {url} = req.body;
    //console.log('url : '+url);

    const targetFile = path.join(__dirname, '..', url);
    //console.log('file :' + targetFile);

    const exits = fs.existsSync(targetFile);
    
    //console.log('exits :'+exits);
    
    if(exits){
        await fs.readFile(targetFile, async(err, data)=>{
           if(err){
            //console.log('file not find');
            res.send({
                result : 'fail',
                failType : 'file not find',
            });
            return;
           }

          // console.log('data',Buffer.from(data).toString('base64'));
           //console.log('mimeType : '+mime.contentType(url));
           res.send({
               result : 'success',
               data : Buffer.from(data).toString('base64'),
           });
       });
    }else{
        res.send({
            result: 'fail',
            failType : 'file not exits',
        });
    }
}