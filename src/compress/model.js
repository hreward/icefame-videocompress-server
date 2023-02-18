const con = require ("./dbconnect");

function getVideoDetails(category, reference, callback){
    let query = {
        string: `SELECT reference, media, compression FROM contest_submissions WHERE reference = ? LIMIT 1`,
        params: [
            reference
        ]
    }
    //changing query based on category
    if(category == "contest"){
        query.string = `SELECT reference, media, compression FROM contests WHERE reference = ? LIMIT 1`;
    } else {
        query.string = `SELECT reference, media, compression FROM contest_submissions WHERE reference = ? LIMIT 1`;
    }
    con.query(query.string, query.params, (error, result)=>{
        if (error) {
            // throw error;
            return callback(new Error("internal error"));
        }
        result = result[0];
        if(!result){
            return callback([]);
        } else {
            var item = {
                reference: result.reference,
                media: result.media,
                compression: result.compression
            };
            return callback(item);
        }
    });
}

function getUncompressedVideosDetails(category, callback){
    let query = {
        string: `SELECT reference, media, compression FROM contest_submissions WHERE compression IS NULL OR compression != ? LIMIT 10`,
        params: [
            "true"
        ]
    }
    //changing query based on category
    if(category == "contest"){
        query.string = `SELECT reference, media, compression FROM contests WHERE compression IS NULL OR compression != ? LIMIT 10`;
    } else {
        query.string = `SELECT reference, media, compression FROM contest_submissions WHERE compression IS NULL OR compression != ? LIMIT 10`;
    }
    con.query(query.string, query.params, (error, result)=>{
        if (error) {
            // throw error;
            return callback(new Error("internal error"));
        }
        // result = result[0];
        if(!result){
            return callback([]);
        } else {
            var returnResult = [];
            result.forEach((value)=>{
                let item = {
                    reference: value.reference,
                    media: value.media,
                    compression: value.compression
                }
                returnResult.push(item);
            });
            return callback(returnResult);
        }
    });
}


function updateVideoDetails(category, reference, callback){
    
    let query = {
        string:"UPDATE contest_submissions SET compression = 'true' WHERE reference = ? LIMIT 1",
        params: [
            reference
        ]
    }
    //changing query based on category
    if(category == "contest"){
        query.string = `UPDATE contests SET compression = 'true' WHERE reference = ? LIMIT 1`;
    } else {
        query.string = `UPDATE contest_submissions SET compression = 'true' WHERE reference = ? LIMIT 1`;
    }
    con.query(query.string, query.params, (error, result)=>{
        if (error) {
            //throw error;
            return callback(new Error("internal error"));
        }
        
        if(result.affectedRows < 1){
            return callback(new Error(`error occured while updating video details ${reference}`));
        } else {
            return callback(true);
        }
    });
}
module.exports = {
    getVideoDetails,
    getUncompressedVideosDetails,
    updateVideoDetails
};