const crypto 		= require('crypto').createHash;
const asyncParallel = require("async/parallel");
const bcrypt 		= require('bcrypt').hash;
const bcryptCompare	= require('bcrypt').compare;
const asyncEach 	= require("async").each;
const Stripe 		= require('stripe');
const stripe 		= Stripe(STRIP_SEC_KEY);
let referralCodeGenerator = require('referral-code-generator')

function Registration() {
	const Registration = this;

	/**
	 * Function to user registration
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next	As Callback argument to the middleware function
	 *
	 * @return json
	 **/
	 this.userRegistration = (req,res,next)=>{
		return new Promise(async(resolve)=>{
			/*const sendObjData = (obj,from) => {
				return (from && from == "adminpanel" && obj) ? resolve(obj) : res.send(obj);
			}*/
			/** Sanitize Data **/
			req.body 		= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			let userType	= (req.body.user_type)			? req.body.user_type	: "";
			let fromCome	= (req.body && req.body.from)	? req.body.from	: "";
			let userId		= (req.body && req.body.user_id)? req.body.user_id	: "";
			let email       = (req.body.email)          	?   req.body.email.toLowerCase():"";



			if(!userType) {
				return resolve({status : STATUS_ERROR, message	: res.__("system.missing_parameters")});
			}
			if(typeof FRONTEND_USERS_TYPE[userType] === typeof undefined || !FRONTEND_USERS_TYPE[userType]){
				return resolve({status : STATUS_ERROR, message	: res.__("system.invalid_access")});
			}
			//if(req.body.mobile_number) req.body.mobile_number = req.body.mobile_number.replace(/^0+/, '');
			/** Check validation **/
			req.checkBody({
                "full_name": {
                    notEmpty: true,
	                isLength:{
                        options: {
                        	min    : NAME_MIN_LENGTH,
                    		max    : NAME_MAX_LENGTH,
                        },
                        errorMessage: res.__("admin.user.please_enter_name_min",NAME_MIN_LENGTH,NAME_MAX_LENGTH)
                    },
                    errorMessage: res.__("admin.user.please_enter_name")
                },
                "email": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_enter_email"),
                    isEmail: {
                        errorMessage: res.__("admin.user.please_enter_valid_email_address")
                    },
                },
                "address": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_select_address")
                },
                "locality": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_enter_city")
                },
                "gender": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_select_gender")
                },
                /*"postal_code": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_enter_postal_code")
                }*/
                "dob": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_select_dateofbirth")
                },
                /*"time_zone": {
					notEmpty	: true,
					errorMessage: res.__("user.please_select_time_zone")
				},*/
            });
			if(userType && userType == USER_TYPE_HOST){
				req.checkBody({
					"postal_code": {
	                    notEmpty: true,
	                    errorMessage: res.__("admin.user.please_enter_postal_code")
	                },
	                "host_availablity": {
	                    notEmpty: true,
	                    errorMessage: res.__("admin.user.please_select_host_availablity")
	                },
                });
			}
			let password			= (req.body.password)			? 	req.body.password			:"";
            let confirmPassword 	= (req.body.confirm_password)   ? req.body.confirm_password :"";
            let timeZone 			= (req.body && req.body.time_zone) ? req.body.time_zone : "UTC-04:00_US/Eastern";
			if(userId){
				if(password != '' || confirmPassword != ''){
	                /** Check validation for password */
	                req.checkBody({
	                    "password": {
	                        notEmpty: true,
	                        matches: {
						      options: PASSWORD_RAJEX,
						      errorMessage: res.__("admin.user.please_enter_password_rajex")
						    },
	                        errorMessage: res.__("admin.user.please_enter_password")
	                    },
	                    "confirm_password": {
	                        notEmpty: true,
	                        errorMessage: res.__("admin.user.please_enter_confirm_password")
	                    },
	                });
	                /** Validate confirm password*/
	                req.checkBody("confirm_password", res.__("admin.user.confirm_password_should_be_same_as_password")).equals(password);
	            }
            }else{
				req.checkBody({
				   "password": {
				        notEmpty: true,
				        matches: {
					      options: PASSWORD_RAJEX,
					      errorMessage: res.__("admin.user.please_enter_password_rajex")
					    },
				        errorMessage: res.__("admin.user.please_enter_password")
				    },
				    "confirm_password": {
				        notEmpty: true,
				        errorMessage: res.__("admin.user.please_enter_confirm_password")
				    }
				});
				req.checkBody("confirm_password", res.__("admin.user.confirm_password_should_be_same_as_password")).equals(password);

            }



			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);

			if(userType && userType == USER_TYPE_HOST){
	            if(SIGNUP_MULTIPLE_CHOICE_QUESTION && SIGNUP_MULTIPLE_CHOICE_QUESTION.length > 0) {
		            (SIGNUP_MULTIPLE_CHOICE_QUESTION.map(function(questionData, index){
		            	if(req.body && typeof req.body['question_ans_option_'+index] !== typeof undefined){
		            		if(req.body['question_ans_option_'+index] && req.body['question_ans_option_'+index] == ''){
				            	if(!errors) errors =[];
				            	errors.push({'param':"question_ans_option_"+index,'msg':res.__("admin.user.please_select_option")});
			            	}
		            	}else{
		            		if(!errors) errors =[];
		            		errors.push({'param':"question_ans_option_"+index,'msg':res.__("admin.user.please_select_option")});
		            	}
		            }));
		        }
			}
			


			if(!userId){
				if(userType && userType == USER_TYPE_HOST){
					if(!req.files || !req.files.video_task_id_proof){
		                if(!errors) errors =[];
		                errors.push({'param':'video_task_id_proof','msg':res.__("admin.user.please_select_video_task_id_proof")});
		            }

		            if(!req.files || !req.files.ic_contact_agreement_video_task){
		                if(!errors) errors =[];
		                errors.push({'param':'ic_contact_agreement_video_task','msg':res.__("admin.user.please_select_ic_contact_agreement_video_task")});
		            }

		            if(!req.files || !req.files.video_task){
		                if(!errors) errors =[];
		                errors.push({'param':'video_task','msg':res.__("admin.user.please_select_video_task")});
		            }
				
		            if(!req.files || !req.files.profile_picture){
		                if(!errors) errors =[];
		                errors.push({'param':'profile_picture','msg':res.__("admin.user.please_select_profile_picture")});
		            }
	            }
	        }


			
            let type 	= "host_question";
            let options = {type : [type]};
           

            var request = require('request');
			/*await request(BLOCK_MAIL_URL+email, function (error, response, body) {
				let finalBodyData 	=	JSON.parse(body);
			  	if (!error && finalBodyData.status == 200 && (finalBodyData.temporary || finalBodyData.dns == false)) {
			  		if(!errors) errors =[];
			    	errors.push({'param':"email",'msg':res.__("admin.user.please_enter_valid_email_address")});
			    	if(errors && errors.length > 0){
						return resolve({status :	STATUS_ERROR, message :	errors});
					} 
			  	}else{*/

		            if(!errors) errors = [];
		            getMasterList(req,res,next,options).then(response=>{
						if(response.status !== STATUS_SUCCESS) {
							return resolve({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
						}
							
						/** Send  susscess response */
						let finalResult = (response.result && response.result[type]) ? response.result[type] :[];
						if(finalResult.length > 0){
							asyncEach(finalResult, (questionData, callback) => {
								if(userType && userType == USER_TYPE_HOST){
									if(!req.body || !req.body["question_"+questionData.id]){
						                errors.push({'param':"question_"+questionData.id,'msg':res.__("admin.user.please_select_question")});
						            }
									callback(null);
								}else{
									callback(null,null);
								}
							},(err) => {
								/** Send error response **/
								if(errors && errors.length > 0){
									return resolve({status :	STATUS_ERROR, message :	errors});
								} 
								
					            let fullName        	= (req.body.full_name)     	 	?   req.body.full_name      	:"";
								let gender				= (req.body.gender)				? 	req.body.gender				:"";
								let address				= (req.body.address)			? 	req.body.address			:"";
								let city				= (req.body.locality)			? 	req.body.locality			:"";
								let postal_code			= (req.body.postal_code)		? 	req.body.postal_code		:"";
								let referralCode		= (req.body.referral_code)		? 	req.body.referral_code			:"";
								let host_availablity	= (req.body.host_availablity)	? 	req.body.host_availablity	:"";
								let timeStamp			= currentTimeStamp();
								let countryCode			= DEFAULT_COUNTRY_CODE;
								let dob					= (req.body.dob)				? 	req.body.dob			:"";

								let validateString		= crypto("md5").update(timeStamp+email).digest("hex");

								asyncParallel({
									user_data : callback=>{
										let options 		= {
											conditions	:	{
												is_deleted	: NOT_DELETED,
												$or			: [
													{email	: email}
												]
											},
											fields : {_id:1,email:1}
										};
										if(userId){
											options.conditions._id   = {$ne :ObjectId(userId)}
										}

										Registration.getUserData(req,res,next,options).then(response=>{
											if(response && response.status != STATUS_SUCCESS) return callback(response.message,{});
											callback(null,response);
										}).catch(next);
									},
									slug : callback=>{
										/** Set options for get user slug **/
										if(userId) return callback(null,null);
										let slugOptions = {
											title 		: fullName,
											table_name 	: "users",
											slug_field 	: "slug"
										};
										getDatabaseSlug(slugOptions).then(slugResponse=>{
											callback(null,slugResponse);
										});
									},
									email_otp : callback=>{
										/** Get Email Otp */
										if(!userId) return callback(null,null);
										if(!email) return callback(null,'');
										getRandomOTP().then(otp=>{
											callback(null,otp);
										});
									},
									new_password : callback=>{
										if(!password) return callback(null,null);
										bcrypt(password, BCRYPT_PASSWORD_SALT_ROUNDS).then(bcryptPassword=>{
											callback(null,bcryptPassword);
										});
									},
									user_referral_code : callback=>{
										if(referralCode){
											if(userType && userType == USER_TYPE_PLAYER){
												let options 		= {
													conditions	:	{
														is_deleted	: NOT_DELETED,
														$or			: [
															{referral_code	: referralCode}
														]
													},
													fields : {_id:1,referral_code:1}
												};
												Registration.getUserData(req,res,next,options).then(response=>{
													//if(response && response.status != STATUS_SUCCESS) return callback(response.message,{});
													callback(null,response);
												}).catch(next);
											}else{
												callback(null,null);
											}
										}else{
											callback(null,null);
										}
									}
									
								},async (asyncErr,asyncResponse)=>{
									if(asyncErr) return next(asyncErr);

									let userResponseData 		= (asyncResponse.user_data) ? asyncResponse.user_data : {};
									if(userResponseData.status != STATUS_SUCCESS) return next(userResponseData.message);

									let slugResponse	= (asyncResponse.slug) 			? asyncResponse.slug 		: {};
									let emailOTP 		= (asyncResponse.email_otp) 	? asyncResponse.email_otp 	: "";
									let newPassword		= (asyncResponse.new_password)  ? asyncResponse.new_password: "";

									if(userResponseData.result){
										let errMessage	 = [];
										let resultMail 	 = (userResponseData.result.email)		  ? userResponseData.result.email.toLowerCase()	:"";
										let enteredMail  = email ? email.toLowerCase(): "";

										/** Push error message in array if email or mobile already exists*/
										if(enteredMail && resultMail == enteredMail){
											errMessage.push({'param':'email','msg':res.__("user.email_id_is_already_exist")});
										}

										/** Send error response **/

										return resolve({status : STATUS_ERROR, message :errMessage});
									}
									
									
									let otpExpiryTime 	= (res.locals.settings["Site.otp_expiry_time"]) ? res.locals.settings["Site.otp_expiry_time"] : 0;
									let uniqueUserReferralCode 	= (asyncResponse.user_referral_code) ? asyncResponse.user_referral_code : {};
									
									if(referralCode && referralCode != "" && referralCode !== 'null' && !uniqueUserReferralCode.result){
										let errMessage	= [];
										errMessage.push({'param':'referral_code','msg':res.__("user.referral_code_is_not_exist_plaese_enter_valid_code")});
										return resolve({status : STATUS_ERROR, message :	errMessage});
									}

									/** Set data to insert **/
									let insertData = {
										full_name 				: fullName,
										time_zone 				: timeZone,
										email 					: email,
										gender 					: gender,
										address 				: address,
										city 					: city,
										postal_code 			: postal_code,
										country_code			: countryCode,
										user_role_id 			: FRONT_USER_ROLE_ID,
										//created 				: getUtcDate(),
										modified 				: getUtcDate(),
									};

									if(newPassword){
										insertData.password 	=	newPassword;
									}

									if(userType && userType == USER_TYPE_PLAYER){
										insertData.time_zone_val 			= timeZone.split('_')[1];
										if(!referralCode || referralCode == 'null' ){
											if(fullName && fullName.length <= REFERRAL_CODE_PREFIX_LENGTH){
												insertData.referral_code 	= referralCodeGenerator.custom('uppercase', REFERRAL_CODE_PREFIX_LENGTH, REFERRAL_CODE_LENGTH, fullName);
											}else{
												insertData.referral_code 	= referralCodeGenerator.custom('uppercase', REFERRAL_CODE_PREFIX_LENGTH, REFERRAL_CODE_LENGTH, 'referral');
											}
										}else{
											insertData.referral_code 		= referralCode;
										}

										
										try {
											const customer = await stripe.customers.create({
											  description: 'My First Test Customer (created for API docs)',
											});
										}catch(e) {
										    return resolve({status	: STATUS_ERROR,result	: {},message: e.message})
										}
									}else{
										insertData.time_zone_val 			= timeZone.split('_')[0];
									}

									
									try {
										if(userType && userType == USER_TYPE_HOST){
											const account = await stripe.accounts.create({
											  type: STRIPE_ACCOUNT_TYPE,
											});
											
											if(account){
												insertData.stripe_account_id	=	(account && account.id)	?	account.id 	:	"";	
											}
										}else{
											const customer = await stripe.customers.create({
											  name 			: fullName,
											  email 		: email,
											  description 	: 'My First Test Customer (created for API docs)',
											});
											if(customer){
												insertData.customer_id	=	(customer && customer.id)	?	customer.id 	:	"";	
											}
										}
									}catch(e) {
									    return resolve({status	: STATUS_ERROR,result	: {},message: e.message})
									}

									if(!userId){
										insertData.slug 		=	(slugResponse && slugResponse.title) ? slugResponse.title :"";
										insertData.active 		=	ACTIVE;
										insertData.is_deleted 	=	NOT_DELETED;
										insertData.modified 	=	getUtcDate();

										if(fromCome){
											insertData.is_verified 				= NOT_VERIFIED;
											insertData.email_otp				= emailOTP;
										    insertData.email_otp_expiry_time	= getUtcDate(addMinute(otpExpiryTime));
											insertData.validate_string			= validateString;
											if(userType && userType == USER_TYPE_HOST){
												insertData.approval_status		= USER_STATUS_PENDING;
											}else{
												insertData.approval_status		= USER_STATUS_APPROVED;
											}
										}else{
											insertData.is_verified 				= VERIFIED;
											insertData.approval_status			= USER_STATUS_APPROVED;
										}
									}

									if(userType && userType == USER_TYPE_HOST){
										insertData.host_availablity 		= host_availablity;
									}else{
										//insertData.dob 		 				= dob;	
									}
									insertData.dob 		 				= dob;	
									asyncEach(finalResult, (questionData, callback) => {
										if(userType && userType == USER_TYPE_HOST){
											insertData["question_"+questionData.id] = req.body["question_"+questionData.id];
											callback(null);
										}else{
											callback(null,null);
										}
									},(err) => {
										let index	=	0
										asyncEach(SIGNUP_MULTIPLE_CHOICE_QUESTION, (optionsChoice, callback) => {
											if(userType && userType == USER_TYPE_HOST){
												insertData['question_ans_option_'+index] = req.body['question_ans_option_'+index];
												index++;
												callback(null);
											}else{
												callback(null,null);
											}

										},(err) => {
											/**Insert conditional data */
											if(userType && userType != "" && typeof FRONTEND_USERS_TYPE[userType] !== typeof undefined){
												insertData[userType] 		=  true;
												insertData.user_type        =  userType;
											}
											let imgErrors 		= 	[];
											let imgaeOptions    =   {};
											//if(userType && userType == USER_TYPE_HOST){
												
												let profileImg      	=   (req.files && req.files.profile_picture)  ?   req.files.profile_picture :'';
											    imgaeOptions.image     	=   profileImg;
											    imgaeOptions.oldPath 	= 	(req.body && req.body.profile_picture_old_image)  ?   req.body.profile_picture_old_image :{};;
											    imgaeOptions.filePath  	=   USERS_FILE_PATH;

												imgaeOptions.allowedExtensions	= ALLOWED_IMAGE_PDF_EXTENSIONS;
												imgaeOptions.allowedImageError	= ALLOWED_IMAGE_PDF_ERROR_MESSAGE;
			 
												imgaeOptions.allowedMimeTypes	= ALLOWED_IMAGE_PDF_MIME_EXTENSIONS;
												imgaeOptions.allowedMimeError	= ALLOWED_IMAGE_PDF_MIME_ERROR_MESSAGE;
											//}

											
											moveUploadedFile(req, res, imgaeOptions).then(imageResponse => {
												console.log(imageResponse,"imageResponse");
												if(imageResponse.status == STATUS_SUCCESS) {
													let videoTaskOptions    =   {}
													if(userType && userType == USER_TYPE_HOST){
													
													    let videoTask       				=   (req.files && req.files.video_task)  ?   req.files.video_task :'';
														videoTaskOptions.image     			=   videoTask;
											    		videoTaskOptions.oldPath 			= 	(req.body && req.body.video_task_old_image)  ?   req.body.video_task_old_image :{};;
											    		videoTaskOptions.filePath  			=   USERS_VIDEO_FILE_PATH;
											    		videoTaskOptions.allowedExtensions  =   ALLOWED_VIDEO_EXTENSIONS;
											    		videoTaskOptions.allowedImageError  =   ALLOWED_VIDEO_ERROR_MESSAGE;
											    		videoTaskOptions.allowedMimeTypes  	=   ALLOWED_VIDEO_MIME_EXTENSIONS;
											    		videoTaskOptions.allowedMimeError  	=   ALLOWED_VIDEO_MIME_ERROR_MESSAGE;
													}
													
													moveUploadedFile(req, res, videoTaskOptions).then(videoTaskResponse => {
														if(videoTaskResponse.status == STATUS_SUCCESS) {
																let videoTaskIdProof      	=   (req.files && req.files.video_task_id_proof)  ?   req.files.video_task_id_proof :'';
															    videoTaskOptions.image      =   videoTaskIdProof;
															    videoTaskOptions.oldPath 	= 	(req.body && req.body.video_task_id_proof_old_image)  ?   req.body.video_task_id_proof_old_image :{};;
															    videoTaskOptions.filePath   =   USERS_ID_PROOF_FILE_PATH;
															moveUploadedFile(req, res, videoTaskOptions).then(videoTaskIdProofResponse => {
																if(videoTaskIdProofResponse.status == STATUS_SUCCESS) {
																	if(userType && userType == USER_TYPE_HOST){
																		let icContactAgreementvideoTask       		=   (req.files && req.files.ic_contact_agreement_video_task)  ?   req.files.ic_contact_agreement_video_task :'';
																		videoTaskOptions.image     					=   icContactAgreementvideoTask;
															    		videoTaskOptions.oldPath 					= 	(req.body && req.body.ic_contact_agreement_video_task_old_image)  ?   req.body.ic_contact_agreement_video_task_old_image :{};;
															    		videoTaskOptions.filePath  					=   USERS_CONTACT_AGREEMENT_FILE_PATH;
																	}
																	moveUploadedFile(req, res, videoTaskOptions).then(videoTaskIcContactResponse => {
																		if(videoTaskIcContactResponse.status == STATUS_SUCCESS) {
																			if(userType && userType == USER_TYPE_HOST){
																				insertData.video_task 						= videoTaskResponse.fileName;
																				insertData.ic_contact_agreement_video_task 	= videoTaskIcContactResponse.fileName;
																				insertData.id_proof_video_task				= videoTaskIdProofResponse.fileName;
																			}
																			insertData.profile_picture 			= (userType && userType == USER_TYPE_HOST)?imageResponse.fileName:'';
																			
																			/** Save user details  **/
																			const users	= db.collection("users");
																			let conditionsField = {}
																			let isEditable 		= false;
																			let insertedUserId 		= '';
																			if(userId){
																				conditionsField._id =	ObjectId(userId);
																				isEditable 			=	true;
																			}else{
																				conditionsField._id =	ObjectId(); 
																				insertedUserId 		=	ObjectId();
																			}
																			

																			users.updateOne(conditionsField,
																			{
																				$set : insertData,
																				$setOnInsert: {
																					created 	: 	getUtcDate(),
																				}
																			},{upsert: true},(err,response) => {
																				if(err) return next(err);

																				let addmsg 	= (fromCome)?res.__("user.user_registered_successfully_message"):res.__("admin.user.user_has_been_added_successfully");
																				let message = (isEditable) ? res.__("admin.user.user_details_has_been_updated_successfully") :addmsg;

																				if(!isEditable && userType && userType == USER_TYPE_PLAYER && uniqueUserReferralCode && uniqueUserReferralCode.result && uniqueUserReferralCode.result._id && response.upsertedId._id){
																					const user_referrals	= db.collection("user_referrals");
																					user_referrals.insertOne({
																						referral_user 	: ObjectId(response.upsertedId._id),
																						referral_user_by: ObjectId(uniqueUserReferralCode.result._id), 
																						redeem_credits  : NOT_CREDITES,
																						status  		: NOT_CREDITES,
																						modified 		: getUtcDate(),
																						created 		: getUtcDate(),
																					},(err,result)=>{
																						if(err) return next(err);
																						/** Send success response **/
																						
																						const user_referral_logs	= db.collection("user_referral_logs");
																						user_referral_logs.insertOne({
																							referral_user 	: ObjectId(response.upsertedId._id),
																							referral_user_by: ObjectId(uniqueUserReferralCode.result._id), 
																							user_referral_id: ObjectId(result.insertedId), 
																							redeem_credits  : NOT_CREDITES,
																							status  		: NOT_CREDITES,
																							type  			: CREDIT,
																							modified 		: getUtcDate(),
																							created 		: getUtcDate(),
																						},(err,result)=>{
																							if(err) return next(result);
																							/** Send success response **/
																							
																							resolve({status:STATUS_SUCCESS,message:message});
																							if(!isEditable && response.upsertedId){
																								/*************** Send Login Credentials To User  ***************/
																								if(fromCome){
																									let sendMailOptions	= {
																										event_type 		: USER_REGISTRATION_EMAIL_EVENTS,
																										user_id			: response.upsertedId._id,
																										validate_string	: validateString,
																									};
																									sendMailToUsers(req,res,sendMailOptions);
																								}
																								/*************** Send Login Credentials To User  ***************/
																							}
																						});
																					});
																				}else{

																					/** Send success response **/
																					resolve({status:STATUS_SUCCESS,message:message});
																					if(!isEditable && response.upsertedId){
																						/*************** Send Login Credentials To User  ***************/
																						if(fromCome){
																							let sendMailOptions	= {
																								event_type 		: USER_REGISTRATION_EMAIL_EVENTS,
																								user_id			: response.upsertedId._id,
																								validate_string	: validateString,
																							};
																							sendMailToUsers(req,res,sendMailOptions);
																						}
																						/*************** Send Login Credentials To User  ***************/
																					}
																				}
																			});
																		}else{
																			

																			let userProfileimg 	= (imageResponse.fileName) ? imageResponse.fileName : "";
																			removeFile({file_path : USERS_FILE_PATH+userProfileimg}).then(response=>{ });

																			let userVideoFile	= (videoTaskResponse.fileName) ? videoTaskResponse.fileName : "";
																			removeFile({file_path : USERS_VIDEO_FILE_PATH+userVideoFile}).then(response=>{ });

																			let userIdProofVideoFile = (videoTaskIdProofResponse.fileName) ? videoTaskIdProofResponse.fileName : "";
																			removeFile({file_path : USERS_ID_PROOF_FILE_PATH+userIdProofVideoFile}).then(response=>{ });

																			return resolve({
																				status	: STATUS_ERROR,
																				message	: [{'param':'ic_contact_agreement_video_task','msg':videoTaskIcContactResponse.message}],
																			});
																		}
																	}).catch(next);
																}else{
																	
																	let userProfileimg 	= (imageResponse.fileName) ? imageResponse.fileName : "";
																	removeFile({file_path : USERS_FILE_PATH+userProfileimg}).then(response=>{ });

																	let userVideoFile	= (videoTaskResponse.fileName) ? videoTaskResponse.fileName : "";
																	removeFile({file_path : USERS_VIDEO_FILE_PATH+userVideoFile}).then(response=>{ });

																	
																	return resolve({
																		status	: STATUS_ERROR,
																		message	: [{'param':'video_task_id_proof','msg':videoTaskIdProofResponse.message}],
																	});
																}
															}).catch(next);
														}else{

															let userProfileimg 	= (imageResponse.fileName) ? imageResponse.fileName : "";
															removeFile({file_path : USERS_FILE_PATH+userProfileimg}).then(response=>{ });


															return resolve({
																status	: STATUS_ERROR,
																message	: [{'param':'video_task','msg':videoTaskResponse.message}],
															});
														}
													}).catch(next);
												}else{
													return resolve({
														status	: STATUS_ERROR,
														message	: [{'param':'profile_picture','msg':imageResponse.message}],
													});

													//let removeImage = (element.image) ? element.image : "";
													//removeFile({file_path : USERS_FILE_PATH+removeImage}).then(response=>{ });
												}
											}).catch(next);
										})
									})
								});
							});
						}
					}).catch(next);
				//}
			//});
		});
	};// end userRegistration()

	/**
	 * Function to get user data
	 *
	 * @param req		As	Request Data
	 * @param res		As 	Response Data
	 * @param options	As  object of data
	 *
	 * @return json
	 **/
	this.getUserData = (req,res,next,options) => {
		return new Promise(resolve=>{
			let conditions	= (options.conditions)	? options.conditions	:{};
			let fields		= (options.fields)		? options.fields		:{};
			if(!conditions){
				/** Send error response **/
				return resolve({
					status	: STATUS_ERROR,
					message	: res.__("system.something_going_wrong_please_try_again")
				});
			}

			/** Get user details **/
			const users	= db.collection("users");
			users.findOne(conditions,{projection: fields},(err,result)=>{
				if(err){
					/** Send error response **/
					let response = {
						status	: STATUS_ERROR,
						message	: res.__("system.something_going_wrong_please_try_again")
					};
					return resolve(response);
				}

				/** Send success response **/
				if(!result)return resolve({status : STATUS_SUCCESS,result : false});

				/** Send success response **/
				if(!result.profile_picture)return resolve({status	: STATUS_SUCCESS,result : result});

				/** Set options for append image **/
				let imageOptions = {
					"file_url" 			: USERS_URL,
					"file_path" 		: USERS_FILE_PATH,
					"result" 			: [result],
					"database_field" 	: "profile_picture"
				};

				/** Append image with full path **/
				appendFileExistData(imageOptions).then(fileResponse=>{
					/** Send success response **/
					resolve({
						status	: STATUS_SUCCESS,
						result 	: (fileResponse && fileResponse.result && fileResponse.result[0])	?	fileResponse.result[0]	:{}
					});
				});
			});
		}).catch(next);
	};// end getUserData()


	/**
	 * Function for login user
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next	As Callback argument to the middleware function
	 *
	 * @return json
	 **/
	this.userLogin =  (req,res,next)=>{
		return new Promise(async (resolve)=>{
			/** Sanitize Data **/
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			/** Check validation **/
			req.checkBody({
				'user_name': {
					notEmpty		: true,
					errorMessage	: res.__("user.please_enter_user_name"),
					matches			: {
						options		: [EMAIL_REGULAR_EXPRESSION],
						errorMessage: res.__("user.please_enter_valid_email_address")
					},
				},
				"password": {
					notEmpty	: true,
					errorMessage: res.__("user.please_enter_password")
				},
			});

			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);
			/** Send error response **/
			if(errors) return resolve({status : STATUS_ERROR, message	: errors});

			let userName 	= (req.body.user_name)	? (req.body.user_name).toLowerCase() :"";
			let password 	= (req.body.password)	? req.body.password	 :"";

			/** Set conditions **/
			let conditions	=	{
				user_role_id	: FRONT_USER_ROLE_ID,
				is_deleted		: NOT_DELETED,
				"$or"			: [
					{"email"	: {$regex : '^'+userName+'$',$options : 'i'}}, //check user name with case insensitive
				],
			};

			/** Set options data for get user details **/
			let userOptions = {
				conditions	: conditions,
				fields		: {is_deleted:0,created:0,modified:0}
			};

			/** Get user details **/
			let userResponse = await getUserData(req,res,next,userOptions);


			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
			let resultData	= (userResponse.result) ? userResponse.result :"";
			if(!resultData){
				/** Send error/success response **/
				return resolve({
					status	: STATUS_ERROR,
					message	: [{"param":"password","msg":res.__("user.email_password_entered_incorrect")}]
				});
			}
			/**Check password is matched or not */
			let userPassword 	= (resultData.password) ? resultData.password : "";
			let isPasswordMatch	= await bcryptCompare(password, userPassword);
			if(!isPasswordMatch){
				return resolve({
					status	: STATUS_ERROR,
					message	: [{"param":"password","msg":res.__("user.email_password_entered_incorrect")}]
				});
			}

			if(resultData.is_verified != VERIFIED){
				/** Response if user not verifird by admin*/
				// return resolve({
				// 	status	: STATUS_ERROR,
				// 	message	: res.__("user.account_is_not_verified")
				// });
				let verifyLinkAgain	=	FRONT_WEBSITE_URL+"resend_verification_link/"+resultData.validate_string;
				return resolve({status : STATUS_ERROR, message	: res.__("user.account_is_not_verified")+' '+'<a href="'+verifyLinkAgain+'" class="form_link">'+res.__("user.resend_verification_link")+'</a>'});
			}
			if(resultData.active != ACTIVE){
				/** Response if user deactivated by admin*/
				return resolve({
					status	: STATUS_ERROR,
					message	: res.__("user.account_temporarily_disabled")
				});
				//return resolve({status : STATUS_ERROR, message	: [{param : "password",msg :res.__("user.account_temporarily_disabled")}]});
			}
			if(resultData.approval_status != USER_STATUS_APPROVED){
				/** Response if user not approved by admin*/
				return resolve({
					status	: STATUS_ERROR,
					message	: res.__("user.account_not_approved_by_admin")
				});
				//return resolve({status : STATUS_ERROR, message	: [{param : "password",msg :res.__("user.account_not_approved_by_admin")}]});
			}

			/*if(resultData && resultData.user_type == USER_TYPE_HOST){
				if(resultData && resultData.zoom_user_create && resultData.zoom_user_create.id){
					let zoomUserId  = (resultData.zoom_user_create.id)?resultData.zoom_user_create.id:"";
					const jwt 	= require('jsonwebtoken');
					const payload = {
					    iss: ZOOM_API_KEY,
					    exp: ((new Date()).getTime() + 5000)
					};
					const token = jwt.sign(payload, ZOOM_API_SECRET);
					var request = require("request");
					var options = {
					  method 		: 'GET',
					  url 			: CHECK_USER_ZOOM_URL+zoomUserId,
					  headers		: {'content-type': 'application/json', authorization: `Bearer ${token}`},
					};

					request(options, function (error, response, body) {
					  if (error) throw new Error(error);
					  let 	mainBody 	=	JSON.parse(body);
					  if(mainBody && Object.keys(mainBody).length>0 && mainBody.status == 'active'){
					  	return resolve({
							status	: STATUS_SUCCESS,
							result	: resultData
						});
					  }else{
					  	return resolve({
							status	: STATUS_ERROR,
							message	: res.__("user.account_not_verified_by_zoom")
						});
					  }
					 
					});
				}else{
					return resolve({
						status	: STATUS_ERROR,
						message	: res.__("user.account_not_verified_by_zoom")
					});
				}
			}*/

			return resolve({
				status	: STATUS_SUCCESS,
				result	: resultData
			});
		});
	};//End userLogin()

	/**
	 * Function to verify email address
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.verifyEmailAddress = (req,res,next)=>{
		
		return new Promise(resolve=>{
			/** Sanitize Data */
			req.body 			= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let validateString	= (req.body.validate_string)	? req.body.validate_string	:"";

			/** Send error response */
			if(!validateString) return resolve({status : STATUS_ERROR, message	: res.__("system.missing_parameters")});

			/** Get user details  **/
			const users = db.collection("users");
			users.findOne({
				is_deleted				: NOT_DELETED,
				validate_string			: validateString,
			},{projection: {_id:1,user_role_id:1,user_type:1,is_verified:1,email:1,full_name:1}},(err,result)=>{
				if(err) return next(err);

				/** Send error response */
				if(!result) return resolve({status : STATUS_ERROR, message : res.__("user.you_are_using_wrong_link")});
				if(result && result.is_verified == VERIFIED){
					//return resolve({status : STATUS_SUCCESS, redirect_url : WEBSITE_URL+"dashboard"});
					return resolve({status : STATUS_ERROR, message : res.__("user.already_verified_link")});
				}

				let email			= (result.email)		? result.email			: "";
				let fullName		= (result.full_name) 	? result.full_name		: "";


				let updateData		=	{
					$set: {
						is_verified			: VERIFIED,
						modified			: getUtcDate()
					},
					/*$unset : {
						validate_string	: 1
					}*/
				};

				/** Update user details **/
				users.updateOne({
					_id : ObjectId(result._id)
				},
				updateData,(updateErr,updateResult)=>{
					if(updateErr) return next(updateErr);
					/** Send success response **/
					resolve({
						status 	:	STATUS_SUCCESS,
						result  : 	result,
						message	:	res.__("user.your_email_address_verified_successfully"),
					});

					/*********** Send email for verify email ***************/
					let emailOptions 	= {
						to 				: email,
						action 			: "account_verification",
						rep_array 		: [fullName]
					};
					sendMail(req,res,emailOptions);
					/*********** Send email for verify ***************/
				
				});

				

			});
		}).catch(next);
	};//End verifyEmailAddress()

	/**
	 * Function for recover forgot password
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 **/
    this.userForgotPassword = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body 	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			/** Check validation **/
			req.checkBody({
				'user_name': {
					notEmpty		: true,
					errorMessage	: res.__("user.please_enter_user_name"),
					matches			: {
						options		: [EMAIL_REGULAR_EXPRESSION],
						errorMessage: res.__("user.please_enter_valid_email_address")
					},
				},
			});

			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);

			/** Send error response **/
			if(errors) return resolve({status : STATUS_ERROR, message: errors});
			let userName	= (req.body.user_name)	? req.body.user_name.toLowerCase() :"";

			/** Set options for get user details **/
			let options = {
				conditions			: {
					user_role_id	: FRONT_USER_ROLE_ID,
					is_deleted		: NOT_DELETED
				},
				fields	:	{
					_id :1,full_name:1,is_verified:1,active:1,email:1
				}
			};
			/**Condition  for email*/
			options.conditions.email	= userName;
			/** Get user details **/
			let response =  await getUserData(req,res,next,options);
			if(response.status != STATUS_SUCCESS) return next(response.message);

			/** Send error response **/
			if(!response.result) return resolve({status : STATUS_ERROR, message	: [{param : "user_name",msg :res.__("user.email_not_registered")}]});

			let result 			= response.result;
			let activeStatus	= (result.active)		? result.active			: "";
			let verifiedStatus	= (result.is_verified)	? result.is_verified	: "";
			let email			= (result.email)		? result.email			: "";
			let fullName		= (result.full_name) 	? result.full_name		: "";

			let timeStamp				= currentTimeStamp();
			let forgotValidateString	= crypto("md5").update(timeStamp+email).digest("hex");
			/** Send error response **/
			if(activeStatus != ACTIVE) return resolve({status : STATUS_ERROR, message	: [{param : "user_name",msg :res.__("user.account_temporarily_disabled")}]});
			/** Send error response **/
			if(verifiedStatus != VERIFIED) return resolve({status : STATUS_ERROR, message : [{param : "user_name",msg :res.__("user.account_is_not_verified")}]});

			let dataToBeSaved = {
				modified				: getUtcDate(),
				forgot_validate_string	: forgotValidateString,
			};
			/** Update otp number **/
			const users = db.collection("users");
			users.updateOne({_id : ObjectId(result._id)},{$set	: dataToBeSaved},(updateErr,updateResult)=>{
				if(updateErr) return next(updateErr);

				/*********** Send email for forgot password ***************/
				let verifyLink		=	FRONT_WEBSITE_URL+"reset_password/"+forgotValidateString;
				let verifyClickLink	=	'<a target="_blank" href='+FRONT_WEBSITE_URL+"reset_password/"+forgotValidateString+'>'+ res.__("system.click_here") +'</a>';
				let emailOptions 	= {
					to 				: email,
					action 			: "forgot_password",
					rep_array 		: [fullName,verifyLink,verifyClickLink]
				};
				sendMail(req,res,emailOptions);
				/*********** Send email for forgot password ***************/

				/** Send success response **/
				let returnResponse = {
					status 		: STATUS_SUCCESS,
					message		: res.__("user.verification_link_sent_successfully_on_email",email),
					forgot_validate_string 	: forgotValidateString
				};
				/** Send success response **/
				resolve(returnResponse);
			});
		});
	};// end forgotPassword()

	/**
	 * Function to check Reset Password Email
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.checkResetPassword = (req, res,next)=>{
		return new Promise(async resolve=>{
			let forgotPasswordValidateString = (req.body.forgot_password_validate_string) ? req.body.forgot_password_validate_string 	:"";
			/** Send error response */
			if(!forgotPasswordValidateString) return resolve({status : STATUS_ERROR, message: res.__("system.missing_parameters")});
			/** Get user details  **/
			const users = db.collection("users");
			users.findOne({
				is_deleted				: NOT_DELETED,
				forgot_validate_string	: forgotPasswordValidateString,
			},{projection: {_id:1,user_role_id:1}},(err,result)=>{
				if(err) return next(err);
				/** Send error response */
				if(!result) return resolve({status : STATUS_ERROR, message: res.__("user.you_are_using_wrong_link")});
				
				resolve({status : STATUS_SUCCESS,forgot_validate_string: forgotPasswordValidateString});
			});
		});
	};//End checkResetPassword()

	/**
	 * Function to reset Password email
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.resetPassword = (req, res,next)=>{
		return new Promise(async resolve=>{
			let forgotPasswordValidateString = (req.body.forgot_password_validate_string) ? req.body.forgot_password_validate_string 	:"";

			/** Send error response */
			if(!forgotPasswordValidateString) return resolve({status : STATUS_ERROR, message: res.__("system.missing_parameters")});
			req.body 		= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			req.checkBody({
				"password": {
					notEmpty	: 	true,
					isLength	:	{
						options			: PASSWORD_LENGTH,
						errorMessage	: res.__("user.password_length_should_be_minimum_6_character")
					},
					errorMessage: res.__("user.please_enter_password")
				},
				"confirm_password": {
					notEmpty		: true,
					isLength:{
						options: PASSWORD_LENGTH,
						errorMessage: res.__("user.confirm_password_length_should_be_minimum_6_character")
					},
					errorMessage	: res.__("user.please_enter_confirm_password")
				},
			});
			req.checkBody('confirm_password', res.__("user.confirm_password_should_be_same_as_password")).equals(req.body.password);
			let errors = parseValidation(req.validationErrors(),req);
			/** Send error response **/
			if(errors) return resolve({status : STATUS_ERROR, message : errors});

			let userType			= (req.body.user_type)		? req.body.user_type 	: "";
			let password			= (req.body.password)		? req.body.password		: "";
			const users = db.collection("users");
			asyncParallel({
				user_data : callback=>{

					users.findOne({
						is_deleted				: NOT_DELETED,
						forgot_validate_string	: forgotPasswordValidateString,
					},{projection: {_id:1,user_role_id:1,email:1,full_name:1}},(err,result)=>{

						if(err) return next(err);

						/** Send error response */
						//if(!result) return callback(null,result);;
						if(!result)  return resolve({status : STATUS_ERROR, message : res.__("user.you_are_using_wrong_link")});
						callback(null,result);
					});
				},
				new_password : callback=>{
					bcrypt(password, BCRYPT_PASSWORD_SALT_ROUNDS).then(bcryptPassword=>{
						callback(null,bcryptPassword);
					});
				}
			},(asyncErr,asyncResponse)=>{
				if(asyncErr) return next(asyncErr);
				let userResponseData = (asyncResponse.user_data) ? asyncResponse.user_data : {};
				//if(!userResponseData) return res.send({status : STATUS_ERROR,redirect_url: WEBSITE_URL, message : res.__("user.you_are_using_wrong_link")});

				let newPassword		 = (asyncResponse.new_password) ? asyncResponse.new_password : "";

				let updateData		 =	{
					$set: {
						password			: newPassword,
						modified			: getUtcDate()
					},
					$unset : {
						forgot_validate_string	: 1
					}
				};

				/** Update user details **/
				users.updateOne({
					_id : ObjectId(userResponseData._id)
				},
				updateData,(updateErr,updateResult)=>{
					if(updateErr) return next(updateErr);

					/** Send success response **/
					resolve({
						status		:	STATUS_SUCCESS,
						message 	:  	res.__("user.user_password_changed_successfully"),
					});

					/*************** Send Reset Password info mail  ***************/
					let emailOptions 	= {
						to 				: userResponseData.email,
						action 			: "reset_password",
						rep_array 		: [userResponseData.full_name]
					};
					sendMail(req,res,emailOptions);
					/*************** Send Reset Password info mail ***************/
				});
			});
		});
	};// end resetPassword()

	/**
	 * Function for resend email to verify email link
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.resendVerifyEmailLink = (req,res,next)=>{
		let verificationString	= 	(req.body.verification_validate_string) ? req.body.verification_validate_string :"";
		return new Promise(resolve=>{
			/** Send error response */
			if(!verificationString){
				res.send({
					status		:	STATUS_ERROR,
					message 	:  	res.__("user.link_expired_or_wrong_link"),
				});
			}
			/** Get user details  **/
			const users = db.collection("users");
			users.findOne({
				validate_string	: verificationString,
				is_deleted		: NOT_DELETED
			},{projection: {_id:1,email:1,full_name:1}},(err,result)=>{
				if(err) return next(err);
				/** Send error response */
				if(!result || !result._id){
					resolve({
						status		:	STATUS_ERROR,
						message 	:  	res.__("user.link_expired_or_wrong_link"),
					});
				}

				let timeStamp			= 	currentTimeStamp();
				let userEmail 			= 	(result.email) 			? result.email 			:"";
				let userName 			= 	(result.full_name) 		? result.full_name 		:"";
				let newValidateString	= 	crypto("md5").update(timeStamp+userEmail).digest("hex");
				/** Update user details **/
				users.updateOne({
					_id : ObjectId(result._id)
				},
				{$set: {
					validate_string	: newValidateString,
					modified		: getUtcDate()
				}},(updateErr,updateResult)=>{
					if(updateErr) return next(updateErr);

					/******* Send verify email to user *******/
						let verifyLink	=	FRONT_WEBSITE_URL+"verify_email/"+newValidateString;
						sendMail(req,res,{
							to 			: userEmail,
							action 		: "email_verification_link",
							rep_array 	: [userName,verifyLink]
						});
					/******* Send verify email to user *******/

					/** Send success response **/
					resolve({status:STATUS_SUCCESS,message : res.__("user.verification_link_send_to_email",userEmail)});
				});
			});
		});
	};//End resendVerifyEmailLink()

	
}
module.exports = new Registration();
