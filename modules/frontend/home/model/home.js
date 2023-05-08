const asyncParallel		= require("async/parallel");
function Home() {

	/**
	 * Function for render index file
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */
	this.index = (req, res, next) => {
		asyncParallel({
			sliders : (callback) => {
				const collection = db.collection("slider");
				collection.find({status : ACTIVE }).sort({order:1}).toArray((err, result) => {
					/** Set options for append image full path **/
					let options = {
						"file_url"          :   SLIDERS_URL,
						"file_path"         :   SLIDERS_FILE_PATH,
						"result"            :   result,
						"database_field"    :   "slider_image"
					};
					appendFileExistData(options).then((response) => {
						let result = response.result ? response.result : [];
						callback(err, result);
					});
         		});
			},
			products : (callback) => {
				const collection = db.collection("products");
				collection.find(
					{
						is_popular : POPULAR , 
						is_active : ACTIVE, 
						is_deleted: NOT_DELETED
					},
					{projection: 
						{
							_id : 0, 
							slug : 1,
							default_image : 1, 
							product_name : 1,
							flavor :1
						}
					}
				).toArray((err, result) => {
					/** Set options for append image full path **/
					let options = {
						"file_url"          :   PRODUCTS_URL,
						"file_path"         :   PRODUCTS_FILE_PATH,
						"result"            :   result,
						"database_field"    :   "default_image"
					};
					appendFileExistData(options).then((response) => {
						let result = response.result ? response.result : [];
						callback(err, result);
					});
         		});
			},  
			about_us : (callback) => {
				const collection = db.collection("pages");
				collection.findOne({ slug : 'about-ozekisake' },(err, result) => {
					callback(err, result);
				})
			},
			popular_sakes : (callback) => {
				const collection = db.collection("pages");
				collection.findOne({ slug : 'popular-sakes' },(err, result) => {
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
			/** Render to index page **/
			res.render('index', {
				active_url 	: "", 
				slider 		: (response.sliders) ? response.sliders : [],
				about_us 	: (response.about_us) ? response.about_us.body : {},
				popular_sakes 	: (response.popular_sakes) ? response.popular_sakes.body : {},
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : {},
				products 	: (response.products) ? response.products : [],
			});
		});
	};// end index()

	/**
	 * Function for newsletter
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */
 	this.newsletter = (req, res, next) => {
		if(isPost(req)){

			/** Sanitize Data **/
			req.body 	=	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let email	=	(req.body.email)	?	req.body.email	:"";
			
			/** Check validation **/
			req.checkBody({
				"email": {
					notEmpty: true,
					errorMessage: res.__("admin.subscriber.please_enter_email"),
					isEmail: {
						errorMessage: res.__("admin.subscriber.please_enter_valid_email_address")
					},
				},
			});
			
			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);
			
			/** Send error response **/
			if(errors) return res.send({status : STATUS_ERROR,message : errors});
			
			/** Configure newsletter subscribers unique conditions **/
			const newsletter_subscribers = db.collection("newsletter_subscribers");
			newsletter_subscribers.findOne({
				email	:	{$regex : "^"+email+"$",$options:"i"}
			}, {_id:1,email:1},(err,result)=>{
				if(err) return next(err);
				
				/** Send error response if email already exists **/
				if(result){
					return res.send({
						status	: STATUS_ERROR, 
						message	: [{'param':'email','msg':res.__("admin.newsletter.your_email_id_is_already_exist")}]
					});
				}
				
				const crypto 	= 	require("crypto");
				let currentTime	= 	currentTimeStamp();
				let encId		=	crypto.createHash("md5").update(currentTime+email).digest("hex");
				
				/** Save newsletter subscribers data **/
				newsletter_subscribers.insertOne({
					email 			: 	email,
					status 			:  	ACTIVE,
					user_id 		: 	0,
					enc_id			:	encId,
					is_subscribe	:	SUBSCRIBED,
					modified 		: 	getUtcDate(),
					created 		: 	getUtcDate()
				},(insertErr,insertResult)=>{
					if(!insertErr){
						/** Send success response **/
						res.send({
							status		: STATUS_SUCCESS,
							message		: res.__("newsletter.subscrive_successfully_message")
						});
					}else{
						/** Send success response **/
						res.send({
							status		: STATUS_ERROR,
							message		: res.__("newsletter.subscrive_successfully_message")
						});
					}
				});			
			});
		}
	}
}
module.exports = new Home();
