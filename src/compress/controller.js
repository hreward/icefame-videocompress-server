const compressModel = require ("./model");
const FfmpegCommand = require('fluent-ffmpeg');
const {setUser} = require("../helper");
const { copyFile, rename, readFileSync, writeFileSync } = require("fs");
var pathToFfmpeg = require('ffmpeg-static');


function compressVideo(request, response){
    if(!request.params.id || request.params.id < 1){
        return response.status(400).json({status:"error", success:false, message:" "});
    }
    if(!request.params.category || request.params.category < 1){
        return response.status(400).json({status:"error", success:false, message:" "});
    }

    if(request.params.category == "contest"){
        mediaCategory = "contest";
    } else {
        mediaCategory = "submission"
    }

    setUser(mediaCategory+" "+request.params.id);
    compressModel.getVideoDetails(mediaCategory, request.params.id, async (result)=>{
        if(result instanceof Error){
            // console.log(result.message);
            logger.error(result.message);
            return response.status(200).send("call ended");
        }

        //check if return is empty
        if(result.length < 1){
            // console.log("Media not found");
            logger.error("Media not found");
            await compressUncompressedVideos(mediaCategory);
            return response.status(200).send("call ended");
        }

        // confirm video has not been compressed previously
        if(result.compression == "true"){
            //ignore and return
            logger.info("video has been previously compressed.")
            logger.info("START compressing other videos:");
            await compressUncompressedVideos(mediaCategory);
        } else {
            //do compression here
            var mediaArr = result.media.split("/");
            var filename = mediaArr[mediaArr.length-1];
            await actualCompression(mediaCategory, filename)
            .then(
                (value)=>{
                    //update video compression status
                    compressModel.updateVideoDetails(mediaCategory, result.reference, (updResult)=>{
                        if(updResult instanceof Error){
                            // console.log(updResult.message);
                            logger.error(updResult.message);
                        }
                        // return response.status(200).send("done");
                        // console.log("done");
                        logger.info("done"); 
                    });
                },
                (reason)=>{
                    logger.error("Error: "+reason);
                }
            ).finally(async ()=>{
                // console.log("compressing other videos");
                logger.info("START compressing other videos");
                await compressUncompressedVideos(mediaCategory);
                logger.info("DONE compressing other videos");
            });
        }
        return response.status(200).send("call ended");
        
    });
}

async function compressUncompressedVideos(mediaCategory){
    // check if ffmpeg is already running
    const running = readFileSync("./ffmpegrunningstatus") || null;
    if(running.toString() == "true"){
        var watcher = true;
        await new Promise((resolve, reject)=>{
            logger.info("waiting for ffmpeg.");
            setTimeout(() => {
                return resolve(true);
            }, 25000);
        }).then((value)=>{
            //after wait check again and if still running return/exit
            const stillrunning = readFileSync("./ffmpegrunningstatus") || null;
            if(stillrunning == "true"){
                logger.info("ffmpeg is still on after 25secs wait.");
                watcher = true;
            } else {
                watcher = false;
            }
            // return;
        });
        
        if(watcher == true){
            return; //abort function and return. no more encoding.
        }
    }
    writeFileSync("./ffmpegrunningstatus", "true");
    process.setMaxListeners(15);
    compressModel.getUncompressedVideosDetails(mediaCategory, async (submissions)=>{
        if(submissions instanceof Error){
            // console.log(submissions.message);
            logger.error(submissions.message);
        }

        // confirm video has not been compressed previously
        for (const submission of submissions) {
            setUser(mediaCategory+" "+submission.reference);
            if(submission.compression == "true"){
                //ignore and return
                // return response.status(200).send("i");
                // console.log("ignore");
                logger.info("video has not been compressed previously");
            } else {
                setUser(mediaCategory+" "+submission.reference);
                //do compression here
                var mediaArr = submission.media.split("/");
                var filename = mediaArr[mediaArr.length-1];

                await actualCompression(mediaCategory, filename)
                .then((value)=>{
                    //update video compression status
                    compressModel.updateVideoDetails(mediaCategory, submission.reference, (updResult)=>{
                        if(updResult instanceof Error){
                            // console.log(updResult.message);
                            logger.error(updResult.message);
                        }
                        // return response.status(200).send("done");
                        // console.log("done");
                        logger.info("done");
                    });
                }, (reason)=>{
                    logger.error("Error: "+reason);
                });
            }
        }
        writeFileSync("./ffmpegrunningstatus", "false");
    });
}

