const request 			= require('request');
var objectID 			= require('mongodb').ObjectID
const asyncParallel 	= require("async/parallel");
const asyncEach			= require("async/each");
const asyncforEachOf 	= require("async").forEachOf;

function Master() {

    /**
	 * Function to get master list
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getMasterList = (req,res,next)=>{
		return new Promise(async resolve=>{
			let type 		= (req.body.type) 		? req.body.type :"";
			//let parentId 	= (req.body.parent_id)	? req.body.parent_id :"";

			/** Send error response */
			if(!type) return resolve({status : STATUS_ERROR, message : res.__("system.missing_parameters")});

			/** Set options **/
			let options ={type : [type]};
			//if(parentId) options.parent_id = parentId;

			/** Get master list **/
			getMasterList(req,res,next,options).then(response=>{
				if(response.status !== STATUS_SUCCESS) return resolve({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				
				/** Send  susscess response */
				let finalResult = (response.result && response.result[type]) ? response.result[type] :[];
				resolve({status : STATUS_SUCCESS, result : finalResult});
			}).catch(next);
		});
	};//End getMasterList()

	/**
	 * Function for submit contact us form
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.addContactUs = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body 	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			
			/** Check validation **/
			req.checkBody({
				"name": {
					notEmpty		: true,
					errorMessage	: res.__("contact_us.please_enter_name")
				},
				"email": {
					notEmpty	: true,
					errorMessage: res.__("contact_us.please_enter_email"),
					isEmail	: 	{
						errorMessage : res.__("contact_us.please_enter_valid_email_address")
					},
				},
				/*"mobile_number": {
					notEmpty	: true,
					isNumeric	:		{
						errorMessage: res.__("contact_us.invalid_mobile_number")
					},
					isLength	:	{
						options		: MOBILE_NUMBER_LENGTH,
						errorMessage: res.__("user.invalid_mobile_number")
					},
					errorMessage: res.__("contact_us.please_enter_mobile_number"),
				},*/
				/*"subject": {
					notEmpty		: true,
					errorMessage	: res.__("contact_us.please_enter_subject")
				},*/
				"message": {
					notEmpty		: true,
					errorMessage	: res.__("contact_us.please_enter_message")
				},
			});


			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);

			if(req.body['recaptcha'] === undefined || req.body['recaptcha'] === '' || req.body['recaptcha'] === null){
				if(!errors) errors =[];
				errors.push({'param':'recaptcha','msg':res.__("causes.please_select_g-recaptcha-response")});
			}
			/** Send error response **/
			if(errors) return resolve({status : STATUS_ERROR, message : errors});

			const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + GOOGLE_SECRET_KEY + "&response=" + req.body['recaptcha'] + "&remoteip=" + req.connection.remoteAddress;

			request(verificationURL,function(error,response,body) {
				bodyData = JSON.parse(body);
				if(bodyData.success !== undefined && !bodyData.success) {
				    return 	resolve({
								status		:	STATUS_SUCCESS,
								redirect_url:  	WEBSITE_URL+"contact-us",
								message		:	res.__("system.failed_captcha_verification"),
							});
				}

				/** Save contacts details */
				const contacts = db.collection('contacts');
				contacts.insertOne({
					name 		: req.body.name,
					email 		: req.body.email,
					message 	: req.body.message,
					modified 	: getUtcDate(),
					created 	: getUtcDate(),
				},async (err,result)=>{
					if(err) return next(result);
					req.flash(STATUS_SUCCESS,res.__("contact_us.contact_has_been_saved_successfully"));
					/** Send success response **/
					resolve({
						status		:	STATUS_SUCCESS,
						redirect_url:  	WEBSITE_URL+"contact-us",
						message		:	res.__("contact_us.contact_has_been_saved_successfully"),
					});

					/*************** Send Mail To Admin  ***************/
					sendMailToUsers(req,res,{
						event_type 	: USER_CONTACT_US_EVENTS,
						name		: req.body.name,
						email 		: req.body.email,
						message 	: req.body.message,
					});
				});
			});
		});
	};//End addContactUs()


	/**
	 * Function to get Slider's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getSliderDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			let sliderType = (req.body.slider_type) ? req.body.slider_type : "";
			/** Get Slider details **/
			const slider = db.collection('slider');
			slider.find({
				slider_name : sliderType,
				status 		: ACTIVE,
				//is_featured : FEATURED,
				display_on_home_page : DISPLAY
			},{projection: {_id:1,slider_name:1,body:1,modified:1,slider_descriptions:1,body_description:1,display_on_home_page:1,is_featured:1,action_name:1,slider_url:1,status:1,slider_image:1}}).toArray((err,result)=>{
				if(err) return next(err);
				if(!result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				/** Set options for append image full path **/
				let options = {
				    "file_url"          :   SLIDERS_URL,
				    "file_path"         :   SLIDERS_FILE_PATH,
				    "result"            :   result,
				    "database_field"    :   "slider_image"
				};

				/** Append image with full path **/
				appendFileExistData(options).then(fileResponse=>{
				    let response = {
				        status  : STATUS_SUCCESS,
				        result  : (fileResponse && fileResponse.result && fileResponse.result)   ?   fileResponse.result  :{}
				    };
				    resolve(response);
				});
			});
		});
	};// End getSliderDetails().

	/**
	 * Function to get Block's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getBlockDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Get Slider details **/
			const block = db.collection('block');
			block.find({
				status 		: ACTIVE,
			},{projection: {_id:1,block_name:1,block_descriptions:1,slug:1,status:1,modified:1}}).toArray((err,result)=>{
				if(err) return next(err);
				if(!result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			    resolve({ status  : STATUS_SUCCESS,result  : result});
			});
		});
	};// End getBlockDetails().


	/**
	 * Function to get Faq's/Help Center detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getFaqDetails = (req,res,next)=>{
		let faqId 		= (req.body.faq_id) ? req.body.faq_id : "";
		let faqCatId 	= (req.body.faq_category) ? req.body.faq_category : "";
		let searchContent = (req.body.search_content) ? req.body.search_content : "";
		let limit = (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
		let userType = (req.body.user_type) ? req.body.user_type : "";
		return new Promise(async resolve=>{
			let conditions = {};
			let faqObjId = (req.body.faq_id) ? 	decodeId(req.body.faq_id) : "";
			if(faqId && !objectID.isValid(faqObjId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			let faqCategoryId = (req.body.faq_category) ? 	decodeId(req.body.faq_category) : "";

			/** Get faq details **/
			const faqs = db.collection('faqs');
			//if(faqId) conditions._id = ObjectId(faqObjId);
			if(faqCategoryId) conditions.faq_category = ObjectId(faqCategoryId);
			if(userType) conditions.user_type = userType;
			if(searchContent) conditions.question =  {'$regex': searchContent, '$options' : 'i'};

			asyncParallel([
                (callback)=>{
                    /** Get list of faq's **/
                    faqs.aggregate([
						{$match : conditions},
						{$limit: limit },
						{$lookup: {
							from 		: 	"masters",
							localField	: 	"faq_category",
							foreignField: 	"_id",
							as 			: 	"faq_category_data"
						}},
						{$sort: {order : SORT_ASC}},
						{$project : {question:1,faq_ans:1,order:1,faq_category:1,modified:1,faq_category_name:{"$arrayElemAt":["$faq_category_data.name",0]}}},
					]).toArray((err, result)=>{
                        callback(err, result);
                    });
                },
                (callback)=>{
                    /** Get total number of records in faqs collection **/
                    faqs.countDocuments(conditions,(err,countResult)=>{
                        callback(err, countResult);
                    });
                }
            ],
            (err,response)=>{
                /** Send response **/
                if(err) return next(err);
				//if(!result && result.length > 0) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				if(!faqId){
					return  resolve({ 
						status  		: (!err) 		? STATUS_SUCCESS: STATUS_ERROR,
						result 			: (response[0]) ? response[0] 	: [],
						recordsTotal    : (response[1]) ? response[1] 	: 0
					}); 

				}

				faqs.find({
					faq_category    : (response[0] && response[0][0] && response[0][0].faq_category)?response[0][0].faq_category:"",
					_id 			: { $ne: (response[0] && response[0][0] && response[0][0]._id)?ObjectId(response[0][0]._id):"" },
					user_type  		: userType
				},{projection: {_id:1,question:1,modified:1,order:1,faq_category:1}}).toArray((err,relatedResult)=>{
					if(err) return next(err);
					if(!relatedResult) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				    resolve({ 
						status  		: STATUS_SUCCESS,
						result 			: (response[0]) ? response[0] 	: [],
						recordsTotal    : (response[1]) ? response[1] 	: 0,
						relatedResult 	: relatedResult
					});
				});
            });
		}); 
	};// End getFaqDetails().


	/**
	 * Function to get Game's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getGamesListing = (req,res,next)=>{
		let gameType 		= (req.body.game_type) ? req.body.game_type : "";
		let gameTypeList 	= (req.body.game_type_list) ? req.body.game_type_list : false;

		return new Promise(async resolve=>{
			/** Get Games details **/
			//if(gameTypeList && gameType == '') return setTimeout(function(){ resolve({ status  : STATUS_SUCCESS,result  : []}); }, 3000);

			if(gameTypeList && gameType == '') return resolve({ status  : STATUS_SUCCESS,result  : []});

			let conditions = {};
			if(gameType) conditions.game_type = gameType;
			conditions.status = ACTIVE;
			const games = db.collection('games');
			games.aggregate([
				{$match : conditions},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"games_name",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$project : {_id:1,games_name:1,games_level:1,min_no_of_contestent:1,game_type:1,
				max_no_of_contestent:1,body:1,from_date:1,to_date:1,modified:1,status:1,
				game_rules:1,games_image:1,game_category_name:{"$arrayElemAt":["$game_category_data.name",0]}}},
				//{$sort: {_id : SORT_DESC}},
			]).toArray((err, result)=>{
				if(err) return next(err);
				if(!result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			    resolve({ status  : STATUS_SUCCESS,result  : result});
			}); 
		}); 
	};// End getGamesListing().


	/**
	 * Function to get Game's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getGamesDetail = (req,res,next)=>{
		let gameId 		= (req.body.game_id) ? ObjectId(req.body.game_id ) : "";

		return new Promise(async resolve=>{
			/** Get Games details **/
			let conditions = {};
			conditions.game_type 		= 'private';
			if(gameId) conditions._id 	= gameId;
			const games = db.collection('games');
			games.aggregate([
				{$match : conditions},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"games_name",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$project : {_id:1,games_name:1,games_level:1,min_no_of_contestent:1,game_type:1,
				max_no_of_contestent:1,body:1,from_date:1,to_date:1,modified:1,status:1,
				game_rules:1,games_image:1,game_category_name:{"$arrayElemAt":["$game_category_data.name",0]}}},
			]).toArray((err, result)=>{
				if(err) return next(err);
				if(!result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			    resolve({ status  : STATUS_SUCCESS,result  : result});
			}); 
		}); 
	};// End getGamesDetail().

	/**
	 * Function to get Game's slot detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getGameSlotsListing = (req,res,next)=>{
		let gameId 			 = (req.body.game_id) ? ObjectId(req.body.game_id ) : "";
		let gameDay			 = (req.body.game_day) ? req.body.game_day : "";

		return new Promise(async resolve=>{
			/** Get Games Slot details **/
			//if(gameId == '') return setTimeout(function(){ resolve({ status  : STATUS_SUCCESS,result  : []}); }, 10000);
			if(gameId == '') return resolve({ status  : STATUS_SUCCESS,result  : []});
			if(!gameDay) return resolve({ status  : STATUS_SUCCESS,result  : []});	

			let conditions = {};
			//if(gameType) conditions.game_type = gameType;
			if(gameId) conditions.game_id   = gameId;
			if(gameDay) conditions.day    	= gameDay;

			const public_game_availabilitys = db.collection('public_game_availabilitys');
			public_game_availabilitys.find(conditions).toArray((err,result)=>{
				if(err) return next(err);			
				resolve({ status  : STATUS_SUCCESS,result  : result});
			});
		}); 
	};// End getGameSlotsListing().

	/**
	 * Function to get Private Game's slot detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getPrivateGameSlotsListing = (req,res,next)=>{
		let gameDay				= (req.body.game_day) ? req.body.game_day : "";
		let gameId				= (req.body.game_id) ? req.body.game_id : "";
		let gameType			= (req.body.game_type)? req.body.game_type : "";
		let userType			= (req.body.user_type)? req.body.user_type : "";
		return new Promise(async resolve=>{
			/** Get Private Games Slot details **/
			if(!gameDay) return resolve({ status  : STATUS_SUCCESS,result  : []});	
			if(gameType == PUBLIC) return resolve({ status  : STATUS_SUCCESS,result  : []});			

			if(userType && userType == USER_TYPE_HOST){
				const availabilitys = db.collection('availabilitys');
				availabilitys.findOne({day:gameDay},(err, result)=>{
					if(err) return next(err);
					/** Send error response */
					if(!result) return resolve({status : STATUS_ERROR, message	: res.__("admin.system.invalid_access") });

					/** Send success response **/
					resolve({
						status	: STATUS_SUCCESS,
						result	: result
					});
				});
			}else{
				let userSlug			= (req.body.user_slug)? req.body.user_slug : "";
				let userId = '';
				if(userSlug){
					/** Set options for get user details **/
					let options = {
						conditions			: 	{ 
											     	user_role_id: FRONT_USER_ROLE_ID,
											     	active 		: ACTIVE,
											     	is_deleted 	: NOT_DELETED,
											     	is_verified	: VERIFIED,
											    },
						fields				:	{_id :1,full_name:1}
					};
					/**Condition  for email*/
					options.conditions.slug	= userSlug;
					/** Get user details **/
					let userResponse =  await getUserData(req,res,next,options);
					userId 			 =	ObjectId(userResponse.result._id)
				}
				


				const host_game_availabilitys = db.collection('host_game_availabilitys');
				let gameDate 		=	newDate(gameDay,DATE_OF_BIRTH_FORMAT);
				let previousDate 	=   gameDay.replace('00:00:00','01:00:00');
				let nextDate 		=   gameDay.replace('00:00:00','23:59:00');
				previousDate 		=	newDate(previousDate,DATE_OF_BIRTH_FORMAT);
				nextDate 			=	newDate(nextDate,DATE_OF_BIRTH_FORMAT);
				
				let conditions = {game_type:gameType,game_id:ObjectId(gameId)};
				conditions['event_date']	=	{$in : [previousDate,nextDate,gameDate] };
				host_game_availabilitys.aggregate([
					{$match : conditions},
				]).toArray((err, result)=>{
					if(err) return next(err);
					if(!result || result.length <= 0) return resolve({status : STATUS_SUCCESS, result	: [] });

					let customSlotListsArray =  [];
					asyncEach(result,(orderResultData, asyncParentCallback)=>{
						let conditionValues 	=	{ 
							"$or" 					: [ {"approval_status": {"$ne": CUSTOM_PLAN_STATUS_REJECTED}} ],
							'preferred_date' 		: orderResultData.event_date,
							'start_time' 			: String(orderResultData.start_time),
							'end_time' 				: String(orderResultData.end_time),
						}
						if(userId){
							conditionValues.player_id 	=	userId;
						}
						getCustomeXLGames(req,res,next,conditionValues).then(response=>{
							if(response && response.result == false){
								customSlotListsArray.push(orderResultData);
							}
							asyncParentCallback(null,customSlotListsArray);	
						}).catch(next);
					},(asyncParentErr,asyncParentContent)=>{
						let slotListsArray =  [];
						if(customSlotListsArray.length > 0 ){
							asyncEach(customSlotListsArray,(orderResultData, asyncCallback)=>{
								let conditionValues 	=	{ 
										"$or": [{"order_status": ORDER_STATUS_APPROVED}, {"order_status": ORDER_STATUS_PENDING}],
										'game_book_date' 				: orderResultData.event_date,
										'game_start_time' 				: orderResultData.start_time,
										'game_end_time' 				: orderResultData.end_time,
								}
								let conArray 	=	[];
								if(userId){
									conArray.push({"player_id": {$in : [userId] }});
								}
								conArray.push({"host_id": ObjectId(orderResultData.host_id)});
								conditionValues.$or	=	conArray;
								getBookedGames(req,res,next,conditionValues).then(bookingResponse=>{
									if(bookingResponse && bookingResponse.result == false){
										
										let startTimeValue	=	orderResultData.start_time;
										if(parseInt(startTimeValue) < 10){
											startTimeValue 	=	'0'+String(parseInt(startTimeValue))+':00';
										}else{
											if(parseInt(startTimeValue) == 12){
												startTimeValue 	=	'12:00';
											}else{
												startTimeValue 	=	String(parseInt(startTimeValue))+':00';
											}
										}
										//let currentTime	 		= 	currentTimeStamp();
										let currentTime 			= 	new Date();
										currentTime.setHours( currentTime.getHours() + 1 );

										let now 				=   new Date(orderResultData.event_date+' '+startTimeValue);

										if(currentTime <= now.getTime()){
											slotListsArray.push(orderResultData);
										}
									}
									asyncCallback(null,slotListsArray);	
								}).catch(next);
							},(asyncErr,asyncContent)=>{


								var flags = [], output = [], l = slotListsArray.length, i;
								for( i=0; i<l; i++) {
								    if( flags[slotListsArray[i].start_time]) continue;
								    flags[slotListsArray[i].start_time] = true;
								    output.push(slotListsArray[i]);
								}
								/** Send success response **/
								resolve({
									status	: STATUS_SUCCESS,
									result	: output
								});
							});
						}else{
							resolve({
								status	: STATUS_SUCCESS,
								result	: slotListsArray
							});
						}
					});



					/*let 	slotListsArray =  [];
					asyncEach(result,(orderResultData, asyncCallback)=>{
						let conditionValues 	=	{ 
							'order_status'					: ORDER_STATUS_APPROVED ,
							'game_book_date' 				: orderResultData.event_date,
							'game_start_time' 				: orderResultData.start_time,
							'game_end_time' 				: orderResultData.end_time,
						}
						if(userId){
							conditionValues.player_id 	=	userId;
						}
						getBookedGames(req,res,next,conditionValues).then(response=>{
							if(response && response.result == false){
								slotListsArray.push(orderResultData);
							}
							asyncCallback(null,slotListsArray);	
						}).catch(next);
					},(asyncErr,asyncContent)=>{
						console.log(slotListsArray,"slotListsArrayslotListsArray");

						var flags = [], output = [], l = slotListsArray.length, i;
						for( i=0; i<l; i++) {
						    if( flags[slotListsArray[i].start_time]) continue;
						    flags[slotListsArray[i].start_time] = true;
						    output.push(slotListsArray[i]);
						}

						resolve({
							status	: STATUS_SUCCESS,
							result	: slotListsArray
						});
					});*/
					
				});
			}
		}); 
	};// End getPrivateGameSlotsListing().


	/**
	 * Function to get Pricing package's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getPricingPackagesDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Get Slider details **/
			const block = db.collection('pricing_packages');
			block.find({
				type 		: 'game_plans',
			},{projection: {_id:1,title:1,amount:1,game_type:1,no_of_contestants:1,days:1,modified:1,slug:1,description:1}}).toArray((err,result)=>{
				if(err) return next(err);
				if(!result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			    resolve({ status  : STATUS_SUCCESS,result  : result});
			});
		});
	};// End getPricingPackagesDetails().


	/**
	 * Function to get SocialSetting's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getSocialSettings = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Get LINKS details **/
			let SocialLinksData =	{
				'facebook'  : {
					'sociallink_facebook_url'		: 	res.locals.settings["SocialLink.facebook"],
					'sociallink_facebook_hashtag'	: 	res.locals.settings["SocialLink.facebook_hashtag"],
					'sociallink_facebook_title'		: 	res.locals.settings["SocialLink.facebook_title"],
				},
				'twitter' 	: {
					'sociallink_twitter_url'		: 	res.locals.settings["SocialLink.twitter"],
					'sociallink_twitter_hashtag'	: 	res.locals.settings["SocialLink.twitter_hashtag"],
					'sociallink_twitter_title'		: 	res.locals.settings["SocialLink.twitter_title"],
				},
				'pinterest' : {
					'sociallink_pinterest_url'		: 	res.locals.settings["SocialLink.pinterest"],
					'sociallink_pinterest_hashtag'	: 	res.locals.settings["SocialLink.pinterest_hashtag"],
					'sociallink_pinterest_title'	: 	res.locals.settings["SocialLink.pinterest_title"],
				},
				'linkedin'  : {
					'sociallink_linkedin_url'		: 	res.locals.settings["SocialLink.linkedin"],
					'sociallink_linkedin_hashtag'	: 	res.locals.settings["SocialLink.linkedin_hashtag"],
					'sociallink_linkedin_title'		: 	res.locals.settings["SocialLink.linkedin_title"],
				}
			};
			resolve({ status  : STATUS_SUCCESS,result  : SocialLinksData});
			
		});
	};// End getSocialSettings().


	/**
	 * Function for add or update Host Public/Private Availability
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.setHostAviblity =  (req, res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			//let gameavailabilityContent = (req.body && req.body.gameavailability)?req.body.gameavailability : {};
			/** Check validation **/
			req.checkBody({
				"game": {
					notEmpty	: true,
					errorMessage: res.__("hostaviblity.please_select_game")
				},
				"game_type": {
					notEmpty	: true,
					errorMessage: res.__("hostaviblity.please_select_game_type")
				},
				/*"gameavailability": {
					notEmpty	: true,
					errorMessage: res.__("hostaviblity.please_select_gameavailability")
				}*/
			});
			


			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);
			/** Send error response **/

			if(!req.body || !req.body.gameavailability){
                if(!errors) errors =[];
                errors.push({'param':'gameavailability','msg':res.__("hostaviblity.please_select_gameavailability")});
            }

            if(req.body || req.body.gameavailability){
            	let gameavailabilityContent	=	(req.body && req.body.gameavailability) ? JSON.parse(req.body.gameavailability).host_game	:'';
            	if(gameavailabilityContent.length <= 0){
            		if(!errors) errors =[];
                	errors.push({'param':'gameavailability','msg':res.__("hostaviblity.please_select_gameavailability")});
            	}
            }

			if(errors) return resolve({status : STATUS_ERROR, message	: errors});


			let gameId 				=	(req.body.game)   		? ObjectId(req.body.game) :"";
			let gameType  			=	(req.body.game_type)  	? req.body.game_type   	:"";
			let availabilityData 	=	(req.body && req.body.gameavailability) ? JSON.parse(req.body.gameavailability).host_game	:'';
			let userSlug 			= 	(req.body.user_slug) 	? req.body.user_slug : "";
			let eventAssignedDate 	= 	(req.body.event_date) 	? req.body.event_date : "";

			/** Set options for get user details **/
			let options = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields				:	{_id :1,full_name:1}
			};
			/**Condition  for email*/
			options.conditions.slug	= userSlug;
			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,options);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});


			const host_game_availabilitys = db.collection('host_game_availabilitys');
			let insertData	=	[];

			if(availabilityData && availabilityData.length>0){
				//availabilityData.map(function(gameSlot, index){ 
				asyncEach(availabilityData,(gameSlot, asyncCallback)=>{
					let slots = gameSlot.split('_');
					if(gameSlot){
						let finalContent	=	{
				 			'game_id'			:	gameId,
				 			'game_type'			:	gameType,
				 			'host_id'			:	ObjectId(userResponse.result._id),
				 			'event_date' 		:   eventAssignedDate,
				 			//'modified' 			: 	getUtcDate(),
							//'created' 			: 	getUtcDate(),
				 		};

				 		
				 		let startTimeValue 	=	'';
						let endTimeValue 	=	'';

				 		if(gameType && gameType == PUBLIC){
				 			finalContent.public_game_availability_id	=	ObjectId(slots[1]);
							finalContent.start_time	=	(slots[3])?parseInt(slots[3]):'';
				 			finalContent.end_time	=	(slots[4])?parseInt(slots[4]):'';	

				 			startTimeValue	=	(slots[5])?slots[5]:'';
				 			endTimeValue	=	(slots[6])?slots[6]:'';			 			
						}else{
							finalContent.private_game_availability_id	=	ObjectId(slots[1]);
							finalContent.start_time	=	(slots[2])?parseInt(slots[2]):'';
				 			finalContent.end_time	=	(slots[3])?parseInt(slots[3]):'';

				 			startTimeValue	=	(slots[4])?slots[4]:'';
				 			endTimeValue	=	(slots[4])?slots[5]:'';
						}


					
						if(startTimeValue){
							if(startTimeValue.indexOf("pm") != '-1'){
								startTimeValue.replace('pm','');
								startTimeValue 	=	startTimeValue.replace('pm','');
								let timeValue 	=	startTimeValue.split(':');
								if(parseInt(timeValue[0]) == 12){
									startTimeValue 	=	String(parseInt(timeValue[0]))+':'+timeValue[1];
								}else{
									startTimeValue 	=	String(parseInt(timeValue[0])+12)+':'+timeValue[1];
								}

							}else{
								startTimeValue.replace('am','');
								startTimeValue 	=	startTimeValue.replace('am','');
								let timeValue 	=	startTimeValue.split(':');

								if(parseInt(startTimeValue) < 10){
									startTimeValue 	=	'0'+String(parseInt(timeValue[0]))+':'+timeValue[1];
								}else{
									if(parseInt(startTimeValue) == 12){
										startTimeValue 	=	'12:30';
									}else{
										startTimeValue 	=	String(parseInt(timeValue[0]))+':'+timeValue[1];
									}
								}
							}
						}

					

						eventAssignedDate 		= 	eventAssignedDate.replace('00:00:00',startTimeValue);
						eventAssignedDate 		=	newDate(eventAssignedDate,DATABASE_DATE_FORMAT);
						finalContent.event_date =	eventAssignedDate;

				 		insertData.push(finalContent);
				 		eventAssignedDate 		=	(req.body.event_date) 	? req.body.event_date : "";
				 		
				 	} 
				 	asyncCallback(null);
				},(asyncErr,asyncContent)=>{
					let hostBookedAvailablityError 	=	insideErr	=	false;


					asyncEach(insertData,(value, asyncChildCallback)=>{	
						let condition	= '';
						if(gameType == PRIVATE){
							/*condition	=	{
								host_id    : ObjectId(userResponse.result._id),
								event_date : value.event_date,
						    	$and: [
						    		{
						    			$or:  	[   
								    		{	
								    			$and  :  [ { game_type:    { $ne : PRIVATE } }  ],
								    			$or:  	[   
						    						{ $or  :  [ { end_time  :    { $eq : (value.start_time) } }  ] }, 
						    						{ $or  :  [ { start_time:    { $eq : (value.end_time  ) } }  ] },
						    					],
								    		},
				    						{ $or  :  [ { start_time:    { $eq : (value.start_time  ) } } ] },
				    						{ $or  :  [ { end_time  :    { $eq : (value.end_time  ) } } ] },
				    					]
						    		},
						    	]
							}*/
							condition	=	{
								host_id    : ObjectId(userResponse.result._id),
								event_date : value.event_date,
						    	$and: [
						    		{
						    			$or:  	[   
				    						{ $or  :  [ { end_time  :    { $eq : (value.start_time) } } ] }, 
				    						{ $or  :  [ { start_time:    { $eq : (value.end_time  ) } } ] },
				    						{ $or  :  [ { start_time:    { $eq : (value.start_time  ) } } ] },
				    						{ $or  :  [ { end_time 	:    { $eq : (value.end_time  ) } } ] },
				    					]
						    		},
						    	]
							}
						}else{
							condition	=	{
								//'game_id':ObjectId(gameId),
								host_id    : ObjectId(userResponse.result._id),
								//event_date : eventAssignedDate,
								event_date : value.event_date,
								//game_type  : PUBLIC,
								//$and 	   : [ { start_time: { $eq : value.start_time } }, { end_time : { $eq: value.end_time } } ],
						    	$and: [
						    		{
						    			$or:  	[   
				    						{ $or  :  [ { end_time  :    { $eq : (value.start_time) } } ] }, 
				    						{ $or  :  [ { start_time:    { $eq : (value.end_time  ) } } ] },
				    						{ $or  :  [ { start_time:    { $eq : (value.start_time  ) } } ] },
				    						{ $or  :  [ { end_time 	:    { $eq : (value.end_time  ) } } ] },
				    					]
						    		},
						    	]
							}
						}
						let newCondition 	=	{}
						if(gameType == PUBLIC){
							let eventAssignedDateChange  = newDate(eventAssignedDate,DATABASE_DATE_FORMAT);
							newCondition	=	{
								event_date : eventAssignedDateChange,
								game_type  : PUBLIC,
								start_time : value.start_time,
								end_time   : value.end_time,
							}
							const games = db.collection('games');
							games.findOne({_id:gameId},(gameErr,gameResult)=>{
								if(gameErr) return next(gameErr);
								host_game_availabilitys.countDocuments(newCondition,(err,countResult)=>{
									if(err) return next(err);
										
									if(gameResult && gameResult.max_no_of_contestent_per_game <= countResult){
										hostBookedAvailablityError = true;
										insideErr = true;
										asyncChildCallback(null);
									}else{
										host_game_availabilitys.findOne(condition,(hostAvailablityErr,hostAvailablityResult) => {
											if(hostAvailablityErr) return next(hostAvailablityErr);
											if(hostAvailablityResult){
												hostBookedAvailablityError = true;
											}
											asyncChildCallback(null);
										});
									}
								});
							});
						}else{
							host_game_availabilitys.findOne(condition,(hostAvailablityErr,hostAvailablityResult) => {
								if(hostAvailablityErr) return next(hostAvailablityErr);
								if(hostAvailablityResult){
									hostBookedAvailablityError = true;
								}
								asyncChildCallback(null);
							});
						}
					},(asyncChildErr,asyncChildContent)=>{
						if(hostBookedAvailablityError){
							if(!errors) errors =[];
							errors.push({'param':'gameavailability','msg':res.__("hostaviblity.these_avaiblity_are_already_booked_here")});
							if(insideErr){
								errors.push({'param':'gameavailability','msg':res.__("hostaviblity.these_avaiblity_limit_reached")});
							}
							if(errors && errors.length>0) return resolve({status : STATUS_ERROR, message	: errors});
						}
						
						host_game_availabilitys.insertMany(insertData,(err,result)=>{
							if(err) return next(err);
						
							resolve({
								status		:	STATUS_SUCCESS,
								message		:	res.__("admin.availability.public_availability_has_been_added_successfully"),
							});
						});
					});
				});
			}
			
			
		});
	};//End setHostAviblity()

	/**
	 * Function to get Slider's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getHostBookedSlotsListing = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug 	= (req.body.user_slug)  ? req.body.user_slug : "";
			let eventDate 	= (req.body.show_event_date) ? req.body.show_event_date : "";
			let eventId 	= (req.body.event_id) ? req.body.event_id : "";
			/** Get user details **/
			/** Set options for get user details **/
			let options = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1,is_verified:1,active:1,email:1
				}
			};
			/**Condition  for email*/
			options.conditions.slug	= userSlug;
			/** Get user details **/
			let response =  await getUserData(req,res,next,options);
			
			if(response.status != STATUS_SUCCESS) return next(response.message);
			if(!response.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			const host_game_availabilitys = db.collection('host_game_availabilitys');


			let availabilityCondition 			=	{};
			if(eventId == '') availabilityCondition.host_id = ObjectId(response.result._id);
			
			//if(eventDate != '') availabilityCondition.event_date	=	eventDate;
			if(eventId != '') availabilityCondition._id				=	ObjectId(eventId);


			/*let currentDate =  newDate('',API_DATE_FORMAT);
			availabilityCondition.event_date = { $eq: currentDate } ;
*/
			host_game_availabilitys.aggregate([
				{$match : availabilityCondition},
				{$lookup: {
					from 		: 	"games",
					localField	: 	"game_id",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$project : {_id:1,game_type:1,private_game_availability_id:1,start_time:1,host_id:1,
					end_time:1,event_date:1,game_id:1,public_game_availability_id:1,modified:1,
					game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
					game_level_id:{"$arrayElemAt":["$game_category_data.games_name",0]}},
				},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"game_level_id",
					foreignField: 	"_id",
					as 			: 	"game_data"
				}},
				{$lookup:{
			      from: "order",
			      let: { gid: "$game_id",start_time: "$start_time",end_time: "$end_time",event_date: "$event_date"},
			      pipeline: [
			        {$match: {
			          $expr: {
			            $and: [
			                { $eq: ["$game_id", "$$gid"] },
			                { $eq: ['$order_status', 'approved'] },
							{ $eq: ["$game_start_time",'$$start_time'] },
			                { $eq: ["$game_end_time", '$$end_time'] },
			                { $eq: ["$game_book_date", '$$event_date'] },
			                { $eq: ["$host_id", ObjectId(response.result._id)] },
			            ],
			          },
			        }},
			      ],
			      as: "order_details",
			    }},

				{$project : {
					_id:1,game_type:1,private_game_availability_id:1,start_time:1,host_id:1,
					end_time:1,event_date:1,game_id:1,public_game_availability_id:1,modified:1,
					game_category_name:1,game_level_id:1,game_name:{"$arrayElemAt":["$game_data.name",0]},
					order_id:{"$arrayElemAt":["$order_details._id",0]},
					order_book:{"$arrayElemAt":["$order_details.order_book",0]}
				}},
			]).toArray((availabilityErr, availabilityResult)=>{
				if(availabilityErr) return next(availabilityErr);


				//if(availabilityResult && availabilityResult.length <= 0) resolve({status	: STATUS_SUCCESS,result	:[],message	: res.__("admin.system.invalid_access")});

				if(req.body && eventId != '' && req.body.event_edit ){

					if(availabilityResult && availabilityResult.length <= 0) return resolve({status	: STATUS_SUCCESS,result	:{},message	: res.__("admin.system.invalid_access")});
					
					host_game_availabilitys.find({game_id:ObjectId(availabilityResult[0].game_id),host_id : ObjectId(response.result._id),event_date:availabilityResult[0].event_date}).toArray((hostErr,hostResult)=>{

						if(hostErr) return next(hostErr);
						let finalData	=	[];
						let newObj		=	{};
						let finalSelectedValues	=	[];
						if(hostResult && hostResult.length>0){
							
							/*hostResult.map((val,index)=>{
								finalData.push((val && val.start_time)?val.start_time:"");
								if(val.game_type == PRIVATE){
									finalSelectedValues.push((val && val.start_time)?'gameavailability_'+val.private_game_availability_id+'_'+val.start_time+'_'+val.end_time:"");
								}else if(val.game_type == PUBLIC){
									finalSelectedValues.push((val && val.start_time)?'gameavailability_'+val.public_game_availability_id+'_'+index+'_'+val.start_time+'_'+val.end_time:"");
								}
							});
							*/

							asyncforEachOf(hostResult,async(val,index,asyncCallback)=>{
							

								finalData.push((val && val.start_time !=='' )?val.start_time:"");
								if(val.game_type == PRIVATE){

									finalSelectedValues.push((val && val.start_time !== '')?'gameavailability_'+val.private_game_availability_id+'_'+val.start_time+'_'+val.end_time:"");
									
								}else if(val.game_type == PUBLIC){
									finalSelectedValues.push((val && val.start_time !== '')?'gameavailability_'+val.public_game_availability_id+'_'+index+'_'+val.start_time+'_'+val.end_time:"");
								}
									
								asyncCallback(null);
							},asyncErr=>{	
								
								newObj['host_game'] =	finalSelectedValues;
								return resolve({ 
									status  				: STATUS_SUCCESS,
									result  				: (availabilityResult) ? availabilityResult  :[],
									finalSelectedData  		: finalData,
									finalSelectedValues  	: (newObj)?newObj:{}
								});
								callback(hostGameAvailabilityErr, hostGameAvailabilityResult);
							});
						}else{


							newObj['host_game'] =	[];
							return resolve({ 
								status  				: STATUS_SUCCESS,
								result  				: (availabilityResult) ? availabilityResult  :[],
								finalSelectedData  		: finalData,
								finalSelectedValues  	: (newObj)?newObj:{}
							});
						}		
						/*newObj['host_game'] =	finalSelectedValues;
						return resolve({ 
							status  				: STATUS_SUCCESS,
							result  				: (availabilityResult) ? availabilityResult  :[],
							finalSelectedData  		: finalData,
							finalSelectedValues  	: (newObj)?newObj:{}
						});*/
					});
				}else{
					/*return setTimeout(function(){  
						return resolve({ status  : STATUS_SUCCESS,result  : (availabilityResult)   ?   availabilityResult  :{}}); }, 5000);*/

					return resolve({ status  : STATUS_SUCCESS,result  : (availabilityResult)   ?   availabilityResult  :{}});
				}
			}); 
		});
	};// End getHostBookedSlotsListing().


	/**
	 * Function to delete host booking
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.deleteHostBooking = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let eventId  = (req.body.id) ? ObjectId(req.body.id) : "";
			/** Get user details **/

			/** Set options for get user details **/
			let options = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1,is_verified:1,active:1,email:1
				}
			};
			/**Condition  for email*/
			options.conditions.slug	= userSlug;
			/** Get user details **/
			let response =  await getUserData(req,res,next,options);
			if(response.status != STATUS_SUCCESS) return next(response.message);
			if(!response.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			const host_game_availabilitys = db.collection('host_game_availabilitys');

			host_game_availabilitys.aggregate([
				{$match : {_id:eventId,host_id:ObjectId(response.result._id)}},
				{$lookup: {
					from 		: 	"games",
					localField	: 	"game_id",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$project : {_id:1,game_type:1,private_game_availability_id:1,start_time:1,host_id:1,
					end_time:1,event_date:1,game_id:1,public_game_availability_id:1,modified:1,
					game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
					game_level_id:{"$arrayElemAt":["$game_category_data.games_name",0]}},
				},
				{$lookup:{
			      from: "order",
			      let: { gid: "$game_id",start_time: "$start_time",end_time: "$end_time",event_date: "$event_date"},
			      pipeline: [
			        {$match: {
			          $expr: {
			            $and: [
			                { $eq: ["$game_id", "$$gid"] },
			                //{ $eq: ['$order_status', 'approved'] },
							{ $eq: ["$game_start_time",'$$start_time'] },
			                { $eq: ["$game_end_time", '$$end_time'] },
			                { $eq: ["$game_book_date", '$$event_date'] },
			                { $eq: ["$host_id", ObjectId(response.result._id)] },
			            ],
			          },
			        }},
			      ],
			      as: "order_details",
			    }},
				{$project : {
					_id:1,game_type:1,private_game_availability_id:1,start_time:1,host_id:1,
					end_time:1,event_date:1,game_id:1,public_game_availability_id:1,modified:1,
					game_category_name:1,game_level_id:1,game_name:{"$arrayElemAt":["$game_data.name",0]},
					order_id:{"$arrayElemAt":["$order_details._id",0]},
					order_book:{"$arrayElemAt":["$order_details.order_book",0]},
					order_status:{"$arrayElemAt":["$order_details.order_status",0]}
				}},
			]).toArray((availabilityErr, availabilityResult)=>{

			//host_game_availabilitys.findOne({_id:eventId,host_id:ObjectId(response.result._id)},(err,result) => {
				if(availabilityErr) return next(availabilityErr);
				
				availabilityResult =	(availabilityResult && availabilityResult[0])? availabilityResult[0]:{};
				
				if(availabilityResult && availabilityResult.order_id){
					

					if(availabilityResult.order_status == ORDER_STATUS_REJECTED){
						host_game_availabilitys.deleteOne({_id:eventId,host_id:ObjectId(response.result._id)},(deletedErr,deletedResult) => {
							if(deletedErr) return next(deletedErr);
							let response = {
						        status  : STATUS_SUCCESS,
						        result  : res.__("admin.availability.availability_deleted_successfully")
						    };
						    resolve(response);
						});
					}else{
						let response = {
					        status  	: STATUS_SUCCESS,
					        not_delete  : true,
					        result  	: res.__("admin.availability.availability_will_not_deleted_at_this_time")
					    };
						resolve(response);
					}
				}else{			
					
				    host_game_availabilitys.deleteOne({_id:eventId,host_id:ObjectId(response.result._id)},(deletedErr,deletedResult) => {
						if(deletedErr) return next(deletedErr);
						let response = {
					        status  : STATUS_SUCCESS,
					        result  : res.__("admin.availability.availability_deleted_successfully")
					    };
					    resolve(response);
					})
				}
			});
		});
	};// End deleteHostBooking().

	/**
	 * Function to repete host booking
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.repetHostBooking = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let eventId  = (req.body.id) ? ObjectId(req.body.id) : "";

			/** Get user details **/
			/** Set options for get user details **/
			let options = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1,is_verified:1,active:1,email:1
				}
			};
			/**Condition  for email*/
			options.conditions.slug	= userSlug;
			/** Get user details **/
			let response =  await getUserData(req,res,next,options);
			if(response.status != STATUS_SUCCESS) return next(response.message);
			if(!response.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			const host_game_availabilitys = db.collection('host_game_availabilitys');

			host_game_availabilitys.findOne({_id:eventId,host_id:ObjectId(response.result._id)},(availabilityErr,availabilityResult) => {
				if(availabilityErr) return next(availabilityErr);


				let startTimeValue 	=	availabilityResult.start_time;

		 		
			
				if(startTimeValue){

					if(parseInt(startTimeValue) < 10){
						startTimeValue 	=	'0'+String(parseInt(startTimeValue))+':00';
					}else{
						if(parseInt(startTimeValue) == 12){
							startTimeValue 	=	'12:00';
						}else{
							startTimeValue 	=	String(parseInt(startTimeValue))+':00';
						}
					}
					
				}


				let finalDate  = newDate(addDaysToDate(24*7,availabilityResult.event_date+' '+startTimeValue),DATABASE_DATE_FORMAT);


				let condition	= '';
				if(availabilityResult.game_type == PRIVATE){
					/*condition	=	{
						host_id    : ObjectId(response.result._id),
						event_date : finalDate,
				    	$and: [
				    		{
				    			$or:  	[   
						    		{	
						    			$and  :  [ { game_type:    { $ne : PRIVATE } }  ],
						    			$or:  	[   
				    						{ $or  :  [ { end_time  :    { $eq : (availabilityResult.start_time) } }  ] }, 
				    						{ $or  :  [ { start_time:    { $eq : (availabilityResult.end_time  ) } }  ] },
				    					],
						    		},
		    						{ $or  :  [ { start_time:    { $eq : (availabilityResult.start_time  ) } } ] },
		    						{ $or  :  [ { end_time  :    { $eq : (availabilityResult.end_time  ) } } ] },
		    					]
				    		},
				    	]
					}*/

					condition	=	{
						host_id    : ObjectId(response.result._id),
						event_date : finalDate,
				    	$and: [
				    		{
				    			$or:  	[   
		    						{ $or  :  [ { end_time  :    { $eq : (availabilityResult.start_time) } } ] }, 
		    						{ $or  :  [ { start_time:    { $eq : (availabilityResult.end_time  ) } } ] },
		    						{ $or  :  [ { start_time:    { $eq : (availabilityResult.start_time  ) } } ] },
		    						{ $or  :  [ { end_time:    	 { $eq : (availabilityResult.end_time  ) } } ] },
		    					]
				    		},
				    	]
						    
					}
				}else{
					condition	=	{
						host_id    : ObjectId(response.result._id),
						event_date : finalDate,
				    	$and: [
				    		{
				    			$or:  	[   
		    						{ $or  :  [ { end_time  :    { $eq : (availabilityResult.start_time) } } ] }, 
		    						{ $or  :  [ { start_time:    { $eq : (availabilityResult.end_time  ) } } ] },
		    						{ $or  :  [ { start_time:    { $eq : (availabilityResult.start_time  ) } } ] },
		    						{ $or  :  [ { end_time:    	 { $eq : (availabilityResult.end_time  ) } } ] },
		    					]
				    		},
				    	]
						    
					}
				}
				//{start_time:availabilityResult.start_time,end_time:availabilityResult.end_time,event_date:finalDate}
				host_game_availabilitys.findOne(condition,(checkAvailabilityErr,checkAvailabilityResult) => {
					
					if(checkAvailabilityResult) return resolve({status : STATUS_ERROR, message: res.__("hostaviblity.these_avaiblity_are_already_booked_here") });
					
					let userGameAvaiblity 	=	{
						'game_id'			:	availabilityResult.game_id,
						'game_type'			:	availabilityResult.game_type,
						'host_id'			:	ObjectId(availabilityResult.host_id),
						'event_date' 		:   finalDate,
						'start_time'		: 	parseInt(availabilityResult.start_time),
						'end_time'			: 	parseInt(availabilityResult.end_time),			 
						'modified' 			: 	getUtcDate(),
						'created' 			: 	getUtcDate(),
					}

					if(availabilityResult.game_type == "public"){
						userGameAvaiblity.public_game_availability_id 	=	ObjectId(availabilityResult.public_game_availability_id);
					}else{
						userGameAvaiblity.private_game_availability_id 	=	ObjectId(availabilityResult.private_game_availability_id);
					}

					host_game_availabilitys.insertOne(userGameAvaiblity,(err,result)=>{
						let response = {
					        status  : STATUS_SUCCESS,
					        result  : res.__("admin.availability.availability_repeted_successfully")
					    };
					    resolve(response);
					});
				});
			});
		});
	};// End repetHostBooking().	

	/**
	 * Function to update host detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.updateHostBooking = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let eventId  = (req.body.id) ? ObjectId(req.body.id) : "";
			let eventDate= (req.body.event_date) ? req.body.event_date : "";
			
			/** Set options for get user details **/
			let options = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1
				}
			};
			/**Condition  for email*/
			options.conditions.slug	= userSlug;
			/** Get user details **/
			let response =  await getUserData(req,res,next,options);
			if(response.status != STATUS_SUCCESS) return next(response.message);
			if(!response.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			const host_game_availabilitys = db.collection('host_game_availabilitys');

			let updateData	={
				$set: {
					event_date			: eventDate,
					modified			: getUtcDate()
				}
			};

			/** Update user details **/
			host_game_availabilitys.updateOne({_id:eventId,host_id:ObjectId(response.result._id)},updateData,(updateErr,updateResult)=>{
				if(updateErr) return next(updateErr);
				/** Send success response **/
				let response = {
			        status  : STATUS_SUCCESS,
			        result  : res.__("availability.availability_updated_successfully")
			    };
			    resolve(response);
			});
		});
	};// End updateHostBooking().

	/**
	 * Function for submit add Feedback form
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.addFeedback = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body 	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			
			/** Check validation **/
			req.checkBody({
				"name": {
					notEmpty		: true,
					errorMessage	: res.__("contact_us.please_enter_name")
				},
				"email": {
					notEmpty	: true,
					errorMessage: res.__("contact_us.please_enter_email"),
					isEmail	: 	{
						errorMessage : res.__("contact_us.please_enter_valid_email_address")
					},
				},
				"message": {
					notEmpty		: true,
					errorMessage	: res.__("contact_us.please_enter_message")
				},
			});


			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);

			/** Send error response **/
			if(errors) return resolve({status : STATUS_ERROR, message : errors});

			/** Save contacts details */
			const feedback = db.collection('feedback');
			feedback.insertOne({
				name 		: req.body.name,
				email 		: req.body.email,
				message 	: req.body.message,
				modified 	: getUtcDate(),
				created 	: getUtcDate(),
			},async (err,result)=>{
				if(err) return next(result);
				req.flash(STATUS_SUCCESS,res.__("feedback.feedback_has_been_saved_successfully"));
				/** Send success response **/
				resolve({
					status		:	STATUS_SUCCESS,
					redirect_url:  	WEBSITE_URL+"feedback",
					message		:	res.__("feedback.feedback_has_been_saved_successfully"),
				});	
				sendMailToUsers(req,res,{
					event_type 	: USER_CONTACT_US_EVENTS,
					name		: req.body.name,
					email 		: req.body.email,
					message 	: req.body.message,
				});				
			});
			
		});
	};//End addFeedback()
	
	/**
	 * Function for add player form
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.addPlayerTempAvailability = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body 	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
					
			let planId  = (req.body.plan_id) ? ObjectId(req.body.plan_id) : "";
			const pricing_packages = db.collection('pricing_packages');

			pricing_packages.findOne({_id:planId},async(pricingErr, pricingResult)=>{
				if(pricingErr) return next(pricingErr);

				/** Send error response */
				if(!pricingResult){
					resolve({
						status		:	STATUS_ERROR,
						message		:	res.__("system.something_going_wrong_please_try_again"),
					});	
				}
			
				/** Check validation **/
				req.checkBody({
					"game": {
						notEmpty		: true,
						errorMessage	: res.__("player.please_select_game")
					},
					/*"wager": {
						notEmpty	: true,
						errorMessage: res.__("player.please_enter_wager"),
					},*/
					"game_date": {
						notEmpty		: true,
						errorMessage	: res.__("player.please_select_playing_game_date")
					},
					"gameavailability": {
						notEmpty		: true,
						errorMessage	: res.__("player.please_select_gameavailability")
					}

				});

				
				/** parse Validation array  **/
				let errors = parseValidation(req.validationErrors(),req);

				/** Send error response **/
				if(errors) return resolve({status : STATUS_ERROR, message : errors});

				let gameId   = (req.body.game) ? ObjectId(req.body.game) : "";

				let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
				/** Set options for get user details **/
				let options = {
					conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
					fields	:	{
						_id :1,full_name:1
					}
				};
				/**Condition  for user id*/
				options.conditions.slug	= userSlug;
				/** Get user details **/
				let response =  await getUserData(req,res,next,options);
				if(response.status != STATUS_SUCCESS) return next(response.message);
				if(!response.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});


				let insertData			=	[];
				let availabilityData 	=	(req.body.gameavailability) ? req.body.gameavailability : ""
				availabilityData 		= 	availabilityData.split(',');

				let startTimeValue 	=	'';
				let endTimeValue 	=	'';

				if(availabilityData && availabilityData.length>0){
					availabilityData.map(function(gameSlot, index){ 
						let slots = gameSlot.split('_');
						if(gameSlot){
							let finalContent	=	{};
							finalContent.private_game_availability_id	=	ObjectId(slots[1]);
							finalContent.start_time	=	(slots[2])?parseInt(slots[2]):'';
				 			finalContent.end_time	=	(slots[3])?parseInt(slots[3]):'';
				 			startTimeValue			=	(slots[4])?slots[4]:'';
				 			endTimeValue			=	(slots[5])?slots[5]:'';
					 		insertData.push(finalContent);
					 	} 
					});
				}
				
				if(startTimeValue){
					if(startTimeValue.indexOf("pm") != '-1'){
						startTimeValue.replace('pm','');
						startTimeValue 	=	startTimeValue.replace('pm','');
						let timeValue 	=	startTimeValue.split(':');
						startTimeValue 	=	String(parseInt(timeValue[0])+12)+':'+timeValue[1];
						if(parseInt(timeValue[0]) == 12){
							startTimeValue 	=	String(12)+':'+timeValue[1];
						}
					}else{
						startTimeValue.replace('am','');
						startTimeValue 	=	startTimeValue.replace('am','');
						let timeValue 	=	startTimeValue.split(':');

						if(parseInt(startTimeValue) < 10){
							startTimeValue 	=	'0'+String(parseInt(timeValue[0]))+':'+timeValue[1];
						}else{
							if(parseInt(startTimeValue) == 12){
								startTimeValue 	=	'12:'+timeValue[1];
							}else{
								startTimeValue 	=	String(parseInt(timeValue[0]))+':'+timeValue[1];
							}
						}
					}
				}
				
				let eventDateValueData 	=	(req.body.game_date) ? (req.body.game_date) : "";
				eventDateValueData 		= 	eventDateValueData.replace('00:00:00',startTimeValue);
				eventDateValueData 		=	newDate(eventDateValueData,DATABASE_DATE_FORMAT);
			
				/** Save contacts details */
				const player_temp_availability = db.collection('player_temp_availability');
				
				let  userId	=	ObjectId(response.result._id);

				let hostGameCondition =	{
					game_id 	: 	gameId,
					game_type 	: 	PRIVATE,
					start_time 	: 	insertData[0].start_time,
					end_time  	: 	insertData[0].end_time,
					event_date 	: 	eventDateValueData,
				};

				const host_game_availabilitys = db.collection('host_game_availabilitys');
				host_game_availabilitys.findOne(hostGameCondition,(hostGameAvailabilityErr, hostGameAvailabilityResult)=>{


					if(hostGameAvailabilityErr) return next(hostGameAvailabilityErr);
					
					if(hostGameAvailabilityResult){

						let conditionValuesNew 	=	{ 
								"$or": [{"order_status": ORDER_STATUS_APPROVED}, {"order_status": ORDER_STATUS_PENDING}],
								'game_book_date' 				: eventDateValueData,
								'game_start_time' 				: insertData[0].start_time,
								'game_end_time' 				: insertData[0].end_time,
						}
						if(userId){
							conditionValuesNew.player_id		=	{$in : [userId] };
						}
						getBookedGames(req,res,next,conditionValuesNew).then(bookingResponse=>{
							
							if(bookingResponse && bookingResponse.result == true){
								if(!errors) errors =[];
				                errors.push({'param':'gameavailability','msg':res.__("player.game_alredy_booked_on_this_date")});
				                if(errors && errors.length > 0){
									return resolve({status :	STATUS_ERROR, message :	errors});
								} 
							}
							
							player_temp_availability.findOne({player_id:userId},(err, result)=>{
								if(err) return next(err);
								/** Send error response */
								if(result){
									player_temp_availability.deleteMany({player_id:userId},(deleteManyErr)=>{
										if(deleteManyErr) return next(deleteManyErr);

										player_temp_availability.insertOne({
											game_id 			: gameId,
											player_id 			: userId,
											plan_id 			: planId,
											wager 				: (req.body.wager) ? req.body.wager : "",
											//game_date 			: (req.body.game_date) ? newDate(req.body.game_date,DATABASE_DATE_FORMAT) : "",
											game_date 			: eventDateValueData,
											gameavailability 	: insertData,
											modified 			: getUtcDate(),
											created 			: getUtcDate(),
										},async (err,result)=>{
											if(err) return next(result);
											/** Send success response **/
											resolve({
												status		:	STATUS_SUCCESS,
												message		:	res.__("player.game_availability_has_been_saved_successfully"),
											});	
										});
									});
								}else{
									player_temp_availability.insertOne({
										game_id 			: gameId,
										player_id 			: userId,
										wager 				: (req.body.wager) ? req.body.wager : "",
										game_date 			: (req.body.game_date) ? newDate(req.body.game_date,DATABASE_DATE_FORMAT)  : "",
										plan_id 			: planId,
										gameavailability 	: insertData,
										modified 			: getUtcDate(),
										created 			: getUtcDate(),
									},async (err,result)=>{
										if(err) return next(result);
										/** Send success response **/
										resolve({
											status		:	STATUS_SUCCESS,
											message		:	res.__("player.game_availability_has_been_saved_successfully"),
										});	
									});
								}
							});
						});
					}else{
						
						if(!errors) errors =[];
		                errors.push({'param':'gameavailability','msg':res.__("player.game_availability_not_found")});

		                if(errors && errors.length > 0){
							return resolve({status :	STATUS_ERROR, message :	errors});
						} 

					
					}
				});
			});
		});
	};//End addPlayerTempAvailability()



	let getBookedGames = (req,res,next,conditions)=>{
		return new Promise(async resolve=>{
			const order 	= 	db.collection('order');
			order.findOne(conditions,(errData, resultData)=>{
				if(errData) return next(errData);
				if(resultData){
					resolve({
				        status      : STATUS_SUCCESS,
				        result 		: true,
				        data 		: resultData	
				    });
				}else{
					resolve({
				        status      : STATUS_ERROR,
				        result 		: false,
				        data 		: {},	
				    });
				}
			});
		});
	}


	/**
	 * Function to get Game Specific Host List
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getGameSpecificHostList = (req,res,next)=>{
		return new Promise(async resolve=>{
			req.body 	 = sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let ratingOption = (req.body.rating_option) ? req.body.rating_option : "";
			/** Set options for get user details **/
			let options  = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1
				}
			};
			/**Condition  for user id*/
			options.conditions.slug	= userSlug;
			/** Get user details **/
			let response =  await getUserData(req,res,next,options);
			if(response.status != STATUS_SUCCESS) return next(response.message);
			if(!response.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			let seachField  = 	(req.body.seachvalue) ? req.body.seachvalue : "";


			let userId		=	ObjectId(response.result._id);

			const player_temp_availability = db.collection('player_temp_availability');

			//player_temp_availability.findOne({player_id:userId},(playerTempErr, playerTempResult)=>{

			player_temp_availability.aggregate([
				{$match : {player_id : userId}},
				/*{$lookup: {
					from 		: 	"games",
					localField	: 	"game_id",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},*/
				{$lookup: {
					from 		: 	"pricing_packages",
					localField	: 	"plan_id",
					foreignField: 	"_id",
					as 			: 	"plan_data"
				}},
				{$project : {
					_id:1,game_id:1,public_game_availability_id:1,player_id:1,plan_id:1,
					wager:1,game_date:1,gameavailability:1,modified:1,created:1,
					/*min_no_of_contestent:{"$arrayElemAt":["$game_category_data.min_no_of_contestent",0]},
					max_no_of_contestent:{"$arrayElemAt":["$game_category_data.max_no_of_contestent",0]},*/
					max_no_of_contestent:{"$arrayElemAt":["$plan_data.no_of_contestants",0]},
				}},
			]).toArray((playerTempErr, playerTempResult)=>{
				

				if(playerTempErr) return next(playerTempErr);

				/** Send error response */
				if(!playerTempResult && playerTempResult.length <= 0) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				playerTempResult 	=	(playerTempResult && playerTempResult[0])?playerTempResult[0]:{};

				
				let gameId 	= (playerTempResult.game_id) 	? playerTempResult.game_id : "";
				let tempId 	= (playerTempResult._id) 		? playerTempResult._id : "";
				
				let privateGameAvailabilityId 	=	(playerTempResult.gameavailability && playerTempResult.gameavailability[0].private_game_availability_id) ? ObjectId(playerTempResult.gameavailability[0].private_game_availability_id) :'';	
				let privateGameStartTime 		=	(playerTempResult.gameavailability && playerTempResult.gameavailability[0].start_time !== '') ? playerTempResult.gameavailability[0].start_time :'';	
				let privateGameEndTime 			=	(playerTempResult.gameavailability && playerTempResult.gameavailability[0].end_time !== '') ? playerTempResult.gameavailability[0].end_time :'';	
				let privateGameEventDate 		=	(playerTempResult && playerTempResult.game_date) ? playerTempResult.game_date :'';	

				const host_game_availabilitys 	= db.collection('host_game_availabilitys');
				let limit = (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;

				let hostGameCondition =	{
					game_id 	: 	gameId,
					game_type 	: 	PRIVATE,
					//private_game_availability_id 	: 	privateGameAvailabilityId,
					start_time 	: 	privateGameStartTime,
					end_time  	: 	privateGameEndTime,
					event_date 	: 	privateGameEventDate,
				};


				let hostSearchCondition =	{
					full_name 	: 	{$regex : seachField, $options : 'i'},
				};

				let sortValue = (req.body.rating_option) ? req.body.rating_option : "";
				if(sortValue){
					//hostSearchCondition['quizAvg']	=	{$gte:parseInt(sortValue)}
				}
				asyncParallel([
				    (callback)=>{
				        /** Get list of host game availabilitys **/
						host_game_availabilitys.aggregate([
							{$match : hostGameCondition},
							{$lookup: {
								from 		: 	"users",
								localField	: 	"host_id",
								foreignField: 	"_id",
								as 			: 	"host_users"
							}},
							{$lookup: {
								from 		: 	"user_review_ratings",
								localField	: 	"host_id",
								foreignField: 	"host_id",
								as 			: 	"host_review_ratings"
							}},
							{$project : 
								{
									_id:1,game_id:1,event_date:1,modified:1,created:1,game_type:1,
									host_id:1,start_time:1,end_time:1,private_game_availability_id:1,
									full_name:{"$arrayElemAt":["$host_users.full_name",0]},
									profile_picture:{"$arrayElemAt":["$host_users.profile_picture",0]},
									about_me:{"$arrayElemAt":["$host_users.about_me",0]},
									slug:{"$arrayElemAt":["$host_users.slug",0]},
									quizAvg: { $ifNull: [ { $avg: "$host_review_ratings.user_rating"}, 0 ] }
								}
							},
							{$match : hostSearchCondition},
							{$limit: limit },
							{$sort: {quizAvg : (parseInt(sortValue) != 1)?SORT_DESC:SORT_ASC}}
						]).toArray((hostGameAvailabilityErr, hostGameAvailabilityResult)=>{
							callback(hostGameAvailabilityErr, hostGameAvailabilityResult);
						});
				    },
				    (callback)=>{
				        host_game_availabilitys.aggregate([
							{$match : hostGameCondition},
							{$lookup: {
								from 		: 	"users",
								localField	: 	"host_id",
								foreignField: 	"_id",
								as 			: 	"host_users"
							}},
							{$project : 
								{
								full_name:{"$arrayElemAt":["$host_users.full_name",0]},
								}
							},
							{$match : hostSearchCondition},
						]).toArray((err, countResult)=>{
							callback(err, countResult.length);
						});
				    },
				],
				(err,response)=>{
					/** Send response **/
	                if(err) return next(err);
					let 	hostListsArray =  [];
					asyncEach(response[0],(orderResultData, asyncCallback)=>{
						const order 			= 	db.collection('order');
						let conditionValues 	=	{ 
							'host_id'						: ObjectId(orderResultData.host_id),
							/*'order_status'					: { $ne: ORDER_STATUS_PENDING },
							'order_status'					: { $ne: ORDER_STATUS_REJECTED },*/
							'order_status'					:  ORDER_STATUS_APPROVED ,
							//'order_book.game_date' 		: orderResultData.event_date,
							//'order_book.gameavailability' : {"$elemMatch": {start_time: orderResultData.start_time,end_time: orderResultData.end_time}},
							'game_book_date' 				: orderResultData.event_date,
							'game_start_time' 				: String(orderResultData.start_time),
							'game_end_time' 				: String(orderResultData.end_time),
						}
						getBookedGames(req,res,next,conditionValues).then(response=>{
							if(response && response.result == false){
								hostListsArray.push(orderResultData);
							}
							asyncCallback(null,hostListsArray);	
						}).catch(next);
					},(asyncErr,asyncContent)=>{

						/** Set options for append image **/
						let imageOptions = {
							"file_url" 			: USERS_URL,
							"file_path" 		: USERS_FILE_PATH,
							"result" 			: (hostListsArray) ? hostListsArray : [],
							"database_field" 	: "profile_picture"
						};

						/** Append image with full path **/
						appendFileExistData(imageOptions).then(fileResponse=>{
							/** Send success response **/
							let resultData 	= (fileResponse && fileResponse.result && fileResponse.result)	?	fileResponse.result	:{}
							return resolve({
								status			: STATUS_SUCCESS,
								result 			: (fileResponse && fileResponse.result && fileResponse.result)	?	fileResponse.result	:{},
								recordsTotal    : (response[1]) ? response[1] : 0,
								temp_id    		: tempId,
								//min_contestent  : playerTempResult.min_no_of_contestent,
								min_contestent  : 1,
								max_contestent  : playerTempResult.max_no_of_contestent,
							});
						});
					});
				});
			});
		});
	};//End getGameSpecificHostList()



	/**
	 * Function to get host data
	 *
	 * @param req		As	Request Data
	 * @param res		As 	Response Data
	 * @param options	As  object of data
	 *
	 * @return json
	 **/
	this.getHostDetails = (req,res,next,options) => {
		return new Promise(async(resolve)=>{

			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let experiencesWants = (req.body.experiences_wants) ? req.body.experiences_wants : false;
			if(!userSlug)return resolve({status : STATUS_SUCCESS,result : {}});


			let options = {
				conditions	: 	{ 
						     	user_role_id: FRONT_USER_ROLE_ID,
						     	active 		: ACTIVE,
						     	is_deleted 	: NOT_DELETED,
						     	is_verified	: VERIFIED,
						    },
				fields	:	{
					_id :1,full_name:1
				}
			};
			/**Condition  for user id*/
			options.conditions.slug	= userSlug;
			/** Get user details **/
			let response =  await getUserData(req,res,next,options);
			if(response.status != STATUS_SUCCESS) return next(response.message);
			if(!response.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
		

			let limit = (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;

			/** Set options for get user details **/
			//let conditions 	= FRONT_USER_COMMON_CONDITIONS;
			let conditions 	= {};
			conditions.slug = userSlug;

			asyncParallel([
			    (callback)=>{
			    	if(experiencesWants){
			    		/** Get list of order's **/
				        const order 	= 	db.collection('order');
						/** Get list of users's **/
						order.find({host_id:ObjectId(response.result._id),order_status:ORDER_STATUS_APPROVED},{projection: {order_book :1,host_id:1,order_status:1}}).toArray(async(orderErr,orderResult)=>{
							if(orderErr) return next(orderErr);
							if(!orderResult && orderResult.length <=0) callback(orderErr, []);
							let newArray 	=	0;
							asyncEach(orderResult,(orderResultData, asyncCallback)=>{
								let gameBookedDate  =   '';
						        let startTime       =   '';
						        let endTime         =   '';
						        if(orderResultData && orderResultData.order_book){
						            if(orderResultData.order_book.game_type == PUBLIC){
						                gameBookedDate  =   orderResultData.order_book.event_date;
						                startTime       =   orderResultData.order_book.start_time;
						                endTime         =   orderResultData.order_book.end_time;
						            }else{
						                if(orderResultData.order_book.preferred_date){
						                    gameBookedDate  =   orderResultData.order_book.preferred_date;
						                    startTime       =   orderResultData.order_book.start_time;
						                    endTime         =   orderResultData.order_book.end_time;
						                }else{
						                    gameBookedDate  =   orderResultData.order_book.game_date;
						                    if(orderResultData.order_book.gameavailability && orderResultData.order_book.gameavailability.length > 0){
						                        startTime       =   orderResultData.order_book.gameavailability[0].start_time;
						                        endTime         =   orderResultData.order_book.gameavailability[0].end_time;
						                    }
						                }
						            }
						        }

								let currentTimeStamp	=	new Date().getTime();
								let afterFixTimeStamp	=	getAsDate(gameBookedDate,covertFullHourtoAMPM(startTime));
								afterFixTimeStamp.setHours(afterFixTimeStamp.getHours());
								if(currentTimeStamp >= afterFixTimeStamp.getTime()){ // when today is greate from this date
									newArray +=	1;
								}
							 	asyncCallback(null);
							},(asyncErr,asyncContent)=>{
								callback(asyncErr, newArray);
							});
				        });
			    	}else{
			    		callback(null, null);
			    	}
			        
			    },
			    (callback)=>{
			    	/** Get user details **/
					const users	= db.collection("users");
			        users.aggregate([
						{$match : conditions},
						{$lookup: {
							from 		: 	"masters",
							localField	: 	"host_category",
							foreignField: 	"_id",
							as 			: 	"category_data"
						}},
						{$project : 
							{
								_id :1,full_name:1,profile_picture:1,about_me:1,host_category:{"$arrayElemAt":["$category_data.name",0]},
							}
						},
					]).toArray((err, result)=>{
			            callback(err, result);
			        });
			    }
			],
			(err,response)=>{
			    /** Send response **/

			    if(err){
					/** Send error response **/
					let response = {
						status	: STATUS_ERROR,
						message	: res.__("system.something_going_wrong_please_try_again")
					};
					return resolve(response);
				}

				let result 	=	(response[1]) ? response[1] : {};

				/** Send success response **/
				if(result && result.length <= 0)return resolve({status : STATUS_SUCCESS,result : false});

				/** Set options for append image **/
				let imageOptions = {
					"file_url" 			: USERS_URL,
					"file_path" 		: USERS_FILE_PATH,
					"result" 			: result,
					"database_field" 	: "profile_picture"
				};

				/** Append image with full path **/
				appendFileExistData(imageOptions).then(async(fileResponse)=>{

					let usersResult			=	(fileResponse && fileResponse.result && fileResponse.result[0])	?	fileResponse.result[0]	:{}
					let averageRatingValue 	=	await averageRating(usersResult._id);
                    /** Send success response **/
                    let res 	=	{
										status		 : STATUS_SUCCESS,
										result 		 : usersResult,
										avg_rating 	 : averageRatingValue.avg_rating,
										total_review : averageRatingValue.total_review,
									}
					res.experiences	=	(response[0]) ? response[0] : 0;
					return resolve(res);
				});

			});

		}).catch(next);
	};// end getHostDetails()


	/**
	 * Function to get host data
	 *
	 * @param req		As	Request Data
	 * @param res		As 	Response Data
	 * @param options	As  object of data
	 *
	 * @return json
	 **/
	this.getReviewsRatingList = (req,res,next,options) => {
		return new Promise(async (resolve)=>{

			let limit = (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;

			let userSlug 	= 	(req.body && req.body.user_slug)? req.body.user_slug : "";
			/** Set options for get user details **/
			let options = {
				conditions			: 	{slug:userSlug},
				fields				:	{_id :1,full_name:1}
			};
			/** Get player details **/
			let usersResult =  await getUserData(req,res,next,options);
			if(usersResult.status != STATUS_SUCCESS) return next(usersResult.message);
			if( userSlug !== typeof undefined  && !usersResult.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			/** Get user details **/
			const user_review_ratings	= db.collection("user_review_ratings");
            asyncParallel([
                (callback)=>{
                    /** Get list of faq's **/
					user_review_ratings.aggregate([
						{$match : {host_id:ObjectId(usersResult.result._id)}},
						{$limit: limit },
						{$lookup: {
							from 		: 	"users",
							localField	: 	"user_id",
							foreignField: 	"_id",
							as 			: 	"player_data"
						}},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"host_id",
							foreignField: 	"_id",
							as 			: 	"host_data"
						}},
						{$project : {
								_id:1,host_id:1,user_id:1,review:1,user_rating:1,comment:1,
								full_name:{"$arrayElemAt":["$player_data.full_name",0]},
								host_full_name:{"$arrayElemAt":["$host_data.full_name",0]},
								profile_picture:{"$arrayElemAt":["$player_data.profile_picture",0]},
							}
						},
					]).toArray((reviewErr, reviewResult)=>{
	                    callback(reviewErr, reviewResult);
		            });
                },
                (callback)=>{
                    /** Get total number of records in user review ratings collection **/
		            user_review_ratings.countDocuments({host_id:ObjectId(usersResult.result._id)},(err,countResult)=>{
                        callback(err, countResult);
                    });
                }
            ], (err,response)=>{					


        		/** Set options for append image **/
				let imageOptions = {
					"file_url" 			: USERS_URL,
					"file_path" 		: USERS_FILE_PATH,
					"result" 			: (response[0]) ? response[0] : [],
					"database_field" 	: "profile_picture"
				};

				/** Append image with full path **/
				appendFileExistData(imageOptions).then(fileResponse=>{
					/** Send success response **/
					return resolve({
						status			: STATUS_SUCCESS,
						reviews 		: (fileResponse && fileResponse.result && fileResponse.result)	?	fileResponse.result	:{},
						recordsTotal    : (response[1]) ? response[1] : 0,
					});
				});
            });
				
			
		}).catch(next);
	};// end getReviewsRatingList()


	/**
	 * Function to get host data
	 *
	 * @param req		As	Request Data
	 * @param res		As 	Response Data
	 * @param options	As  object of data
	 *
	 * @return json
	 **/
	this.getPlayerDetails = (req,res,next,options) => {
		return new Promise(resolve=>{
			let playerEmail = 	(req.body && req.body.player_email) 	? req.body.player_email: "";
			/** Set options for get user details **/
			let conditions 		= 	{};
			conditions.email 	= 	playerEmail;
			/** Get user details **/
			const users	= db.collection("users");
			users.findOne(conditions,{projection: {_id :1,full_name:1,profile_picture:1,about_me:1}},(err,result)=>{
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
	};// end getPlayerDetails()

	/**
	 * Function to get users list
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getUsersList = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userType 		= (req.body.user_type) 		? req.body.user_type :"";
			let conditions	= {
				active			:	ACTIVE,
				user_role_id 	: 	FRONT_USER_ROLE_ID,
				is_deleted 		:	NOT_DELETED,
				is_verified 	: 	VERIFIED
			};
			conditions.user_type	= userType;
			const users = db.collection('users');
			users.find(conditions,{projection: {slug :1,full_name:1,email:1}}).toArray((usersErr,usersResult)=>{
				if(usersErr) return next(usersErr);		
				if(usersResult && usersResult.length>0){
					usersResult.map((value,index)=>{
						delete value._id;
						usersResult[index].label		=	value.full_name+' '+value.email;
						usersResult[index].value		=	value.slug;
						delete value.email;
						delete value.full_name;
						delete value.slug;
					})
				}
				resolve({ status  : STATUS_SUCCESS,result  : usersResult});
			});
		});
	};//End getUsersList()


	/**
	 * Function to get Available Host Listing detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getAvailableHostListing = (req,res,next)=>{
		return new Promise(async resolve=>{
			let gameId 		= (req.body.game_id) 	? ObjectId(req.body.game_id) : "";
			let from 		= (req.body.from) 		? req.body.from : "";
			let eventDate 	= (req.body.event_date) ? newDate(req.body.event_date,DATABASE_DATE_FORMAT) : "";
			if(from){
			    eventDate 	= (req.body.event_date) ? req.body.event_date: "";
			}

			/** Get user details **/

			let availabilityCondition =	{
				event_date	:	eventDate,
				game_id		:	gameId,
				game_type 	: 	PRIVATE // Also Use In admin Custome 
			};
			const host_game_availabilitys = db.collection('host_game_availabilitys');
			host_game_availabilitys.aggregate([
				{$match : availabilityCondition},
				{$group : {
					_id : "$host_id",
				}},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"_id",
					foreignField: 	"_id",
					as 			: 	"host_users"
				}},
				{$lookup: {
					from 		: 	"user_review_ratings",
					localField	: 	"_id",
					foreignField: 	"host_id",
					as 			: 	"host_review_ratings"
				}},
				{$project : 
					{
						_id:1,full_name:{"$arrayElemAt":["$host_users.full_name",0]},email:{"$arrayElemAt":["$host_users.email",0]},quizAvg: { $avg: "$host_review_ratings.user_rating"}
					}
				},
			]).toArray((availabilityErr, availabilityResult)=>{
				if(availabilityErr) return next(availabilityErr);
				if(from){
					if(availabilityResult && availabilityResult.length>0){
						availabilityResult.map((value,index)=>{						
							let rating 	=	(value.quizAvg)?value.quizAvg:0
							availabilityResult[index].label		=	value.full_name+' ('+value.email+')'+' (Rating: '+rating+')';
							availabilityResult[index].value		=	value._id;
							delete value._id;
							delete value.full_name;
							delete value.email;
							delete value.quizAvg;
						})
					}
				}

				return resolve({ 
					status  				: STATUS_SUCCESS,
					result  				: (availabilityResult) ? availabilityResult  :[],
				});
			}); 
		});
	};// End getAvailableHostListing().



	let getCustomeXLGames = (req,res,next,conditions)=>{
		return new Promise(async resolve=>{
			const custom_package_booking 	= 	db.collection('custom_package_booking');
			custom_package_booking.findOne(conditions,(errData, resultData)=>{
				if(errData) return next(errData);
				if(resultData){
					resolve({
				        status      : STATUS_SUCCESS,
				        result 		: true,
				        data 		: resultData	
				    });
				}else{
					resolve({
				        status      : STATUS_ERROR,
				        result 		: false,
				        data 		: {},	
				    });
				}
			});
		});
	}


	/**
	 * Function to get Private Game's Host slot detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getPrivateGameHostSlotsListing = (req,res,next)=>{
		let gameType			= (req.body.game_type)? req.body.game_type : "";
		return new Promise(async resolve=>{
			/** Get Private Games Slot details **/			
			let gameId				= (req.body.game_id)	? ObjectId(req.body.game_id) : "";
			let hostId				= (req.body.host_id)	? ObjectId(req.body.host_id) : "";

			//let gameDay 			= (req.body.game_date)  ? newDate(req.body.game_date,DATABASE_DATE_FORMAT) : "";
			let gameDay 			= (req.body.game_date)  ? req.body.game_date : "";
			let from 				= (req.body.from)  		? req.body.from : "";

			const host_game_availabilitys = db.collection('host_game_availabilitys');
			
			let previousDate 	=   gameDay.replace('00:00:00','01:00:00');
			let nextDate 		=   gameDay.replace('00:00:00','23:59:00');
			previousDate 		=	newDate(previousDate,DATE_OF_BIRTH_FORMAT);
			nextDate 			=	newDate(nextDate,DATE_OF_BIRTH_FORMAT);



			let userSlug			= (req.body.user_slug)? req.body.user_slug : "";
			let userId = '';
			if(userSlug){
				/** Set options for get user details **/
				let options = {
					conditions			: 	{ 
										     	user_role_id: FRONT_USER_ROLE_ID,
										     	active 		: ACTIVE,
										     	is_deleted 	: NOT_DELETED,
										     	is_verified	: VERIFIED,
										    },
					fields				:	{_id :1,full_name:1}
				};
				/**Condition  for email*/
				options.conditions.slug	= userSlug;
				/** Get user details **/
				let userResponse =  await getUserData(req,res,next,options);
				userId 			 =	ObjectId(userResponse.result._id)
			}

			let conditions = {host_id:hostId,game_id:gameId,game_type:gameType};
			conditions['event_date']	=	{$in : [previousDate,nextDate,gameDay] };
			host_game_availabilitys.aggregate([
				{$match : conditions},
			]).toArray((err, result)=>{
				
				if(err) return next(err);
				/** Send error response */
				if(!result) return resolve({status : STATUS_ERROR, message	: res.__("admin.system.invalid_access") });

				if(from){

					let slotListsArray =  [];
					asyncEach(result,(orderResultData, asyncCallback)=>{
						let conditionValues 	=	{ 
							"$or"  							: [{"order_status": ORDER_STATUS_APPROVED}, {"order_status": ORDER_STATUS_PENDING}],
							'game_book_date' 				: orderResultData.event_date,
							'game_start_time' 				: orderResultData.start_time,
							'game_end_time' 				: orderResultData.end_time,
						}
						if(userId){
							conditionValues.player_id 	=	{$in : [userId] };
						}
						getBookedGames(req,res,next,conditionValues).then(response=>{
							if(response && response.result == false){
								slotListsArray.push(orderResultData);
							}
							asyncCallback(null,slotListsArray);	
						}).catch(next);
					},(asyncErr,asyncContent)=>{
						var flags = [], output = [], l = slotListsArray.length, i;
						for( i=0; i<l; i++) {
							if(gameDay && gameDay == slotListsArray[i].event_date){
								if( flags[slotListsArray[i].start_time]) continue;
							    flags[slotListsArray[i].start_time] = true;
							    output.push(slotListsArray[i]);
							}
						}
						
						/** Send success response **/
						resolve({
							status	: STATUS_SUCCESS,
							result	: output
						});
					});
				}else{

					let customSlotListsArray =  [];
					asyncEach(result,(orderResultData, asyncParentCallback)=>{
						let conditionValues 	=	{ 
							"$or" 					: [ {"approval_status": {"$ne": CUSTOM_PLAN_STATUS_REJECTED}} ],
							'preferred_date' 		: orderResultData.event_date,
							'start_time' 			: String(orderResultData.start_time),
							'end_time' 				: String(orderResultData.end_time),
						}
						if(userId){
							conditionValues.player_id 	=	userId;
						}
						getCustomeXLGames(req,res,next,conditionValues).then(response=>{
							if(response && response.result == false){
								customSlotListsArray.push(orderResultData);
							}
							asyncParentCallback(null,customSlotListsArray);	
						}).catch(next);
					},(asyncParentErr,asyncParentContent)=>{
						let slotListsArray =  [];
						if(customSlotListsArray.length > 0 ){
							asyncEach(customSlotListsArray,(orderResultData, asyncCallback)=>{
								let conditionValues 	=	{ 
									"$or" 							: [{"order_status": ORDER_STATUS_APPROVED}, {"order_status": ORDER_STATUS_PENDING}],
									'game_book_date' 				: orderResultData.event_date,
									'game_start_time' 				: orderResultData.start_time,
									'game_end_time' 				: orderResultData.end_time,
								}
								/*if(userId){
									conditionValues.player_id 	=	{$in : [userId] };
								}*/

								let conArray 	=	[];
								if(userId){
									conArray.push({"player_id": {$in : [userId] }});
								}
								conArray.push({"host_id": hostId});
								conditionValues.$or	=	conArray;
						
								getBookedGames(req,res,next,conditionValues).then(bookingResponse=>{
									if(bookingResponse && bookingResponse.result == false){

										let startTimeValue	=	orderResultData.start_time;
										if(parseInt(startTimeValue) < 10){
											startTimeValue 	=	'0'+String(parseInt(startTimeValue))+':00';
										}else{
											if(parseInt(startTimeValue) == 12){
												startTimeValue 	=	'12:00';
											}else{
												startTimeValue 	=	String(parseInt(startTimeValue))+':00';
											}
										}
										//let currentTime	 		= 	currentTimeStamp();
										let currentTime 			= 	new Date();
										currentTime.setHours( currentTime.getHours() + 1 );

										let now 				=   new Date(orderResultData.event_date+' '+startTimeValue);
										if(currentTime <= now.getTime()){
											slotListsArray.push(orderResultData);
										}


										//slotListsArray.push(orderResultData);
									}
									asyncCallback(null,slotListsArray);	
								}).catch(next);
							},(asyncErr,asyncContent)=>{
								var flags = [], output = [], l = slotListsArray.length, i;
								for( i=0; i<l; i++) {
								    if( flags[slotListsArray[i].start_time]) continue;
								    flags[slotListsArray[i].start_time] = true;
								    output.push(slotListsArray[i]);
								}

								/** Send success response **/
								resolve({
									status	: STATUS_SUCCESS,
									result	: output
								});
							});
						}else{
							resolve({
								status	: STATUS_SUCCESS,
								result	: slotListsArray
							});
						}
					});
				}
			});
		}); 
	};// End getPrivateGameHostSlotsListing().

}
module.exports = new Master();
