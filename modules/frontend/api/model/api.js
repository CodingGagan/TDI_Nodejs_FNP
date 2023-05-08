const asyncParallel		= require("async/parallel");
const crypto 			= require('crypto').createHash;
const bcrypt 			= require('bcrypt').hash;
const bcryptCompare		= require('bcrypt').compare;
const asyncEach 		= require("async").each;
const asyncforEachOf 	= require("async").forEachOf;
const request 			= require('request');


function Api() {

	/**
	 * Function for get cms details
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getCmsDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			let pageSlug 	= (req.body && req.body.page_slug) ? req.body.page_slug :"";

			/** Send error response */
			if(!pageSlug) return resolve({status : STATUS_ERROR, message : res.__("system.missing_parameters"),result:[]});
			/** Get cms data*/
			const pages		= db.collection('pages');

			pages.findOne({ slug : pageSlug },{projection:{_id:0,name:1,body:1}},(err,result)=>{
				if(err) return next(err);
				/** Send error response */
				if(!result){
					resolve({
						status 	: STATUS_ERROR,
						result 	: {}
					});
				}
				resolve({
					status 	: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
					result 	: result
				});
			});
		});
	};// end getCmsDetails()
}
module.exports = new Api();
