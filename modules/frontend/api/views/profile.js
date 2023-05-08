const bcrypt 			= require('bcrypt').hash;
const bcryptCompare		= require('bcrypt').compare;
const crypto 		= require('crypto').createHash;

function Profile() {

   /**
	 * Function for change Password details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.changePassword = (req, res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body 			= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			let password		= (req.body.password)			? req.body.password			: "";
			let confirmPassword	= (req.body.confirm_password)	? req.body.confirm_password	: "";
			let oldPassword		= (req.body.old_password)		? req.body.old_password		: "";
			let slug 			= (req.body.slug)				? req.body.slug				: "";
			if(!slug) return resolve({status : STATUS_ERROR, message: res.__("admin.system.something_going_wrong_please_try_again")});
			/** Validate password if password changed*/
			req.checkBody({
				"password": {
					notEmpty: true,
					isLength:{
						options: PASSWORD_LENGTH,
						errorMessage: res.__("admin.user.password_length_should_be_minimum_6_character")
					},
					errorMessage: res.__("admin.user.please_enter_your_password")
				},
				"old_password": {
					notEmpty: true,
					errorMessage: res.__("admin.user.please_enter_your_old_password")
				},
				"confirm_password": {
					notEmpty: true,
					isLength:{
						options: PASSWORD_LENGTH,
						errorMessage: res.__("admin.user.password_length_should_be_minimum_6_character")
					},
					errorMessage: res.__("admin.user.please_enter_confirm_password")
				},
			});
			/**Validate confirm password*/
			req.checkBody("confirm_password", res.__("admin.user.confirm_password_should_be_same_as_password")).equals(password);
			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);
			if(errors) return resolve({status :	STATUS_ERROR, message :	errors});
			const users			=	db.collection("users");
			let conditions 		=	{};
			conditions.slug 	=	slug;

			users.findOne(conditions,{projection: {_id:1,password:1,email:1,full_name:1}},(err,result)=>{
				if(err) return next(err);
				if(!result || result.length <=0 ) return resolve({status : STATUS_ERROR, "message" : res.__("user.user_not_exist")});
				bcryptCompare(oldPassword,result.password).then(passwordMatched=>{
					if(!passwordMatched) return resolve({status: STATUS_ERROR,message: [{"param":"old_password","msg":res.__("admin.user_profile.old_password_you_entered_did_not_matched")}]});
					
					/** update password details **/
					bcrypt(password, BCRYPT_PASSWORD_SALT_ROUNDS).then(newPassword=>{
						let updateData = {
							password  : newPassword,
							modified  : getUtcDate()
						};
						users.updateOne({_id : ObjectId(result._id)},{$set	: updateData},(updateErr,updateResult)=>{
							if(updateErr) return next(updateErr);
							/** Send success response **/
							resolve({status : STATUS_SUCCESS,"message" : res.__("user.user_password_changed_successfully")});
							let emailOptions 	= {
								to 				: result.email,
								action 			: "reset_password",
								rep_array 		: [result.full_name]
							};
							sendMail(req,res,emailOptions);
						});
					});
				});
			});
		});
	};//End changePassword()

	/**
	 * Function for edit Profile  details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.editProfile = (req, res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body 			= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			if(!req.body && !req.body.slug) return resolve({status : STATUS_ERROR, message: res.__("admin.system.something_going_wrong_please_try_again")});
			/** Validate user details if details changed*/			
			
			let slug 			= (req.body.slug)	? req.body.slug	: "";


			let validation = {
				"full_name": {
					notEmpty	: true,
					errorMessage: res.__("user.please_enter_full_name")
				},
				"email": {
					notEmpty	: true,
					errorMessage: res.__("user.please_enter_email"),
					isEmail	: 	{
						errorMessage : res.__("user.please_enter_valid_email_address")
					},
				},
				/*"time_zone": {
					notEmpty	: true,
					errorMessage: res.__("user.please_select_time_zone")
				},*/

			/*	
				"about_me" :	{
					notEmpty	: true,
					errorMessage: res.__("user.please_enter_about_me")
				}*/
			}
			if(req.body && req.body.user_type && req.body.user_type == USER_TYPE_PLAYER){
				validation.locality = 	{
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_enter_city")
                };
				validation.state = 		{
					notEmpty	: true,
					errorMessage: res.__("user.please_enter_state")
				};
			}else{
				validation.about_me = 		{
					notEmpty	: true,
					errorMessage: res.__("user.please_enter_about_me")
				}
			}
			

			req.checkBody(validation);
			/** parse Validation array  **/
			let errors 	= parseValidation(req.validationErrors(),req);
			if(errors) 	return resolve({status :	STATUS_ERROR, message :	errors});
			const users	= db.collection("users");

			let email 		=	(req.body && req.body.email) ? req.body.email : "";
			let fullName 	=	(req.body && req.body.full_name) ? req.body.full_name : "";
			let timeZone 	=	(req.body && req.body.time_zone) ? req.body.time_zone : "UTC-04:00_US/Eastern";

			let slugName 	=	slug;
			let conditionsData 		=	{
				is_deleted	: NOT_DELETED,
				//slug 		: { $ne: slug },
				$or			: [
					{email	: email}
				]
			};
			let fields = {_id:1,email:1,slug:1}
		
			users.findOne(conditionsData,{projection: fields},(err,result)=>{
				/** update profile details **/

				let updateData = {
					full_name 				: fullName,
					time_zone 				: timeZone,
					modified 				: getUtcDate(),
				};
				if(req.body && req.body.user_type && req.body.user_type == USER_TYPE_PLAYER){
					updateData.city 			=	(req.body && req.body.locality) ? req.body.locality: "";
					updateData.state 			=	(req.body && req.body.state) 	? req.body.state 	: "";
					updateData.time_zone_val 	=	timeZone.split('_')[1];
				}else{
					updateData.host_category=	(req.body && req.body.host_category) ? ObjectId(req.body.host_category) : "";
					updateData.time_zone_val 	=	timeZone.split('_')[0];
				}
				updateData.about_me 		=	(req.body && req.body.about_me) ? req.body.about_me : "";

				let timeStamp				= currentTimeStamp();
				let emailValidateString		= crypto("md5").update(timeStamp+email).digest("hex");



				if(result){
					let errMessage	 = [];
					let resultMail 	 = (result.email)		  ? result.email.toLowerCase()	:"";
					let enteredMail  = email ? email.toLowerCase(): "";
					let resultSlug 	 = (result.slug)		  ? result.slug	:"";

					/** Push error message in array if email or mobile already exists*/
					if(enteredMail && resultMail == enteredMail &&  resultSlug != slug){
						errMessage.push({'param':'email','msg':res.__("user.email_id_is_already_exist_try_another")});
						return resolve({status : STATUS_ERROR, message :	errMessage});
					}else if(enteredMail && resultMail != enteredMail){
						updateData.temp_email 	=	email;
						updateData.update_email_verification_string 	=	emailValidateString;
					}
				}else{
					updateData.temp_email 	=	email;
					updateData.update_email_verification_string 		=	emailValidateString;
				}
													

				let conditions 		=	{};
				conditions.slug 	=	slug;
				users.updateOne({slug:slug},{$set: updateData},(updateErr,updateResult)=>{
					if(updateErr) return next(updateErr);

					users.findOne({slug : slugName},{projection: {full_name:1,email:1,temp_email:1,city:1,state:1,about_me:1,host_category:1,time_zone:1,time_zone_val:1}},(err,result)=>{
						if(err) return next(err);

						/** Send error response */
						if(!result || result.length <=0 ) return resolve({status : STATUS_ERROR, "message" : res.__("user.user_not_existd")});

						if(result){
							let resultMail 	 = (result.email)		  ? result.email.toLowerCase()	:"";
							let enteredMail  = email ? email.toLowerCase(): "";
							if(enteredMail && resultMail != enteredMail){
								if(email){
									/*********** Send email for forgot password ***************/
									let verifyLink		=	FRONT_WEBSITE_URL+"verify_temp_email/"+emailValidateString;
									let verifyClickLink	=	'<a target="_blank" href='+FRONT_WEBSITE_URL+"verify_temp_email/"+emailValidateString+'>'+ res.__("system.click_here") +'</a>';
									let emailOptions 	= {
										to 				: email,
										action 			: "verify_edit_email",
										rep_array 		: [fullName,verifyLink,verifyClickLink]
									};
									sendMail(req,res,emailOptions);
									/*********** Send email for forgot password ***************/
								}
							}
						}


						req.session.user = result;
						/** Send success response **/
						req.flash(STATUS_SUCCESS,res.__("user.user_profile_updated_successfully"));
						resolve({
							status		:	STATUS_SUCCESS,
							"message" 	:	res.__("user.user_profile_updated_successfully"),
							updated_data: 	result
						});
					});
				});
			});
		});
	};//End editProfile()


	 /**
     * Function for update user's Detail
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
    this.updateProfileImage = (req,res,next)=>{
    	return new Promise(async resolve=>{
	        /** Sanitize Data **/
	        req.body            = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

	        let slug          	= 	(req.body.slug)           ? req.body.slug : "";
	        let conditions 		=	{};
			conditions.slug 	=	slug;

	        /** Configure user unique conditions **/
	        const users = db.collection("users");
	        users.findOne(conditions,{projection: {_id:1}},(err,result)=>{
	            if(err) return next(err);
	            if(!result || result.length <=0 ) return resolve({status : STATUS_ERROR, "message" : res.__("user.user_not_exist")});

	            /** Set options for upload image **/
	            let oldimage=   (req.body.old_image) ? req.body.old_image :"";
	            let image   =   (req.files && req.files.profile_picture)  ?   req.files.profile_picture :"";
	            let options =   {
	                'image'     :   image,
	                'filePath'  :   USERS_FILE_PATH,
	                'oldPath'   :   oldimage
	            };


	            /** Upload user  image **/
	            moveUploadedFile(req,res,options).then(response=>{
	            	/** Send error response **/
	                if(response.status == STATUS_ERROR) return resolve({status  : STATUS_ERROR,message : [{'param':'profile_picture','msg':response.message}] });
	                
	                /** Set update data **/
	                let updateData  =   {
	                    modified        : getUtcDate(),
	                    profile_picture : (response.fileName)  ?  response.fileName :""
	                };

	                /** Update user data **/
	                users.updateOne(conditions,{$set : updateData},(updateErr,result)=>{
	             
	                	if(updateErr) return next(updateErr);

	                	users.findOne(conditions,{projection: {profile_picture:1}},(usersErr,usersResult)=>{

	                		/** Send success response **/
							if(!usersResult.profile_picture) return resolve({status	: STATUS_SUCCESS,result : usersResult});

							/** Set options for append image **/
							let imageOptions = {
								"file_url" 			: USERS_URL,
								"file_path" 		: USERS_FILE_PATH,
								"result" 			: [usersResult],
								"database_field" 	: "profile_picture"
							};

							/** Append image with full path **/
							appendFileExistData(imageOptions).then(fileResponse=>{
								/** Send success response **/
			                    resolve({
			                        status      : STATUS_SUCCESS,
			                        updated_data: (fileResponse && fileResponse.result && fileResponse.result[0])	?	fileResponse.result[0]	:{},
			                        message     : res.__("admin.user.user_details_has_been_updated_successfully"),
			                    });
							}).catch(next); 

	                	}); 
	                });
	                
	            }).catch(next); 
	        });
	    });
    };//End updateProfileImage()

    /**
	 * Function to verify temp email address
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.verifyTempEmailAddress = (req,res,next)=>{
		
		return new Promise(resolve=>{

			/** Sanitize Data */
			req.body 			= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let validateString	= (req.body.validate_string)	? req.body.validate_string	:"";

			/** Send error response */
			if(!validateString) return resolve({status : STATUS_ERROR, message	: res.__("system.missing_parameters")});

			/** Get user details  **/
			const users = db.collection("users");

			let conditions 	=	COMMONE_CONDITIONS;
			conditions.update_email_verification_string 	=	validateString;
			users.findOne(conditions,{projection: {_id:1,is_verified:1,email:1,temp_email:1}},(err,result)=>{
				if(err) return next(err);
				/** Send error response */
				if(!result) return resolve({status : STATUS_ERROR, message : res.__("user.you_are_using_wrong_link")});
				let updateData		=	{
					$set: {
						email 				: result.temp_email,
						modified			: getUtcDate()
					},
					$unset : {
						temp_email			: 1,
						update_email_verification_string:1
					}
				};

				/** Update user details **/
				users.updateOne({
					_id : ObjectId(result._id)
				},
				updateData,(updateErr,updateResult)=>{
					if(updateErr) return next(updateErr);
					users.findOne({
						_id : ObjectId(result._id)
					},{projection: {_id:1,is_verified:1,email:1}},(resultErr,resultData)=>{

						if(resultErr) return next(resultErr);
						/** Send success response **/
						resolve({
							status 			:	STATUS_SUCCESS,
							updated_data  	: 	resultData,
							message			:	res.__("user.your_email_address_verified_successfully"),
						});
					});
				});
			});
		}).catch(next);
	};//End verifyTempEmailAddress()


}
module.exports = new Profile();