// process.on('warning', e => console.warn(e.stack));

function actualCompression(mediaCategory, filename){

return new Promise((resolve, reject)=>{
    // check if file is image then return
    // console.log("checking file type of: "+filename); //resolve(true); return;
    logger.info("checking file type of: "+filename); //resolve(true); return;
    if(filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png")){
        console.info("file is an image file");
        logger.info("file is an image file");
        return resolve(true);
        // return;
    }

    if(mediaCategory == "contest"){
        var originalMediaDir = "/home2/mastpalc/icefame.com/dapp/cdi/contests/";
        var originalMediaFile = "/home2/mastpalc/icefame.com/dapp/cdi/contests/"+filename;
        var TempMediaDir = "/home2/mastpalc/icefame.com/dapp/cdi/contests/tmp/";
        var TempMediaFile = "/home2/mastpalc/icefame.com/dapp/cdi/contests/tmp/"+filename;
    } else {
        var originalMediaDir = "/home2/mastpalc/icefame.com/dapp/cdi/submissions/";
        var originalMediaFile = "/home2/mastpalc/icefame.com/dapp/cdi/submissions/"+filename;
        var TempMediaDir = "/home2/mastpalc/icefame.com/dapp/cdi/submissions/tmp/";
        var TempMediaFile = "/home2/mastpalc/icefame.com/dapp/cdi/submissions/tmp/"+filename;
    }

    // copy file to a temp folder
    copyFile(originalMediaFile, TempMediaFile, (err) => {
        if (err) {
            return reject (new Error("couldn't copy: "+err.message));
        }
        logger.info('copied to temp folder');
    });

    
    var ffmpeg = new FfmpegCommand(originalMediaFile, {niceness:20});
    // ffmpeg.setFfmpegPath(pathToFfmpeg);

    ffmpeg.setFfmpegPath("/home2/mastpalc/ffmpeg/bin/ffmpeg.exe");
    ffmpeg.setFfprobePath("/home2/mastpalc/ffmpeg/bin/ffprobe.exe");
    
    ffmpeg.addOptions([
        "-threads 1",
        // "-vcodec h264",
        // "-acodec aac",
        // "-crf 30"
    ])
    .renice(20)
    .fps(24)
    //get image poster
    .complexFilter([
        "scale=w='if(gt(a,0.75),240,trunc(320*a/2)*2)':h='if(lt(a,0.75),320,trunc(240/a/2)*2)',pad=w=240:h=320:x='if(gt(a,0.75),0,(240-iw)/2)':y='if(lt(a,0.75),0,(320-ih)/2)':color=black[scaled]",
        "[scaled]drawtext=text='ICEFAME':fontcolor=white@0.2:fontsize=11:x=w-60:y=h-27,\
        drawtext=text='www.icefame.com':fontcolor=white@0.2:fontsize=8:x=w-70:y=h-15",
    ])
    .on('error', function(err) {
        return reject(new Error('An error occurred: ' + err.message));
    })
    .on('end', function() {
        //move temp to original
        rename(TempMediaFile, originalMediaFile, (moveErr)=>{
            if(moveErr){
                // console.log(moveErr);
                logger.error(moveErr);
            }
        });
        // console.log('Compression finished !');
        logger.info('Compression finished!');

        /////////////////////////////////////////
        /////trying to take video screenshot/////
        /////////////////////////////////////////
        // var ffmpegSS = new FfmpegCommand(originalMediaFile, {niceness:20});
        // // ffmpeg.setFfmpegPath(pathToFfmpeg);

        // ffmpegSS.setFfmpegPath("/home2/mastpalc/ffmpeg/bin/ffmpeg.exe");
        // ffmpegSS.setFfprobePath("/home2/mastpalc/ffmpeg/bin/ffprobe.exe");
        // ffmpegSS.addOptions([
        //     "-threads 1",
        // ])
        // .takeScreenshots({
        //     filename:filename,
        //     timemarks: [5]
        // }, originalMediaDir)
        // .on('error', function(err) {
        //     logger,info('An error occurred while taking screenshot: ' + err.message);
        // })
        // .on('end', function() {
        //     logger.info("Screenshot saved successfully");
        // });
        return resolve(true);
    })
    .save(TempMediaFile);
});
}


module.exports = {
    compressVideo
};