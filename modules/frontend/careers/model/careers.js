const { ObjectId } = require("bson");
const asyncParallel= require("async/parallel");
function Career() {
	/**
	 * Function for add careers
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addCareers = (req, res,next)=>{
		if(isPost(req)){
			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			/** Check validation */
			req.checkBody({
				'first_name': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_first_name")
				},
				'last_name': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_last_name")
				},
				'email': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_email")
				},
				'telephone': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_telephone")
				},
				'job_id': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_select_any_job")
				},
			})

			/** parse Validation array  */
			let errors = parseValidation(req.validationErrors(),req);

			if(!req.files || !req.files.resume){
                if(!errors) errors =[];
                errors.push({'param':'resume','msg':res.__("admin.careers.please_select_file")});
            }

			let firstName  		= (req.body.first_name) 			? req.body.first_name 	: '';
			let lastName  		= (req.body.last_name) 				? req.body.last_name 	: '';
			let email  			= (req.body.email) 					? req.body.email 		: '';
			let telephone  		= (req.body.telephone) 				? req.body.telephone 	: '';
			let jobId 			= (req.body.job_id) 				? req.body.job_id 		: '';
			let image       	= (req.files && req.files.resume)  	? req.files.resume 		: "";

			if (errors) {
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: errors,
				});
			}

			let imgaeOptions= {
				'image'     :   image,
				'filePath'  :   USERS_FILE_PATH
			};

			/** Upload resume **/
			moveUploadedFile(req, res,imgaeOptions).then(imgaeResponse=>{
				if(imgaeResponse.status == STATUS_ERROR){
					/** Send error response **/
					return res.send({
						status  : STATUS_ERROR,
						message : [{'param':'resume','msg':imgaeResponse.message}],
					});
				}

				/** Save careers details */
				const careers = db.collection('careers');
				careers.insertOne({
					first_name     :   firstName,
					last_name      :   lastName,
					email          :   email,
					resume         :   (imgaeResponse.fileName)    ?   imgaeResponse.fileName  :"",
					telephone      :   telephone,
					job_id   	   :   ObjectId(jobId),
					created 	   :   getUtcDate()
				},(err,result)=>{
					if(err) return next(err);

					/** Send success response */
					return res.send({
						status			: STATUS_SUCCESS,
						redirect_url	: WEBSITE_URL+'careers',
						message			: res.__("front.careers.careers_has_been_added_successfully")
					});
				});
			}).catch(next);
		}else{
			asyncParallel({
				jobs : (callback) => {
					const collection = db.collection("jobs");
					collection.find({active : ACTIVE}).toArray((err,result)=>{
						callback(err, result);
					})
				},
				newsletter_subscribers : (callback) => {
					const collection = db.collection("pages");
					collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
						callback(err, result);
					})
				}
			},
			(err,response) => {
				/** Render to careers page **/
				res.render('careers', {
					active_url 	: "careers", 
					result 	: (response.jobs) ? response.jobs : [],
					newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
				});
			});			
		}
	};
	//End addCareers()

}
module.exports = new Career();