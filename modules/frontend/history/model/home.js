const asyncParallel		= require("async/parallel");
const crypto 			= require('crypto').createHash;
const bcrypt 			= require('bcryptjs').hash;
const bcryptCompare		= require('bcryptjs').compare;
const asyncEach 		= require("async").each;
const asyncforEachOf 	= require("async").forEachOf;
const request 			= require('request');






// function Home() {

// 	/**
// 	 * Function for render index file
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.index = (req,res,next)=>{
// 		asyncParallel({
// 			testimonials : (callback)=>{
// 				/** Get list of testmonials**/
// 				const testimonials	= db.collection("testimonials");
// 				testimonials.aggregate([
// 					{$match		: {is_active : ACTIVE}},
// 					{$sample	: { size: TESTIMONIAL_LIMIT } },
// 					{$project	: {designation:1, description:1, name:1}}
// 				]).toArray((err, result)=>{
// 					if(err || result.length <=0) return callback(err,result);
// 					/** Set options for appened image **/
// 					let options = {
// 						"file_url" 			: TESTIMONIAL_FILE_URL,
// 						"file_path" 		: TESTIMONIAL_FILE_PATH,
// 						"result" 			: result,
// 						"database_field" 	: "image",
// 						"image_placeholder" : "testmonial_image"
// 					};
// 					/** Appened image with full path **/
// 					appendFileExistData(options).then(responseData=>{
// 						result = (responseData && responseData.result)	?	responseData.result	:[];
// 						callback(err, result);
// 					}).catch(next);
// 				});
// 			},
// 			latest_news : (callback)=>{
// 				/** Get list of latest news**/
// 				const latest_news = db.collection("latest_news");
// 				latest_news.aggregate([
// 					{$match : {
// 						is_active: ACTIVE,
// 					}},
// 					{$sort 	: {created : SORT_DESC}},
// 					{$limit : LATEST_NEWS_LIMIT},
// 					{$lookup: {
// 						from 		: "users",
// 						localField	: "posted_by",
// 						foreignField: "_id",
// 						as 			: "user_data"
// 					}},
// 					{$project : {image:1,slug:1,name:1,posted_by:1,created:1,description:1,short_description:1,user_name:{"$arrayElemAt":["$user_data.full_name",0]}}},
// 				]).toArray((err, result)=>{
// 					if(err || result.length <=0) return callback(err,result);
				
// 					/** Set options for appened image **/
// 					let options = {
// 						"file_url" 			: LATEST_NEWS_FILE_URL,
// 						"file_path" 		: LATEST_NEWS_FILE_PATH,
// 						"result" 			: result,
// 						"database_field" 	: "image",
// 						"image_placeholder" : "latest_news_image"
// 					};
// 					/** Appened image with full path **/
// 					appendFileExistData(options).then(responseData=>{
// 						result = (responseData && responseData.result)	?	responseData.result	:[];
// 						callback(err, result);
// 					}).catch(next);
// 				});
// 			},
// 			featured_cause : (callback)=>{
// 				/** Get list of featured cause**/
// 				const causes	= db.collection("causes");
				
			
// 			causes.findOne({
// 				is_active: ACTIVE,
// 				approval_status: CAUSES_STATUS_APPROVED,
// 				$and : [/*{$or:[
// 					{last_date: {$gte: getUtcDate()}},
// 					{last_date : { $exists: false } }
// 				]},*/
// 				{$or: [
// 					{ is_featured: FEATURED },
// 					{ display_on_home_page: DISPLAY }
// 				]}]
// 			},{projection: {images:1,description:1,title:1,last_date:1,slug:1},sort: {is_featured:-1}},(err,result)=>{
			
				
// 					/** Send error response */
// 					if(err || !result) return callback(err,result);
					
					
// 					if(result.last_date){
// 						// Calculate the difference in milliseconds
// 			            var difference_ms = Math.abs(result.last_date - getUtcDate());
// 			            // Convert back to days and return
// 			            result.remainingdays = Math.round(difference_ms/ONEDAY);
// 					}

// 					/** Set options for appened image **/
// 					let options = {
// 						"file_url" 			: CAUSES_FILE_URL,
// 						"file_path" 		: CAUSES_FILE_PATH,
// 						"result" 			: result.images,
// 						"database_field" 	: "image",
// 					};
// 					appendFileExistData(options).then(response=>{
// 						result["images"] = (response.result) ? response.result :[];
// 						callback(err, result);
// 					}).catch(next);
// 				});
// 			},
// 			home_page_cause : (callback)=>{
// 				/** Get list of display on home page causes for home page **/
// 				const causes	= db.collection("causes");
// 				causes.aggregate([
// 					{$match: {
// 						is_active: ACTIVE,
// 						$or:[
// 							{last_date: {$gte: getUtcDate()}},
// 							{last_date : { $exists: false } }
// 						],
// 						approval_status:CAUSES_STATUS_APPROVED,
// 						display_on_home_page:DISPLAY
// 					}},
// 					{$sample: { size: HOME_PAGE_DISPLAY_CAUSES_LIMIT } },
// 					{$project : {images:1,description:1,title:1,slug:1}}
// 				]).toArray((homeCausesErr, homeCausesResponse)=>{
// 					if(homeCausesErr || homeCausesResponse.length <=0) return callback(homeCausesErr,homeCausesResponse);

// 					asyncforEachOf(homeCausesResponse,(records,index,asyncCallback)=>{
// 						/** Set options for appened image **/
// 						let options = {
// 							"file_url" 			: CAUSES_FILE_URL,
// 							"file_path" 		: CAUSES_FILE_PATH,
// 							"result" 			: records.images,
// 							"database_field" 	: "image",
// 						};
// 						appendFileExistData(options).then(response=>{
// 							homeCausesResponse[index]["images"] = (response.result) ? response.result :[];
// 							asyncCallback(null,homeCausesResponse);
// 						}).catch(next);
// 					},(err)=>{
// 						callback(homeCausesErr,homeCausesResponse);
// 					});
// 				});
// 			},
// 			home_page_volunteer : (callback)=>{
// 				/** Get list of home page volunteer**/
// 				const users					= 	db.collection("users");
// 				const clone					= 	require("clone");
// 				let commonCondition 		= 	clone(FRONT_USER_COMMON_CONDITIONS);
// 				commonCondition.user_type 	=	USER_TYPE_VOLUNTEER;


// 				users.aggregate([
// 					{$match: commonCondition},
// 					{$sample: { size: HOME_PAGE_DISPLAY_VOLUNTEER_LIMIT } },
// 					{ '$lookup': {
// 						'from': 'masters',
// 						'let': { 'cid': '$area_expertise' },
// 						'pipeline': [
// 							{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 							{$group	:	{
// 								'_id'	:	"$dropdown_type",
// 								'master_data' : {$push : {"name" : "$name","slug":"$slug"}}
// 							}},
// 						],
// 						'as':'master_details'
// 					}},
// 					{$project : {_id:1,full_name:1,profile_image:1,slug:1,master_details: {$arrayElemAt : ["$master_details.master_data",0]}}}
// 				]).toArray((homeVolunteerErr, homeVolunteerResponse)=>{  
// 					if(homeVolunteerErr || homeVolunteerResponse.length <=0) return callback(homeVolunteerErr,homeVolunteerResponse);
// 					asyncforEachOf(homeVolunteerResponse,(records,index,asyncCallback)=>{

// 						/** Set options for appened image **/
// 						let options = {
// 							"file_url" 			: USERS_URL,
// 							"file_path" 		: USERS_FILE_PATH,
// 							"result" 			: [records],
// 							"database_field" 	: "profile_image",
// 						};
// 						appendFileExistData(options).then(response=>{
// 							homeVolunteerResponse[index]["full_image_path"] = (response.result) ? response.result[0].full_image_path :[];
// 							asyncCallback(null,homeVolunteerResponse);
// 						});
// 					},(err)=>{
// 						callback(homeVolunteerErr,homeVolunteerResponse);
// 					});
// 				});
// 			},
// 		},(err,response)=>{
// 			/** Render to index page **/
// 			let result = {
// 				testimonials		: response.testimonials,
// 				latest_news			: response.latest_news,
// 				featured_cause		: response.featured_cause,
// 				home_page_cause		: response.home_page_cause,
// 				home_page_volunteer	: response.home_page_volunteer,
// 			};
// 			res.render('index', result);
// 		});
// 	};// end index()

// 	/**
// 	 * Function for submit contact us form
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.addContactUs = (req,res,next)=>{
// 		if(isPost(req)){
// 			/** Sanitize Data **/
// 			req.body 	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

// 			/** Check validation **/
// 			req.checkBody({
// 				"name": {
// 					notEmpty		: true,
// 					errorMessage	: res.__("contact_us.please_enter_name")
// 				},
// 				"email": {
// 					notEmpty	: true,
// 					errorMessage: res.__("contact_us.please_enter_email"),
// 					isEmail	: 	{
// 						errorMessage : res.__("contact_us.please_enter_valid_email_address")
// 					},
// 				},
// 				"mobile_number": {
// 					notEmpty	: true,
// 					isNumeric	:		{
// 						errorMessage: res.__("contact_us.invalid_mobile_number")
// 					},
// 					isLength	:	{
// 						options		: MOBILE_NUMBER_LENGTH,
// 						errorMessage: res.__("user.invalid_mobile_number")
// 					},
// 					errorMessage: res.__("contact_us.please_enter_mobile_number"),
// 				},
// 				"subject": {
// 					notEmpty		: true,
// 					errorMessage	: res.__("contact_us.please_enter_subject")
// 				},
// 				"message": {
// 					notEmpty		: true,
// 					errorMessage	: res.__("contact_us.please_enter_message")
// 				}
// 			});


// 			/** parse Validation array  **/
// 			let errors = parseValidation(req.validationErrors(),req);

// 			if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null){
// 				if(!errors) errors =[];
// 				errors.push({'param':'g_recaptcha_data','msg':res.__("causes.please_select_g-recaptcha-response")});
// 			}
// 			/** Send error response **/
// 			if(errors) return res.send({status : STATUS_ERROR, message : errors});

// 			const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + GOOGLE_SECRET_KEY + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;

// 			request(verificationURL,function(error,response,body) {
// 				bodyData = JSON.parse(body);
// 				if(bodyData.success !== undefined && !bodyData.success) {
// 				    return 	res.send({
// 								status		:	STATUS_SUCCESS,
// 								redirect_url:  	WEBSITE_URL+"contact-us",
// 								message		:	res.__("system.failed_captcha_verification"),
// 							});
// 				}

// 				/** Save contacts details */
// 				const contacts = db.collection('contacts');
// 				contacts.insertOne({
// 					name 		: req.body.name,
// 					email 		: req.body.email,
// 					phone 		: req.body.mobile_number,
// 					subject 	: req.body.subject,
// 					message 	: req.body.message,
// 					modified 	: getUtcDate(),
// 					created 	: getUtcDate(),
// 				},async (err,result)=>{
// 					if(err) return next(result);
// 					req.flash(STATUS_SUCCESS,res.__("contact_us.contact_has_been_saved_successfully"));
// 					/** Send success response **/
// 					res.send({
// 						status		:	STATUS_SUCCESS,
// 						redirect_url:  	WEBSITE_URL+"contact-us",
// 						message		:	res.__("contact_us.contact_has_been_saved_successfully"),
// 					});

// 					/*************** Send Mail To Admin  ***************/
// 					sendMailToUsers(req,res,{
// 						event_type 	: USER_CONTACT_US_EVENTS,
// 						name		: req.body.name,
// 						email 		: req.body.email,
// 						phone 		: req.body.mobile_number,
// 						message 	: req.body.message,
// 					});
// 				});
// 			});
// 		}else{
// 			res.render("contact_us");
// 		}
// 	};//End addContactUs()

// 	/**
// 	 * Function for get Project Details
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getProjectDetails = (req,res,next)=>{

// 		let masterSlug		= 	(req.params.slug) ? req.params.slug : 'all';
// 		let currentSiteUrl 	= 	(req.url)	? req.url.replace("/","") : "";
// 		if(currentSiteUrl == "mycauses"){
// 			return res.render('project', {
// 				master_slug		: masterSlug,
// 				status			: STATUS_SUCCESS,
// 				siteUrl  		: false
// 			});
// 		}
// 		const causes	= db.collection("causes");
// 		causes.aggregate([
// 			{ $match: {
// 				is_active: ACTIVE,
// 				$or:[
// 					{last_date: {$gte: getUtcDate()}},
// 					{last_date : { $exists: false } }
// 				],
// 				approval_status:CAUSES_STATUS_APPROVED}
// 			},
// 			{$unwind : "$causes_categorys"},
// 			{$lookup : {
// 				from 		: 	"masters",
// 				localField	: 	"causes_categorys",
// 				foreignField: 	"_id",
// 				as 			: 	"causes_category_data"
// 			}},
// 			{$project : {causes_category_name: {"$arrayElemAt":["$causes_category_data.name",0]},causes_category_slug: {"$arrayElemAt":["$causes_category_data.slug",0]},causes_category_id: {"$arrayElemAt":["$causes_category_data._id",0]}}},
// 			{$group : {
// 				_id : "$causes_category_id",
// 				slug: { $first: "$causes_category_slug" },
// 				category_name: { $first: "$causes_category_name" }
// 			}},
// 		]).toArray((err, result)=>{
// 			if(err) return next(err);
// 			res.render("project",{
// 				category_list  	: result,
// 				master_slug		: masterSlug,
// 				status			: STATUS_SUCCESS,
// 				siteUrl  		: true
// 			});
// 		});
// 	};//End getProjectDetails()

// 	/**
// 	 * Function for get causes list
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getMoreCausesList = async (req,res,next)=>{
// 		let currentSiteUrl 	= (req.url)	? req.url.replace("/","") : "";
// 		let masterId		= (req.body.master_id)	? 	ObjectId(req.body.master_id)	:'';
// 		let slug			= (req.body.master_slug)? 	req.body.master_slug	:'';
// 		let skip			= (req.body.skip)		? 	parseInt(req.body.skip)	:DEFAULT_SKIP;
// 		let limit			= (req.body.limit)		? 	req.body.limit	:FRONT_LISTING_LIMIT;
// 		const causes		= db.collection("causes");
// 		let causesCondition	=	{
// 			is_active: ACTIVE,
// 			$or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],
// 			approval_status:CAUSES_STATUS_APPROVED
// 		};
// 		if(masterId) causesCondition['causes_categorys']	=	{$in : [masterId] };
// 		let causeIds = [];
// 		if(req.session.user && req.session.user.user_type == USER_TYPE_VOLUNTEER){
// 			/** Set options data for get user details **/
// 			let userOptions 	= 	{user_id	: ObjectId(req.session.user._id)};
// 			let userResponse 	= 	await volunteerCauseLists(req,res,next,userOptions);
			
// 			if(userResponse && userResponse.status == STATUS_SUCCESS){
// 				asyncforEachOf(userResponse.result_data,(userResponseRecords,userResponseIndex,asyncCallback)=>{
// 					causeIds.push(ObjectId(userResponseRecords.cause_id));
// 					asyncCallback(null,causeIds);
// 				},(err)=>{});
// 			}
// 			if(currentSiteUrl == "ngo-more-causes-list") causesCondition['_id'] 		= {$in : causeIds };
// 		}else{
// 			if(currentSiteUrl == "ngo-more-causes-list") causesCondition['user_id'] 	= ObjectId(req.session.user._id);
// 		}
// 		asyncParallel({
// 			recent_causes : (callback)=>{
// 				causes.aggregate([
// 					{$match : causesCondition},
// 					{$lookup : {
// 						from 		: "users",
// 						localField	: "user_id",
// 						foreignField: "_id",
// 						as 			: "user_data"
// 					}},
// 					{ '$lookup': {
// 						'from': 'masters',
// 						'let': { 'cid': '$causes_categorys' },
// 						'pipeline': [
// 							{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 							{$group	:	{
// 								'_id'	:	"$dropdown_type",
// 								'name'	:	{$push : "$name"},
// 							}},
// 						],
// 						'as':'master_details'
// 					}},
// 					{$project :{images:1,user_id:1,created:1,description:1,title:1,slug:1,last_date:1,
// 								master_details: {$arrayElemAt : ["$master_details.name",0]},
// 								user_name:{"$arrayElemAt":["$user_data.full_name",0]}}},
// 					{$sort  : { created : SORT_DESC } },
// 					{$skip 	: skip}, 
// 					{$limit : limit}
// 				]).toArray((err, result)=>{

// 					if(err || result.length <=0) return callback(err,result);
// 					asyncforEachOf(result,(records,index,asyncCallback)=>{
// 						/** Set options for appened image **/
// 						let options = {
// 							"file_url" 			: CAUSES_FILE_URL,
// 							"file_path" 		: CAUSES_FILE_PATH,
// 							"result" 			: records.images,
// 							"database_field" 	: "image",
// 						};
// 						if(records.images.length<=0) options.multi_single_img = true;
// 						appendFileExistData(options).then(response=>{
// 							result[index]["images"] = (response.result) ? response.result :[];
// 							asyncCallback(null,result);
// 						});
// 					},(err)=>{
// 						callback(err,result);
// 					});
// 				});
// 			},
// 			total_count : (callback)=>{
// 				/** Get lead count **/
// 				causes.find(causesCondition).count((err,countResult)=>{
// 					callback(err, countResult);
// 				});
// 			},
// 		},(asyncErr,asyncResponse)=>{
// 			if(asyncErr) return next(asyncErr);
// 			/** Send success response **/
// 			res.render('causes_category_more_list',{
// 				layout      : 	false,
// 				skip    	:   skip,
// 				limit   	:   limit,
// 				slug		:	slug,
// 				master_id	:	masterId,
// 				result		:   (asyncResponse.recent_causes)	?	asyncResponse.recent_causes :[],
// 				total_count	:	(asyncResponse.total_count)		?	asyncResponse.total_count 	:0,
// 			});
// 		});
// 	};//End getMoreCausesList()


// 	/**
// 	 * Function to cause Lists
// 	 *
// 	 * @param req	As Request Data
// 	 * @param res	As Response Data
// 	 * @param next	As Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	let volunteerCauseLists = (req,res,next,options)=>{
// 		return new Promise(resolve=>{
// 			let userId	= (options.user_id)	? ObjectId(options.user_id):"";
// 			const volunteer_causes = db.collection("volunteer_causes");
// 			volunteer_causes.find({user_id:userId},{projection:{cause_id:1}}).toArray((err, result)=>{
// 				if(err) return next(err);
// 				resolve({status : STATUS_SUCCESS, result_data: result});
// 			});
// 		}).catch(next);
// 	};//End volunteerCauseLists()


// 	/**
// 	 * Function for get volunteers list
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getVolunteersLists =  (req,res,next)=>{
		
// 		if(req.session.user && req.session.user.user_type  &&  req.session.user.user_type == USER_TYPE_COMPANY){
// 			req.flash(STATUS_ERROR, res.__("system.invalid_access"));
// 			return res.redirect(WEBSITE_URL);
// 		}
// 		if(isPost(req)){
// 			let limit			=	(req.body.length) 	? parseInt(req.body.length) 	:FRONT_LISTING_LIMIT;
// 			let skip			= 	(req.body.start)  	? parseInt(req.body.start)  	:DEFAULT_SKIP;
// 			let causeId			= 	(req.body.cause_id) ? ObjectId(req.body.cause_id)  	:'';
// 			/** Configure Datatable conditions*/
// 			configDatatable(req,res,null).then(dataTableConfig=>{
// 				const collection	= 	db.collection('volunteer_causes');
// 				/** Set  Common Conditions **/
// 				let commonConditions = {};
// 				if(causeId) commonConditions.cause_id = causeId;
// 				/** Datatable conditions assign in a object*/
// 				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);
				
// 				let CommonAggr	=	[{$match 	: dataTableConfig.conditions},
// 									{$sort  	: { created : SORT_DESC } },
// 									{$skip 		: skip},
// 									{$limit 	: limit},
// 									{$lookup 	: {
// 										from 		: "users",
// 										localField	: "user_id",
// 										foreignField: "_id",
// 										as 			: "user_data"
// 									}},
// 									{$lookup : {
// 										from 		: "causes",
// 										localField	: "cause_id",
// 										foreignField: "_id",
// 										as 			: "causes_data"
// 									}},
// 									{$project :{user_id:1,created:1,
// 									user_name:{"$arrayElemAt":["$user_data.full_name",0]},
// 									causes_title:{"$arrayElemAt":["$causes_data.title",0]},
// 									profile_image:{"$arrayElemAt":["$user_data.profile_image",0]},
// 									email:{"$arrayElemAt":["$user_data.email",0]},
// 									slug:{"$arrayElemAt":["$user_data.slug",0]},
// 									mobile_number:{"$arrayElemAt":["$user_data.mobile_number",0]}}}];
// 				if(!causeId){
// 					CommonAggr.push({$group :{
// 							_id				: "$user_id",
// 							user_name 		: { $first: "$user_name" },
// 							created 		: { $first: "$created" },
// 							causes_title 	: { $first: "$causes_title" },
// 							email 			: { $first: "$email" },
// 							slug 			: { $first: "$slug" },
// 							mobile_number 	: { $first: "$mobile_number" },
// 							profile_image 	: { $first: "$profile_image" },
// 						}
// 					});
// 				}
// 				let CommonCountAggr	=	[{$match 	: dataTableConfig.conditions},
// 										{$lookup 	: {
// 											from 		: "users",
// 											localField	: "user_id",
// 											foreignField: "_id",
// 											as 			: "user_data"
// 										}},
// 										{$lookup : {
// 											from 		: "causes",
// 											localField	: "cause_id",
// 											foreignField: "_id",
// 											as 			: "causes_data"
// 										}}];

// 				if(!causeId){
// 					CommonCountAggr.push({$project :{user_id:1}},
// 					{$sort  : { created : SORT_DESC } },
// 					{$group : 	{
// 						_id				: "$user_id",
// 						user_name 		: { $first: "$user_name" },
// 						created 		: { $first: "$created" },
// 						causes_title 	: { $first: "$causes_title" },
// 						profile_image 	: { $first: "$profile_image" },
// 						email 			: { $first: "$email" },
// 						slug 			: { $first: "$slug" },
// 						mobile_number 	: { $first: "$mobile_number" }
// 					}},{$count : "count"});
// 				}else{
// 					CommonCountAggr.push({
// 						$project :{user_id:1,created:1,
// 						user_name:{"$arrayElemAt":["$user_data.full_name",0]},
// 						causes_title:{"$arrayElemAt":["$causes_data.title",0]},
// 						profile_image:{"$arrayElemAt":["$user_data.profile_image",0]},
// 						email:{"$arrayElemAt":["$user_data.email",0]},
// 						slug:{"$arrayElemAt":["$user_data.slug",0]},
// 						mobile_number:{"$arrayElemAt":["$user_data.mobile_number",0]}}},
// 						{$sort  : { created : SORT_DESC } },
// 						{$count : "count"
// 					});
// 				} 

// 				asyncParallel({
// 					collection_list :(callback)=>{
// 						/** Get list of categories  **/
// 						collection.aggregate(CommonAggr).toArray((err, result)=>{
// 							if(err || result.length <=0) return callback(err,result);
// 							asyncforEachOf(result,(records,index,asyncCallback)=>{
// 								let options = {
// 									"file_url" 			: USERS_URL,
// 									"file_path" 		: USERS_FILE_PATH,
// 									"result" 			: [records],
// 									"database_field" 	: "profile_image",
// 								};
// 								appendFileExistData(options).then(response=>{
// 									result[index]["profile_image"] = (response.result) ? response.result[0].full_image_path :[];
// 									asyncCallback(null,result);
// 								});

// 							},(err)=>{
// 								callback(err, result);
// 							});
// 						});
// 					},
// 					total_records:(callback)=>{
// 						if(causeId){
// 							/** Get total number of records in Documents collection **/
// 							collection.countDocuments(commonConditions,(err,countResult)=>{
// 								callback(err, countResult);
// 							});
// 						}else{
// 							collection.aggregate(CommonCountAggr).toArray((err, countResult)=>{
// 								countResultData = (countResult && countResult[0] && countResult[0].count) ? countResult[0].count : 0;
// 								callback(err,countResultData);
// 							});
// 						}
// 					},
// 					filter_records:(callback)=>{
// 						/** Get filtered records counting in categories **/
// 						collection.aggregate(CommonCountAggr).toArray((err, filterContResult)=>{
// 							filterContResult = (filterContResult && filterContResult[0] && filterContResult[0].count) ? filterContResult[0].count : 0;
// 							callback(err,filterContResult);
// 						});
// 					}
// 				},(err, response)=>{
// 					/** Send response **/
// 					res.send({
// 						status			: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
// 						draw			: dataTableConfig.result_draw,
// 						data			: (response.collection_list)? response.collection_list :[],
// 						recordsFiltered	: (response.filter_records) ? response.filter_records :0,
// 						recordsTotal	: (response.total_records)  ? response.total_records :0
// 					});
// 				});
// 			});
// 		}else{	
// 			let causeSlug	= 	(req.params.slug)? req.params.slug:'';
// 			if(!causeSlug) return res.render('volunteers_list');
// 			const causes 	= 	db.collection('causes');
// 			let causesCondition	=	{
// 				slug : causeSlug,
// 				is_active: ACTIVE,
// 				$or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],
// 				approval_status:CAUSES_STATUS_APPROVED
// 			};
// 			/** Get latest news details **/
// 			causes.aggregate([
// 				{$match : causesCondition},
// 				{ '$lookup': {
// 					'from': 'masters',
// 					'let': { 'cid': '$causes_categorys' },
// 					'pipeline': [
// 						{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 						{$group	:	{
// 							'_id'	:	"$dropdown_type",
// 							'name'	:	{$push : "$name"},
// 						}},
// 					],
// 					'as':'master_details'
// 				}},
// 				{$project : {_id:1,title:1,last_date:1,images:1,description:1,is_active:1,created:1,slug:1,master_details: {$arrayElemAt : ["$master_details.name",0]}}}
// 			]).toArray((causesErr, causesResult)=>{
// 				if(causesErr || causesResult.length <=0) return next(causesErr);
// 				/** Set options for appened image full path **/
// 				let options = {
// 					"file_url" 			: 	CAUSES_FILE_URL,
// 					"file_path" 		: 	CAUSES_FILE_PATH,
// 					"result" 			: 	causesResult[0].images,
// 					"database_field" 	: 	"image"
// 				};
// 				if(causesResult[0].images<=0) options.multi_single_img = true;
// 				/** Appened image with full path **/
// 				appendFileExistData(options).then(imageResponse=>{
// 					/** Send success response **/
// 					let newsResponse		= (imageResponse && imageResponse.result)?imageResponse.result	: {};
// 					causesResult[0].images 	= newsResponse;
// 					res.render('volunteers_list',{cause_id:causesResult._id,cause_slug:causeSlug,records:causesResult[0]});
// 				}).catch(next);
// 			});	
// 		}
// 	};//End getVolunteersLists()


// 	/**
// 	 * Function for get Organisation volunteers list
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getOrganisationVolunteersLists =  (req,res,next)=>{
// 		if(req.session.user && req.session.user.user_type  &&  req.session.user.user_type != USER_TYPE_COMPANY){
// 			req.flash(STATUS_ERROR, res.__("system.invalid_access"));
// 			return res.redirect(WEBSITE_URL);
// 		}
// 		if(isPost(req)){
// 			let limit			=	(req.body.length) 		? parseInt(req.body.length) 	:FRONT_LISTING_LIMIT;
// 			let skip			= 	(req.body.start)  		? parseInt(req.body.start)  	:DEFAULT_SKIP;
// 			/** Configure Datatable conditions*/
// 			configDatatable(req,res,null).then(dataTableConfig=>{
// 				const collection	= 	db.collection('users');
// 				/** Set  Common Conditions **/
// 				let commonConditions = {};
// 				if(req.session.user._id) commonConditions.parent_id = ObjectId(req.session.user._id);
// 				/** Datatable conditions assign in a object*/
// 				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);
// 				asyncParallel({
// 					volunteer_list :(callback)=>{
// 						/** Get list of categories  **/
// 						collection.aggregate([
// 							{$match : dataTableConfig.conditions},
// 							{$sort 	: dataTableConfig.sort_conditions},
// 							{$skip 	: skip},
// 							{$limit : limit},
// 							{$project : {_id:1,profile_image:1,email:1,slug:1,modified:1,mobile_number:1,full_name:1}}
// 						]).toArray((err, result)=>{

// 							asyncforEachOf(result,(records,index,asyncCallback)=>{
// 								let options = {
// 									"file_url" 			: USERS_URL,
// 									"file_path" 		: USERS_FILE_PATH,
// 									"result" 			: [records],
// 									"database_field" 	: "profile_image",
// 								};
// 								appendFileExistData(options).then(response=>{
// 									result[index]["profile_image"] = (response.result) ? response.result[0].full_image_path :[];
// 									asyncCallback(null,result);
// 								});
// 							},(err)=>{
// 								callback(err, result);
// 							});
// 						});
// 					},
// 					total_records:(callback)=>{
// 						/** Get total number of records in categories collection **/
// 						collection.countDocuments(commonConditions,(err,countResult)=>{
// 							callback(err, countResult);
// 						});
// 					},
// 					filter_records:(callback)=>{
// 						/** Get filtered records counting in categories **/
// 						collection.countDocuments(dataTableConfig.conditions,(err,filterContResult)=>{
// 							callback(err, filterContResult);
// 						});
// 					}
// 				},(err, response)=>{
// 					/** Send response **/
// 					res.send({
// 						status			: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
// 						draw			: dataTableConfig.result_draw,
// 						data			: (response.volunteer_list) ? response.volunteer_list :[],
// 						recordsFiltered	: (response.filter_records) ? response.filter_records :0,
// 						recordsTotal	: (response.total_records)  ? response.total_records :0
// 					});
// 				});
// 			});
// 		}else{
// 			res.render('organisation_volunteers_list');
// 		}
// 	};//End getOrganisationVolunteersLists()

// 	/**
// 	 * Function for get user Details
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getUserDetails = (req,res,next)=>{
// 		let userSlug				= 	(req.params.user_slug) ? req.params.user_slug : '';
// 		const clone					= 	require("clone");
// 		let commonCondition 		= 	clone(FRONT_USER_COMMON_CONDITIONS);
// 		commonCondition.slug 		=	userSlug;
// 		const users = db.collection("users");

// 		users.aggregate([
// 			{$match: commonCondition},
// 			{ '$lookup': {
// 				'from': 'masters',
// 				'let': { 'cid': '$area_expertise' },
// 				'pipeline': [
// 					{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 					{$group	:	{
// 						'_id'	:	"$dropdown_type",
// 						'master_data' : {$push : {"name" : "$name","slug":"$slug"}}
// 					}},
// 				],
// 				'as':'master_details'
// 			}},
// 			{$project : {_id:1,email:1,mobile_number:1,profile_image:1,user_type:1,full_name:1,master_details: {$arrayElemAt : ["$master_details.master_data",0]}}}
// 		]).toArray((err, result)=>{
// 			if(err) return next(err);
// 			/** Set options for appened image **/
// 			let options = {
// 				"file_url" 			: USERS_URL,
// 				"file_path" 		: USERS_FILE_PATH,
// 				"result" 			: [result[0]],
// 				"database_field" 	: "profile_image",
// 			};
// 			appendFileExistData(options).then(response=>{
// 				res.send({status : STATUS_SUCCESS,result:response.result[0]});
// 			}).catch(next);
// 		});
// 	};//End getUserDetails()


// 	/**
// 	 * Function for get about Details
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getAboutUsDetails = (req,res,next)=>{
// 		res.render("about");
// 	};//End getAboutUsDetails()

// 	/**
// 	 * Function for get HowItWorks Details
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getHowItWorksDetails = (req,res,next)=>{
// 		res.render("how_it_works");
// 	};//End getHowItWorksDetails()

// 	/**
// 	 * Function for get faqs Details
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getFaqsDetails = (req,res,next)=>{
// 		/** Get faq data **/
// 		const faqs = db.collection('faqs');

// 		faqs.aggregate([
// 			{$match : {is_active: ACTIVE}},
// 			{$lookup : {
// 				from 		: "masters",
// 				localField	: "faq_category",
// 				foreignField: "_id",
// 				as 			: "faq_category_data"
// 			}},
// 			{$project : {_id:1,question:1,answer:1,is_active:1,modified:1,faq_category_name: {"$arrayElemAt":["$faq_category_data.name",0]}}}
// 		]).toArray((err, response)=>{
// 			if(err) return next(err);

// 			if(!response) return res.send({status : STATUS_ERROR,response:{}, message : res.__("system.no_record_found")});
// 			/** Render to faq page **/
// 			let responseArray = [];
// 			if(response && response.length > 0) {
// 				response.map((records,index)=>{
// 					let Id = records.faq_category_name;
// 					if(!responseArray[Id]) responseArray[Id] = [];
// 					responseArray[Id].push(records);
// 				});
// 			}
// 			res.render("faqs",{
// 				result : responseArray
// 			});
// 		});
// 	};//End getFaqsDetails()

// 	/**
// 	 * Function for get gallery lists
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getGalleryDetails = (req,res,next)=>{
// 		let masterSlug	= (req.params.slug) ? req.params.slug : 'all';
// 		/** Get gallery data with category from masters **/
// 		const gallery	= db.collection("gallery");
// 		gallery.aggregate([
// 			{ $match: { is_active: ACTIVE} },
// 			{$unwind : "$gallery_categorys"},
// 			{$lookup : {
// 				from 		: 	"masters",
// 				localField	: 	"gallery_categorys",
// 				foreignField: 	"_id",
// 				as 			: 	"gallery_category_data"
// 			}},
// 			{$project : {gallery_category_name: {"$arrayElemAt":["$gallery_category_data.name",0]},gallery_category_slug: {"$arrayElemAt":["$gallery_category_data.slug",0]},gallery_category_id: {"$arrayElemAt":["$gallery_category_data._id",0]}}},
// 			{$group : {
// 				_id 			: "$gallery_category_id",
// 				slug 			: { $first: "$gallery_category_slug" },
// 				category_name 	: { $first: "$gallery_category_name" }
// 			}},
// 		]).toArray((err, result)=>{
// 			if(err) return next(err);
// 				res.render("gallery",{
// 				category_list  	: result,
// 				master_slug		: masterSlug,
// 			});
// 		});
// 	};//End getGalleryDetails()

// 	/**
// 	 * Function for submit register us form
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.userRegistration = (req,res,next)=>{
// 		console.log("sdsdds");
// 		let registrationType = (req.query.type)?req.query.type:"";
// 		if(isPost(req)){
// 			req.body 		= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
// 			req.checkBody({
// 				"email": {
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_email"),
// 					isEmail	: 	{
// 						errorMessage : res.__("user.please_enter_valid_email_address")
// 					},
// 				},
// 				"mobile_number": {
// 					notEmpty	: true,
// 					isNumeric	:		{
// 						errorMessage: res.__("user.invalid_mobile_number")
// 					},
// 					isLength	:	{
// 						options		: MOBILE_NUMBER_LENGTH,
// 						errorMessage: res.__("user.invalid_mobile_number")
// 					},
// 					errorMessage: res.__("user.please_enter_mobile_number"),
// 				},
// 				/*"user_type": {
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_user_type")
// 				},*/
// 				"password": {
// 					notEmpty	: 	true,
// 					isLength	:	{
// 						options			: PASSWORD_LENGTH,
// 						errorMessage	: res.__("user.password_length_should_be_minimum_6_character")
// 					},
// 					errorMessage: res.__("user.please_enter_password")
// 				},
// 				"confirm_password": {
// 					notEmpty		: true,
// 					isLength:{
// 						options: PASSWORD_LENGTH,
// 						errorMessage: res.__("user.confirm_password_length_should_be_minimum_6_character")
// 					},
// 					errorMessage	: res.__("user.please_enter_confirm_password")
// 				},
// 				"terms_conditions":{
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_terms_conditions")
// 				}
// 			});

// 			if(registrationType == USER_TYPE_NGO){
// 				req.checkBody({
// 					"ngo_full_name": {
// 						notEmpty	: true,
// 						errorMessage: res.__("user.please_enter_ngo_full_name")
// 					},
// 					"contact_person_ngo_name": {
// 						notEmpty	: true,
// 						errorMessage: res.__("user.please_enter_contact_person_ngo_name")
// 					}
// 				});
// 			}else if(registrationType == USER_TYPE_COMPANY){
// 				req.checkBody({
// 					"company_full_name": {
// 						notEmpty	: true,
// 						errorMessage: res.__("user.please_enter_company_full_name")
// 					},
// 					"contact_person_company_name": {
// 						notEmpty	: true,
// 						errorMessage: res.__("user.please_enter_contact_person_company_name")
// 					}
// 				});
// 			}else{
// 				req.checkBody({
// 					"full_name": {
// 						notEmpty	: true,
// 						errorMessage: res.__("user.please_enter_full_name")
// 					},
// 					"area_expertise_types": {
// 						notEmpty	: true,
// 						errorMessage: res.__("causes.please_select_area_expertise_types")
// 					}
// 				});
// 			}

// 			req.checkBody('confirm_password', res.__("user.confirm_password_should_be_same_as_password")).equals(req.body.password);
// 			let errors = parseValidation(req.validationErrors(),req);

// 			if(registrationType != USER_TYPE_COMPANY && (!req.files || !req.files.profile_image)){
// 				if(!errors) errors =[];
// 				errors.push({'param':'profile_image','msg':res.__("user.please_select_images")});
// 			}

// 			if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null){
// 				if(!errors) errors =[];
// 				errors.push({'param':'g_recaptcha_data','msg':res.__("causes.please_select_g-recaptcha-response")});
// 			}
			
// 			/** Send error response **/
// 			if(errors) return res.send({status :	STATUS_ERROR, message :	errors});


// 			let image			= (req.files && req.files.profile_image) ? req.files.profile_image	:"";
// 			let imageOptions	=	{
// 				'image' 	 : image,
// 				'filePath' 	 : USERS_FILE_PATH,
// 			};

// 			moveUploadedFile(req, res,imageOptions).then(imageResponse=>{
// 				if(imageResponse.status == STATUS_ERROR){
// 					/** Send error response **/
// 					return res.send({
// 						status	: STATUS_ERROR,
// 						message	: [{'param':'profile_image','msg':imageResponse.message}],
// 					});
// 				}
			
// 				const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + GOOGLE_SECRET_KEY + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
// 				request(verificationURL,function(error,response,body) {
// 					bodyData = JSON.parse(body);
// 					if(bodyData.success !== undefined && !bodyData.success) {
// 					    return 	res.send({status:STATUS_SUCCESS,redirect_url:WEBSITE_URL+"register",message:res.__("system.failed_captcha_verification")});
// 					}
					
// 					let email				= (req.body.email) 			? (req.body.email).toLowerCase()		:"";
// 					let mobileNumber		= (req.body.mobile_number) 	? req.body.mobile_number	:"";
// 					let fullName			= "";
// 					let userType			= registrationType;

// 					if(userType == USER_TYPE_NGO){
// 						fullName = (req.body.contact_person_ngo_name) 		? req.body.contact_person_ngo_name		:"";
// 					}else if(userType == USER_TYPE_COMPANY){
// 						fullName = (req.body.contact_person_company_name) 	? req.body.contact_person_company_name	:"";
// 					}else{
// 						fullName = req.body.full_name;
// 					}

// 					let password			= (req.body.password)		? req.body.password	: "";
// 					let timeStamp			= currentTimeStamp();
// 					let countryCode			= DEFAULT_COUNTRY_CODE;
// 					let validateString		= crypto("md5").update(timeStamp+mobileNumber+email).digest("hex");
// 					asyncParallel({
// 						user_data : callback=>{
// 							let options 		= {
// 								conditions	:	{
// 									is_deleted	: NOT_DELETED,
// 									$or			: [
// 										{email 			: {$regex : '^'+email+'$',$options : 'i'}},
// 										{mobile_number	: mobileNumber}
// 									]
// 								},
// 								fields : {_id:1,email:1,mobile_number:1}
// 							};
// 							getUserData(req,res,next,options).then(response=>{
// 								if(response && response.status != STATUS_SUCCESS) return callback(response.message,{});
// 								callback(null,response);
// 							}).catch(next);
// 						},
// 						slug : callback=>{
// 							/** Set options for get user slug **/
// 							let slugOptions = {
// 								title 		: fullName,
// 								table_name 	: "users",
// 								slug_field 	: "slug"
// 							};
// 							getDatabaseSlug(slugOptions).then(slugResponse=>{
// 								callback(null,slugResponse);
// 							});
// 						},
// 						new_password : callback=>{
// 							bcrypt(password, BCRYPT_PASSWORD_SALT_ROUNDS).then(bcryptPassword=>{
// 								callback(null,bcryptPassword);
// 							});
// 						}
// 					},(asyncErr,asyncResponse)=>{
// 						if(asyncErr) return next(asyncErr);
// 						let userResponseData 	= (asyncResponse.user_data) ? asyncResponse.user_data : {};
// 						if(userResponseData.status != STATUS_SUCCESS) return next(userResponseData.message);

// 						let slugResponse	= (asyncResponse.slug) ? asyncResponse.slug : {};
// 						let newPassword		= (asyncResponse.new_password) ? asyncResponse.new_password : "";

// 						if(userResponseData.result){
// 							let errMessage	 = [];
// 							let resultMail 	 = (userResponseData.result.email)		  ? userResponseData.result.email.toLowerCase()	:"";
// 							let resultMobile = (userResponseData.result.mobile_number) ? userResponseData.result.mobile_number		:"";
// 							let enteredMail  = email.toLowerCase();

// 							/** Push error message in array if email or mobile already exists*/
// 							if(resultMail == enteredMail){
// 								errMessage.push({'param':'email','msg':res.__("user.email_id_is_already_exist")});
// 							}
// 							if(resultMobile == mobileNumber){
// 								errMessage.push({'param':'mobile_number','msg':res.__("user.mobile_number_is_already_exist")});
// 							}
// 							/** Send error response **/
// 							return res.send({status : STATUS_ERROR, message :	errMessage});
// 						}

// 						/** Set data to insert **/
// 						let insertData = {
// 							full_name 				: fullName,
// 							slug 					: (slugResponse && slugResponse.title) ? slugResponse.title :"",
// 							email 					: email,
// 							mobile_number			: mobileNumber,
// 							password				: newPassword,
// 							is_verified 			: NOT_VERIFIED,
// 							is_email_verified 		: NOT_VERIFIED,
// 							validate_string 		: validateString,
// 							user_role_id 			: FRONT_USER_ROLE_ID,
// 							active 					: ACTIVE,
// 							is_deleted 				: NOT_DELETED,
// 							user_type				: userType,
// 							approval_status			: USER_STATUS_APPROVED,
// 							modified 				: getUtcDate(),
// 							created 				: getUtcDate()
// 						};

// 						if(userType == USER_TYPE_NGO){
// 							insertData.ngo 				= true;
// 							insertData.ngo_full_name 	= (req.body.ngo_full_name) ? req.body.ngo_full_name:"";
// 							insertData.profile_image 	= imageResponse.fileName;
// 						}else if(userType == USER_TYPE_COMPANY){
// 							insertData.company 			= true;
// 							insertData.company_full_name= (req.body.company_full_name) ? req.body.company_full_name:"";
// 						}else{
// 							insertData.volunteer 		= true;
// 							insertData.profile_image 	= imageResponse.fileName;
// 							let areaExpertiseTypes 		= (req.body && req.body.area_expertise_types) ? req.body.area_expertise_types : [];
// 							let areaExpertise 			= (areaExpertiseTypes.constructor === Array) ? areaExpertiseTypes : [areaExpertiseTypes];
// 							insertData.area_expertise	= arrayToObject(areaExpertise);
// 						}

// 						/** Save user details  **/
// 						const users	= db.collection("users");
// 						users.insertOne(insertData,(qryError,qryResult)=>{
// 							if(qryError) return next(qryError);
// 							let insertedUserId 	= (qryResult && qryResult.insertedId) ? qryResult.insertedId :"";
// 							/** Send success response **/

// 							/*req.flash(STATUS_SUCCESS,res.__("user.user_registered_successfully_message"));*/
// 							setErrorSuccessMessage(req,res,next,STATUS_SUCCESS,res.__("user.user_registered_successfully_message"));
// 							res.send({status:STATUS_SUCCESS,redirect_url:WEBSITE_URL+"success_page"});

// 							/*************** Send Login Credentials To User  ***************/
// 								let sendMailOptions	= {
// 									event_type 		: USER_REGISTRATION_EMAIL_EVENTS,
// 									user_id			: insertedUserId,
// 									validate_string	: validateString,
// 								};
// 								sendMailToUsers(req,res,sendMailOptions);
// 							/*************** Send Login Credentials To User  ***************/
// 						});

// 					});
// 				});
// 			});
// 		}else{
// 			if(!registrationType){
// 				res.render("register_type");
// 			}else{
// 				if(Object.keys(FRONTEND_USERS_TYPE).includes(registrationType) == false){
// 					setErrorSuccessMessage(req,res,next,STATUS_OTHER,res.__("user.you_are_using_wrong_link"));
// 					return res.redirect(WEBSITE_URL+"success_page");
// 				}

// 				if(registrationType == USER_TYPE_VOLUNTEER){
// 					let options = {
// 						collections : [{
// 							collection			: "masters",
// 							columns				: ["_id","name"],
// 							conditions			: {
// 								status 			: ACTIVE,
// 								dropdown_type 	: "area_expertise",
// 							}
// 						}]
// 					};
// 					getDropdownList(req,res,next, options).then(dropDrownResponse=> {
// 						if(dropDrownResponse.status != STATUS_SUCCESS){
// 							req.flash(STATUS_ERROR, res.__("system.invalid_access"));
// 							return res.redirect(WEBSITE_URL);
// 						}
// 						res.render('register',{
// 							registration_type	: 	registrationType,
// 							area_expertise_types: 	(dropDrownResponse.final_html_data[0]) ? dropDrownResponse.final_html_data[0]:"",
// 						});
// 					}).catch(next);
// 				}else{
// 					res.render("register",{registration_type:registrationType});
// 				}
// 			}
// 		}
// 	};//End userRegisteation()

// 	/**
// 	 * Function for add Volunteer
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.addVolunteer = (req,res,next)=>{
// 		if(isPost(req)){
// 			req.body 		= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
// 			req.checkBody({
// 				"email": {
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_email"),
// 					isEmail	: 	{
// 						errorMessage : res.__("user.please_enter_valid_email_address")
// 					},
// 				},
// 				"mobile_number": {
// 					notEmpty	: true,
// 					isNumeric	:		{
// 						errorMessage: res.__("user.invalid_mobile_number")
// 					},
// 					isLength	:	{
// 						options		: MOBILE_NUMBER_LENGTH,
// 						errorMessage: res.__("user.invalid_mobile_number")
// 					},
// 					errorMessage: res.__("user.please_enter_mobile_number"),
// 				},
// 				"full_name": {
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_full_name")
// 				},
// 				"area_expertise_types": {
// 					notEmpty	: true,
// 					errorMessage: res.__("causes.please_select_area_expertise_types")
// 				}
// 			});
// 			let errors = parseValidation(req.validationErrors(),req);

// 			if(!req.files || !req.files.profile_image){
// 				if(!errors) errors =[];
// 				errors.push({'param':'profile_image','msg':res.__("user.please_select_images")});
// 			}

// 			/** Send error response **/
// 			if(errors) return res.send({status :	STATUS_ERROR, message :	errors});

// 			let image			= (req.files && req.files.profile_image) ? req.files.profile_image	:"";
// 			let imageOptions	=	{
// 				'image' 	 : image,
// 				'filePath' 	 : USERS_FILE_PATH,
// 			};

// 			moveUploadedFile(req, res,imageOptions).then(async(imageResponse)=>{
// 				if(imageResponse.status == STATUS_ERROR){
// 					/** Send error response **/
// 					return res.send({
// 						status	: STATUS_ERROR,
// 						message	: [{'param':'profile_image','msg':imageResponse.message}],
// 					});
// 				}
			
// 				let email				= (req.body.email) 			? (req.body.email).toLowerCase()	:"";
// 				let mobileNumber		= (req.body.mobile_number) 	? req.body.mobile_number			:"";
// 				let fullName 			= (req.body.full_name) 		? req.body.full_name 				:"";

// 				/** Set options data for get Random Password **/
// 				let userOptions 		= {srting_length: 8};
// 				/** Get Random Password **/
// 				let getRandomPassword   = await getRandomString(req,res,next,userOptions);
// 				if(getRandomPassword.status != STATUS_SUCCESS) return next(getRandomPassword.message);
// 				let password			= (getRandomPassword.result) ? getRandomPassword.result :"";

// 				asyncParallel({
// 					user_data : callback=>{
// 						let options 		= {
// 							conditions	:	{
// 								is_deleted	: NOT_DELETED,
// 								$or			: [
// 									{email 			: {$regex : '^'+email+'$',$options : 'i'}},
// 									{mobile_number	: mobileNumber}
// 								]
// 							},
// 							fields : {_id:1,email:1,mobile_number:1}
// 						};
// 						getUserData(req,res,next,options).then(response=>{
// 							if(response && response.status != STATUS_SUCCESS) return callback(response.message,{});
// 							callback(null,response);
// 						}).catch(next);
// 					},
// 					slug : callback=>{
// 						/** Set options for get user slug **/
// 						let slugOptions = {
// 							title 		: fullName,
// 							table_name 	: "users",
// 							slug_field 	: "slug"
// 						};
// 						getDatabaseSlug(slugOptions).then(slugResponse=>{
// 							callback(null,slugResponse);
// 						});
// 					},
// 					new_password : callback=>{
// 						bcrypt(password, BCRYPT_PASSWORD_SALT_ROUNDS).then(bcryptPassword=>{
// 							callback(null,bcryptPassword);
// 						});
// 					}
// 				},(asyncErr,asyncResponse)=>{
// 					if(asyncErr) return next(asyncErr);
// 					let userResponseData 	= (asyncResponse.user_data) ? asyncResponse.user_data : {};
// 					if(userResponseData.status != STATUS_SUCCESS) return next(userResponseData.message);
// 					let slugResponse	= (asyncResponse.slug) ? asyncResponse.slug : {};
// 					let newPassword		= (asyncResponse.new_password) ? asyncResponse.new_password : "";

// 					if(userResponseData.result){
// 						let errMessage	 = [];
// 						let resultMail 	 = (userResponseData.result.email)		  ? userResponseData.result.email.toLowerCase()	:"";
// 						let resultMobile = (userResponseData.result.mobile_number) ? userResponseData.result.mobile_number		:"";
// 						let enteredMail  = email.toLowerCase();

// 						/** Push error message in array if email or mobile already exists*/
// 						if(resultMail == enteredMail){
// 							errMessage.push({'param':'email','msg':res.__("user.email_id_is_already_exist")});
// 						}
// 						if(resultMobile == mobileNumber){
// 							errMessage.push({'param':'mobile_number','msg':res.__("user.mobile_number_is_already_exist")});
// 						}
// 						/** Send error response **/
// 						return res.send({status : STATUS_ERROR, message :	errMessage});
// 					}
// 					/** Set data to insert **/
// 					let insertData = {
// 						full_name 				: fullName,
// 						slug 					: (slugResponse && slugResponse.title) ? slugResponse.title :"",
// 						email 					: email,
// 						mobile_number			: mobileNumber,
// 						password				: newPassword,
// 						is_verified 			: VERIFIED,
// 						is_email_verified 		: VERIFIED,
// 						validate_string 		: "",
// 						user_role_id 			: FRONT_USER_ROLE_ID,
// 						active 					: ACTIVE,
// 						is_deleted 				: NOT_DELETED,
// 						user_type				: USER_TYPE_VOLUNTEER,
// 						approval_status			: USER_STATUS_APPROVED,
// 						modified 				: getUtcDate(),
// 						created 				: getUtcDate()
// 					};

// 					insertData.parent_id 		= (req.session.user && req.session.user._id)?ObjectId(req.session.user._id):"";
// 					insertData.volunteer 		= true;
// 					insertData.profile_image 	= imageResponse.fileName;
// 					let areaExpertiseTypes 		= (req.body && req.body.area_expertise_types) ? req.body.area_expertise_types : [];
// 					let areaExpertise 			= (areaExpertiseTypes.constructor === Array) ? areaExpertiseTypes : [areaExpertiseTypes];
// 					insertData.area_expertise	= arrayToObject(areaExpertise);
					
// 					/** Save user details  **/
// 					const users	= db.collection("users");
// 					users.insertOne(insertData,(qryError,qryResult)=>{
// 						if(qryError) return next(qryError);
// 						let insertedUserId 	= (qryResult && qryResult.insertedId) ? qryResult.insertedId :"";
// 						/** Send success response **/

// 						/*req.flash(STATUS_SUCCESS,res.__("user.user_registered_successfully_message"));*/
// 						setErrorSuccessMessage(req,res,next,STATUS_SUCCESS,res.__("user.new_volunteer_registered_successfully_message"));
// 						res.send({status:STATUS_SUCCESS,redirect_url:WEBSITE_URL+"success_page"});

// 						/*************** Send Login Credentials To User  ***************/
// 							/*let sendMailOptions	= {
// 								event_type 		: USER_REGISTRATION_EMAIL_EVENTS,
// 								user_id			: insertedUserId,
// 								validate_string	: validateString,
// 							};*/
// 							//sendMailToUsers(req,res,sendMailOptions);
// 						/*************** Send Login Credentials To User  ***************/
// 					});
// 				});
// 			});
// 		}else{
// 			let options = {
// 				collections : [{
// 					collection			: "masters",
// 					columns				: ["_id","name"],
// 					conditions			: {
// 						status 			: ACTIVE,
// 						dropdown_type 	: "area_expertise",
// 					}
// 				}]
// 			};
// 			getDropdownList(req,res,next, options).then(dropDrownResponse=> {
// 				if(dropDrownResponse.status != STATUS_SUCCESS){
// 					req.flash(STATUS_ERROR, res.__("system.invalid_access"));
// 					return res.redirect(WEBSITE_URL);
// 				}
// 				res.render('add_volunteer',{
// 					area_expertise_types: 	(dropDrownResponse.final_html_data[0]) ? dropDrownResponse.final_html_data[0]:"",
// 				});
// 			}).catch(next);
			
// 		}
// 	};//End addVolunteer()

// 	/**
// 	 * Function to verify email address
// 	 *
// 	 * @param req	As Request Data
// 	 * @param res	As Response Data
// 	 * @param next	As Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	let verifyEmailAddress = (req,res,next)=>{
// 		return new Promise(resolve=>{
// 			/** Sanitize Data */
// 			req.body 			= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
// 			let validateString	= (req.body.validate_string)	? req.body.validate_string	:"";

// 			/** Send error response */
// 			if(!validateString) return resolve({status : STATUS_ERROR, message	: res.__("system.missing_parameters")});

// 			/** Get user details  **/
// 			const users = db.collection("users");
// 			users.findOne({
// 				is_deleted				: NOT_DELETED,
// 				//is_email_verified		: NOT_VERIFIED,
// 				validate_string			: validateString,
// 			},{projection: {_id:1,user_role_id:1,user_type:1,is_verified:1,is_email_verified:1}},(err,result)=>{
// 				if(err) return next(err);

// 				/** Send error response */
// 				if(!result) return resolve({status : STATUS_ERROR, message : res.__("user.you_are_using_wrong_link")});
// 				if(result && result.is_verified == VERIFIED && result.is_email_verified == VERIFIED){
// 					return resolve({status : STATUS_SUCCESS, redirect_url : WEBSITE_URL+"dashboard"});
// 				}

// 				let updateData		=	{
// 					$set: {
// 						is_email_verified	: VERIFIED,
// 						is_verified			: VERIFIED,
// 						modified			: getUtcDate()
// 					},
// 					/*$unset : {
// 						validate_string	: 1
// 					}*/
// 				};

// 				/** Update user details **/
// 				users.updateOne({
// 					_id : ObjectId(result._id)
// 				},
// 				updateData,(updateErr,updateResult)=>{
// 					if(updateErr) return next(updateErr);
// 					/** Send success response **/
// 					resolve({
// 						status 	:	STATUS_SUCCESS,
// 						result  : 	result,
// 						message	:	res.__("user.your_email_address_verified_successfully"),
// 					});
// 				});
// 			});
// 		}).catch(next);
// 	};//End verifyEmailAddress()

// 	/**
// 	 * Function to verify email
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 * @param next 	As Callback argument to the middleware function
// 	 *
// 	 * @return render/json
// 	 */
// 	this.verifyEmail = (req, res,next)=>{
// 		let validateString = (req.params.validate_string) ? req.params.validate_string 	:"";

// 		req.body.validate_string = validateString;
// 		verifyEmailAddress(req, res,next).then(response=>{
// 			/** Send response **/
// 			if(response && response.status == STATUS_ERROR){
// 				//req.flash(response.status,response.message);
// 				//return res.redirect(WEBSITE_URL)
// 				setErrorSuccessMessage(req,res,next,response.status,response.message);
// 				return res.redirect(WEBSITE_URL+"success_page");
// 			}
					
// 			if(response && response.status == STATUS_SUCCESS && response.redirect_url) return res.redirect( WEBSITE_URL+"dashboard");

// 			const users = db.collection("users");
// 			users.findOne({_id : ObjectId(response.result._id)},(userErr,userResult)=>{
// 				if(userErr) return next(userErr);
// 				if(response && response.result && response.result.user_type){
// 					req.session.user 	= userResult;
// 					setErrorSuccessMessage(req,res,next,response.status,response.message);
// 					return res.redirect(WEBSITE_URL+"success_page");
// 				}else{
// 					setErrorSuccessMessage(req,res,next,STATUS_OTHER,res.__("system.something_going_wrong_please_try_again"));
// 					return res.redirect(WEBSITE_URL+"success_page");
// 					//req.flash(res.__("system.something_going_wrong_please_try_again"));
// 					//return res.redirect(WEBSITE_URL)
// 				}
// 			});
// 		}).catch(next);
// 	};//End verifyEmail()

// 	/**
// 	 * Function for resend email to verify email link
// 	 *
// 	 * @param req As Request Data
// 	 * @param res As Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return render/json
// 	 */
// 	this.resendVerifyEmailLink = (req,res,next)=>{
// 		let verificationString	= 	(req.params.verification_validate_string) ? req.params.verification_validate_string :"";

// 		/** Send error response */
// 		if(!verificationString){
// 			req.flash(STATUS_ERROR,res.__("user.link_expired_or_wrong_link"));
// 			return res.redirect(WEBSITE_URL);
// 		}
// 		/** Get user details  **/
// 		const users = db.collection("users");
// 		users.findOne({
// 			validate_string	: verificationString,
// 			is_deleted		: NOT_DELETED
// 		},{projection: {_id:1,email:1,full_name:1,mobile_number:1}},(err,result)=>{
// 			if(err) return next(err);

// 			/** Send error response */
// 			if(!result || !result._id){
// 				req.flash(STATUS_ERROR,res.__("user.link_expired_or_wrong_link"));
// 				return res.redirect(WEBSITE_URL);
// 			}

// 			let timeStamp			= 	currentTimeStamp();
// 			let userEmail 			= 	(result.email) 			? result.email 			:"";
// 			let mobileNumber 		= 	(result.mobile_number) 	? result.mobile_number 	:"";
// 			let userName 			= 	(result.full_name) 		? result.full_name 		:"";
// 			let newValidateString	= 	crypto("md5").update(timeStamp+mobileNumber+userEmail).digest("hex");
// 			/** Update user details **/
// 			users.updateOne({
// 				_id : ObjectId(result._id)
// 			},
// 			{$set: {
// 				validate_string	: newValidateString,
// 				modified		: getUtcDate()
// 			}},(updateErr,updateResult)=>{
// 				if(updateErr) return next(updateErr);

// 				/******* Send verify email to user *******/
// 					let verifyLink	=	WEBSITE_URL+"verify_email/"+newValidateString;
// 					sendMail(req,res,{
// 						to 			: userEmail,
// 						action 		: "email_verification_link",
// 						rep_array 	: [userName,verifyLink]
// 					});
// 				/******* Send verify email to user *******/

// 				/** Send success response **/

// 				req.flash(STATUS_SUCCESS,res.__("user.verification_link_send_to_email",userEmail));
// 				res.redirect(WEBSITE_URL);
// 			});
// 		});
// 	};//End resendVerifyEmailLink()

// 	/**
// 	 * Function for login user
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 * @param next	As Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 **/
// 	let loginSubmit = (req,res,next)=>{
// 		return new Promise(resolve=>{
// 			/** Sanitize Data **/
// 			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

// 			/** Check validation **/
// 			req.checkBody({
// 				'user_name': {
// 					notEmpty		: true,
// 					errorMessage	: res.__("user.please_enter_user_name"),
// 					matches			: {
// 						options		: [EMAIL_REGULAR_EXPRESSION],
// 						errorMessage: res.__("user.please_enter_valid_email_address")
// 					},
// 				},
// 				"password": {
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_password")
// 				},
// 			});

// 			/** parse Validation array  **/
// 			let errors = parseValidation(req.validationErrors(),req);

// 			if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null){
// 				if(!errors) errors =[];
// 				errors.push({'param':'g_recaptcha_data','msg':res.__("causes.please_select_g-recaptcha-response")});
// 			}
// 			/** Send error response **/
// 			if(errors) return resolve({status : STATUS_ERROR, message	: errors});
// 			const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + GOOGLE_SECRET_KEY + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
// 			request(verificationURL,async function(error,response,body) {
// 				bodyData = JSON.parse(body);
// 				if(bodyData.success !== undefined && !bodyData.success) {
// 				    return resolve({status	: STATUS_ERROR,message	: "Failed captcha verification"});
// 				}

// 				let userName 	= (req.body.user_name)	? (req.body.user_name).toLowerCase() :"";
// 				let password 	= (req.body.password)	? req.body.password	 :"";

// 				/** Set conditions **/
// 				let conditions	=	{
// 					user_role_id	: FRONT_USER_ROLE_ID,
// 					is_deleted		: NOT_DELETED,
// 					"$or"			: [
// 						{"email"	: {$regex : '^'+userName+'$',$options : 'i'}}, //check user name with case insensitive
// 					],
// 				};


// 				/** Set options data for get user details **/
// 				let userOptions = {
// 					conditions	: conditions,
// 					fields		: {is_deleted:0,created:0,modified:0}
// 				};

// 				/** Get user details **/
// 				let userResponse = await getUserData(req,res,next,userOptions);
// 				if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
// 				let resultData	= (userResponse.result) ? userResponse.result :"";
// 				if(!resultData){
// 					/** Send error/success response **/
// 					return resolve({
// 						status	: STATUS_ERROR,
// 						message	: [{"param":"password","msg":res.__("user.email_password_entered_incorrect")}]
// 					});
// 				}
// 				/**Check password is matched or not */
// 				let userPassword 	= (resultData.password) ? resultData.password : "";
// 				let isPasswordMatch	= await bcryptCompare(password, userPassword);
// 				if(!isPasswordMatch){

// 					return resolve({
// 						status	: STATUS_ERROR,
// 						message	: [{"param":"password","msg":res.__("user.email_password_entered_incorrect")}]
// 					});
// 				}

// 				if(resultData.is_verified != VERIFIED){
// 					/** Response if user not verifird by admin*/
// 					// return resolve({
// 					// 	status	: STATUS_ERROR,
// 					// 	message	: res.__("user.account_is_not_verified")
// 					// });
// 					let verifyLinkAgain	=	WEBSITE_URL+"resend_verification_link/"+resultData.validate_string;
// 					return resolve({status : STATUS_ERROR, message	: [{param : "password",msg :res.__("user.account_is_not_verified")+' '+'<a href="'+verifyLinkAgain+'" class="form_link">'+res.__("user.resend_verification_link")+'</a>'}]});
// 				}
// 				if(resultData.active != ACTIVE){
// 					/** Response if user deactivated by admin*/
// 					// return resolve({
// 					// 	status	: STATUS_ERROR,
// 					// 	message	: res.__("user.account_temporarily_disabled")
// 					// });
// 					return resolve({status : STATUS_ERROR, message	: [{param : "password",msg :res.__("user.account_temporarily_disabled")}]});
// 				}
// 				if(resultData.approval_status != USER_STATUS_APPROVED){
// 					/** Response if user not approved by admin*/
// 					// return resolve({
// 					// 	status	: STATUS_ERROR,
// 					// 	message	: res.__("user.account_not_approved_by_admin")
// 					// });
// 					return resolve({status : STATUS_ERROR, message	: [{param : "password",msg :res.__("user.account_not_approved_by_admin")}]});
// 				}
// 				return resolve({
// 					status	: STATUS_SUCCESS,
// 					result	: resultData
// 				});
// 			});
// 		});
// 	};//End login()

// 	/**
// 	 * Function to login email
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 * @param next 	As Callback argument to the middleware function
// 	 *
// 	 * @return render/json
// 	*/
// 	this.login = (req, res,next)=>{
// 		if(isPost(req)){
// 			loginSubmit(req, res,next).then(response=>{
// 				if(response.status != STATUS_SUCCESS) return res.send(response);
// 				/** Send success response **/
// 				req.flash(STATUS_SUCCESS,response.message);

// 				if(response && response.result && response.result.user_type){
// 					redirectUrl = WEBSITE_URL+"dashboard";
// 					/*if(response.result.user_type == USER_TYPE_NGO){
// 						redirectUrl = WEBSITE_URL+"dashboard";
// 					}else if(response.result.user_type == USER_TYPE_VOLUNTEER){
// 						redirectUrl = WEBSITE_URL+"dashboard";
// 					}*/
// 				}else{
// 					return resolve({status	: STATUS_ERROR,message	: res.__("system.something_going_wrong_please_try_again")});
// 				}
// 				req.session.user = response.result;
// 				res.send({status : STATUS_SUCCESS,redirect_url : redirectUrl});
// 			}).catch(next);
// 		}else{
// 			/** Render to login page **/
// 			if(!req.session.user){
// 				res.render("login",{layout:false});
// 			}else{
// 				res.send({status : STATUS_SUCCESS,is_redirect_url : true,redirect_url : WEBSITE_URL});
// 			}
// 		}
// 	};//End login()

// 	/**
// 	 * Function to dashboard email
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 * @param next 	As Callback argument to the middleware function
// 	 *
// 	 * @return render/json
// 	*/
// 	this.dashboard = (req, res,next)=>{
// 		if(req.session.user && req.session.user.user_type  &&  req.session.user.user_type != USER_TYPE_NGO){
// 			return res.render("dashboard");
// 		}
// 		const causes	= db.collection("causes");
// 		causes.aggregate([
// 			{$match : {	
// 				is_active: ACTIVE,
// 				approval_status : CAUSES_STATUS_APPROVED,
// 				$or:[{last_date : {$gte: getUtcDate()}},{last_date : { $exists: false } }],
// 				is_completed	: NOT_COMPLETED,
// 				volunteer_exist : { $exists: true },
// 				user_id			: ObjectId(req.session.user._id),
// 			}},
// 			{$sample: { size: LATEST_DASHBOARD_CAUSES_LIMIT } },
// 			{$lookup : {
// 				from 		: "users",
// 				localField	: "user_id",
// 				foreignField: "_id",
// 				as 			: "user_data"
// 			}},
// 			{ '$lookup': {
// 				'from': 'masters',
// 				'let': { 'cid': '$causes_categorys' },
// 				'pipeline': [
// 					{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 					{$group	:	{
// 						'_id'	:	"$dropdown_type",
// 						'name'	:	{$push : "$name"},
// 					}},
// 				],
// 				'as':'master_details'
// 			}},
// 			{$project : {_id:1,title:1,last_date:1,images:1,description:1,category:1,is_active:1,slug:1,created:1,master_details: {$arrayElemAt : ["$master_details.name",0]},user_name:{"$arrayElemAt":["$user_data.full_name",0]}}},
// 			{$sort  : { created : SORT_DESC } },
// 			{$limit : LATEST_CAUSES_LIMIT}
// 		]).toArray((causesErr, causesResponse)=>{
// 			if(causesErr) return next(updateErr);
// 			if(causesResponse && causesResponse.length <=0) return res.render("dashboard",{causes_result:[]});
// 		 	asyncforEachOf(causesResponse,(records,index,asyncCallback)=>{
// 				let options = {
// 					"file_url" 			: CAUSES_FILE_URL,
// 					"file_path" 		: CAUSES_FILE_PATH,
// 					"result" 			: records.images,
// 					"database_field" 	: "image",
// 				};
// 				if(records.images.length<=0) options.multi_single_img = true;

// 				appendFileExistData(options).then(response=>{
// 					causesResponse[index]["images"] = (response.result) ? response.result[0] :[];
// 					asyncCallback(null,causesResponse);
// 				});
// 			},(err)=>{
// 				res.render("dashboard",{causes_result:causesResponse});
// 			});
// 		});
// 	};//End dashboard()


// 	/**
// 	 * Function to success page
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 * @param next 	As Callback argument to the middleware function
// 	 *
// 	 * @return render/json
// 	*/
// 	this.successErrorPage = (req, res,next)=>{
// 		let messageContent 	= 	(req.session.message_content && typeof req.session.message_content !== typeof undefined)?req.session.message_content:"";
// 		let status 			= 	(req.session.message_type && typeof req.session.message_type !== typeof undefined)?req.session.message_type:"";
// 		return res.render("success_error_page",{status: status,message:messageContent});
// 	};//End successPage()


// 	/**
// 	 * Function for recover forgot password
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return render/json
// 	 **/
//     let userForgotPassword = (req,res,next)=>{
// 		return new Promise(async resolve=>{
// 			/** Sanitize Data **/
// 			req.body 	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

// 			/** Check validation **/
// 			req.checkBody({
// 				'user_name': {
// 					notEmpty		: true,
// 					errorMessage	: res.__("user.please_enter_user_name"),
// 					matches			: {
// 						options		: [EMAIL_REGULAR_EXPRESSION],
// 						errorMessage: res.__("user.please_enter_valid_email_address")
// 					},
// 				},
// 			});

// 			/** parse Validation array  **/
// 			let errors = parseValidation(req.validationErrors(),req);

// 			/** Send error response **/
// 			if(errors) return resolve({status : STATUS_ERROR, message: errors});
// 			let userName	= (req.body.user_name)	? req.body.user_name :"";

// 			/** Set options for get user details **/
// 			let options = {
// 				conditions			: {
// 					user_role_id	: FRONT_USER_ROLE_ID,
// 					is_deleted		: NOT_DELETED
// 				},
// 				fields	:	{
// 					_id :1,full_name:1,is_verified:1,active:1,email:1
// 				}
// 			};
// 			/**Condition  for email*/
// 			options.conditions.email	= userName;
// 			/** Get user details **/
// 			let response =  await getUserData(req,res,next,options);
// 			if(response.status != STATUS_SUCCESS) return next(response.message);

// 			/** Send error response **/
// 			if(!response.result) return resolve({status : STATUS_ERROR, message	: [{param : "user_name",msg :res.__("user.email_not_registered")}]});

// 			let result 			= response.result;
// 			let activeStatus	= (result.active)		? result.active			: "";
// 			let verifiedStatus	= (result.is_verified)	? result.is_verified	: "";
// 			let email			= (result.email)		? result.email			: "";
// 			let fullName		= (result.full_name) 	? result.full_name		: "";

// 			let timeStamp				= currentTimeStamp();
// 			let forgotValidateString	= crypto("md5").update(timeStamp+email).digest("hex");
// 			/** Send error response **/
// 			if(activeStatus != ACTIVE) return resolve({status : STATUS_ERROR, message	: [{param : "user_name",msg :res.__("user.account_temporarily_disabled")}]});
// 			/** Send error response **/
// 			if(verifiedStatus != VERIFIED) return resolve({status : STATUS_ERROR, message : [{param : "user_name",msg :res.__("user.account_is_not_verified")}]});

// 			let dataToBeSaved = {
// 				modified				: getUtcDate(),
// 				forgot_validate_string	: forgotValidateString,
// 			};
// 			/** Update otp number **/
// 			const users = db.collection("users");
// 			users.updateOne({_id : ObjectId(result._id)},{$set	: dataToBeSaved},(updateErr,updateResult)=>{
// 				if(updateErr) return next(updateErr);

// 				/*********** Send email for forgot password ***************/
// 				let verifyLink		=	WEBSITE_URL+"reset_password/"+forgotValidateString;
// 				let verifyClickLink	=	'<a target="_blank" href='+WEBSITE_URL+"reset_password/"+forgotValidateString+'>'+ res.__("system.click_here") +'</a>';
// 				let emailOptions 	= {
// 					to 				: email,
// 					action 			: "forgot_password",
// 					rep_array 		: [fullName,verifyLink,verifyClickLink]
// 				};
// 				sendMail(req,res,emailOptions);
// 				/*********** Send email for forgot password ***************/

// 				/** Send success response **/
// 				let returnResponse = {
// 					status 		: STATUS_SUCCESS,
// 					message		: res.__("user.verification_link_sent_successfully_on_email",email),
// 					forgot_validate_string 	: forgotValidateString
// 				};
// 				/** Send success response **/
// 				resolve(returnResponse);
// 			});
// 		});
// 	};// end forgotPassword()

// 	/**
// 	 * Function for forgot password
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.forgotPassword = (req,res,next)=>{
// 		if(isPost(req)){
// 			userForgotPassword(req, res,next).then(response=>{
// 				if(response.status != STATUS_SUCCESS) return res.send(response);
// 				if(!response.forgot_validate_string) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
// 				/** Send success response **/
// 				req.flash(STATUS_SUCCESS,response.message);
// 				res.send({
// 					status		:	STATUS_SUCCESS,
// 					redirect_url:  	WEBSITE_URL
// 				});
// 			}).catch(next);
// 		}else{
// 			/** Render to forgot password  page **/
// 			res.render("forgot_password");
// 		}
// 	};//End forgotPassword()

// 	/**
// 	 * Function to reset Password email
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 * @param next 	As Callback argument to the middleware function
// 	 *
// 	 * @return render/json
// 	 */
// 	this.resetPassword = (req, res,next)=>{
// 		let forgotPasswordValidateString = (req.params.forgot_password_validate_string) ? req.params.forgot_password_validate_string 	:"";
// 		if(isPost(req)){
// 			req.body 		= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
// 			req.checkBody({
// 				"password": {
// 					notEmpty	: 	true,
// 					isLength	:	{
// 						options			: PASSWORD_LENGTH,
// 						errorMessage	: res.__("user.password_length_should_be_minimum_6_character")
// 					},
// 					errorMessage: res.__("user.please_enter_password")
// 				},
// 				"confirm_password": {
// 					notEmpty		: true,
// 					isLength:{
// 						options: PASSWORD_LENGTH,
// 						errorMessage: res.__("user.confirm_password_length_should_be_minimum_6_character")
// 					},
// 					errorMessage	: res.__("user.please_enter_confirm_password")
// 				},
// 			});
// 			req.checkBody('confirm_password', res.__("user.confirm_password_should_be_same_as_password")).equals(req.body.password);
// 			let errors = parseValidation(req.validationErrors(),req);
// 			/** Send error response **/
// 			if(errors) return res.send({status :	STATUS_ERROR, message :	errors});

// 			let userType			= (req.body.user_type)		? req.body.user_type 	: "";
// 			let password			= (req.body.password)		? req.body.password		: "";
// 			const users = db.collection("users");
// 			asyncParallel({
// 				user_data : callback=>{

// 					users.findOne({
// 						is_deleted				: NOT_DELETED,
// 						forgot_validate_string	: forgotPasswordValidateString,
// 					},{projection: {_id:1,user_role_id:1,email:1,full_name:1}},(err,result)=>{

// 						if(err) return next(err);

// 						/** Send error response */
// 						//if(!result) return callback(null,result);;
// 						if(!result)  return res.send({status : STATUS_ERROR,redirect_url: WEBSITE_URL, message : res.__("user.you_are_using_wrong_link")});
// 						callback(null,result);
// 					});
// 				},
// 				new_password : callback=>{
// 					bcrypt(password, BCRYPT_PASSWORD_SALT_ROUNDS).then(bcryptPassword=>{
// 						callback(null,bcryptPassword);
// 					});
// 				}
// 			},(asyncErr,asyncResponse)=>{
// 				if(asyncErr) return next(asyncErr);
// 				let userResponseData = (asyncResponse.user_data) ? asyncResponse.user_data : {};
// 				//if(!userResponseData) return res.send({status : STATUS_ERROR,redirect_url: WEBSITE_URL, message : res.__("user.you_are_using_wrong_link")});

// 				let newPassword		 = (asyncResponse.new_password) ? asyncResponse.new_password : "";

// 				let updateData		 =	{
// 					$set: {
// 						password			: newPassword,
// 						modified			: getUtcDate()
// 					},
// 					$unset : {
// 						forgot_validate_string	: 1
// 					}
// 				};

// 				/** Update user details **/
// 				users.updateOne({
// 					_id : ObjectId(userResponseData._id)
// 				},
// 				updateData,(updateErr,updateResult)=>{
// 					if(updateErr) return next(updateErr);

// 					/** Send success response **/
// 					req.flash(STATUS_SUCCESS,res.__("user.user_password_changed_successfully"));
// 					res.send({
// 						status		:	STATUS_SUCCESS,
// 						redirect_url:  	WEBSITE_URL,
// 					});

// 					/*************** Send Reset Password info mail  ***************/
// 						let emailOptions 	= {
// 							to 				: userResponseData.email,
// 							action 			: "reset_password",
// 							rep_array 		: [userResponseData.full_name]
// 						};
// 						sendMail(req,res,emailOptions);
// 					/*************** Send Reset Password info mail ***************/
// 				});
// 			});
// 		}else{
// 			/** Send error response */
// 			if(!forgotPasswordValidateString) return res.send({status : STATUS_ERROR,redirect_url: WEBSITE_URL, message: res.__("system.missing_parameters")});
// 			/** Get user details  **/
// 			const users = db.collection("users");
// 			users.findOne({
// 				is_deleted				: NOT_DELETED,
// 				forgot_validate_string	: forgotPasswordValidateString,
// 			},{projection: {_id:1,user_role_id:1}},(err,result)=>{
// 				if(err) return next(err);
// 				/** Send error response */
// 				if(!result){
// 					req.flash(STATUS_ERROR,res.__("user.you_are_using_wrong_link"));
// 					return res.redirect(WEBSITE_URL);
// 				}
// 				res.render('reset_password',{
// 					forgot_validate_string: forgotPasswordValidateString
// 				});
// 			});
// 		}
// 	};//End verifyEmail()

// 	/**
// 	 * Function for change Password details
// 	 *
// 	 * @param req As Request Data
// 	 * @param res As Response Data
// 	 *
// 	 * @return render/json
// 	 */
// 	this.changePassword = (req, res,next)=>{
// 		if(isPost(req)){
// 			/** Sanitize Data **/
// 			req.body 			= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
// 			let password		= (req.body.password)			? req.body.password			: "";
// 			let confirmPassword	= (req.body.confirm_password)	? req.body.confirm_password	: "";
// 			let oldPassword		= (req.body.old_password)		? req.body.old_password		: "";
// 			let id 				= (req.session.user)			? req.session.user._id		: "";
// 			if(!id) return res.send({status : STATUS_ERROR,redirect_url: WEBSITE_URL, message: res.__("admin.system.something_going_wrong_please_try_again")});
// 			/** Validate password if password changed*/
// 			req.checkBody({
// 				"password": {
// 					notEmpty: true,
// 					isLength:{
// 						options: PASSWORD_LENGTH,
// 						errorMessage: res.__("admin.user.password_length_should_be_minimum_6_character")
// 					},
// 					errorMessage: res.__("admin.user.please_enter_your_password")
// 				},
// 				"old_password": {
// 					notEmpty: true,
// 					errorMessage: res.__("admin.user.please_enter_your_old_password")
// 				},
// 				"confirm_password": {
// 					notEmpty: true,
// 					isLength:{
// 						options: PASSWORD_LENGTH,
// 						errorMessage: res.__("admin.user.password_length_should_be_minimum_6_character")
// 					},
// 					errorMessage: res.__("admin.user.please_enter_confirm_password")
// 				},
// 			});
// 			/**Validate confirm password*/
// 			req.checkBody("confirm_password", res.__("admin.user.confirm_password_should_be_same_as_password")).equals(password);
// 			/** parse Validation array  **/
// 			let errors = parseValidation(req.validationErrors(),req);
// 			if(errors) return res.send({status :	STATUS_ERROR, message :	errors});

// 			const users		= db.collection("users");
// 			bcryptCompare(oldPassword,req.session.user.password).then(passwordMatched=>{
// 				if(!passwordMatched){
// 					/** Send error response **/
// 					return res.send({
// 						status	: STATUS_ERROR,
// 						message	: [{"param":"old_password","msg":res.__("admin.user_profile.old_password_you_entered_did_not_matched")}],
// 					});
// 				}

// 				/** update password details **/
// 				bcrypt(password, BCRYPT_PASSWORD_SALT_ROUNDS).then(newPassword=>{
// 					let updateData = {
// 						password  : newPassword,
// 						modified  : getUtcDate()
// 					};
// 					users.updateOne({_id : ObjectId(id)},{$set	: updateData},(updateErr,updateResult)=>{
// 						if(updateErr) return next(updateErr);
// 						/** Send success response **/
// 						req.flash(STATUS_SUCCESS,res.__("user.user_password_changed_successfully"));
// 						res.send({
// 							status		:	STATUS_SUCCESS,
// 							redirect_url:  	WEBSITE_URL,
// 						});
// 					});
// 				});
// 			});
// 		}else{
// 			res.render("change_password");
// 		}
// 	};//End changePassword()

// 	/**
// 	 * Function for edit Profile  details
// 	 *
// 	 * @param req As Request Data
// 	 * @param res As Response Data
// 	 *
// 	 * @return render/json
// 	 */
// 	this.editProfile = (req, res,next)=>{
// 		if(isPost(req)){
// 			/** Sanitize Data **/
// 			req.body 			= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
// 			if(!req.session.user) return res.send({status : STATUS_ERROR,redirect_url: WEBSITE_URL, message: res.__("admin.system.something_going_wrong_please_try_again")});
// 			/** Validate password if password changed*/
// 			req.checkBody({
// 				"full_name": {
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_full_name")
// 				},
// 				"email": {
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_email"),
// 					isEmail	: 	{
// 						errorMessage : res.__("user.please_enter_valid_email_address")
// 					},
// 				},
// 				"mobile_number": {
// 					notEmpty	: true,
// 					isNumeric	:		{
// 						errorMessage: res.__("user.invalid_mobile_number")
// 					},
// 					isLength	:	{
// 						options		: MOBILE_NUMBER_LENGTH,
// 						errorMessage: res.__("user.invalid_mobile_number")
// 					},
// 					errorMessage: res.__("user.please_enter_mobile_number"),
// 				},
// 				"user_type": {
// 					notEmpty	: true,
// 					errorMessage: res.__("user.please_enter_user_type")
// 				},

// 			});
// 			/** parse Validation array  **/
// 			let errors 	= parseValidation(req.validationErrors(),req);
// 			if(errors) 	return res.send({status :	STATUS_ERROR, message :	errors});
// 			const users	= db.collection("users");
// 			/** update profile details **/
// 			let updateData = {
// 				full_name 				: (req.body.full_name)		? req.body.full_name		:"",
// 				//email 				: (req.body.email) 			? req.body.email 			:"",
// 				user_type				: (req.body.user_type)		? req.body.user_type		:"",
// 				mobile_number			: (req.body.mobile_number) 	? req.body.mobile_number	:"",
// 				modified 				: getUtcDate(),
// 			};

// 			let unsetData = {};
// 			if(req.body.user_type == USER_TYPE_NGO){
// 				updateData.ngo 		= true;
// 				unsetData.volunteer = 1;
// 			}else{
// 				updateData.volunteer 	= true;
// 				unsetData.ngo   		= 1;
// 			}

// 			users.updateOne({_id : ObjectId(req.session.user._id)},{$set: updateData,$unset: unsetData},(updateErr,updateResult)=>{
// 				if(updateErr) return next(updateErr);
// 				users.findOne({_id : ObjectId(req.session.user._id)},(err,result)=>{
// 					if(err) return next(err);

// 					/** Send error response */
// 					if(!result){
// 						req.flash(STATUS_ERROR,res.__("user.you_are_using_wrong_link"));
// 						return res.redirect(WEBSITE_URL);
// 					}
// 					req.session.user = result;
// 					/** Send success response **/
// 					req.flash(STATUS_SUCCESS,res.__("user.user_profile_updated_successfully"));
// 					res.send({
// 						status		:	STATUS_SUCCESS,
// 						redirect_url:  	WEBSITE_URL,
// 					});
// 				});
// 			});
// 		}else{
// 			if(req.session.user){
// 				res.render("edit_profile");
// 			}
// 		}
// 	};//End changePassword()


// 	/**
// 	 * Function for upload Cause Image
// 	 *
// 	 * @param req As Request Data
// 	 * @param res As Response Data
// 	 *
// 	 * @return render/json
// 	 */
// 	this.uploadCauseImage = (req, res,next)=>{
// 		/** Sanitize Data **/
// 		var base64Str 	= req.body.image;
// 		var isBase64 	= require('is-base64');
// 		if(isBase64(base64Str, {mimeRequired: true})){
// 			var base64Img = require('base64-img');
// 			var optionalObj = 	{'fileName': 'imageFileName', 'type':'png'};
			
// 			let newFolder	= 	(newDate("","mmm")+ newDate("","yyyy")).toUpperCase()+'/';
// 			var path 		=	CAUSES_FILE_PATH+newFolder;
// 			let newFileName = 	newFolder + Date.now()+ '-' +"causeimage";

// 			req.session.cause_image_content = {base_image_string:base64Str,cause_image_file_name:newFileName};

// 			/*base64Img.img(base64Str, CAUSES_FILE_PATH, newFileName, function(err, filepath) {
// 				if(err) return next(err);
// 				let fileImageName = filepath.split('frontend/uploads/causes/');
// 				return res.send({status : STATUS_SUCCESS, message	: imgErrors,'file_name':fileImageName[1]});
// 			});*/
// 			return res.send({status : STATUS_SUCCESS,file_name:"fileImageName[1]"});
// 		}else{
// 			imgErrors.push({'param':'images','msg':"imageResponse.message"});
// 			return res.send({status : STATUS_ERROR, message	: imgErrors});
// 		}
// 	}


// 	/**
// 	 * Function for get cms details
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.getCmsDetails = (req,res,next)=>{
// 		let pageSlug 	= (req.params.page_slug) ? req.params.page_slug :"";
// 		/** Send error response */
// 		if(!pageSlug) return res.send({status : STATUS_ERROR, message : res.__("system.missing_parameters"),result:[]});
// 		/** Get cms data*/
// 		const pages		= db.collection('pages');
// 		pages.findOne({ slug : pageSlug },{projection:{_id:0,name:1,body:1}},(err,result)=>{
// 			if(err) return next(err);
// 			/** Send error response */
// 			if(!result){
// 				req.flash(STATUS_ERROR,res.__("cms.wrong_link"));
// 				return res.redirect(WEBSITE_URL);
// 			}
// 			res.render("cms_details",{
// 				status : STATUS_SUCCESS,
// 				result : result
// 			});
// 		});
// 	};// end getCmsDetails()

// 	/**
// 	 * Function for get list of latest news
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.getNewsList = (req,res,next)=>{
// 		let masterSlug	=	(req.params.slug) ? req.params.slug : '';
// 		/** Get master list **/
// 		const latest_news	= db.collection("latest_news");
// 		latest_news.aggregate([
// 			{$match : {is_active: ACTIVE}},
// 			{$unwind : "$category"},
// 			{$group : {
// 				_id : "$category"
// 			}},
// 		]).toArray((categoryErr, categoryResponse)=>{
// 			if(categoryErr) return callback(categoryErr,[]);
			
// 			if(categoryResponse.length > 0){
// 				let responseArray	=	categoryResponse.map((records,index)=>{
// 					return records._id
// 				});
// 				getMasterValuesSlug(req,res,next,{"master_ids" : responseArray}).then(masterResponse=>{
// 					res.render('category_list', {
// 						category_list	:	masterResponse,
// 						master_slug		:	masterSlug,
// 					});
// 				}).catch(next);
// 			}
// 		});
// 	};// end getNewsList()

// 	/**
// 	 * Function for get product list
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getMoreList = (req,res,next)=>{
// 		if(isPost(req)){
// 			let masterId		= (req.body.master_id)	? 	ObjectId(req.body.master_id)	:'';
// 			let slug			= (req.body.master_slug)? 	req.body.master_slug	:'';
// 			let skip			= (req.body.skip)		? 	parseInt(req.body.skip)	:DEFAULT_SKIP;
// 			let limit			= (req.body.limit)		? 	req.body.limit	:FRONT_LISTING_LIMIT;
// 			const latest_news	= db.collection("latest_news");

// 			let newsCondition	=	{
// 				is_active: ACTIVE
// 			};
// 			if(masterId) newsCondition['category']	=	{$in : [masterId] };
// 			asyncParallel({
// 				recent_news : (callback)=>{
// 					latest_news.aggregate([
// 						{$match : newsCondition},
// 						{$project : {image:1,slug:1,name:1,category:1,posted_by:1,created:1,description:1,short_description:1}},
// 						{$skip : skip},
// 						{$limit : limit}
// 					]).toArray((err, result)=>{
// 						if(err || result.length <=0) return callback(err,result);

// 						/** Set options for appened image **/
// 						let options = {
// 							"file_url" 			: LATEST_NEWS_FILE_URL,
// 							"file_path" 		: LATEST_NEWS_FILE_PATH,
// 							"result" 			: result,
// 							"database_field" 	: "image",
// 							"image_placeholder" : "latest_news_image"
// 						};

// 						/** Appened image with full path **/
// 						appendFileExistData(options).then(responseData=>{
// 							result = (responseData && responseData.result)	?	responseData.result	:[];
// 							callback(null,result);
// 						});
// 					});
// 				},
// 				total_count : (callback)=>{
// 					/** Get lead count **/
// 					latest_news.find(newsCondition).count((err,countResult)=>{
// 						callback(err, countResult);
// 					});
// 				},
// 			},(asyncErr,asyncResponse)=>{
// 				if(asyncErr) return next(asyncErr);

// 				/** Send success response **/
// 				res.render('category_more_list',{
// 					layout      : 	false,
// 					skip    	:   skip,
// 					limit   	:   limit,
// 					slug		:	slug,
// 					master_id	:	masterId,
// 					result		:   (asyncResponse.recent_news)	?	asyncResponse.recent_news 		:[],
// 					total_count	:	(asyncResponse.total_count)	?	asyncResponse.total_count 	:0,
// 				});
// 			});
// 		}
// 	};//End getMoreList()

// 	/**
// 	 * Function to get latest new's detail
// 	 *
// 	 * @param req	As Request Data
// 	 * @param res	As Response Data
// 	 * @param next 	As Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.getNewsDetails = (req,res,next)=>{
// 		const latest_news	= db.collection("latest_news");
// 		asyncParallel({
// 			news_detail : (callback)=>{
// 				let slug = (req.params.slug) ? req.params.slug :"";
// 				/** Get latest news details **/
// 				latest_news.aggregate([
// 					{$match : {slug : slug}},
// 					{$lookup : {
// 						from 		: "users",
// 						localField	: "posted_by",
// 						foreignField: "_id",
// 						as 			: "user_data"
// 					}},
// 					{ '$lookup': {
// 						'from': 'masters',
// 						'let': { 'cid': '$category' },
// 						'pipeline': [
// 							{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 							{$group	:	{
// 								'_id'	:	"$dropdown_type",
// 								'master_data' : {$push : {"name" : "$name","slug":"$slug"}}
// 								//~ 'name'	:	{$push : "$name"},
// 								//~ 'slug'	:	{$push : "$slug"},
// 							}},
// 						],
// 						'as':'master_details'
// 					}},
// 					{$project : {_id:1,name:1,image:1,description:1,category:1,short_description:1, is_active:1,image:1,created:1,master_details: {$arrayElemAt 	: ["$master_details.master_data",0]},user_name:{"$arrayElemAt":["$user_data.full_name",0]}}}
// 				]).toArray((newsErr, newsResult)=>{
// 					if(newsErr || newsResult.length <=0) return callback(newsErr,newsResult);

// 					//~ if(!newsResult) return callback(null,[]);

// 					/** Set options for appened image full path **/
// 					let options = {
// 						"file_url" 			: 	LATEST_NEWS_FILE_URL,
// 						"file_path" 		: 	LATEST_NEWS_FILE_PATH,
// 						"result" 			: 	[newsResult[0]],
// 						"database_field" 	: 	"image"
// 					};

// 					/** Appened image with full path **/
// 					appendFileExistData(options).then(imageResponse=>{
// 						/** Send success response **/
// 						let newsResponse	= (imageResponse && imageResponse.result && imageResponse.result[0])	?	imageResponse.result[0]	: {};
// 						callback(null,newsResponse)
// 					});
// 				});
// 			},
// 			category_list : (callback)=>{
// 				/** Get master list **/
// 				latest_news.aggregate([
// 					{$match : {is_active: ACTIVE}},
// 					{$unwind : "$category"},
// 					{$group : {
// 						_id : "$category"
// 					}},
// 				]).toArray((categoryErr, categoryResponse)=>{
// 					if(categoryErr) return callback(categoryErr,[]);

// 					if(categoryResponse.length > 0){
// 						let responseArray	=	categoryResponse.map((records,index)=>{
// 							return records._id
// 						});
// 						getMasterValuesSlug(req,res,next,{"master_ids" : responseArray}).then(masterResponse=>{
// 							callback(null,masterResponse);
// 						}).catch(next);
// 					}
// 				});
// 			},
// 			recent_news : (callback)=>{
// 				/** Get list of latest news**/
// 				latest_news.aggregate([
// 					{$match : {is_active: ACTIVE}},
// 					{$project : {image:1,slug:1,name:1,posted_by:1,created:1,description:1,short_description:1}},
// 					{$limit : LATEST_NEWS_LIMIT},
// 				]).toArray((newsErr, newsResponse)=>{
// 					if(newsErr) return callback(err,[]);

// 					/** Set options for appened image **/
// 					let options = {
// 						"file_url" 			: LATEST_NEWS_FILE_URL,
// 						"file_path" 		: LATEST_NEWS_FILE_PATH,
// 						"result" 			: newsResponse,
// 						"database_field" 	: "image",
// 						"image_placeholder" : "latest_news_image"
// 					};
// 					/** Appened image with full path **/
// 					appendFileExistData(options).then(responseData=>{
// 						result = (responseData && responseData.result)	?	responseData.result	:[];
// 						callback(newsErr, result);
// 					});
// 				});
// 			},
// 		},(err,response)=>{
// 			/** Render to index page **/
// 			res.render('news_detail', {
// 				news_detail		: response.news_detail,
// 				category_list	: response.category_list,
// 				recent_news		: response.recent_news,
// 			});
// 		});
// 	};// End getNewsDetails()


// 	/**
// 	 * Function for submit add Causes us form
// 	 *
// 	 * @param req 	As 	Request Data
// 	 * @param res 	As 	Response Data
// 	 * @param next	As 	Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.addCauses = (req,res,next)=>{
// 		if(isPost(req)){
// 			if(req.session.user && req.session.user.user_type  &&  req.session.user.user_type != USER_TYPE_NGO){
// 				req.flash(STATUS_ERROR, res.__("system.invalid_access"));
// 				return res.redirect(WEBSITE_URL);
// 			}
// 			req.body 		= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
// 			let title		= (req.body.title) ? req.body.title : "";
// 			req.checkBody({
// 				"title": {
// 					notEmpty	: true,
// 					errorMessage: res.__("causes.please_enter_title")
// 				}, 
// 				"causes_types": {
// 					notEmpty	: true,
// 					errorMessage: res.__("causes.please_select_causes_types")
// 				},
// 				"description": {
// 					notEmpty		: true,
// 					isLength:{
// 						options: {min: CAUSES_MESSAGE_TEXT_LENGTH},
// 						errorMessage : res.__("causes.message_min_length",CAUSES_MESSAGE_TEXT_LENGTH)
// 					},
// 					errorMessage	: res.__("causes.please_enter_description")
// 				},
// 				/*"last_date": {
// 					notEmpty	: true,
// 					errorMessage: res.__("causes.please_enter_last_date")
// 				}*/
// 			});
// 			let errors = parseValidation(req.validationErrors(),req);

// 			/** Send error response **/
// 			if(errors) return res.send({status :	STATUS_ERROR, message :	errors});
// 			var fileContent 		= [];
// 			var fileImageContent 	= [];
// 			/*if(!req.files || !req.files.images){
// 				if(!errors) errors =[];
// 				errors.push({'param':'images','msg':res.__("causes.please_select_images")});
// 			}*/

// 			let resultAllImages = (req.files && req.files.images) ? req.files.images : [];
// 			resultAllImages = (resultAllImages.constructor === Array) ? resultAllImages : [resultAllImages];
// 			let imgErrors 	= [];
// 			asyncEach(resultAllImages, (data, callback) => {
// 				let options = {
// 					'image'	  : data,
// 					'filePath': CAUSES_FILE_PATH
// 				};
// 				moveUploadedFile(req, res, options).then(imageResponse => {
// 					if(imageResponse.status == STATUS_SUCCESS) {
// 						fileContent.push({ image: imageResponse.fileName, _id: ObjectId() });
// 					}else{
// 						imgErrors.push({'param':'images','msg':imageResponse.message});
// 					}
// 					callback(null);
// 				});
// 			},(err) => {

// 				if(imgErrors && imgErrors.length > 0) {
// 					return res.send({status : STATUS_ERROR, message	: imgErrors});
// 				}
// 				if(fileContent && fileContent.length > 0) {
// 					fileContent.forEach(element => {
// 					  let removeImage = (element.image) ? element.image : "";
// 					  removeFile({file_path : CAUSES_FILE_PATH+removeImage}).then(response=>{ });
// 					});
// 				}
// 				var imageName = "";
// 				if(req.session && req.session.cause_image_content) {
// 					var base64Img = require('base64-img');
// 					let base64String 	=  req.session.cause_image_content.base_image_string;
// 					let causeImageName 	=  req.session.cause_image_content.cause_image_file_name;
// 					base64Img.img(base64String, CAUSES_FILE_PATH, causeImageName, function(err, filepath) {
// 						if(err) return next(err);
// 						let fileImageName = filepath.split('frontend/uploads/causes/');
// 						imageName = fileImageName[1];
// 						fileImageContent.push({ image: fileImageName[1], _id: ObjectId() });
// 					});
// 				}
// 				let causesTypes = (req.body && req.body.causes_types) ? req.body.causes_types : [];
// 				let causesCategorys = (causesTypes.constructor === Array) ? causesTypes : [causesTypes];
// 				let createdData = {
// 					title					: title,
// 					description 			: (req.body.description)?req.body.description:"",
// 					causes_categorys		: arrayToObject(causesCategorys),
// 					is_featured 			: NOT_FEATURED,
// 					display_on_home_page 	: NOT_DISPLAY,
// 					images					: fileImageContent,
// 					is_active 				: ACTIVE,
// 					user_id 				: (req.session.user)?ObjectId(req.session.user._id):"",
// 					created 				: getUtcDate(),
// 					modified 				: getUtcDate(),
// 					approval_status			: CAUSES_STATUS_PENDING,
// 					is_completed			: NOT_COMPLETED,
// 				}
// 				if(req.body.last_date) createdData.last_date = getUtcDate(newDate(req.body.last_date));

// 				const causes = db.collection('causes');

// 				/** Set requested Data **/
// 				let requestedData = {
// 					title 		:	title,
// 					table_name 	: 	"causes",
// 					slug_field 	: 	"slug"
// 				};

// 				/** Make Slug */
// 				getDatabaseSlug(requestedData).then(response=>{
// 					createdData.slug 	=	(response && response.title) ? response.title : "";
// 					let previewCheck 	= 	(req.body.preview_check) 	 ? req.body.preview_check : "";

// 					if(previewCheck == "preview_data"){
// 						req.session.causes_data 	= createdData;

// 						const causes	= db.collection("causes");
// 						asyncParallel({
// 							causes_detail : (callback)=>{

// 								/** Set options for appened image full path **/
// 								let options = {
// 									"file_url" 			: 	CAUSES_FILE_URL,
// 									"file_path" 		: 	CAUSES_FILE_PATH,
// 									"result" 			: 	req.session.causes_data.images,
// 									"database_field" 	: 	"image"
// 								};

// 								/** Appened image with full path **/
// 								appendFileExistData(options).then(imageResponse=>{
// 									/** Send success response **/
// 									let newsResponse				= (imageResponse && imageResponse.result)?imageResponse.result:{};
// 									req.session.causes_data.images 	= newsResponse;
// 									asyncParallel({
// 										user_name : (callback)=>{
// 											const users = db.collection("users");
// 											users.findOne({_id: ObjectId(req.session.causes_data.user_id)},{projection: {_id:1,full_name:1}},(usersErr,usersResult)=>{
// 												if(usersErr) return callback(usersErr,null);
// 												if(!usersResult) return callback(null,{});
// 												callback(null,usersResult);
// 											});
// 										},
// 										master_details : (callback)=>{
// 											const masters = db.collection("masters");
// 											masters.findOne({ _id: { $in: req.session.causes_data.causes_categorys } },{projection: {_id:1,name:1}},(mastersErr,mastersResult)=>{
// 												if(mastersErr) return callback(mastersErr,null);
// 												if(!mastersResult) return callback(null,{});
// 												callback(null,mastersResult);
// 											});
// 										}
// 									},(asyncParallelResponseInsideErr,asyncParallelResponseInside)=>{
// 										callback(null,asyncParallelResponseInside);
// 									});
// 								});
// 							},
// 							category_list : (callback)=>{
// 								/** Get master list **/
// 								causes.aggregate([
// 									{$match : {is_active: ACTIVE,$or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],approval_status:CAUSES_STATUS_APPROVED}},
// 									{$unwind : "$causes_categorys"},
// 									{$group : {
// 										_id : "$causes_categorys"
// 									}},
// 								]).toArray((categoryErr, categoryResponse)=>{
// 									if(categoryErr) return callback(categoryErr,[]);

// 									if(categoryResponse.length > 0){
// 										let responseArray	=	categoryResponse.map((records,index)=>{
// 											return records._id
// 										});
// 										getMasterValuesSlug(req,res,next,{"master_ids" : responseArray}).then(masterResponse=>{
// 											callback(null,masterResponse);
// 										}).catch(next);
// 									}
// 								});
// 							},
// 							recent_causes : (callback)=>{
// 								/** Get list of latest causes**/
// 								causes.aggregate([
// 									{$match : {is_active: ACTIVE,$or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],approval_status:CAUSES_STATUS_APPROVED}},
// 									{$sample: { size: LATEST_CAUSES_LIMIT } },
// 									{$lookup : {
// 										from 		: "users",
// 										localField	: "user_id",
// 										foreignField: "_id",
// 										as 			: "user_data"
// 									}},
// 									{ '$lookup': {
// 										'from': 'masters',
// 										'let': { 'cid': '$causes_categorys' },
// 										'pipeline': [
// 											{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 											{$group	:	{
// 												'_id'	:	"$dropdown_type",
// 												'name'	:	{$push : "$name"},
// 											}},
// 										],
// 										'as':'master_details'
// 									}},
// 									{$project : {_id:1,title:1,last_date:1,images:1,description:1,category:1,is_active:1,slug:1,created:1,master_details: {$arrayElemAt : ["$master_details.name",0]},user_name:{"$arrayElemAt":["$user_data.full_name",0]}}},
// 									{$sort  : { created : SORT_DESC } },
// 									{$limit : LATEST_CAUSES_LIMIT}
// 								]).toArray((causesErr, causesResponse)=>{
// 									if(causesErr) return callback(causesErr,[]);
// 									if(causesResponse && causesResponse.length <=0) return callback(causesErr,[]);
// 								 	asyncforEachOf(causesResponse,(records,index,asyncCallback)=>{
// 										let options = {
// 											"file_url" 			: CAUSES_FILE_URL,
// 											"file_path" 		: CAUSES_FILE_PATH,
// 											"result" 			: records.images,
// 											"database_field" 	: "image",
// 										};
// 										if(records.images.length<=0) options.multi_single_img = true;

// 										appendFileExistData(options).then(response=>{
// 											causesResponse[index]["images"] = (response.result) ? response.result[0] :[];
// 											asyncCallback(null,causesResponse);
// 										});
// 									},(err)=>{
// 										callback(err,causesResponse);
// 									});
// 								});
// 							},

// 						},(err,response)=>{
// 							req.session.causes_data.user_name 		= response.causes_detail.user_name.full_name;
// 							req.session.causes_data.master_details 	= [response.causes_detail.master_details.name];
// 							let result = {
// 								causes_detail	: req.session.causes_data,
// 								category_list	: response.category_list,
// 								recent_causes	: response.recent_causes,
// 							};
// 							req.session.causes_data  = result;
// 							return res.send({status:STATUS_SUCCESS,redirect_url: WEBSITE_URL+"causes-preview","from_preview":true});
// 						});
// 					}else{
// 						causes.insertOne(createdData,(err, result)=>{
// 							if(err) return next(err);
// 							req.session.causes_data 		= null;
// 							req.session.cause_image_content = null;
// 							/** Send success response **/
// 							/*req.flash(STATUS_SUCCESS,res.__("causes.causes_submit_successfully"));*/
// 							setErrorSuccessMessage(req,res,next,STATUS_SUCCESS,res.__("causes.causes_submit_successfully"));
// 							res.send({status:STATUS_SUCCESS,redirect_url: WEBSITE_URL+"success_page"});
// 							/*************** Send Causes Approval Request User  ***************/
// 							let sendMailOptions	= {
// 								event_type 		: CAUSES_REQUEST_EVENTS,
// 								full_name		: (req.session.user)?req.session.user.full_name:"",
// 							};
// 							sendMailToUsers(req,res,sendMailOptions);
// 							/*************** Send Causes Approval Request Use  ***************/
// 						});
// 					}
// 				});
// 			});
// 		}else{
// 			if(req.session.user && req.session.user.user_type  &&  req.session.user.user_type != USER_TYPE_NGO){
// 				req.flash(STATUS_ERROR, res.__("system.invalid_access"));
// 				return res.redirect(WEBSITE_URL);
// 			}
// 			let options = {
// 				collections : [{
// 					collection			: "masters",
// 					columns				: ["_id","name"],
// 					conditions			: {
// 						status 			: ACTIVE,
// 						dropdown_type 	: "causes_category",
// 					}
// 				}]
// 			};
// 			getDropdownList(req,res,next, options).then(dropDrownResponse=> {
// 				if(dropDrownResponse.status != STATUS_SUCCESS){
// 					req.flash(STATUS_ERROR, res.__("system.invalid_access"));
// 					return res.redirect(WEBSITE_URL);
// 				}
// 				res.render('add_causes',{
// 					causes_types 	: 	(dropDrownResponse.final_html_data[0]) ? dropDrownResponse.final_html_data[0]:"",
// 				});
// 			}).catch(next);
// 		}
// 	};//End addCauses()


// 	/**
// 	 * Function to get latest causes's detail
// 	 *
// 	 * @param req	As Request Data
// 	 * @param res	As Response Data
// 	 * @param next 	As Callback argument to the middleware function
// 	 *
// 	 * @return json
// 	 */
// 	this.getCausesDetails = (req,res,next)=>{ 
// 		let currentSiteUrl 	= 	(req.url)	? req.url.replace("/","") : "";
// 		if(currentSiteUrl == "causes-preview"){
// 			if(!req.session.causes_data){
// 				setErrorSuccessMessage(req,res,next,STATUS_OTHER,res.__("user.you_are_using_wrong_link"));
// 				return res.redirect(WEBSITE_URL+"success_page");
// 			}else{
// 				return res.render('causes_detail', req.session.causes_data);
// 			}
// 		}
// 		let slug = (req.params.slug) ? req.params.slug :"";
// 		const causes	= db.collection("causes");
// 		asyncParallel({
// 			causes_detail : (callback)=>{
// 				let causesCondition	=	{
// 					slug : slug,
// 					is_active: ACTIVE,
// 					//~ $or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],
// 					approval_status:CAUSES_STATUS_APPROVED
// 				};
// 				/** Get latest news details **/
// 				causes.aggregate([
// 					{$match : causesCondition},
// 					{$lookup : {
// 						from 		: "users",
// 						localField	: "user_id",
// 						foreignField: "_id",
// 						as 			: "user_data"
// 					}},
// 					{ '$lookup': {
// 						'from': 'masters',
// 						'let': { 'cid': '$causes_categorys' },
// 						'pipeline': [
// 							{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 							{$group	:	{
// 								'_id'	:	"$dropdown_type",
// 								'name'	:	{$push : "$name"},
// 							}},
// 						],
// 						'as':'master_details'
// 					}},
// 					{$project : {_id:1,title:1,last_date:1,images:1,description:1,category:1,is_active:1,created:1,master_details: {$arrayElemAt : ["$master_details.name",0]},user_name:{"$arrayElemAt":["$user_data.full_name",0]}}}
// 				]).toArray((causesErr, causesResult)=>{  
// 					if(causesErr) return callback(causesErr);
// 					if(causesResult.length <= 0) return callback(null,{});

// 					/** Set options for appened image full path **/
// 					let options = {
// 						"file_url" 			: 	CAUSES_FILE_URL,
// 						"file_path" 		: 	CAUSES_FILE_PATH,
// 						"result" 			: 	causesResult[0].images,
// 						"database_field" 	: 	"image"
// 					};
// 					if(causesResult[0].images<=0) options.multi_single_img = true;
// 					/** Appened image with full path **/
// 					appendFileExistData(options).then(imageResponse=>{
// 						/** Send success response **/
// 						let newsResponse		= (imageResponse && imageResponse.result)?imageResponse.result	: {};
// 						causesResult[0].images 	= newsResponse;
// 						callback(null,causesResult)
// 					});
// 				});
// 			},
// 			category_list : (callback)=>{
// 				/** Get master list **/
// 				causes.aggregate([
// 					{$match : {is_active: ACTIVE,$or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],approval_status:CAUSES_STATUS_APPROVED}},
// 					{$unwind : "$causes_categorys"},
// 					{$group : {
// 						_id : "$causes_categorys"
// 					}},
// 				]).toArray((categoryErr, categoryResponse)=>{
// 					if(categoryErr) return callback(categoryErr,[]);

// 					if(categoryResponse.length > 0){
// 						let responseArray	=	categoryResponse.map((records,index)=>{
// 							return records._id
// 						});
// 						getMasterValuesSlug(req,res,next,{"master_ids" : responseArray}).then(masterResponse=>{
// 							callback(null,masterResponse);
// 						}).catch(next);
// 					}
// 				});
// 			},
// 			recent_causes : (callback)=>{
// 				/** Get list of latest causes**/
// 				/*causes.aggregate([
// 					{$match : {is_active: ACTIVE,$or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],approval_status:CAUSES_STATUS_APPROVED}},
// 					{$project : {images:1,slug:1,title:1,user_id:1,created:1,description:1}},
// 					{$sort  : { created : -1 } },
// 					{$limit : LATEST_CAUSES_LIMIT},
// 				])*/
// 				causes.aggregate([
// 					{$match : {is_active: ACTIVE,$or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],approval_status:CAUSES_STATUS_APPROVED}},
// 					{$sample: { size: LATEST_CAUSES_LIMIT } },
// 					{$lookup : {
// 						from 		: "users",
// 						localField	: "user_id",
// 						foreignField: "_id",
// 						as 			: "user_data"
// 					}},
// 					{ '$lookup': {
// 						'from': 'masters',
// 						'let': { 'cid': '$causes_categorys' },
// 						'pipeline': [
// 							{ '$match': { '$expr': { '$in': ['$_id', '$$cid'] } } },
// 							{$group	:	{
// 								'_id'	:	"$dropdown_type",
// 								'name'	:	{$push : "$name"},
// 							}},
// 						],
// 						'as':'master_details'
// 					}},
// 					{$project : {_id:1,title:1,last_date:1,images:1,description:1,category:1,is_active:1,slug:1,created:1,master_details: {$arrayElemAt : ["$master_details.name",0]},user_name:{"$arrayElemAt":["$user_data.full_name",0]}}},
// 					{$sort  : { created : SORT_DESC } },
// 					{$limit : LATEST_CAUSES_LIMIT}
// 				]).toArray((causesErr, causesResponse)=>{
// 					if(causesErr) return callback(causesErr,[]);
// 					if(causesResponse && causesResponse.length <=0) return callback(causesErr,[]);
// 				 	asyncforEachOf(causesResponse,(records,index,asyncCallback)=>{
// 						let options = {
// 							"file_url" 			: CAUSES_FILE_URL,
// 							"file_path" 		: CAUSES_FILE_PATH,
// 							"result" 			: records.images,
// 							"database_field" 	: "image",
// 						};
// 						if(records.images.length<=0) options.multi_single_img = true;

// 						appendFileExistData(options).then(response=>{
// 							causesResponse[index]["images"] = (response.result) ? response.result[0] :[];
// 							asyncCallback(null,causesResponse);
// 						});
// 					},(err)=>{
// 						callback(err,causesResponse);
// 					});
// 				});
// 			},

// 		},(err,response)=>{
// 			let result = {
// 				causes_detail	: response.causes_detail[0],
// 				category_list	: response.category_list,
// 				recent_causes	: response.recent_causes,
// 				causes_slug 	: slug,
// 			};
// 			res.render('causes_detail', result);
// 		});
// 	};// End getCausesDetails()

// 	/**
// 	 * Function for get gallery list
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 *
// 	 * @return json
// 	 */
// 	this.getMoreGalleryList = (req,res,next)=>{
// 		if(isPost(req)){

// 			let masterId		= (req.body.master_id)	? 	ObjectId(req.body.master_id)	:'';
// 			let slug			= (req.body.master_slug)? 	req.body.master_slug	:'';
// 			let skip			= (req.body.skip)		? 	parseInt(req.body.skip)	:DEFAULT_SKIP;
// 			let limit			= (req.body.limit)		? 	req.body.limit	:FRONT_LISTING_LIMIT;
// 			const gallery		= db.collection("gallery");
// 			let galleryCondition	=	{is_active: ACTIVE};
// 			if(masterId) galleryCondition['gallery_categorys']	=	{$in : [masterId] };

// 			asyncParallel({
// 				recent_gallery_item : (callback)=>{
// 					gallery.aggregate([
// 						{$match : galleryCondition},
// 						{$project : {images:1,name:1,gallery_categorys:1,created:1}},
// 						{$skip : skip},
// 						{$limit : limit}
// 					]).toArray((err, result)=>{
// 						if(err) return callback(err);
// 						if(!result) return callback(err, null);
// 						asyncforEachOf(result,(records,index,asyncCallback)=>{
// 							/** Set options for appened image **/
// 							let options = {
// 								"file_url" 			: GALLERY_FILE_URL,
// 								"file_path" 		: GALLERY_FILE_PATH,
// 								"result" 			: [records.images],
// 								"database_field" 	: "image",
// 							};
// 							appendFileExistData(options).then(response=>{
// 								result[index]["images"] = (response.result) ? response.result :[];
// 								asyncCallback(null,result);
// 							});
// 						},(err)=>{
// 							callback(err,result);
// 						});
// 					});
// 				},
// 				total_count : (callback)=>{
// 					/** Get lead count **/
// 					gallery.find(galleryCondition).count((err,countResult)=>{
// 						callback(err, countResult);
// 					});
// 				},
// 			},(asyncErr,asyncResponse)=>{
// 				if(asyncErr) return next(asyncErr);
// 				/** Send success response **/
// 				res.render('gallery_category_more_list',{
// 					layout      : 	false,
// 					skip    	:   skip,
// 					limit   	:   limit,
// 					slug		:	slug,
// 					master_id	:	masterId,
// 					result		:   (asyncResponse.recent_gallery_item)	?	asyncResponse.recent_gallery_item :[],
// 					total_count	:	(asyncResponse.total_count)	?	asyncResponse.total_count 	:0,
// 				});
// 			});
// 		}
// 	};//End getMoreGalleryList()


// 	/**
// 	 * Function for confirm Share Volunteer
// 	 *
// 	 * @param req 	As Request Data
// 	 * @param res 	As Response Data
// 	 * @param next 	As 	Callback argument to the middleware function
// 	 *
// 	 * @return null
// 	 */
// 	this.confirmShareVolunteer = (req,res,next)=>{
// 		let causeSlug 	= (req.params.slug) ? req.params.slug:"";
// 		const causes 	= db.collection('causes');
// 		causes.findOne({slug: causeSlug,is_active: ACTIVE,$or:[{last_date: {$gte: getUtcDate()}},{last_date : { $exists: false } }],approval_status:CAUSES_STATUS_APPROVED },{projection:{_id:1,user_id:1}},(causesErr,causesResult)=>{
// 			/** Send error response */
// 			if(causesErr) return next(causesErr);
// 			if(!causesResult)  return res.send({status:STATUS_ERROR,message:res.__("admin.system.invalid_access")});
// 			const volunteer_causes = db.collection('volunteer_causes');
// 			volunteer_causes.findOne({user_id: ObjectId(req.session.user._id),cause_id:ObjectId(causesResult._id) },(volunteerCausesErr,volunteerCausesResult)=>{
// 			if(volunteerCausesErr) return next(volunteerCausesErr);
// 				if(volunteerCausesResult) return res.send({status:STATUS_ERROR,message:res.__("volunteer_causes.volunteer_causes_has_been_already_applyed")});
// 				volunteer_causes.insertOne({
// 					cause_id 	: causesResult._id,
// 					user_id 	: ObjectId(req.session.user._id),
// 					modified 	: getUtcDate(),
// 					created 	: getUtcDate(),
// 				},(err,result)=>{
// 					if(err) return next(err);
// 					causes.updateOne({_id : ObjectId(causesResult._id)},
// 					{$set: {volunteer_exist	: true}},(updateErr,updateResult)=>{
// 						if(updateErr) return next(updateErr);
// 						/** Send success response **/
// 						res.send({status:STATUS_SUCCESS,message:res.__("volunteer_causes.volunteer_causes_has_been_applied_confirmly")});
// 						/*************** Send Mail To Admin  ***************/
// 						let sendMailOptions	= {
// 							event_type 	: VOLUNTEER_REQUEST_EVENTS,
// 							user_id		: req.session.user._id,
// 							ngo_id 		: causesResult.user_id
// 						};
// 						sendMailToUsers(req,res,sendMailOptions);
// 					});
// 				});
// 			});
// 		});
// 	};//End confirmShareVolunteer()
// }
module.exports = new Home();
