const asyncParallel		= require("async/parallel");	
function Contact() {
	/**
	 * Function for add contact
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addContact = (req, res, next)=>{
		if(isPost(req)){
			
			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			/** Check validation */
			req.checkBody({
				'full_name': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_full_name")
				},
				'email': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_email")
				},
				'comments': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_comments")
				},
			})

			/** parse Validation array  */
			let errors = parseValidation(req.validationErrors(),req);

			if (errors) {
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: errors,
				});
			}

			let fullName  	= (req.body.full_name) ? req.body.full_name : '';
			let email  		= (req.body.email) ? req.body.email : '';
			let comments  	= (req.body.comments) ? req.body.comments : '';

			/** Save contact details */
			const contact = db.collection('contact_us');
			contact.insertOne({
				email          :   email,
				full_name      :   fullName,
				comments   	   :   comments,
				created 	   :   getUtcDate()
			},(err,result)=>{
				if(err) return next(err);

				/** Send success response */
				res.send({
					status			: STATUS_SUCCESS,
					redirect_url	: WEBSITE_URL+'contact-us',
					message			: res.__("front.contact.thank_for_contact")
				});
			});
		}else{
			asyncParallel({
				contact_us : (callback) => {
					const collection = db.collection("pages");
					collection.findOne({ slug: "contact-us" }, (err, result) => {
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
				/** Render to contact-us page **/
				res.render('contact-us', {
					active_url 	: "contact-us", 
					contact_us 	: (response.contact_us) ? response.contact_us.body : '',
					newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
				});
			});
		}
	};//End addContact()

}
module.exports = new Contact();