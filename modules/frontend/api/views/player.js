const request 			= require('request');
const objectID 			= require('mongodb').ObjectID
const asyncParallel 	= require("async/parallel");
const asyncEach			= require("async/each");
const asyncEachSeries 	= require('async/eachSeries');
const asyncforEachOfSeries 	= require('async/forEachOfSeries');
const Stripe 			= require('stripe');
const stripe 			= Stripe(STRIP_SEC_KEY);
var thenrequest 		= require('then-request');


function Player() {

	let getPublicBookedGames = (req,res,next,playerResponse,values)=>{
		return new Promise(async resolve=>{
			const order 	= 	db.collection('order');
			order.findOne({
				"player_id" 			:	{ $in: (playerResponse && playerResponse.result && playerResponse.result._id) ? [playerResponse.result._id]:[]},
				"game_type" 			: 	"public",
				"order_book._id" 		:   ObjectId(values._id),
				"order_status" 			: 	ORDER_STATUS_APPROVED
			},(errData, resultData)=>{
				if(errData) return next(errData);
				let showBookBtn		=	true;	
				if(resultData){

					let gameBookedDate  =   '';
					let startTime       =   '';
					let endTime         =   '';
					if(resultData && resultData.order_book){
	                    if(resultData.order_book.game_type == PUBLIC){
	                        gameBookedDate  =   resultData.order_book.event_date;
	                        startTime       =   resultData.order_book.start_time;
	                        endTime         =   resultData.order_book.end_time;
	                    }
	                }

					let currentTimeStamp		=	new Date().getTime();
					let afterFixTimeStampVal	=	getAsDate(gameBookedDate,covertFullHourtoAMPM(startTime));
					if(currentTimeStamp <= afterFixTimeStampVal.getTime()){ // when today is greate from this date
						showBookBtn		=	false;	
					}
					values.show_btn		=	showBookBtn;	
					resolve({
				        status      : STATUS_SUCCESS,
				        result 		: values
				    });
				}else{
					resolve({
				        status      : STATUS_ERROR,
				        result 		: {}
				    });
				}
			});
		});
	}
	

 	

	 /**
	 * Function to get Public Game's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getPublicGamesListing = (req,res,next)=>{

		return new Promise(async resolve=>{
			let conditions = {};
			conditions.game_type = 'public';
			let date 		= new Date();
			let currentHour = date.getHours();
			//conditions.start_time =  { $gt: currentHour+1 } ;

			const host_game_availabilitys = db.collection('host_game_availabilitys');
			let limit = (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;

			let userSlug 	= 	(req.body && req.body.user_slug)? req.body.user_slug : "";
			/** Set options for get user details **/
			let options = {
				conditions			: 	{slug:userSlug},
				fields				:	{_id :1,full_name:1}
			};
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,options);
			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);
			if( userSlug !== typeof undefined  && !playerResponse.result) return resolve({status: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			let currentDate 	=	newDate('',DATE_OF_BIRTH_FORMAT);

			asyncParallel([
                (callback)=>{
                    host_game_availabilitys.aggregate([
						{$match : conditions},
						{$lookup: {
							from 		: 	"games",
							localField	: 	"game_id",
							foreignField: 	"_id",
							as 			: 	"game_category_data"
						}},
						{$lookup: {
							from 		: 	"masters",
							localField	: 	"game_category_data.games_name",
							foreignField: 	"_id",
							as 			: 	"game_data"
						}},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"host_id",
							foreignField: 	"_id",
							as 			: 	"hostData"
						}},
						{$lookup:{
					      from: "order",
					      let: { gid: "$game_id",start_time: "$start_time",end_time: "$end_time",event_date: "$event_date"},
					      pipeline: [
					        {$match: {
					          $expr: {
					            $and: [
					                { $eq: ["$game_id", "$$gid"] },
					                { $eq: ['$game_type', 'public'] },
									{ $or: [ { $eq: [ "$order_status", 'approved' ] }, { $eq: [ "$order_status", 'pending' ] } ] },
									{ $eq: ["$order_book.start_time",'$$start_time'] },
					                { $eq: ["$order_book.end_time", '$$end_time'] },
					                { $eq: ["$order_book.event_date", '$$event_date'] },
					            ],
					          },
					        }},
					      ],
					      as: "order_details",
					    }},
					    {$lookup:{
					      from: "order",
					      let: { start_time: "$start_time",end_time: "$end_time",event_date: "$event_date"},
					      pipeline: [
					        {$match: {
					          $expr: {
					            $and: [
									{ $or: [ { $eq: [ "$order_status", 'approved' ] }, { $eq: [ "$order_status", 'pending' ] } ] },
									{ $eq: ["$order_book.start_time",'$$start_time'] },
					                { $eq: ["$order_book.end_time", '$$end_time'] },
					                { $eq: ["$order_book.event_date", '$$event_date'] },
					                { $in: [(playerResponse && playerResponse.result && playerResponse.result._id) ? ObjectId(playerResponse.result._id):[], '$player_id'] },
					            ],
					          },
					        }},
					      ],
					      as: "already_book",
					    }},
					 
						{$addFields: {order_details_id:{"$arrayElemAt":["$order_details._id",0]}}},
						
						{ $lookup: {
						    from: "public_player_invitation",
						    let: {
						      orderId: "$order_details_id",gid: "$game_id",start_time: "$start_time",end_time: "$end_time",event_date: "$event_date",host_id:"$host_id"
						    },
						    pipeline: [
						      	{ 
						      	$match: {
								        $expr:{ $and: [
						              		{ $eq: ["$order_id", "$$orderId"] },
						              		{ $eq: ["$game_id", "$$gid"] },
							                { $eq: ['$game_type', 'public'] },
											{ $eq: ["$game_start_time",'$$start_time'] },
							                { $eq: ["$game_end_time", '$$end_time'] },
							                { $eq: ["$game_book_date", '$$event_date'] },
							                { $eq: ["$host_id", '$$host_id'] },
							                { $ne: ["$order_status", ORDER_STATUS_REJECTED] },
						          		] }
							      	} 
							    },
						      	{
								    $lookup:{
								        from:'order',
								        localField:'order_id',
								        foreignField:'_id',
								        as:'order_detail_values'
								    }
								},
						    ],
						    as: "publicPlayerInvitation"
						} },
						
						{$lookup:{
					      from: "public_player_invitation",
					      let: { gid: "$game_id",start_time: "$start_time",end_time: "$end_time",event_date: "$event_date",host_id:"$host_id",order_details_id:"$order_details_id"},
					      pipeline: [
					        {$match: {
					          $expr: {
					            $and: [
					                { $eq: ["$game_id", "$$gid"] },
					                { $eq: ['$game_type', 'public'] },
									{ $eq: ["$game_start_time",'$$start_time'] },
					                { $eq: ["$game_end_time", '$$end_time'] },
					                { $eq: ["$game_book_date", '$$event_date'] },
					                { $eq: ["$player_id", ObjectId(playerResponse.result._id)] },
					                { $eq: ["$host_id", '$$host_id'] },
					                { $ne: ["$order_status", ORDER_STATUS_REJECTED] },
					                //{ $eq: ["$order_id", '$order_details_id'] },
					            ],
					          },
					        }},
					      ],
					      as: "order_value_book",
					    }},
						{$project : {
							_id:1,game_type:1,private_game_availability_id:1,start_time:1,host_id:1,order_details_id:1,
							end_time:1,event_date:1,game_id:1,public_game_availability_id:1,modified:1,
							game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
							min_no_of_contestent:{"$arrayElemAt":["$game_category_data.min_no_of_contestent",0]},
							max_no_of_contestent:{"$arrayElemAt":["$game_category_data.max_no_of_contestent",0]},
							game_name:{"$arrayElemAt":["$game_data.name",0]},
							host_name:{"$arrayElemAt":["$hostData.full_name",0]},
							host_time_zone_val:{"$arrayElemAt":["$hostData.time_zone_val",0]},
							host_slug:{"$arrayElemAt":["$hostData.slug",0]},
							profile_picture:{"$arrayElemAt":["$hostData.profile_picture",0]},
							size_of_game_current_avaiblity: {$size: "$publicPlayerInvitation"},
							publicPlayerInvitation:{"$arrayElemAt":["$publicPlayerInvitation",0]},
							publicPlayerInvitation:"$publicPlayerInvitation",
							order_value_book:"$order_value_book",
							already_book_slot:"$already_book",
						}},
						{$match: { event_date : { $gte:currentDate}}},
						{$sort: {event_date : SORT_ASC}},
						{$limit: limit },
					]).toArray((availabilityErr, availabilityResult)=>{
						if(availabilityErr) return next(availabilityErr);
						callback(availabilityErr, (availabilityResult && availabilityResult.length>0)	?	availabilityResult	:[]);
                    });
                },
                (callback)=>{
                    /** Get total number of records in faqs collection **/
                  /*  host_game_availabilitys.countDocuments(conditions,(err,countResult)=>{
                        callback(err, countResult);
                    });*/

                    host_game_availabilitys.aggregate([
						{$match : conditions},
						{$lookup: {
							from 		: 	"games",
							localField	: 	"game_id",
							foreignField: 	"_id",
							as 			: 	"game_category_data"
						}},
						{$lookup: {
							from 		: 	"masters",
							localField	: 	"game_category_data.games_name",
							foreignField: 	"_id",
							as 			: 	"game_data"
						}},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"host_id",
							foreignField: 	"_id",
							as 			: 	"hostData"
						}},
						{$lookup:{
					      from: "order",
					      let: { gid: "$game_id",start_time: "$start_time",end_time: "$end_time",event_date: "$event_date"},
					      pipeline: [
					        {$match: {
					          $expr: {
					            $and: [
					                { $eq: ["$game_id", "$$gid"] },
					                { $eq: ['$game_type', 'public'] },
									{ $or: [ { $eq: [ "$order_status", 'approved' ] }, { $eq: [ "$order_status", 'pending' ] } ] },
									{ $eq: ["$order_book.start_time",'$$start_time'] },
					                { $eq: ["$order_book.end_time", '$$end_time'] },
					                { $eq: ["$order_book.event_date", '$$event_date'] },
					            ],
					          },
					        }},
					      ],
					      as: "order_details",
					    }},
					    {$lookup:{
					      from: "order",
					      let: { start_time: "$start_time",end_time: "$end_time",event_date: "$event_date"},
					      pipeline: [
					        {$match: {
					          $expr: {
					            $and: [
									{ $or: [ { $eq: [ "$order_status", 'approved' ] }, { $eq: [ "$order_status", 'pending' ] } ] },
									{ $eq: ["$order_book.start_time",'$$start_time'] },
					                { $eq: ["$order_book.end_time", '$$end_time'] },
					                { $eq: ["$order_book.event_date", '$$event_date'] },
					                { $in: [(playerResponse && playerResponse.result && playerResponse.result._id) ? ObjectId(playerResponse.result._id):[], '$player_id'] },
					            ],
					          },
					        }},
					      ],
					      as: "already_book",
					    }},
					 
						{$addFields: {order_details_id:{"$arrayElemAt":["$order_details._id",0]}}},
						
						{ $lookup: {
						    from: "public_player_invitation",
						    let: {
						      orderId: "$order_details_id",gid: "$game_id",start_time: "$start_time",end_time: "$end_time",event_date: "$event_date",host_id:"$host_id"
						    },
						    pipeline: [
						      	{ 
						      	$match: {
								        $expr:{ $and: [
						              		{ $eq: ["$order_id", "$$orderId"] },
						              		{ $eq: ["$game_id", "$$gid"] },
							                { $eq: ['$game_type', 'public'] },
											{ $eq: ["$game_start_time",'$$start_time'] },
							                { $eq: ["$game_end_time", '$$end_time'] },
							                { $eq: ["$game_book_date", '$$event_date'] },
							                { $eq: ["$host_id", '$$host_id'] },
							                { $ne: ["$order_status", ORDER_STATUS_REJECTED] },
						          		] }
							      	} 
							    },
						      	{
								    $lookup:{
								        from:'order',
								        localField:'order_id',
								        foreignField:'_id',
								        as:'order_detail_values'
								    }
								},
						    ],
						    as: "publicPlayerInvitation"
						} },
						
						{$lookup:{
					      from: "public_player_invitation",
					      let: { gid: "$game_id",start_time: "$start_time",end_time: "$end_time",event_date: "$event_date",host_id:"$host_id",order_details_id:"$order_details_id"},
					      pipeline: [
					        {$match: {
					          $expr: {
					            $and: [
					                { $eq: ["$game_id", "$$gid"] },
					                { $eq: ['$game_type', 'public'] },
									{ $eq: ["$game_start_time",'$$start_time'] },
					                { $eq: ["$game_end_time", '$$end_time'] },
					                { $eq: ["$game_book_date", '$$event_date'] },
					                { $eq: ["$player_id", ObjectId(playerResponse.result._id)] },
					                { $eq: ["$host_id", '$$host_id'] },
					                //{ $eq: ["$order_id", '$order_details_id'] },
					            ],
					          },
					        }},
					      ],
					      as: "order_value_book",
					    }},
						{$project : {
							_id:1,game_type:1,private_game_availability_id:1,start_time:1,host_id:1,order_details_id:1,
							end_time:1,event_date:1,game_id:1,public_game_availability_id:1,modified:1,
							game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
							min_no_of_contestent:{"$arrayElemAt":["$game_category_data.min_no_of_contestent",0]},
							max_no_of_contestent:{"$arrayElemAt":["$game_category_data.max_no_of_contestent",0]},
							game_name:{"$arrayElemAt":["$game_data.name",0]},
							host_name:{"$arrayElemAt":["$hostData.full_name",0]},
							host_time_zone_val:{"$arrayElemAt":["$hostData.time_zone_val",0]},
							host_slug:{"$arrayElemAt":["$hostData.slug",0]},
							profile_picture:{"$arrayElemAt":["$hostData.profile_picture",0]},
							size_of_game_current_avaiblity: {$size: "$publicPlayerInvitation"},
							publicPlayerInvitation:{"$arrayElemAt":["$publicPlayerInvitation",0]},
							publicPlayerInvitation:"$publicPlayerInvitation",
							order_value_book:"$order_value_book",
							already_book_slot:"$already_book",
						}},
						{$match: { event_date : { $gte:currentDate}}},
						{$sort: {event_date : SORT_ASC}},
					]).toArray((err, countResult)=>{
						if(err) return next(err);
						callback(err, countResult.length);
                    });

                }
            ], (err,response)=>{
            	let 	hostGameAvailabilitysResult = (response[0]) ? response[0] : [];

        		/** Set options for append image **/
				let imageOptions = {
					"file_url" 			: USERS_URL,
					"file_path" 		: USERS_FILE_PATH,
					"result" 			: hostGameAvailabilitysResult,
					"database_field" 	: "profile_picture"
				};

				/** Append image with full path **/
				appendFileExistData(imageOptions).then(fileResponse=>{
					/** Send success response **/
				    return resolve({
				        status      		: STATUS_SUCCESS,
				        result 				: (fileResponse && fileResponse.result)	?	fileResponse.result	:{},
				        recordsTotal 		: (response[1]) ? response[1] : [],
				        public_game_price 	: res.locals.settings["PublicGame.price"],
				    });
				}).catch(next);

            }); 
		}); 
	};// End getPublicGamesListing().

	/**
	 * Function to get Host Game's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getHostsListing = (req,res,next)=>{

		return new Promise(async resolve=>{
			
			const users = db.collection('users');
			let limit 	= (req.body.limit)  	? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			let userSlug 	= 	(req.body && req.body.user_slug)? req.body.user_slug : "";

			/** Set options for get user details **/
			let options = {
				conditions			: 	{slug:userSlug},
				fields				:	{_id :1,full_name:1}
			};
			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,options);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});


			let conditions	= {
				active			:	ACTIVE,
				user_role_id 	: 	FRONT_USER_ROLE_ID,
				is_deleted 		:	NOT_DELETED,
				is_verified 	: 	VERIFIED
			};
			conditions.user_type	= USER_TYPE_HOST;


			/*let gemLookupConditions = {};
			gemLookupConditions.game_type 	= 'public';
			let date 				= new Date();
			let currentHour 		= date.getHours();
			gemLookupConditions.start_time 	= { $gt: currentHour+1 } ;*/

			asyncParallel([
                (callback)=>{
                    /** Get list of users's **/
                    users.aggregate([
						{$match : conditions},
						{$limit: limit },
						{$project : {
							__id:1,full_name:1,slug:1,profile_picture:1
						}},
					]).toArray((err, result)=>{
						if(err) return next(err);
						/** Set options for append image **/
						let imageOptions = {
							"file_url" 			: USERS_URL,
							"file_path" 		: USERS_FILE_PATH,
							"result" 			: result,
							"database_field" 	: "profile_picture"
						};

						/** Append image with full path **/
						appendFileExistData(imageOptions).then(fileResponse=>{
							/** Send success response **/
							callback(err, (fileResponse && fileResponse.result)	?	fileResponse.result	:{});
						}).catch(next);
                    });
                },
                (callback)=>{
                    /** Get total number of records in users collection **/
                    users.countDocuments(conditions,(err,countResult)=>{
                        callback(err, countResult);
                    });
                },
                (callback)=>{
                    /** Get total number of records in favorite users collection **/
                    const favorite_users = db.collection('favorite_users');
					favorite_users.find({user_id :userResponse.result._id},{projection: {_id:1,host_id:1}}).toArray((favErr,favResult)=>{
						favHostsResult = [];
						if(favResult && favResult.length > 0){
							favResult.map((value)=>{
								favHostsResult.push(value.host_id);
							})
						}
						callback(favErr,favHostsResult);
                    });
                }
            ],
            (err,response)=>{
                /** Send response **/
                if(err) return next(err);
				
				if(!response) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			    resolve({ 
					status  		: STATUS_SUCCESS,
					result 			: (response[0]) ? response[0] 	: [],
					recordsTotal    : (response[1]) ? response[1] 	: 0,
					fevHosts    	: (response[2]) ? response[2] 	: []
				});				
            });
		}); 
	};// End getHostsListing().

	/**
	 * Function for mark as Favorite UnFavorite form
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.markAsFavoriteHost = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			let hostId 		= 	(req.body && req.body.host_id) 	? decodeId(req.body.host_id) : "";
			let userSlug 	= 	(req.body && req.body.user_slug)? req.body.user_slug : "";
			
			if(hostId && !objectID.isValid(hostId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			/** Set options for get user details **/
			let options = {
				conditions			: 	{slug:userSlug},
				fields				:	{_id :1,full_name:1}
			};

			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,options);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			const favorite_users = db.collection('favorite_users');
			favorite_users.findOne({host_id:ObjectId(hostId),user_id:userResponse.result._id,is_favorite:FAVORITE},(favErr, favResult)=>{
				if(favErr) return next(favErr);
				/** Send error response */
				if(favResult){
					favorite_users.deleteOne({_id:ObjectId(favResult._id)},(deletedErr,deletedResult) => {
						if(deletedErr) return next(deletedErr);
						return resolve({
					        status  : STATUS_SUCCESS,
					        message  : res.__("front.favorite_users_has_been_mark_as_unfavorite_successfully")
					    });
					});
				}else{
					/** Save contacts details */
					favorite_users.insertOne({
						host_id 	: ObjectId(hostId),
						user_id 	: userResponse.result._id,
						is_favorite : FAVORITE,
						modified 	: getUtcDate(),
						created 	: getUtcDate(),
					},(err,result)=>{
						if(err) return next(result);
						/** Send success response **/
						return resolve({
							status		:	STATUS_SUCCESS,
							message		:	res.__("front.favorite_users_has_been_mark_as_favorite_successfully"),
						});	
					});
				}
			});
		});
	};//End markAsFavoriteHost()
	
	/**
	 * Function to update user detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.setUserNotificationSetting = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let notificationSetting = (req.body.notification_setting) ? req.body.notification_setting : "";
				

			if(!notificationSetting) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

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

			const users = db.collection('users');
			let updateData	={
				$set: {
					notification_setting	: (notificationSetting && notificationSetting == NOTIFICATION_BY_PUSH)?NOTIFICATION_BY_PUSH:NOTIFICATION_BY_EMAIL,
					modified				: getUtcDate()
				}
			};

			/** Update user details **/
			users.updateOne({_id:response.result._id},updateData,(updateErr,updateResult)=>{
				if(updateErr) return next(updateErr);
				/** Send success response **/
				let response = {
			        status   : STATUS_SUCCESS,
			        message  : res.__("user.user_setting_updated_successfully"),
			        updated_data	: 	(notificationSetting && notificationSetting == NOTIFICATION_BY_PUSH)?NOTIFICATION_BY_PUSH:NOTIFICATION_BY_EMAIL
			    };
			    resolve(response);
			});
		});
	};// End setUserNotificationSetting().

	/**
	 * Function to get Public Categry Game's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getGameCategorys = (req,res,next)=>{

		return new Promise(async resolve=>{
			let gameType   = (req.body.game_type) ? req.body.game_type : "";


			let conditions = {'dropdown_type':'game_category','status':ACTIVE};
			const masters  = db.collection('masters');

			//if(gameType) conditions.game_type = gameType;

			masters.aggregate([
				{$match : conditions},
				

				/*{$lookup: {
					from 		: 	"games",
					localField	: 	"_id",
					foreignField: 	"games_name",
					as 			: 	"game_category"
				}},*/

				{ '$lookup': {
					'from': 'games',
					'let': { 'mid': '$_id' },
					'pipeline': [
						{$match: {
							$expr: {
								$and: [
									{ $eq: ["$games_name", "$$mid"] },
									{ $eq: ["$game_type", gameType] },
									{ $eq: ["$status", ACTIVE] },
								],
							},
						}},
					],
					'as':'game_category'
				}},

				{$project : {
					__id:1,name:1, 
					game_category : '$game_category',
					size_of_game_category: {$size: "$game_category"}
				}},
				{$match : {size_of_game_category: { $gt: 0 }}},

			]).toArray((gameErr, gameResult)=>{
				if(gameErr) return next(gameErr);

				if(!gameResult) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				/** Send success response **/
			    resolve({
			        status      : STATUS_SUCCESS,
			        result 		: (gameResult)	?	gameResult	:{},
			    });
				
			}); 
		}); 
	};// End getGameCategorys().




	/**
	 * Function to get Public Game's Category Body detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getGameCategoryBody = (req,res,next)=>{

		return new Promise(async resolve=>{
			let gameId = (req.body.game_id) ? req.body.game_id : "";
			if(!gameId) return resolve({status	: STATUS_SUCCESS,result	: {}});

			const games = db.collection('games');
			//games.findOne({_id:ObjectId(gameId)},(err, result)=>{

			games.aggregate([
				{$match : {_id : ObjectId(gameId)}},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"games_name",
					foreignField: 	"_id",
					as 			: 	"game_data"
				}},
				{$project : {
					_id:1,games_name:1,games_level:1,body:1,min_no_of_contestent:1,
					max_no_of_contestent:1,slug:1,from_to_date:1,from_date:1,modified:1,
					to_date:1,game_type:1,games_image:1,status:1,game_rules:1,
					game_category_name:{"$arrayElemAt":["$game_data.name",0]},
				}},
			]).toArray(async (err, result)=>{
				if(err) return next(err);
				/** Send error response */
				if(!result && result.length <=0) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				resolve({
			        status      : STATUS_SUCCESS,
			        result 		: (result && result[0])	?	result[0]	:{},
			        public_game_price : 	res.locals.settings["PublicGame.price"],
			    });
			});
		}); 
	};// End getGameCategorys().


	/**
	 * Function to get Public Game's Category Body detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getGameCategoryBodyDetails = (req,res,next)=>{

		return new Promise(async resolve=>{

			let gameId = (req.body.game_id) ? req.body.game_id : "";
			if(!gameId) return resolve({status	: STATUS_SUCCESS,result	: {}});
			
			let publicGameId 		= 	(req.body && req.body._id) 	 ? decodeId(req.body._id) : "";
			if(publicGameId && !objectID.isValid(publicGameId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}			

			const host_game_availabilitys = db.collection('host_game_availabilitys');
			host_game_availabilitys.findOne({_id:ObjectId(publicGameId)},(hostGameErr, hostGameResult)=>{
				if(hostGameErr) return next(hostGameErr);

				const games = db.collection('games');
				games.aggregate([
					{$match : {_id : ObjectId(gameId)}},
					{$lookup: {
						from 		: 	"masters",
						localField	: 	"games_name",
						foreignField: 	"_id",
						as 			: 	"game_data"
					}},
					{$addFields: {game_category_name:{"$arrayElemAt":["$game_data.name",0]}}},
					{$lookup:{
				      from: "order",
				      let: { gid: "$_id" },
				      pipeline: [
				        {$match: {
				          $expr: {
				            $and: [
				                { $eq: ["$game_id", "$$gid"] },
				                { $eq: ['$game_type', 'public'] },
								{ $or: [ { $eq: [ "$order_status", 'approved' ] }, { $eq: [ "$order_status", 'pending' ] } ] },
								{ $eq: ["$order_book.start_time", hostGameResult.start_time] },
				                { $eq: ["$order_book.end_time", hostGameResult.end_time] },
				                { $eq: ["$order_book.event_date", hostGameResult.event_date] },
				            ],
				          },
				        }},
				      ],
				      as: "order_details",
				    }},
				    {$addFields: {order_details_id:{"$arrayElemAt":["$order_details._id",0]}}},
			      	/*{$lookup: {
						from 		: 	"public_player_invitation",
						localField	: 	"order_details._id",
						foreignField: 	"order_id",
						as 			: 	"publicPlayerInvitation"
					}},*/
					{ $lookup: {
					    from: "public_player_invitation",
					    let: {
					     orderId: "$order_details_id",gid: "$_id"
					    },
					    pipeline: [
					      	{ 
					      	$match: {
							        $expr:{ $and: [
					              		{ $eq: ["$order_id", "$$orderId"] },
					              		{ $eq: ["$game_id", "$$gid"] },
						                { $eq: ['$game_type', 'public'] },
										{ $eq: ["$game_start_time", hostGameResult.start_time] },
						                { $eq: ["$game_end_time",  hostGameResult.end_time] },
						                { $eq: ["$game_book_date",  hostGameResult.event_date] },
						                { $eq: ["$host_id", ObjectId(hostGameResult.host_id)] },
						                { $ne: ["$order_status", ORDER_STATUS_REJECTED] },
					          		] }
						      	} 
						    },
					      	{
							    $lookup:{
							        from:'order',
							        localField:'order_id',
							        foreignField:'_id',
							        as:'order_detail_values'
							    }
							},
					    ],
					    as: "publicPlayerInvitation"
					} },
					{$project : {
						_id:1,games_name:1,games_level:1,body:1,min_no_of_contestent:1,
						max_no_of_contestent:1,slug:1,from_to_date:1,from_date:1,modified:1,
						to_date:1,game_type:1,games_image:1,status:1,game_rules:1,
						game_category_name:1,
						size_of_game_current_avaiblity: {$size: "$publicPlayerInvitation"},					
					}},
				]).toArray(async (err, result)=>{
					if(err) return next(err);
					/** Send error response */
					if(!result && result.length <=0) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
					resolve({
				        status      : STATUS_SUCCESS,
				        result 		: (result && result[0])	?	result[0]	:{},
				        public_game_price : 	res.locals.settings["PublicGame.price"],
				    });
				});
			});
		}); 
	};// End getGameCategoryBodyDetails().

	/**
	 * Function to player Invitation set detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.playerInvitation = (req,res,next)=>{
		return new Promise(async resolve=>{

			/** Sanitize Data **/
			req.body 	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			let insertContent	 		 		= 	[];
			let insertEmailContent	 	 		= 	[];
			let insertExistUserEmailContent	 	= 	[];
			let insertValidationCheck	 =	returnedTarget	=	{};
			let invitationLength =  (req.body.invitation_length) ? req.body.invitation_length : "";

			if(req.body){
				for (let i = 0; i < invitationLength; i++) {
					insertValidationCheck = Object.assign(insertValidationCheck,{
						["fullname_"+i]: {
							notEmpty		: true,
							errorMessage	: res.__("admin.user.please_enter_name")
						},
					});

					if(req.body && req.body["email_"+i].length > 0){
					    insertValidationCheck = Object.assign(insertValidationCheck,{
							["email_"+i]: {
								isEmail	: 	{
									errorMessage : res.__("admin.user.please_enter_valid_email_address")
								},
							}
						})
					}
				}
			}			

			/** Check validation **/
			req.checkBody(insertValidationCheck);

			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);
			/** Send error response **/
			if(errors) return resolve({status : STATUS_ERROR, message : errors});
		
			let hostSlug = (req.body.host_slug) ? req.body.host_slug : "";
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let tempId   = (req.body.temp_id)   ? ObjectId(req.body.temp_id) : "";

			/** Set options for get host details **/
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
			/**Condition  for host*/
			options.conditions.slug	= hostSlug;
			/** Get host details **/
			let hostResponse =  await getUserData(req,res,next,options);

			if(hostResponse.status != STATUS_SUCCESS) return next(hostResponse.message);
			if(!hostResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});



			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);



			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);
			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});


			const player_temp_availability = db.collection('player_temp_availability');
			let updateData	={
				$set: {
					host_id				: ObjectId(hostResponse.result._id),
					modified			: getUtcDate()
				}
			};

			/** Update user temp details **/
			player_temp_availability.findOneAndUpdate({_id:tempId},updateData,(updateErr,updateResult)=>{
				
				if(updateErr) return next(updateErr);
				const users				=	db.collection("users");
				const player_invitation = 	db.collection('player_invitation');
				if(req.body){
					invitationLengthArray 	=	[];
					for (let i = 0; i < invitationLength; i++) {
						invitationLengthArray.push(i);
					}
					asyncEach(invitationLengthArray,(i, asyncCallback)=>{
						users.findOne({email:req.body['email_'+i]},(err, result)=>{
							if(err) return next(err);
							/** Send error response */
							insertContent.push({
								'email'				:	(req.body['email_'+i])?req.body['email_'+i]:'',
								'fullname'	    	:	req.body['fullname_'+i],
								'host_id'			:	ObjectId(hostResponse.result._id),
								'game_id'			:	ObjectId(updateResult.value.game_id),
								'gameavailability'	:	updateResult.value.gameavailability,
								'game_date'			:	updateResult.value.game_date,
								'approval_status'	:	INVITATION_STATUS_PENDING,
								'payment_status'	:	INVITATION_PAYMENT_PENDING,
								'user_id'			:	ObjectId(playerResponse.result._id),
								'created'	    	:	getUtcDate(),
								'modified'	    	:	getUtcDate(),
							});
							if(result){
								insertExistUserEmailContent.push({
									'email'		:	req.body['email_'+i],
									'fullname'	:	req.body['fullname_'+i]
								});
							}else{
								insertEmailContent.push({
									'email'		:	(req.body['email_'+i])?req.body['email_'+i]:'',
									'fullname'	:	req.body['fullname_'+i]
								});
							}
							asyncCallback(null);
						});
					},(asyncErr,asyncContent)=>{
						/** Send success response **/

						player_invitation.deleteMany({
							user_id:ObjectId(playerResponse.result._id),
							host_id:ObjectId(hostResponse.result._id),
							order_id: { $exists: false}
						},(err,result)=>{
							if(err) return next(err);
							/** Save contacts details */

							if(insertContent && insertContent.length <= 0)  resolve({status:STATUS_SUCCESS,message:res.__("front.player_invitation_has_been_sent_successfully")});

							player_invitation.insertMany(insertContent,(insertErr,insertResult)=>{
								if(insertErr) return next(insertResult);
								/** Send success response **/
								resolve({
									status		:	STATUS_SUCCESS,
									message		:	res.__("front.player_invitation_has_been_sent_successfully"),
								});	
							});
						});

						/*if(insertEmailContent && insertEmailContent.length > 0){
							let sendMailOptions	= {
								event_type 		: USER_INVITATION_EMAIL_EVENTS,
								user_data 		: insertEmailContent,
							};
							sendMailToUsers(req,res,sendMailOptions);
						}

						if(insertExistUserEmailContent && insertExistUserEmailContent.length > 0){
							let sendMailOptionsData	= {
								event_type 		: USER_INVITATION_EVENTS,
								user_data 		: insertExistUserEmailContent,
							};
							sendMailToUsers(req,res,sendMailOptionsData);
						}*/
					});
				}					
			});
		}); 
	};// End playerInvitation().

	/**
	 * Function to check Out Details Pricing package's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.checkOutDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";

			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			const player_temp_availability = db.collection('player_temp_availability');

			player_temp_availability.aggregate([
				{$match : {player_id : ObjectId(playerResponse.result._id)}},
				{$lookup: {
					from 		: 	"games",
					localField	: 	"game_id",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"game_category_data.games_name",
					foreignField: 	"_id",
					as 			: 	"game_data"
				}},
				{$lookup: {
					from 		: 	"pricing_packages",
					localField	: 	"plan_id",
					foreignField: 	"_id",
					as 			: 	"plan_data"
				}},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"host_id",
					foreignField: 	"_id",
					as 			: 	"hostData"
				}},
				{$project : {
					_id:1,name:1,game_date:1,gameavailability:1,
					game_name:{"$arrayElemAt":["$game_data.name",0]},
					game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
					plan_amount:{"$arrayElemAt":["$plan_data.amount",0]},
					plan_no_of_contestants:{"$arrayElemAt":["$plan_data.no_of_contestants",0]},
					plan_title:{"$arrayElemAt":["$plan_data.title",0]},
					plan_days:{"$arrayElemAt":["$plan_data.days",0]},
					host_name:{"$arrayElemAt":["$hostData.full_name",0]},
				}},
			]).toArray(async (availabilityErr, availabilityResult)=>{
				if(availabilityErr) return next(availabilityErr);
				if(!availabilityResult) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				let getReferralAmount =  await getUserReferralAmount(req,res,next,{user_id:ObjectId(playerResponse.result._id)});
				if(availabilityResult[0] && availabilityResult[0].gameavailability){
					availabilityResult[0].event_date 	=	availabilityResult[0].game_date;
					availabilityResult[0].start_time 	=	availabilityResult[0].gameavailability[0].start_time;
					availabilityResult[0].end_time 		=	availabilityResult[0].gameavailability[0].end_time;
				}
				resolve({ 
					status  				: STATUS_SUCCESS,
					result  				: (availabilityResult)?availabilityResult[0]:{},
					user_referrals_points  	: (getReferralAmount && getReferralAmount.user_referrals_points)?getReferralAmount.user_referrals_points:0,
					admin_referrals_charge  : (getReferralAmount && getReferralAmount.admin_referrals_charge)?getReferralAmount.admin_referrals_charge:0,
					user_referrals  		: (getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0,
				});

			});
		});
	};// End checkOutDetails().

	/**
	 * Function to check Out Public Plan Details detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.checkOutPublicPlanDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			
			let publicGameId 		= 	(req.body && req.body.game_id) 	 ? decodeId(req.body.game_id) : "";
			let userSlug 			= 	(req.body && req.body.user_slug) ? req.body.user_slug : "";

			if(publicGameId && !objectID.isValid(publicGameId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}				

			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});



			
			const host_game_availabilitys = db.collection('host_game_availabilitys');
			host_game_availabilitys.aggregate([
				{$match : {_id : ObjectId(publicGameId)}},
				{$lookup: {
					from 		: 	"games",
					localField	: 	"game_id",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"game_category_data.games_name",
					foreignField: 	"_id",
					as 			: 	"game_data"
				}},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"host_id",
					foreignField: 	"_id",
					as 			: 	"hostData"
				}},
				{$project : {
					_id:1,game_type:1,private_game_availability_id:1,start_time:1,host_id:1,
					end_time:1,event_date:1,game_id:1,public_game_availability_id:1,modified:1,
					game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
					plan_min_no_of_contestants:{"$arrayElemAt":["$game_category_data.min_no_of_contestent",0]},
					plan_no_of_contestants:{"$arrayElemAt":["$game_category_data.max_no_of_contestent",0]},
					game_name:{"$arrayElemAt":["$game_data.name",0]},
					host_name:{"$arrayElemAt":["$hostData.full_name",0]},
				}},
			]).toArray(async (publicGameAvailabilityErr, publicGameAvailabilityResult)=>{
				if(publicGameAvailabilityErr) return next(publicGameAvailabilityErr);
				if(!publicGameAvailabilityResult && publicGameAvailabilityResult.length <= 0) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			   	
			   	if(publicGameAvailabilityResult && publicGameAvailabilityResult.length > 0){
					publicGameAvailabilityResult[0].public_game 	=	true;
					publicGameAvailabilityResult[0].plan_amount 	=	res.locals.settings["PublicGame.price"];
				}

				/*let gameBookedDate  =   '';
				let startTime       =   '';
				let endTime         =   '';
				if(publicGameAvailabilityResult[0] && publicGameAvailabilityResult[0].order_book){
				    if(publicGameAvailabilityResult[0].order_book.game_type == PUBLIC){
				        gameBookedDate  =   publicGameAvailabilityResult[0].order_book.event_date;
				        startTime       =   publicGameAvailabilityResult[0].order_book.start_time;
				        endTime         =   publicGameAvailabilityResult[0].order_book.end_time;
				    }else{
				        if(publicGameAvailabilityResult[0].order_book.preferred_date){
				            gameBookedDate  =   publicGameAvailabilityResult[0].order_book.preferred_date;
				            startTime       =   publicGameAvailabilityResult[0].order_book.start_time;
				            endTime         =   publicGameAvailabilityResult[0].order_book.end_time;
				        }else{
				            gameBookedDate  =   publicGameAvailabilityResult[0].order_book.game_date;
				            if(publicGameAvailabilityResult[0].order_book.gameavailability && publicGameAvailabilityResult[0].order_book.gameavailability.length > 0){
				                startTime       =   publicGameAvailabilityResult[0].order_book.gameavailability[0].start_time;
				                endTime         =   publicGameAvailabilityResult[0].order_book.gameavailability[0].end_time;
				            }
				        }
				    }
				}
				console.log(publicGameAvailabilityResult[0],gameBookedDate,startTime,endTime)

				publicGameAvailabilityResult[0].game_date 			=	gameBookedDate;
				publicGameAvailabilityResult[0].game_start_time 	=	startTime;
				publicGameAvailabilityResult[0].game_start_time 	=	endTime;*/

				/*const user_referrals = db.collection('user_referrals');
				user_referrals.countDocuments({referral_user_by:ObjectId(playerResponse.result._id),redeem_credits: { $ne: 0 }},(userReferralErr,userReferralCount)=>{
					if(userReferralErr) return next(userReferralErr);			
					let referralCharge =	(res.locals.settings["Referral.charge"])?res.locals.settings["Referral.charge"]:0
					resolve({ 
						status  			: STATUS_SUCCESS,
						result  			: (publicGameAvailabilityResult)?publicGameAvailabilityResult[0]:{},
						user_referrals      : (userReferralCount*referralCharge),
					});
				});
				*/
				let getReferralAmount =  await getUserReferralAmount(req,res,next,{user_id:ObjectId(playerResponse.result._id)});
				resolve({ 
					status  			: STATUS_SUCCESS,
					result  			: (publicGameAvailabilityResult)?publicGameAvailabilityResult[0]:{},
					user_referrals_points  	: (getReferralAmount && getReferralAmount.user_referrals_points)?getReferralAmount.user_referrals_points:0,
					admin_referrals_charge  : (getReferralAmount && getReferralAmount.admin_referrals_charge)?getReferralAmount.admin_referrals_charge:0,
					user_referrals  : (getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0,
				});

			});
		});
	};// End checkOutPublicPlanDetails().

	/**
	 * Function to check Out Custom XL Request detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let customRequestDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let orderId  = (req.body.order_id)  ? req.body.order_id : "";

			if(orderId && !objectID.isValid(orderId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			const custom_package_booking = db.collection('custom_package_booking');

			custom_package_booking.aggregate([
				{$match : {_id : ObjectId(orderId),player_id : ObjectId(playerResponse.result._id),approval_status:CUSTOM_PLAN_STATUS_QUEUE}},
				{$lookup: {
					from 		: 	"games",
					localField	: 	"game_id",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"game_category_data.games_name",
					foreignField: 	"_id",
					as 			: 	"game_data"
				}},
				{$lookup: {
					from 		: 	"pricing_packages",
					localField	: 	"plan_id",
					foreignField: 	"_id",
					as 			: 	"plan_data"
				}},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"host_id",
					foreignField: 	"_id",
					as 			: 	"hostData"
				}},
				{$project : {
					__id:1,name:1,party_size:1,amount:1,party_size:1,preferred_date:1,game_id:1,host_id:1,
					start_time:1,end_time:1,approval_status:1,
					game_name:{"$arrayElemAt":["$game_data.name",0]},
					game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
					host_name:{"$arrayElemAt":["$hostData.full_name",0]},
				}},
			]).toArray((availabilityErr, availabilityResult)=>{
				if(availabilityErr) return next(availabilityErr);
				if(!availabilityResult) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				if(availabilityResult && availabilityResult.length > 0){
					availabilityResult[0].plan_title 				=	"Custom";
					availabilityResult[0].plan_days  				=	"-";
					availabilityResult[0].plan_no_of_contestants   	=	availabilityResult[0].party_size;
					availabilityResult[0].game_type  				=	GAMES_TYPE[PRIVATE].status_name;
					availabilityResult[0].plan_amount  				=	availabilityResult[0].amount;
				}
			    resolve({ status  : STATUS_SUCCESS,result  : (availabilityResult)?availabilityResult:{}});
			});
		});
	};// End customRequestDetails()



	/**
	 * Function to check Out Custom XL Request detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let playerTempAvailabilityDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userId 	=	(req.body && req.body.user_id)?req.body.user_id:'';
			const player_temp_availability = db.collection('player_temp_availability');
			player_temp_availability.aggregate([
				{$match : {player_id : ObjectId(userId)}},
				{$lookup: {
					from 		: 	"games",
					localField	: 	"game_id",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"game_category_data.games_name",
					foreignField: 	"_id",
					as 			: 	"game_data"
				}},
				{$lookup: {
					from 		: 	"pricing_packages",
					localField	: 	"plan_id",
					foreignField: 	"_id",
					as 			: 	"plan_data"
				}},
				{$project : {
					__id:1,name:1,player_id:1,plan_id:1,wager:1,game_date:1,gameavailability:1,host_id:1,game_id:1,
					game_name:{"$arrayElemAt":["$game_data.name",0]},
					game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
					plan_amount:{"$arrayElemAt":["$plan_data.amount",0]},
					plan_no_of_contestants:{"$arrayElemAt":["$plan_data.no_of_contestants",0]},
					plan_title:{"$arrayElemAt":["$plan_data.title",0]},
					plan_days:{"$arrayElemAt":["$plan_data.days",0]},
					game_type:{"$arrayElemAt":["$plan_data.game_type",0]},
				}},
			]).toArray(async (availabilityErr, availabilityResult)=>{
				if(availabilityErr) return next(availabilityErr);
				if(availabilityResult && availabilityResult.length <= 0) return resolve({status	: STATUS_ERROR,message: res.__("admin.system.invalid_access"),redirect:true});
				resolve({ status  : STATUS_SUCCESS,result  : (availabilityResult)?availabilityResult:{}});
			});
		});
	};// End playerTempAvailabilityDetails()


	/**
	 * Function to get Public Game's avaiblity
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getPublicGameAvaiblity = (req,res,next,options)=>{
		return new Promise(async resolve=>{
			
			let publicGameId 		= 	(options && options._id) 	 ? ObjectId(options._id) : "";
			const host_game_availabilitys = db.collection('host_game_availabilitys');
			host_game_availabilitys.findOne({_id:publicGameId},(hostGameErr, hostGameResult)=>{
				if(hostGameErr) return next(hostGameErr);
				if(!hostGameResult) return resolve({status: STATUS_ERROR,game_pass : false });
				
				const games = db.collection('games');
				games.aggregate([
					{$match : {_id : ObjectId(hostGameResult.game_id)}},
					{$lookup: {
						from 		: 	"masters",
						localField	: 	"games_name",
						foreignField: 	"_id",
						as 			: 	"game_data"
					}},
					{$lookup:{
				      from: "order",
				      let: { gid: "$_id" },
				      pipeline: [
				        {$match: {
				          $expr: {
				            $and: [
				                { $eq: ["$game_id", "$$gid"] },
				                { $eq: ['$game_type', 'public'] },
								{ $or: [ { $eq: [ "$order_status", 'approved' ] }, { $eq: [ "$order_status", 'pending' ] } ] },
								{ $eq: ["$order_book.start_time", hostGameResult.start_time] },
				                { $eq: ["$order_book.end_time", hostGameResult.end_time] },
				                { $eq: ["$order_book.event_date", hostGameResult.event_date] },
				            ],
				          },
				        }},
				      ],
				      as: "order_details",
				    }},
				   
					{$addFields: {order_details_id:{"$arrayElemAt":["$order_details._id",0]}}},
			      	
					{ $lookup: {
					    from: "public_player_invitation",
					    let: {
					     orderId: "$order_details_id",gid: "$_id"
					    },
					    pipeline: [
					      	{ 
					      	$match: {
							        $expr:{ $and: [
					              		//{ $eq: ["$order_id", "$$orderId"] },
					              		{ $eq: ["$game_id", "$$gid"] },
						                { $eq: ['$game_type', 'public'] },
										{ $eq: ["$game_start_time", hostGameResult.start_time] },
						                { $eq: ["$game_end_time",  hostGameResult.end_time] },
						                { $eq: ["$game_book_date",  hostGameResult.event_date] },
						                { $eq: ["$host_id", ObjectId(hostGameResult.host_id)] },
						                { $ne: ["$order_status", ORDER_STATUS_REJECTED] },
					          		] }
						      	} 
						    },
					      	{
							    $lookup:{
							        from:'order',
							        localField:'order_id',
							        foreignField:'_id',
							        as:'order_detail_values'
							    }
							},
					    ],
					    as: "publicPlayerInvitation"
					} },
					{$project : {
						_id:1,games_name:1,games_level:1,body:1,min_no_of_contestent:1,
						max_no_of_contestent:1,slug:1,from_to_date:1,from_date:1,modified:1,
						to_date:1,game_type:1,games_image:1,status:1,game_rules:1,
						game_category_name:1,size_of_game_current_avaiblity: {$size: "$publicPlayerInvitation"},			
						parent_game_name:{"$arrayElemAt":["$game_data.name",0]},		
					}},
				]).toArray(async (err, result)=>{
					if(err) return next(err);
					if(!result && result.length <= 0 ) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

					let resultData	=	(result && result[0])?result[0]:0;
					let min_game_pass 		= false;
					let public_game_name 	= '';
					if(result && result[0] && result[0].size_of_game_current_avaiblity == result[0].min_no_of_contestent){
						min_game_pass 	= true;
					}
					if(result && result[0]){
						public_game_name	=	(result && result[0] && result[0].parent_game_name)?result[0].parent_game_name:''+' - '+(result && result[0] && result[0].games_level)?result[0].games_level:''
					}

				
					if(resultData.size_of_game_current_avaiblity < resultData.max_no_of_contestent){
						return resolve({
					        status      	: STATUS_SUCCESS,
					        game_pass 		: true,
					        min_game_done 	: min_game_pass,
					        public_game_name: public_game_name,
					        hostgame_result : hostGameResult,
					    });
					}else{
						return resolve({
					        status      	: STATUS_ERROR,
					        game_pass 		: false,
					        min_game_done 	: min_game_pass,
					        public_game_name: public_game_name,
					        hostgame_result : hostGameResult,
					    });
					}
				});
			});
		}); 
	};// End getPublicGameAvaiblity().


	/**
	 * Function to check Out Final Payment detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	*/
	this.checkOutFinalPayment = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body 			= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			let paymentCard 			=	(req.body && req.body.payment_card)?req.body.payment_card:'';
			let paymentMethod 			=	(req.body && req.body.payment_method)?req.body.payment_method:'';

			let referralsWants 			=	(req.body && req.body.referrals_cradits)?req.body.referrals_cradits:'';

			let billingInformation		=	(req.body) ? req.body 	:	{};

			if(paymentCard != 'previous_card'){

				/** Check validation **/
				req.checkBody({
					"first_name": {
	                    notEmpty: true,
		                isLength:{
	                        options: {
	                        	min    : NAME_MIN_LENGTH,
	                    		max    : NAME_MAX_LENGTH,
	                        },
	                        errorMessage: res.__("admin.user.please_enter_first_name_min",NAME_MIN_LENGTH,NAME_MAX_LENGTH)
	                    },
	                    errorMessage: res.__("admin.user.please_enter_first_name")
	                },
	                "last_name": {
	                    notEmpty: true,
		                isLength:{
	                        options: {
	                        	min    : NAME_MIN_LENGTH,
	                    		max    : NAME_MAX_LENGTH,
	                        },
	                        errorMessage: res.__("admin.user.please_enter_last_name_min",NAME_MIN_LENGTH,NAME_MAX_LENGTH)
	                    },
	                    errorMessage: res.__("admin.user.please_enter_last_name")
	                },
	                "address": {
	                    notEmpty: true,
	                    errorMessage: res.__("admin.user.please_select_address")
	                },
	                "city": {
	                    notEmpty: true,
	                    errorMessage: res.__("admin.user.please_enter_city")
	                },
	                "state": {
	                    notEmpty: true,
	                    errorMessage: res.__("admin.user.please_enter_state")
	                },
	                "zip_code": {
	                    notEmpty: true,
	                    errorMessage: res.__("admin.user.please_enter_zip_code")
	                }
				});

				/** parse Validation array  **/
				let errors = parseValidation(req.validationErrors(),req);

				/** Send error response **/
				if(errors) return resolve({status : STATUS_ERROR, message : errors});
			}
			let insertedNewBookingId 	= uniqueBookingIDGenerator();
			let userSlug 	=	(req.body && req.body.user_slug)?req.body.user_slug:'';
			
			if(paymentCard != 'previous_card'){
				var token 		=	(req.body && req.body.token)?req.body.token:'';
				if(!token) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			}
			/** Set options for get player details **/
			let optionsForPlayer = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields				:	{
											_id :1,full_name:1,stripe_account_id:1,customer_id:1,email:1
										}
			};
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status : STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			let publicGameId 	= (req.body && req.body.public_game_id)?decodeId(req.body.public_game_id):'';
			
			if(publicGameId){
				if(publicGameId && !objectID.isValid(publicGameId)){
					return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
				}


				let publicGameAvaiblityCount 	=	await getPublicGameAvaiblity(req,res,next,{'_id':publicGameId});
					
				if(publicGameAvaiblityCount.status == STATUS_ERROR || !publicGameAvaiblityCount.game_pass) return resolve({ status	: STATUS_ERROR,message	: res.__("admin.public.slot_avaiblity_not_present")})

				if(publicGameAvaiblityCount && publicGameAvaiblityCount.hostgame_result){
					if(Object.keys(publicGameAvaiblityCount.hostgame_result).length > 0){
						let conditionValuesNewPublic 	=	{ 
								"$or" 				: [{"order_status": ORDER_STATUS_APPROVED}, {"order_status": ORDER_STATUS_PENDING}],
								'game_book_date' 	: (publicGameAvaiblityCount.hostgame_result.event_date)?publicGameAvaiblityCount.hostgame_result.event_date:'',
								'game_start_time' 	: (publicGameAvaiblityCount.hostgame_result.start_time)?publicGameAvaiblityCount.hostgame_result.start_time:'',
								'game_end_time' 	: (publicGameAvaiblityCount.hostgame_result.end_time)?publicGameAvaiblityCount.hostgame_result.end_time:'',
								'player_id'			: {$in : [ObjectId(playerResponse.result._id)] }
						}
													
						let bookedGameCheck  =	await getBookedGames(req,res,next,conditionValuesNewPublic);
						if(bookedGameCheck && bookedGameCheck.result == true){
							return resolve({ status	: STATUS_ERROR,message	: res.__("player.game_alredy_booked_on_this_date")})
						}
					}
				}


				let getReferralAmount 	=   await getUserReferralAmount(req,res,next,{user_id:ObjectId(playerResponse.result._id)});
				let userReferralAmount 	= 	(getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0
				let finalAmount 		=	(res.locals.settings["PublicGame.price"])?res.locals.settings["PublicGame.price"]:0
				if(referralsWants == 'true'){
					if(userReferralAmount >= finalAmount){
						finalAmount		=	userReferralAmount-finalAmount;
					}else{
						finalAmount		=	finalAmount-userReferralAmount;
					}
				}
				
				let chargeData	=	{};
				chargeData.amount		=  finalAmount*100;
				chargeData.currency		=  CURRENCY;
				chargeData.description	=  insertedNewBookingId; // 'Charge Generate For '+publicGameAvaiblityCount.public_game_name;
				if(paymentCard != 'previous_card'){
					//chargeData.source		= token;
				}else{
					chargeData.customer		= playerResponse.result.customer_id;
					chargeData.card			= paymentMethod;
				}
				

				try {
					try{
						if(paymentCard != 'previous_card'){
							if(playerResponse.result.customer_id){
								if(token){
				                	const cardNew = await stripe.customers.createSource(
									 	playerResponse.result.customer_id,
									  	{source: token}
									);
									if(cardNew.id){
										chargeData.customer		= playerResponse.result.customer_id;
										chargeData.card			= cardNew.id;
										//chargeData.source		= cardNew.token;
									}
									
					            }
							}
						}

						const charge 	= await stripe.charges.create(chargeData);
						if(charge){
							const host_game_availabilitys = db.collection('host_game_availabilitys');
							host_game_availabilitys.aggregate([
								{$match : {_id : ObjectId(publicGameId)}},
								{$lookup: {
									from 		: 	"games",
									localField	: 	"game_id",
									foreignField: 	"_id",
									as 			: 	"game_category_data"
								}},
								{$lookup: {
									from 		: 	"masters",
									localField	: 	"game_category_data.games_name",
									foreignField: 	"_id",
									as 			: 	"game_data"
								}},
								
								{$project : {
									_id:1,game_type:1,private_game_availability_id:1,start_time:1,host_id:1,
									end_time:1,event_date:1,game_id:1,public_game_availability_id:1,modified:1,
									game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
									plan_min_no_of_contestants:{"$arrayElemAt":["$game_category_data.min_no_of_contestent",0]},
									plan_no_of_contestants:{"$arrayElemAt":["$game_category_data.max_no_of_contestent",0]},
									game_name:{"$arrayElemAt":["$game_data.name",0]},
								}},
							]).toArray((publicGameAvailabilityErr, publicGameAvailabilityResult)=>{
								if(publicGameAvailabilityErr) return next(publicGameAvailabilityErr);
								if(!publicGameAvailabilityResult && publicGameAvailabilityResult.length <= 0) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
							   	
							   	if(publicGameAvailabilityResult && publicGameAvailabilityResult.length > 0){
									publicGameAvailabilityResult[0].public_game 	=	true;
									publicGameAvailabilityResult[0].plan_amount 	=	res.locals.settings["PublicGame.price"];
								}

								const user_referrals = db.collection('user_referrals');
								let updateData	={
									$set: {
										redeem_credits		: (res.locals.settings["Referral.points"])?parseInt(res.locals.settings["Referral.points"]):0,
										modified			: getUtcDate()
									}
								};
								/** Update user details **/

								user_referrals.updateOne({referral_user:ObjectId(playerResponse.result._id),redeem_credits:NOT_CREDITES},updateData,(updateErr,updateResult)=>{
									if(updateErr) return next(updateErr);	
									const user_referral_logs = db.collection('user_referral_logs');
									user_referral_logs.updateOne({referral_user:ObjectId(playerResponse.result._id),redeem_credits:NOT_CREDITES},updateData,(updateLogErr,updateLogResult)=>{
										if(updateLogErr) return next(updateLogErr);	
										/** Send success response **/

										//let hostCommission = ( res.locals.settings["Site.host_commission"] / 100) * publicGameAvailabilityResult[0].plan_amount;
										let hostCommission = res.locals.settings["Site.host_commission"];
										/** Send success response **/
										
										if(billingInformation){
											delete billingInformation.options; 
											delete billingInformation.user_slug; 
											if(paymentCard != 'previous_card'){
												delete billingInformation.token; 
											}
										}
										const order = db.collection('order');
										/*order.insertOne({
											order_book 		: publicGameAvailabilityResult[0],
											game_book_date  : (publicGameAvailabilityResult[0].event_date)?publicGameAvailabilityResult[0].event_date:'',
											game_start_time : (publicGameAvailabilityResult[0].start_time)?publicGameAvailabilityResult[0].start_time:'',
											game_end_time   : (publicGameAvailabilityResult[0].end_time)?publicGameAvailabilityResult[0].end_time:'',
											player_id 		: ObjectId(playerResponse.result._id),
											host_id 		: (publicGameAvailabilityResult[0].host_id)?ObjectId(publicGameAvailabilityResult[0].host_id):"",
											charge_id 		: charge.id,
											order_response 	: JSON.stringify(charge),
											billing_info 	: billingInformation,
											host_commission : hostCommission,
											game_type 		: publicGameAvailabilityResult[0].game_type,
											game_id 		: publicGameAvailabilityResult[0].game_id,
											booking_id 		: insertedNewBookingId,
											order_status 	: ORDER_STATUS_APPROVED,
											host_payment_relige : PLAYMENT_NOT_RELIGE,
											modified 		: getUtcDate(),
											created 		: getUtcDate(),
										},(err,result)=>{*/
										let insertValuesPublic = {
											order_book 		: publicGameAvailabilityResult[0],
											game_book_date  : (publicGameAvailabilityResult[0].event_date)?publicGameAvailabilityResult[0].event_date:'',
											game_start_time : (publicGameAvailabilityResult[0].start_time)?publicGameAvailabilityResult[0].start_time:'',
											game_end_time   : (publicGameAvailabilityResult[0].end_time)?publicGameAvailabilityResult[0].end_time:'',
											//player_id 		: ObjectId(playerResponse.result._id),
											host_id 		: (publicGameAvailabilityResult[0].host_id)?ObjectId(publicGameAvailabilityResult[0].host_id):"",
											charge_id 		: charge.id,
											order_response 	: JSON.stringify(charge),
											billing_info 	: billingInformation,
											host_commission : hostCommission,
											game_type 		: publicGameAvailabilityResult[0].game_type,
											game_id 		: publicGameAvailabilityResult[0].game_id,
											booking_id 		: insertedNewBookingId,
											order_status 	: ORDER_STATUS_APPROVED,
											host_payment_relige : PLAYMENT_NOT_RELIGE,
											modified 		: getUtcDate(),
											//created 		: getUtcDate(),
										}

										let newCond 	=	{
											game_book_date  : (publicGameAvailabilityResult[0].event_date)?publicGameAvailabilityResult[0].event_date:'',
											game_start_time : (publicGameAvailabilityResult[0].start_time)?publicGameAvailabilityResult[0].start_time:'',
											game_end_time   : (publicGameAvailabilityResult[0].end_time)?publicGameAvailabilityResult[0].end_time:'',
											host_id 		: (publicGameAvailabilityResult[0].host_id)?ObjectId(publicGameAvailabilityResult[0].host_id):"",
											//host_id 		: "gg",
										}
										order.findOne(newCond,(prevOrderErr, prevOrderResult)=>{
											if(updateLogErr) return next(updateLogErr);	
												let playerids =	[];
												if(prevOrderResult){

													prevOrderResult.player_id.push(ObjectId(playerResponse.result._id));
													insertValuesPublic.player_id 	=	prevOrderResult.player_id;

												}else{
													playerids.push(ObjectId(playerResponse.result._id));

													insertValuesPublic.player_id 	=	playerids;
												}
												
												order.findOneAndUpdate(newCond,{
													$set		: insertValuesPublic,
													$setOnInsert: {
														created 		: 	getUtcDate(),
													}
												},{upsert: true},(bookErr,bookResponse) => {
													if(bookErr) return next(bookErr);

													
													let insertUpdateBookingId 	=	(bookResponse && bookResponse.lastErrorObject && bookResponse.lastErrorObject.upserted)?ObjectId(bookResponse.lastErrorObject.upserted):ObjectId(bookResponse.value._id);
													
													let insertValuesPublic = {
														order_id  		: insertUpdateBookingId,
														game_book_date  : (publicGameAvailabilityResult[0].event_date)?publicGameAvailabilityResult[0].event_date:'',
														game_start_time : (publicGameAvailabilityResult[0].start_time)?publicGameAvailabilityResult[0].start_time:'',
														game_end_time   : (publicGameAvailabilityResult[0].end_time)?publicGameAvailabilityResult[0].end_time:'',
														player_id 		: ObjectId(playerResponse.result._id),
														player_full_name: playerResponse.result.full_name,
														player_email    : playerResponse.result.email,
														host_id 		: (publicGameAvailabilityResult[0].host_id)?ObjectId(publicGameAvailabilityResult[0].host_id):"",
														game_type 		: publicGameAvailabilityResult[0].game_type,
														game_id 		: publicGameAvailabilityResult[0].game_id,
														booking_id 		: insertedNewBookingId,
														order_status 	: ORDER_STATUS_APPROVED,
														created 		: getUtcDate(),
														modified 		: getUtcDate(),
													}


													const public_player_invitation = db.collection('public_player_invitation');
													public_player_invitation.insertOne(insertValuesPublic,(invitationResultErr,invitationResult) => {
													

														const order_payment = db.collection('order_payment');
														let orderPaymentPublic 	=	{
															order_id 				: insertUpdateBookingId,
															player_id 				: ObjectId(playerResponse.result._id),
															host_id 				: (publicGameAvailabilityResult[0].host_id)?ObjectId(publicGameAvailabilityResult[0].host_id):"",
															charge_id 				: charge.id,
															final_charge_amount 	: finalAmount,
															referrals_wants 	    : referralsWants,
															type 					: DEBIT,
															modified 				: getUtcDate(),
															created 				: getUtcDate(),
														}


														let redeemPointsAmountDetails	=	{};
														if(referralsWants == 'true'){
															redeemPointsAmountDetails.redeem_amount 				=	(getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0;
															redeemPointsAmountDetails.redeem_points 				=	(getReferralAmount && getReferralAmount.user_referrals_points)?getReferralAmount.user_referrals_points:0;
															redeemPointsAmountDetails.redeem_charge_per_point 		=	(getReferralAmount && getReferralAmount.admin_referrals_charge)?getReferralAmount.admin_referrals_charge:0;

															let updateFields	=  {
															    status      		: CREDITES,
															    modified            : getUtcDate()
															};
															let dataToBeUpdated     = {$set : updateFields};
															const user_referrals = db.collection("user_referrals");
															user_referrals.updateMany({'referral_user_by': ObjectId(playerResponse.result._id)},dataToBeUpdated,(rferralUpdateErr,rferralUpdateResult)=>{});
															
															const user_referral_logs = db.collection("user_referral_logs");
															user_referral_logs.insertOne({
																referral_user 	 		: null,
																referral_user_by 		: ObjectId(playerResponse.result._id), 
																redeem_credits_amount   : (getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0,
																redeem_credits   		: (getReferralAmount && getReferralAmount.user_referrals_points)?getReferralAmount.user_referrals_points:0,
																order_id 				: insertUpdateBookingId,
																status  				: CREDITES,
																type  					: DEBIT,
																modified 				: getUtcDate(),
																created 				: getUtcDate(),
															},(orderPaymentErr,orderPaymentResult)=>{});
														}
														orderPaymentPublic.redeem_points_amount_details	=	redeemPointsAmountDetails;
														order_payment.insertOne(orderPaymentPublic,async(orderPaymentErr,orderPaymentResult)=>{
															if(orderPaymentErr) return next(orderPaymentErr);
															
															const user_cards = db.collection('user_cards');
															let insertPublicOneData	=	{
																customer_id 			: playerResponse.result.customer_id,
																player_id 				: ObjectId(playerResponse.result._id),
																modified 				: getUtcDate(),
																created 				: getUtcDate(),
															}

															try{
																/*if(paymentCard != 'previous_card'){
																	if(playerResponse.result.customer_id){
						          										if(token){
															                const cardNew = await stripe.customers.createSource(
																			 	playerResponse.result.customer_id,
																			  	{source: token}
																			);
															            }
																	}
																}*/
																user_cards.insertOne(insertPublicOneData,async (userCardsErr,userCardsResult)=>{
																	if(userCardsErr) return next(userCardsErr);
												                	let zoomOption 					=	{}
												                	let orderAvailabilityValues		=	publicGameAvailabilityResult[0];
												                	
												                	orderAvailabilityValues.gameavailability 	=	{
												                		"start_time"	: 	publicGameAvailabilityResult[0].start_time,
												                		"end_time"		: 	publicGameAvailabilityResult[0].end_time
												                	}

																	zoomOption.game_name 			=	orderAvailabilityValues.game_name;
																	zoomOption.game_date 			=	orderAvailabilityValues.event_date;
																	zoomOption.gameavailability 	=	orderAvailabilityValues.gameavailability;
																	zoomOption.game_type 			=	orderAvailabilityValues.game_type;
																	zoomOption.game_category_name 	=	orderAvailabilityValues.game_category_name;
																	let arrangeMeeting 				= 	await createZoomMeeting(req,res,next,zoomOption);
																	if(arrangeMeeting.status == STATUS_SUCCESS){
																		const user_order_zoom_meeting = db.collection('user_order_zoom_meeting');
																		user_order_zoom_meeting.insertOne({
																			order_id 				: insertUpdateBookingId,
																			body 					: JSON.stringify(arrangeMeeting.result),
																			modified 				: getUtcDate(),
																			created 				: getUtcDate(),
																		},async(userZoomMeetErr,userZoomMeetResult)=>{
																			if(userZoomMeetErr) return next(userZoomMeetErr);
																			/** if action type approved **/
																		    resolve({
																		        status      : STATUS_SUCCESS,
																		        message     : res.__("Payment Successfully")
																		    });
																			/*let sendMailOptions	= {
																				event_type 		: BOOKING_CONFIRM_EMAIL_EVENTS,
																				user_id			: ObjectId(playerResponse.result._id),
																				host_id			: (publicGameAvailabilityResult[0].host_id)?ObjectId(publicGameAvailabilityResult[0].host_id):"",
																				booking_id		: result.insertedId,
																			};
																			sendMailToUsers(req,res,sendMailOptions);*/

																			let sendMailOptions	= {
																				event_type 		: PUBLIC_BOOKING_FIRST_EMAIL_EVENTS,
																				user_id			: ObjectId(playerResponse.result._id),
																				host_id			: (publicGameAvailabilityResult[0].host_id)?ObjectId(publicGameAvailabilityResult[0].host_id):"",
																				booking_id		: insertUpdateBookingId,
																			};
																			sendMailToUsers(req,res,sendMailOptions);


																			let publicGameAvaiblityVal 	=	await getPublicGameAvaiblity(req,res,next,{'_id':publicGameId});
																			if(publicGameAvaiblityVal && publicGameAvaiblityVal.min_game_done){
																				let sendMailOptions	= {
																					event_type 		: PUBLIC_BOOKING_SECOND_EMAIL_EVENTS,
																					game_name		: publicGameAvaiblityCount.public_game_name,
																					booking_id		: insertUpdateBookingId,
																					hostgame_result : (publicGameAvaiblityVal && publicGameAvaiblityVal.hostgame_result)?publicGameAvaiblityVal.hostgame_result:{},
																				};
																				sendMailToUsers(req,res,sendMailOptions);
																			}


																		});
																	}else{
																		return resolve({ status  : STATUS_SUCCESS,message:res.__("Payment Done but meeting not Generate")});
																	}
																});
															}catch(e){
																resolve({status	: STATUS_ERROR,message	: res.__(e.message)});
															}
														});
													});
												});
										});
									});
								});
							});
						}else{
							return resolve({status	: STATUS_ERROR,message	: res.__("Payment Failed")});
						}
					}catch(e) {
						resolve({status	: STATUS_ERROR,message	: res.__(e.message)});
					}	
				}catch(e) {
					resolve({status	: STATUS_ERROR,message	: res.__("Payment Failed Due to "+e.message)});
				}	
			}else{
				let orderId 				= 	(req.body && req.body.order_id)?req.body.order_id:'';
				let availabilityResult 		=  	[];

				if(orderId){
					availabilityResult 		=  	await customRequestDetails(req,res,next);
				}else{
					req.body.user_id		=	ObjectId(playerResponse.result._id);
					availabilityResult 		=  	await playerTempAvailabilityDetails(req,res,next);
					delete req.body.user_id; 
				}

				if(availabilityResult && availabilityResult.status != STATUS_SUCCESS) return resolve({status	: STATUS_ERROR,message: res.__("admin.system.invalid_access"),redirect:true});
				if(availabilityResult && availabilityResult.result.length <= 0) return resolve({status	: STATUS_ERROR,message: res.__("admin.system.invalid_access"),redirect:true});

				availabilityResult 	=	availabilityResult.result;
				let orderAvailabilityResultValues 	=	(availabilityResult && availabilityResult[0])	?	availabilityResult[0] 	:	{};

				let gameBookedDate = '';
				let startTime = '';
				let endTime = '';
				if(orderAvailabilityResultValues && orderAvailabilityResultValues.preferred_date){
			        gameBookedDate  =   orderAvailabilityResultValues.preferred_date;
			        startTime       =   orderAvailabilityResultValues.start_time;
			        endTime         =   orderAvailabilityResultValues.end_time;
			    }else{
			        gameBookedDate  = 	(orderAvailabilityResultValues.game_date)?orderAvailabilityResultValues.game_date:'';
					startTime 		= 	(orderAvailabilityResultValues && orderAvailabilityResultValues.gameavailability && orderAvailabilityResultValues.gameavailability[0] && orderAvailabilityResultValues.gameavailability[0].start_time)?orderAvailabilityResultValues.gameavailability[0].start_time:'';
					endTime  		= 	(orderAvailabilityResultValues && orderAvailabilityResultValues.gameavailability && orderAvailabilityResultValues.gameavailability[0] && orderAvailabilityResultValues.gameavailability[0].end_time)?orderAvailabilityResultValues.gameavailability[0].end_time:'';
			    }

			    let conditionValuesNew 	=	{ 
						"$or": [{"order_status": ORDER_STATUS_APPROVED}, {"order_status": ORDER_STATUS_PENDING}],
						'game_book_date' 	: gameBookedDate,
						'game_start_time' 	: startTime,
						'game_end_time' 	: endTime,
						//'player_id'		: {$in : [ObjectId(playerResponse.result._id)] }
				}
				
				let conArray 			=	[{"player_id": {$in : [ObjectId(playerResponse.result._id)]},"host_id":(orderAvailabilityResultValues.host_id)?ObjectId(orderAvailabilityResultValues.host_id):""}];
				conditionValuesNew.$or	=	conArray;

				getBookedGames(req,res,next,conditionValuesNew).then( async (bookingResponse)=>{

					if(bookingResponse && bookingResponse.result == true){
						if(!errors) errors =[];
				        errors.push({'param':'gameavailability','msg':res.__("player.game_alredy_booked_on_this_date")});
				        if(errors && errors.length > 0){
							return resolve({status :	STATUS_ERROR, message :	errors});
						} 
					}

					let getReferralAmount 	=   await getUserReferralAmount(req,res,next,{user_id:ObjectId(playerResponse.result._id)});
					let userReferralAmount 	= 	(getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0;
					let finalAmount 		=	(availabilityResult && availabilityResult[0])?availabilityResult[0].plan_amount:0;
					if(referralsWants == 'true'){
						if(userReferralAmount >= finalAmount){
							finalAmount		=	userReferralAmount-finalAmount;
						}else{
							finalAmount		=	finalAmount-userReferralAmount;
						}
					}

					let chargeData	=	{};
					chargeData.amount		= finalAmount*100;
					chargeData.currency		= CURRENCY;
					chargeData.description	= insertedNewBookingId; //'Charge Generate For '+availabilityResult.game_name+' '+availabilityResult.game_category_name;
					if(paymentCard != 'previous_card'){
						//chargeData.source		= token;
					}else{
						chargeData.customer		= playerResponse.result.customer_id;
						chargeData.card			= paymentMethod;
					}
					
					try{
						try{
							if(paymentCard != 'previous_card'){
								if(playerResponse.result.customer_id){
									if(token){
					                	const cardNew = await stripe.customers.createSource(
										 	playerResponse.result.customer_id,
										  	{source: token}
										);
										if(cardNew.id){
											chargeData.customer		= playerResponse.result.customer_id;
											chargeData.card			= cardNew.id;
											//chargeData.source		= cardNew.token;
										}
						            }
								}
							}

							const charge 	= await stripe.charges.create(chargeData);

							if(charge){
								

								let tempId   						= 	(availabilityResult && availabilityResult[0])   ? 	ObjectId(availabilityResult[0]._id) : 	"";
								delete orderAvailabilityResultValues._id;

								if(billingInformation){
									delete billingInformation.options; 
									delete billingInformation.user_slug; 
									if(paymentCard != 'previous_card'){
										delete billingInformation.token; 
									}
								}
								
								const user_referrals = db.collection('user_referrals');
								let updateData	={
									$set: {
										redeem_credits		: (res.locals.settings["Referral.points"])?parseInt(res.locals.settings["Referral.points"]):0,
										modified			: getUtcDate()
									}
								};
								/** Update user details **/

								user_referrals.updateOne({referral_user:ObjectId(playerResponse.result._id),redeem_credits:NOT_CREDITES},updateData,(updateErr,updateResult)=>{
									if(updateErr) return next(updateErr);				

									const user_referral_logs = db.collection('user_referral_logs');
									user_referral_logs.updateOne({referral_user:ObjectId(playerResponse.result._id),redeem_credits:NOT_CREDITES},updateData,(updateLogErr,updateLogResult)=>{

										/** Send success response **/
										//let hostCommission = ( res.locals.settings["Site.host_commission"] / 100) * availabilityResult[0].plan_amount;
										let hostCommission = res.locals.settings["Site.host_commission"];
										/** Send success response **/
										const order = db.collection('order');
										
										

										order.insertOne({
											order_book 		: orderAvailabilityResultValues,
											game_book_date  : gameBookedDate,
											game_start_time : startTime,
											game_end_time   : endTime,
											player_id 		: [ObjectId(playerResponse.result._id)],
											host_id 		: (orderAvailabilityResultValues.host_id)?ObjectId(orderAvailabilityResultValues.host_id):"",
											charge_id 		: charge.id,
											order_response 	: JSON.stringify(charge),
											billing_info 	: billingInformation,
											host_commission : hostCommission,
											game_type 		: availabilityResult[0].game_type,
											game_id 		: availabilityResult[0].game_id,
											order_status 		: ORDER_STATUS_APPROVED,
											host_payment_relige : PLAYMENT_NOT_RELIGE,
											booking_id 			: insertedNewBookingId,
											modified 			: getUtcDate(),
											created 			: getUtcDate(),
										},(err,result)=>{
											if(err) return next(err);


											const order_payment = db.collection('order_payment');
											let orderPayment 	=	{
												order_id 				: ObjectId(result.insertedId),
												player_id 				: ObjectId(playerResponse.result._id),
												host_id 				: (orderAvailabilityResultValues.host_id)?ObjectId(orderAvailabilityResultValues.host_id):"",
												charge_id 				: charge.id,
												final_charge_amount 	: finalAmount,
												referrals_wants 	    : referralsWants,
												type 					: DEBIT,
												modified 				: getUtcDate(),
												created 				: getUtcDate(),
											}

											let redeemPointsAmountDetails	=	{};
											if(referralsWants == 'true'){
												redeemPointsAmountDetails.redeem_amount 				=	(getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0;
												redeemPointsAmountDetails.redeem_points 				=	(getReferralAmount && getReferralAmount.user_referrals_points)?getReferralAmount.user_referrals_points:0;
												redeemPointsAmountDetails.redeem_charge_per_point 		=	(getReferralAmount && getReferralAmount.admin_referrals_charge)?getReferralAmount.admin_referrals_charge:0;

												let updateFields	=  {
												    status      		: CREDITES,
												    modified            : getUtcDate()
												};
												let dataToBeUpdated     = {$set : updateFields};
												const user_referrals = db.collection("user_referrals");
												user_referrals.updateMany({'referral_user_by': ObjectId(playerResponse.result._id)},dataToBeUpdated,(rferralUpdateErr,rferralUpdateResult)=>{});


												const user_referral_logs = db.collection("user_referral_logs");
												user_referral_logs.insertOne({
													referral_user 			: null,
													referral_user_by 		: ObjectId(playerResponse.result._id), 
													redeem_credits_amount   : (getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0,
													redeem_credits   		: (getReferralAmount && getReferralAmount.user_referrals_points)?getReferralAmount.user_referrals_points:0,
													status  				: CREDITES,
													type  					: DEBIT,
													order_id 				: ObjectId(result.insertedId),
													modified 				: getUtcDate(),
													created 				: getUtcDate(),
												},(orderPaymentErr,orderPaymentResult)=>{});

											}
											orderPayment.redeem_points_amount_details	=	redeemPointsAmountDetails;
											order_payment.insertOne(orderPayment,async(orderPaymentErr,orderPaymentResult)=>{
												if(orderPaymentErr) return next(orderPaymentErr);
												try{
													const user_cards = db.collection('user_cards');
													let insertOneData	=	{
														customer_id 			: playerResponse.result.customer_id,
														player_id 				: ObjectId(playerResponse.result._id),
														modified 				: getUtcDate(),
														created 				: getUtcDate(),
													}

													if(paymentCard != 'previous_card'){
														insertOneData.stripe_token 	=	token;
													}
													user_cards.insertOne(insertOneData,(userCardsErr,userCardsResult)=>{
														
														if(userCardsErr) return next(userCardsErr);
														if(orderId){
															const modelPath         =   WEBSITE_MODULES_PATH+"api/views/player";
												            const fileFunctions     =   require(modelPath);

												            req.body.id 			=	orderId;
												            req.body.action 		=	USER_STATUS_APPROVED;
												            fileFunctions['updatePlayerActionStatus'](req,res,next).then(async (updatePlayerActionResponse) => {
												                if(updatePlayerActionResponse && updatePlayerActionResponse.status == STATUS_SUCCESS){

												                	let zoomOption 					=	{}
																	zoomOption.game_name 			=	orderAvailabilityResultValues.game_name;
																	zoomOption.game_date 			=	orderAvailabilityResultValues.game_date;
																	zoomOption.gameavailability 	=	orderAvailabilityResultValues.gameavailability;
																	zoomOption.game_type 			=	orderAvailabilityResultValues.game_type;
																	zoomOption.game_category_name 	=	orderAvailabilityResultValues.game_category_name;
																	let arrangeMeeting 				= 	await createZoomMeeting(req,res,next,zoomOption);
																	if(arrangeMeeting.status == STATUS_SUCCESS){
																		const user_order_zoom_meeting = db.collection('user_order_zoom_meeting');
																		user_order_zoom_meeting.insertOne({
																			order_id 				: result.insertedId,
																			body 					: JSON.stringify(arrangeMeeting.result),
																			modified 				: getUtcDate(),
																			created 				: getUtcDate(),
																		},(userZoomMeetErr,userZoomMeetResult)=>{
																			if(userZoomMeetErr) return next(userZoomMeetErr);
																			/** if action type approved **/
																			resolve({
																		        status      : STATUS_SUCCESS,
																		        message     : res.__("Payment Successfully")
																		    });

																			let sendMailOptions	= {
																				event_type 		: BOOKING_CONFIRM_EMAIL_EVENTS,
																				user_id			: ObjectId(playerResponse.result._id),
																				host_id			: (orderAvailabilityResultValues.host_id)?ObjectId(orderAvailabilityResultValues.host_id):"",
																				booking_id		: result.insertedId,
																			};
																			sendMailToUsers(req,res,sendMailOptions);
																		});
																	}else{
																		return resolve({ status  : STATUS_SUCCESS,message:res.__("Payment Done but meeting not Generate")});
																	}
												            	}
												            }).catch(next);
														}else{
															// Private Game Direct //
															let updateFields	=  {
															    payment_status      : INVITATION_PAYMENT_APPROVED,
															    order_id			: ObjectId(result.insertedId),
															    modified            : getUtcDate()
															};
															let dataToBeUpdated     = {$set : updateFields};
															const player_invitation = db.collection("player_invitation");
															player_invitation.updateMany({
																'user_id'					: ObjectId(playerResponse.result._id),
																'gameavailability'			: { $elemMatch: { start_time: { $eq: availabilityResult[0].gameavailability[0].start_time }, end_time: { $eq: availabilityResult[0].gameavailability[0].end_time } } }, 
																'game_date'					: availabilityResult[0].game_date,
																'order_id'  				: { $exists: false}
															},dataToBeUpdated,(err,updateResult)=>{
																if(err) return next(err);

																const player_temp_availability = db.collection('player_temp_availability');
																player_temp_availability.deleteOne({_id:ObjectId(tempId)}, async (deletedErr,deletedResult) => {
																	if(deletedErr) return next(deletedErr);

																	let zoomOption 					=	{}
																	zoomOption.game_name 			=	orderAvailabilityResultValues.game_name;
																	zoomOption.game_date 			=	orderAvailabilityResultValues.game_date;
																	zoomOption.gameavailability 	=	orderAvailabilityResultValues.gameavailability;
																	zoomOption.game_type 			=	orderAvailabilityResultValues.game_type;
																	zoomOption.game_category_name 	=	orderAvailabilityResultValues.game_category_name;
																	let arrangeMeeting 				= 	await createZoomMeeting(req,res,next,zoomOption);

																	if(arrangeMeeting.status == STATUS_SUCCESS){
																		const user_order_zoom_meeting = db.collection('user_order_zoom_meeting');
																		user_order_zoom_meeting.insertOne({
																			order_id 				: result.insertedId,
																			body 					: JSON.stringify(arrangeMeeting.result),
																			modified 				: getUtcDate(),
																			created 				: getUtcDate(),
																		},(userZoomMeetErr,userZoomMeetResult)=>{
																			if(userZoomMeetErr) return next(userZoomMeetErr);
																			/** if action type approved **/

																			let insertEmailContent	 	 		= 	[];
																			let insertExistUserEmailContent	 	= 	[];
																			const player_invitation = db.collection('player_invitation');
																			player_invitation.find({
																				order_id:ObjectId(result.insertedId),
																			}).toArray((invitationResultErr,invitationResult)=>{
																				if(invitationResultErr) return next(invitationResultErr);
																				const users = db.collection('users');
																				asyncEach(invitationResult,(values, asyncCallback)=>{
																					users.findOne({email:(values.email)?values.email:""},(err, result)=>{
																						if(err) return next(err);
																						/** Send error response */
																						if(result){
																							insertExistUserEmailContent.push({
																								'email'		:	(result.email)?result.email:'',
																								'fullname'	:	(result.full_name)?result.full_name:'',
																								'id'		:	(result._id)?result._id:'',
																							});
																						}else{
																							insertEmailContent.push({
																								'email'		:	(values.email)?values.email:'',
																								'fullname'	:	(values.full_name)?values.full_name:''
																							});
																						}
																						asyncCallback(null);
																					});
																				},(asyncErr,asyncContent)=>{
																					/** Send success response **/

																					resolve({ status  : STATUS_SUCCESS,message:res.__("Payment Successfully")});

																					let sendMailOptions	= {
																						event_type 		: BOOKING_CONFIRM_EMAIL_EVENTS,
																						user_id			: ObjectId(playerResponse.result._id),
																						host_id			: (orderAvailabilityResultValues.host_id)?ObjectId(orderAvailabilityResultValues.host_id):"",
																						booking_id		: result.insertedId,
																					};
																					sendMailToUsers(req,res,sendMailOptions);

																					if(insertEmailContent && insertEmailContent.length > 0){
																						let sendMailOptions	= {
																							event_type 		: USER_INVITATION_EMAIL_EVENTS,
																							user_data 		: insertEmailContent,
																							booking_id		: result.insertedId,
																						};
																						sendMailToUsers(req,res,sendMailOptions);
																					}

																					if(insertExistUserEmailContent && insertExistUserEmailContent.length > 0){
																						let sendMailOptionsData	= {
																							event_type 		: USER_INVITATION_EVENTS,
																							user_data 		: insertExistUserEmailContent,
																							booking_id		: result.insertedId,
																						};
																						sendMailToUsers(req,res,sendMailOptionsData);
																					}
																					
																				});

																			});

																		});
																	}else{
																		return resolve({ status  : STATUS_SUCCESS,message:res.__("Payment Done but meeting not Generate")});
																	}
																});
															});
														}
													});
												}catch(e){
													resolve({status	: STATUS_ERROR,message	: res.__(e.message)});
												}
											});
										});
									});
								});
							}else{
								resolve({status	: STATUS_ERROR,message	: res.__("Payment Failed")});
							}
						}catch(e) {
							resolve({status	: STATUS_ERROR,message	: res.__("Payment Failed Due to "+e.message)});
						}
					}catch(e) {
						resolve({status	: STATUS_ERROR,message	: res.__("Payment Failed Due to "+e.message)});
					}	
				});
			}
		});
	};

	/**
	 * Function to host Stripe Connect
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.hostStripeConnect = (req,res,next)=>{
		return new Promise(async resolve=>{
			try{
				let userSlug = (req.body.user_slug) ? req.body.user_slug : "";

				/** Set options for get player details **/
				let optionsForPlayer = {
					conditions			: 	{ 
										     	user_role_id: FRONT_USER_ROLE_ID,
										     	active 		: ACTIVE,
										     	is_deleted 	: NOT_DELETED,
										     	is_verified	: VERIFIED,
										    },
					fields	:	{
						_id :1,full_name:1,stripe_account_id:1
					}
				};
				/**Condition for player Slug*/
				optionsForPlayer.conditions.slug		= userSlug;
				optionsForPlayer.conditions.user_type	= USER_TYPE_HOST;
				/** Get player details **/
				let hostResponse =  await getUserData(req,res,next,optionsForPlayer);

				if(hostResponse.status != STATUS_SUCCESS) return next(hostResponse.message);						

				if(!hostResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				
				if(hostResponse.result.stripe_account_id){

					const accountLinks = await stripe.accountLinks.create({
					  account 		: hostResponse.result.stripe_account_id,
					  refresh_url	: FRONT_WEBSITE_URL+'account_setting',
					  return_url	: FRONT_WEBSITE_URL+'dashboard',
					  type 			: 'account_onboarding',
					});
					
					if(accountLinks){
						return resolve({status	: STATUS_SUCCESS,result	: accountLinks,message	: ''});
					}else{
						return resolve({status	: STATUS_ERROR,result	: {},message: res.__("admin.system.invalid_access")});
					}
				}
			}catch(e){
				return resolve({status	: STATUS_ERROR,result	: {},message: e.message});
			}
			
		});
	};// End hostStripeConnect().

	/**
	 * Function to host Stripe Connect
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.hostStripeConnectCheck = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";

			/** Set options for get player details **/
			let optionsForPlayer = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1,stripe_account_id:1
				}
			};
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug		= userSlug;
			optionsForPlayer.conditions.user_type	= USER_TYPE_HOST;
			/** Get player details **/
			let hostResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(hostResponse.status != STATUS_SUCCESS) return next(hostResponse.message);						

			if(!hostResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			try{
				if(hostResponse.result.stripe_account_id){
					const account = await stripe.accounts.retrieve( hostResponse.result.stripe_account_id);
					if(account){
						//console.log(account,"accountaccountaccount");
						let stripeConnect	=	(Object.keys(account.capabilities).length > 0 ) ? false  : true;
						return resolve({status	: STATUS_SUCCESS,stripe_connect	: stripeConnect,message	: ''});
					}else{
						return resolve({status	: STATUS_ERROR,message: res.__("admin.system.invalid_access")});
					}
				}else{
					const account = await stripe.accounts.create({
					  type: STRIPE_ACCOUNT_TYPE,
					});
					const users = db.collection('users');
					let updateData	={
						$set: {
							stripe_account_id	: (account && account.id)	?	account.id 	:	"",
							modified			: getUtcDate()
						}
					};
					users.updateOne({_id:hostResponse.result._id},updateData,(updateErr,updateResult)=>{
						if(updateErr) return next(updateErr);
						/** Send success response **/
						return resolve({status	: STATUS_SUCCESS,stripe_connect	: true,message	: ''});
					});
				}
			}catch(e){
				
				try {
					const account = await stripe.accounts.create({
					  type: STRIPE_ACCOUNT_TYPE,
					});
					const users = db.collection('users');
					let updateData	={
						$set: {
							stripe_account_id	: (account && account.id)	?	account.id 	:	"",
							modified			: getUtcDate()
						}
					};
					users.updateOne({_id:hostResponse.result._id},updateData,(updateErr,updateResult)=>{
						if(updateErr) return next(updateErr);
						/** Send success response **/
						return resolve({status	: STATUS_SUCCESS,stripe_connect	: true,message	: ''});
					});
				}catch(e) {
				    return resolve({status	: STATUS_ERROR,message: e.message})
				}
			}
			
		});
	};// End hostStripeConnectCheck().



	/**
	 * Function to custom Package Booking Payment
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.customPackageBooking = (req,res,next)=>{
		let isEditable	= (req.params.id) ?	true :false;
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			req.body 		= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			
			let ownHost 	=	(req.body && req.body.ownhost)?req.body.ownhost:'';
			let from 		=	(req.body && req.body.from)?req.body.from:'';
			let gameAvailabilitySlot 	=	(req.body && req.body.gameavailability)?req.body.gameavailability:'';
			
			let requestId	=	(req.params.id) 	? 	ObjectId(req.params.id)	:ObjectId();

			/** Check validation **/
			req.checkBody({
                "game_name": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_select_game_name")
                },
                "ownhost": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_select_ownhost")
                },
                "party_size": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_enter_party_size")
                },
               /* "special_event": {
                    notEmpty: true,
                    isLength:{
                        options: {
                        	min    : SPECIAL_EVENT_MIN_LENGTH,
                    		max    : SPECIAL_EVENT_MAX_LENGTH,
                        },
                        errorMessage: res.__("admin.user.please_enter_special_event_min",SPECIAL_EVENT_MIN_LENGTH,SPECIAL_EVENT_MAX_LENGTH)
                    },
                    errorMessage: res.__("admin.user.please_enter_special_event")
                },*/
                "preferred_date": {
                    notEmpty: true,
                    errorMessage: res.__("admin.user.please_enter_preferred_date")
                }
			});


			if(ownHost && ownHost == "yes"){
				req.checkBody({
	                "host_id": {
	                    notEmpty: true,
	                    errorMessage: res.__("admin.user.please_select_host")
	                },
	                "gameavailability": {
	                    notEmpty: true,
	                    errorMessage: res.__("admin.user.please_select_gameavailability")
	                },
				});
			}
			if(isEditable){
				req.checkBody({
					'amount': {
						notEmpty: true,
						errorMessage: res.__("admin.pricing_packages.please_enter_valid_amount"),
						isFloat: {
							errorMessage: res.__("admin.pricing_packages.please_enter_valid_amount")
						}
					}
				});
			}
			

			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);

			/** Send error response **/
			if(errors) return resolve({status : STATUS_ERROR, message : errors});


			let playerResponse  = 	{};
			if(!isEditable){
				let userSlug 	=	(req.body && req.body.user_slug)?req.body.user_slug:'';

				/** Set options for get player details **/
				let optionsForPlayer = {
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
				/**Condition for player Slug*/
				optionsForPlayer.conditions.user_type	= USER_TYPE_PLAYER;
				optionsForPlayer.conditions.slug		= userSlug;

				/** Get player details **/
				playerResponse =  await getUserData(req,res,next,optionsForPlayer);

				if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

				if(!playerResponse.result) return resolve({status : STATUS_ERROR,message: res.__("admin.system.invalid_access")});
			}
			let preferredDate = (req.body && req.body.preferred_date)?newDate(req.body.preferred_date,DATABASE_DATE_FORMAT):'';
			if(from){
				preferredDate = (req.body && req.body.preferred_date)?req.body.preferred_date:'';
			}
			gameAvailabilitySlot = 	gameAvailabilitySlot.split("_");
			let insertValues 	 =	{
				game_id 		: (req.body && req.body.game_name)?ObjectId(req.body.game_name):'',
				ownhost 		: (req.body && req.body.game_name)?req.body.ownhost:'',
				party_size 		: (req.body && req.body.party_size)?req.body.party_size:'',
				special_event 	: (req.body && req.body.special_event)?req.body.special_event:'',
				preferred_date 	: preferredDate,
				private_game_availability_id : (gameAvailabilitySlot && gameAvailabilitySlot[1]) ? ObjectId(gameAvailabilitySlot[1]):'',
				start_time 		: (gameAvailabilitySlot && gameAvailabilitySlot[2]) ? gameAvailabilitySlot[2]	:'',
				end_time 		: (gameAvailabilitySlot && gameAvailabilitySlot[3]) ? gameAvailabilitySlot[3]	:'',
				modified 		: getUtcDate(),
				approval_status : (isEditable)?CUSTOM_PLAN_STATUS_QUEUE:CUSTOM_PLAN_STATUS_PENDING,
			};


			let conditionValuesNewPublic 	=	{ 
				"$or" 				: [{"order_status": ORDER_STATUS_APPROVED}, {"order_status": ORDER_STATUS_PENDING}],
				'game_book_date' 	: preferredDate,
				'game_start_time' 	: (gameAvailabilitySlot && gameAvailabilitySlot[2]) ? parseInt(gameAvailabilitySlot[2])	:'',
				'game_end_time' 	: (gameAvailabilitySlot && gameAvailabilitySlot[3]) ? parseInt(gameAvailabilitySlot[3])	:'',
				'player_id'			: {$in : [(!isEditable && playerResponse && playerResponse.result && playerResponse.result._id)?ObjectId(playerResponse.result._id):''] }
			}
										
			let bookedGameCheck  =	await getBookedGames(req,res,next,conditionValuesNewPublic);
			if(bookedGameCheck && bookedGameCheck.result == true){
				let message = res.__("player.game_alredy_booked_on_this_date");
				return resolve({
					status		:	STATUS_ERROR,
					message		:	message,
					type		:	true,
				});	
			}
				
			
			if(ownHost && ownHost == "yes"){
				insertValues.host_id 	=	(req.body && req.body.host_id)?ObjectId(req.body.host_id):'';
			}

			if(isEditable){
				insertValues.amount 	=	(req.body && req.body.amount)?req.body.amount:0;
			}
			
			const custom_package_booking = db.collection('custom_package_booking');

			custom_package_booking.updateOne({_id : requestId},{
				$set		: insertValues,
				$setOnInsert: {
					player_id 		:   (!isEditable && playerResponse && playerResponse.result && playerResponse.result._id)?ObjectId(playerResponse.result._id):'',
					created 		: 	getUtcDate(),
				}
			},{upsert: true},(err) => {
				if(err) return next(err);

				/** Send success response **/
				let message = (isEditable) ? res.__("front.custom_package_booking_updated_successfully") :res.__("front.custom_package_booking_created_successfully");
				return resolve({
					status		:	STATUS_SUCCESS,
					message		:	message,
				});	
			});
		});
	};


	/**
	 * Function to get Player Booking Game's Listing  detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getPlayerBookings = (req,res,next)=>{
		return new Promise(async resolve=>{

			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";

			let gameName = (req.body.selected_game) ? ObjectId(req.body.selected_game) : "";
			let gameType = (req.body.game_type) ? req.body.game_type : "";
			let gameDate = (req.body.game_date) ? req.body.game_date : "";

			/** Set options for get player details **/
			let optionsForPlayer = {
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


			
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			//let conditions 		= 	{order_status: { $ne: ORDER_STATUS_REJECTED }};
			let conditions 			= 	{};
			conditions.player_id 	=	{ $in: playerResponse.result._id ? [ObjectId(playerResponse.result._id)]:[]};

			if(gameName != '') 	conditions.game_id 		=	gameName;
			if(gameType != '') 	conditions.game_type 	=	gameType;

			let newConditions 	= 	{ };
			if(gameDate){
				newConditions 	= 	{ 
					$or: [
				        { 	"order_book.game_date" : gameDate },
				        { 	"order_book.preferred_date" : gameDate } ,
				        { 	"order_book.event_date" : gameDate } ,
				    ]
				};
			}
			
			const order 	= db.collection('order');
			let limit 		= (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;

			asyncParallel([
                (callback)=>{
                    /** Get list of users's **/
                    order.aggregate([
						{$match : conditions},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"host_id",
							foreignField: 	"_id",
							as 			: 	"hostData"
						}},
						{$lookup: {
							from 		: 	"games",
							localField	: 	"game_id",
							foreignField: 	"_id",
							as 			: 	"game_category_data"
						}},
						{$lookup: {
							from 		: 	"masters",
							localField	: 	"game_category_data.games_name",
							foreignField: 	"_id",
							as 			: 	"game_data"
						}},
						{$lookup:{
						  from: "public_player_invitation",
						  let: { orderid: "$_id"},
						  pipeline: [
						    {$match: {
						      $expr: {
						        $and: [
						            { $eq: ["$player_id", ObjectId(playerResponse.result._id)] },
						            { $eq: ["$order_id", '$$orderid'] },
						        ],
						      },
						    }},
						  ],
						  as: "public_player_invitation_details",
						}},
						{$lookup:{
						  from: "user_review_ratings",
						  let: { orderid: "$_id"},
						  pipeline: [
						    {$match: {
						      $expr: {
						        $and: [
						            { $eq: ["$booking_id", '$$orderid'] },
						            { $eq: ["$user_id", ObjectId(playerResponse.result._id)] },
						        ],
						      },
						    }},
						  ],
						  as: "userReviewRatingDoneStatus",
						}},
						{$project : {
							_id:1,order_book:1,player_id:1,host_id:1,billing_info:1,
							host_commission:1,modified:1,booking_id:1,game_type:1,order_status:1,
							host_name:{"$arrayElemAt":["$hostData.full_name",0]},
							profile_picture:{"$arrayElemAt":["$hostData.profile_picture",0]},
							host_time_zone_val:{"$arrayElemAt":["$hostData.time_zone_val",0]},
							game_name:{"$arrayElemAt":["$game_data.name",0]},
							game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
							public_player_invitation_details:{"$arrayElemAt":["$public_player_invitation_details",0]},
							userReviewRatingDoneStatus:{"$arrayElemAt":["$userReviewRatingDoneStatus",0]},
						}},
						{$match : newConditions},
						{$sort: {_id : SORT_DESC}},
						{$limit: limit },
					]).toArray((err, result)=>{
						if(err) return next(err);
						/** Set options for append image **/
						let imageOptions = {
							"file_url" 			: USERS_URL,
							"file_path" 		: USERS_FILE_PATH,
							"result" 			: result,
							"database_field" 	: "profile_picture"
						};

						/** Append image with full path **/
						appendFileExistData(imageOptions).then(fileResponse=>{
							/** Send success response **/
							callback(err, (fileResponse && fileResponse.result)	?	fileResponse.result	:{});
						}).catch(next);
                    });
                },
                (callback)=>{
                    /** Get total number of records in faqs collection **/
                   /* order.countDocuments(conditions,(err,countResult)=>{
                        callback(err, countResult);
                    });*/
                    order.aggregate([
						{$match : conditions},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"player_id",
							foreignField: 	"_id",
							as 			: 	"playerData"
						}},
						{$project : {
							__id:1,order_book:1,player_id:1,host_id:1,billing_info:1,
							host_commission:1,modified:1,booking_id:1,game_type:1,order_status:1,
							player_name:{"$arrayElemAt":["$playerData.full_name",0]},
							profile_picture:{"$arrayElemAt":["$playerData.profile_picture",0]},
						}},
						{$match : newConditions},
					]).toArray((err, countResult)=>{
						if(err) return next(err);
                        callback(err, countResult.length);
                    });
                }
            ], (err,response)=>{
                /** Send response **/
                if(err) return next(err);
				if(!response) return resolve({status : STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				let results =	(response[0]) ? response[0] 	: [];
				asyncEach(results,(orderResult, asyncCallback)=>{
					let gameBookedDate  =   '';
					let startTime       =   '';
					let endTime         =   '';
					if(orderResult){
						if(orderResult && orderResult.order_book){
						    if(orderResult.order_book.game_type == PUBLIC){
						        gameBookedDate  =   orderResult.order_book.event_date;
						        startTime       =   orderResult.order_book.start_time;
						        endTime         =   orderResult.order_book.end_time;
						    }else{
						        if(orderResult.order_book.preferred_date){
						            gameBookedDate  =   orderResult.order_book.preferred_date;
						            startTime       =   orderResult.order_book.start_time;
						            endTime         =   orderResult.order_book.end_time;
						        }else{
						            gameBookedDate  =   orderResult.order_book.game_date;
						            if(orderResult.order_book.gameavailability && orderResult.order_book.gameavailability.length > 0){
						                startTime       =   orderResult.order_book.gameavailability[0].start_time;
						                endTime         =   orderResult.order_book.gameavailability[0].end_time;
						            }
						        }
						    }
						}
					}
					orderResult.game_booked_date	=	gameBookedDate;
					orderResult.game_start_time	=	startTime;
					orderResult.game_end_time	=	endTime;
					
					asyncCallback(null);
				},(asyncErr,asyncContent)=>{
					resolve({ 
						status  		: STATUS_SUCCESS,
						result 			: results,
						recordsTotal    : (response[1]) ? response[1] 	: 0,
					});		
				});
            });
		}); 
	};// End getPlayerBookings().

	/**
	 * Function to get Player Custom XL Game's Booking Listing  detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	*/
	this.getPlayerCustomXLBooking = (req,res,next)=>{

		return new Promise(async resolve=>{
			let conditions = {"approval_status":CUSTOM_PLAN_STATUS_QUEUE};
			const custom_package_booking = db.collection('custom_package_booking');
			let limit 	= (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			asyncParallel([
                (callback)=>{
                    /** Get list of users's **/
                    custom_package_booking.aggregate([
						{$match : conditions},
						{$limit: limit },
						{$lookup: {
							from 		: 	"users",
							localField	: 	"host_id",
							foreignField: 	"_id",
							as 			: 	"hostData"
						}},
						{$lookup: {
							from 		: 	"games",
							localField	: 	"game_id",
							foreignField: 	"_id",
							as 			: 	"game_category_data"
						}},
						{$lookup: {
							from 		: 	"masters",
							localField	: 	"game_category_data.games_name",
							foreignField: 	"_id",
							as 			: 	"game_data"
						}},
						{$project : {
							_id:1,approval_status:1,end_time:1,game_id:1,host_id:1,ownhost:1,start_time:1,amount:1,
							party_size:1,player_id:1,preferred_date:1,private_game_availability_id:1,special_event:1,
							game_type:{"$arrayElemAt":["$game_category_data.game_type",0]},
							game_name:{"$arrayElemAt":["$game_data.name",0]},
							game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
							host_name:{"$arrayElemAt":["$hostData.full_name",0]},
							profile_picture:{"$arrayElemAt":["$hostData.profile_picture",0]},
						}}
					]).toArray((err, result)=>{
						if(err) return next(err);
						/** Set options for append image **/
						let imageOptions = {
							"file_url" 			: USERS_URL,
							"file_path" 		: USERS_FILE_PATH,
							"result" 			: result,
							"database_field" 	: "profile_picture"
						};

						/** Append image with full path **/
						appendFileExistData(imageOptions).then(fileResponse=>{
							/** Send success response **/
							callback(err, (fileResponse && fileResponse.result)	?	fileResponse.result	:{});
						}).catch(next);
                    });
                },
                (callback)=>{
                    /** Get total number of records in faqs collection **/
                    custom_package_booking.countDocuments(conditions,(err,countResult)=>{
                        callback(err, countResult);
                    });
                }
            ], (err,response)=>{
                /** Send response **/
                if(err) return next(err);
				if(!response) return resolve({status : STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			    resolve({ 
					status  		: STATUS_SUCCESS,
					result 			: (response[0]) ? response[0] 	: [],
					recordsTotal    : (response[1]) ? response[1] 	: 0,
				});				
            });
		}); 
	};// End getPlayerCustomXLBooking().


	/**
     * Function for update Player Action detail status
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.updatePlayerActionStatus = async (req,res,next)=>{
    	return new Promise(async resolve=>{
	        let bookingId   = (req.body.id)    	? req.body.id  		: "";
	        let action      = (req.body.action) ? req.body.action 	: "";
	        let userSlug    = (req.body.slug)   ? req.body.slug 	: "";
	        
	        let reqStatus 	= (action == USER_STATUS_REJECTED) ? USER_STATUS_REJECTED:USER_STATUS_APPROVED;
	        /**set fields to approve driver details **/
	        let updateFields	=  {
	            approval_status     : reqStatus,
	            modified            : getUtcDate()
	        };

	        let dataToBeUpdated          = {$set : updateFields};
	        const custom_package_booking = db.collection("custom_package_booking");

	        
	        custom_package_booking.updateOne({_id:ObjectId(bookingId),},dataToBeUpdated,(err,updateResult)=>{
	        	if(err) return next(err);
	            /** if action type approved **/
	            if(action == USER_STATUS_REJECTED){
				    /** Send success response **/
				    resolve({
				        status      : STATUS_SUCCESS,
						message		: res.__("admin.admin.custom_booking_request_has_been_rejected"),
				    });
				}else{
					resolve({
				        status      : STATUS_SUCCESS,
				    });
				}
	        });
	    });
    };//End updatePlayerActionStatus()

    /**
     * Function for update Player Invitation Action detail status
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.updatePlayerInvitationActionStatus = async (req,res,next)=>{
    	return new Promise(async resolve=>{
	        let invitationId   	= (req.body.id)    	? req.body.id  		: "";
	        let action      	= (req.body.action) ? req.body.action 	: "";
	        let userEmail    	= (req.body.email)  ? req.body.email 	: "";
	       
	        let reqStatus 		= (action == INVITATION_STATUS_REJECTED) ? INVITATION_STATUS_REJECTED:INVITATION_STATUS_APPROVED;
	        /**set fields to approve  details **/
	        let updateFields	=  {
	            approval_status     : reqStatus,
	            modified            : getUtcDate()
	        };

	        let dataToBeUpdated          = {$set : updateFields};
	        const player_invitation = db.collection("player_invitation");

	        player_invitation.findOneAndUpdate({_id:ObjectId(invitationId),email:userEmail},dataToBeUpdated,(err,updateResult)=>{
	        	if(err) return next(err);
	        	let notiType 	=	NOTIFICATION_PLAYER_ACCEPT_INVITE
	            /** if action type approved **/
	            if(action == USER_STATUS_REJECTED){
				    /** Send success response **/
				    resolve({
				        status      : STATUS_SUCCESS,
						message		: res.__("admin.admin.custom_booking_request_has_been_rejected"),
				    });
				}else{
					notiType 	=	NOTIFICATION_PLAYER_REJECT_INVITE
					resolve({
				        status      : STATUS_SUCCESS,
				    });
				}
				if(updateResult && updateResult.value && updateResult.value.fullname && updateResult.value.order_id && updateResult.value.user_id){
					let notificationMessageParams = [updateResult.value.fullname,updateResult.value.order_id];
					let notificationOptions = {
						notification_data : {
							notification_type : notiType,
							message_params : notificationMessageParams,
							parent_table_id : updateResult.value.user_id,
							user_id : updateResult.value.user_id,
							user_role_id : FRONT_USER_ROLE_ID,
							user_ids : [updateResult.value.user_id],
							role_id : SUPER_ADMIN_ROLE_ID,
							extra_parameters : {
								user_id 	: updateResult.value.user_id
							}
						}
					};
					insertNotifications(req,res,notificationOptions).then(notificationResponse=>{});
				}
				

	        });
	    });
    };//End updatePlayerInvitationActionStatus()


    /**
	 * Function to check Out Custom XL Request detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.checkOutCustomRequestDetails = (req,res,next)=>{
		return new Promise(async resolve=>{

			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let orderId  = (req.body.order_id)  ? req.body.order_id : "";

			if(orderId && !objectID.isValid(orderId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			

			/*	
			const custom_package_booking = db.collection('custom_package_booking');
			custom_package_booking.aggregate([
				{$match : {_id : ObjectId(orderId),player_id : ObjectId(playerResponse.result._id),approval_status:CUSTOM_PLAN_STATUS_QUEUE}},
				{$lookup: {
					from 		: 	"games",
					localField	: 	"game_id",
					foreignField: 	"_id",
					as 			: 	"game_category_data"
				}},
				{$lookup: {
					from 		: 	"masters",
					localField	: 	"game_category_data.games_name",
					foreignField: 	"_id",
					as 			: 	"game_data"
				}},
				{$lookup: {
					from 		: 	"pricing_packages",
					localField	: 	"plan_id",
					foreignField: 	"_id",
					as 			: 	"plan_data"
				}},
				{$project : {
					__id:1,name:1,party_size:1,amount:1,party_size:1,preferred_date:1,
					start_time:1,end_time:1,approval_status:1,
					game_name:{"$arrayElemAt":["$game_data.name",0]},
					game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
				}},
			]).toArray((availabilityErr, availabilityResult)=>{
				if(availabilityErr) return next(availabilityErr);
				if(!availabilityResult) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				if(availabilityResult && availabilityResult.length > 0){
					availabilityResult[0].plan_title 				=	"Custom";
					availabilityResult[0].plan_days  				=	"-";
					availabilityResult[0].plan_no_of_contestants   	=	availabilityResult[0].party_size;
					availabilityResult[0].game_type  				=	GAMES_TYPE[PRIVATE].status_name;
					availabilityResult[0].plan_amount  				=	availabilityResult[0].amount;
				}
			    resolve({ status  : STATUS_SUCCESS,result  : (availabilityResult)?availabilityResult[0]:{}});
			});*/

			let reqResponse =  await customRequestDetails(req,res,next);
			if(!reqResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			if(reqResponse && reqResponse.result && reqResponse.result[0]){
				reqResponse.result[0].event_date 	=	reqResponse.result[0].preferred_date;
			}
			
			let getReferralAmount =  await getUserReferralAmount(req,res,next,{user_id:ObjectId(playerResponse.result._id)});
			resolve({ 
				status  		: reqResponse.status,
				result  		: (reqResponse.result)?reqResponse.result[0]:{},
				user_referrals_points  	: (getReferralAmount && getReferralAmount.user_referrals_points)?getReferralAmount.user_referrals_points:0,
				admin_referrals_charge  : (getReferralAmount && getReferralAmount.admin_referrals_charge)?getReferralAmount.admin_referrals_charge:0,
				user_referrals  : (getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0,
			});
		
		});
	};// End checkOutDetails().


	/**
	 * Function to get Player Invitation Booking Listing  detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	*/
	this.getPlayerInvitationBooking = (req,res,next)=>{

		return new Promise(async resolve=>{

			let userEmail 	= 	(req.body && req.body.email)? req.body.email : "";
			let conditions = {
				"approval_status"	:	INVITATION_STATUS_PENDING,
				"email"				:	userEmail
			};
			const player_invitation = db.collection('player_invitation');
			let limit 	= (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			asyncParallel([
                (callback)=>{
                    /** Get list of users's **/
                    player_invitation.aggregate([
						{$match : conditions},
						{$limit: limit },
						{$lookup: {
							from 		: 	"users",
							localField	: 	"host_id",
							foreignField: 	"_id",
							as 			: 	"hostData"
						}},
						{$lookup: {
							from 		: 	"games",
							localField	: 	"game_id",
							foreignField: 	"_id",
							as 			: 	"game_category_data"
						}},
						{$lookup: {
							from 		: 	"masters",
							localField	: 	"game_category_data.games_name",
							foreignField: 	"_id",
							as 			: 	"game_data"
						}},
						{$project : {
							__id:1,approval_status:1,game_id:1,host_id:1,
							fullname:1,player_id:1,email:1,game_date:1,
							start_time:{"$arrayElemAt":["$gameavailability.start_time",0]},
							end_time:{"$arrayElemAt":["$gameavailability.end_time",0]},
							game_type:{"$arrayElemAt":["$game_category_data.game_type",0]},
							game_name:{"$arrayElemAt":["$game_data.name",0]},
							game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
							host_name:{"$arrayElemAt":["$hostData.full_name",0]},
							profile_picture:{"$arrayElemAt":["$hostData.profile_picture",0]},
						}}
					]).toArray((err, result)=>{
						if(err) return next(err);
						/** Set options for append image **/
						let imageOptions = {
							"file_url" 			: USERS_URL,
							"file_path" 		: USERS_FILE_PATH,
							"result" 			: result,
							"database_field" 	: "profile_picture"
						};

						/** Append image with full path **/
						appendFileExistData(imageOptions).then(fileResponse=>{
							/** Send success response **/
							callback(err, (fileResponse && fileResponse.result)	?	fileResponse.result	:{});
						}).catch(next);
                    });
                },
                (callback)=>{
                    /** Get total number of records in player invitation collection **/
                    player_invitation.countDocuments(conditions,(err,countResult)=>{
                        callback(err, countResult);
                    });
                }
            ], (err,response)=>{
                /** Send response **/
                if(err) return next(err);
				if(!response) return resolve({status : STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			    resolve({ 
					status  		: STATUS_SUCCESS,
					result 			: (response[0]) ? response[0] 	: [],
					recordsTotal    : (response[1]) ? response[1] 	: 0,
				});				
            });
		}); 
	};// End getPlayerInvitationBooking().

	/**
	 * Function for User Review Rating Save form
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.userReviewRatingSave = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			let hostId 		= 	(req.body && req.body.host_id) 	? decodeId(req.body.host_id) : "";
			let orderId 	= 	(req.body && req.body.order_id) ? decodeId(req.body.order_id) : "";
			let userSlug 	= 	(req.body && req.body.user_slug)? req.body.user_slug : "";
			let rating 	    = 	(req.body && req.body.rating)? req.body.rating : "";
			let review 	    = 	(req.body && req.body.review)? req.body.review : "";
			

			if(hostId && !objectID.isValid(hostId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			if(orderId && !objectID.isValid(orderId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			/** Set options for get user details **/
			let options = {
				conditions			: 	{slug:userSlug},
				fields				:	{_id :1,full_name:1}
			};

			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,options);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			const user_review_ratings = db.collection('user_review_ratings');
			user_review_ratings.findOne({host_id:ObjectId(hostId),user_id:userResponse.result._id,booking_id:orderId},(reviewRatingErr, reviewRatingResult)=>{
				if(reviewRatingErr) return next(reviewRatingErr);
				/** Send error response */
				if(reviewRatingResult){
					user_review_ratings.deleteOne({_id:ObjectId(reviewRatingResult._id)},(deletedErr,deletedResult) => {
						if(deletedErr) return next(deletedErr);
						user_review_ratings.insertOne({
							host_id 	: ObjectId(hostId),
							booking_id 	: ObjectId(orderId),
							user_id 	: userResponse.result._id,
							review 		: review,
							user_rating : parseInt(rating),
							modified 	: getUtcDate(),
							created 	: getUtcDate(),
						},(err,result)=>{
							if(err) return next(result);
							/** Send success response **/
							return resolve({
								status		:	STATUS_SUCCESS,
								message		:	res.__("front.favorite_users_has_been_mark_as_favorite_successfully"),
							});	
						});
					});
				}else{
					user_review_ratings.insertOne({
						host_id 	: ObjectId(hostId),
						booking_id 	: ObjectId(orderId),
						user_id 	: userResponse.result._id,
						review 		: review,
						user_rating : parseInt(rating),
						modified 	: getUtcDate(),
						created 	: getUtcDate(),
					},(err,result)=>{
						if(err) return next(result);
						/** Send success response **/
						return resolve({
							status		:	STATUS_SUCCESS,
							message		:	res.__("front.favorite_users_has_been_mark_as_favorite_successfully"),
						});	
					});
				}
				/** Save contacts details */
			});
		});
	};//End userReviewRatingSave()


	/**
	 * Function for User Review Rating Done Status form
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.reviewRatingDoneStatus = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			let orderId 	= 	(req.body && req.body.order_id) 	? decodeId(req.body.order_id) : "";
			let userSlug 	= 	(req.body && req.body.user_slug)? req.body.user_slug : "";
			

			if(orderId && !objectID.isValid(orderId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			/** Set options for get user details **/
			let options = {
				conditions			: 	{slug:userSlug},
				fields				:	{_id :1,full_name:1}
			};

			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,options);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			const user_review_ratings = db.collection('user_review_ratings');
			user_review_ratings.findOne({user_id:ObjectId(userResponse.result._id),booking_id:ObjectId(orderId)},(reviewRatingErr, reviewRatingResult)=>{
				if(reviewRatingErr) return next(reviewRatingErr);

				/** Send error response */
				let ratingDone 	=	true;
				if(!reviewRatingResult) ratingDone 	=	false;
				/** Send success response **/
				return resolve({
					status			:	STATUS_SUCCESS,
					rateing_done	:	ratingDone,
					message 		:	''
				});	
			});
		});
	};//End reviewRatingDoneStatus()

	
	/**
	 * Function for User zoom Meeting Link
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.zoomMeetingLink = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			let orderId 	= 	(req.body && req.body.order_id) 	? decodeId(req.body.order_id) : "";
			let userSlug 	= 	(req.body && req.body.user_slug)? req.body.user_slug : "";
			

			if(orderId && !objectID.isValid(orderId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			/** Set options for get user details **/
			let options = {
				conditions			: 	{slug:userSlug},
				fields				:	{_id :1,full_name:1}
			};

			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,options);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			const user_order_zoom_meeting = db.collection('user_order_zoom_meeting');
			user_order_zoom_meeting.findOne({order_id:ObjectId(orderId)},(err,result)=>{
				if(err) return next(err);

				if(!result) return resolve({status : STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				return resolve({
					status			:	STATUS_SUCCESS,
					result			:	(result)?JSON.parse(result.body):'',
				});
				
				
			});
		});
	};//End zoomMeetingLink()

	

	/**
	 * Function to get Order Details 
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getOrderDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			let orderId  	=   (req.body.order_id)  ? decodeId(req.body.order_id) : "";
			if(!orderId) 	return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			let userSlug 	= (req.body.user_slug) ? req.body.user_slug : "";			

			/** Set options for get player details **/
			let optionsForPlayer = {
				conditions			: 	{ slug	: userSlug},
				fields	:	{
					_id :1,full_name:1
				}
			};

			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			

			let conditions 	= 	{
				"_id" 			: ObjectId(orderId),
				//order_status 	: { $ne: ORDER_STATUS_REJECTED },
				//order_status 	: { $ne: ORDER_STATUS_PENDING  }
			};
			const order 	= 	db.collection('order');
			/** Get list of users's **/
            order.aggregate([
				{$match : conditions},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"host_id",
					foreignField: 	"_id",
					as 			: 	"hostData"
				}},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"player_id",
					foreignField: 	"_id",
					as 			: 	"playerData"
				}},
				{$lookup: {
					from 		: 	"public_player_invitation",
					localField	: 	"_id",
					foreignField: 	"order_id",
					as 			: 	"publicPlayerInvitation"
				}},

				{$lookup:{
			      from: "public_player_invitation",
			      let: { orderid: "$_id"},
			      pipeline: [
			        {$match: {
			          $expr: {
			            $and: [
			                { $eq: ["$order_id", '$$orderid'] },
			                { $ne: ["$order_status", ORDER_STATUS_REJECTED] },
			                //{ $or: [ { 	"$order_status": { $ne: ORDER_STATUS_APPROVED } } ] },
			        		//{ $or: [ { 	"$order_status": { $ne: ORDER_STATUS_PENDING } } ] },

			            ],
			          },
			        }},
			      ],
			      as: "publicPlayerInvitation",
			    }},


				{$lookup:{
			      from: "public_player_invitation",
			      let: { orderid: "$_id"},
			      pipeline: [
			        {$match: {
			          $expr: {
			            $and: [
			                { $eq: ["$player_id", (playerResponse.result && playerResponse.result._id)?ObjectId(playerResponse.result._id):''] },
			                { $eq: ["$order_id", '$$orderid'] },
			            ],
			          },
			        }},
			      ],
			      as: "public_player_invitation_details",
			    }},
				{$project : {
					_id:1,order_book:1,player_id:1,host_id:1,billing_info:1,game_id:1,game_book_date:1,
					host_commission:1,modified:1,booking_id:1,game_type:1,order_status:1,game_start_time:1,
					host_name:{"$arrayElemAt":["$hostData.full_name",0]},game_end_time:1,
					player_name:{"$arrayElemAt":["$playerData.full_name",0]},
					player_email:{"$arrayElemAt":["$playerData.email",0]},
					profile_picture:{"$arrayElemAt":["$hostData.profile_picture",0]},
					host_time_zone_val:{"$arrayElemAt":["$hostData.time_zone_val",0]},
					publicPlayerInvitation:"$publicPlayerInvitation",
					public_player_invitation_details:{"$arrayElemAt":["$public_player_invitation_details",0]},
				}},
			]).toArray((err, result)=>{
				if(err) return next(err);
				if(!result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				if(result && result.length <= 0) return resolve({status	: STATUS_ERROR,message: res.__("admin.system.invalid_access")});
				let orderDetails 	=	 	(result[0])?result[0]:{};
				
				if(orderDetails && orderDetails.game_type == "public"){

					return 	resolve({
					    status      		:  STATUS_SUCCESS,
					    result 				:  (result)?result[0]:{},
					    player_invitations 	:  (orderDetails && orderDetails.publicPlayerInvitation)?orderDetails.publicPlayerInvitation:{},
					});
				}
				const player_invitation = db.collection('player_invitation');
				player_invitation.aggregate([
					{$match : {"order_id" : ObjectId(orderId)}},
					{$lookup: {
						from 		: 	"users",
						localField	: 	"host_id",
						foreignField: 	"_id",
						as 			: 	"hostData"
					}},
					{$lookup: {
						from 		: 	"games",
						localField	: 	"game_id",
						foreignField: 	"_id",
						as 			: 	"game_category_data"
					}},
					{$lookup: {
						from 		: 	"masters",
						localField	: 	"game_category_data.games_name",
						foreignField: 	"_id",
						as 			: 	"game_data"
					}},
					{$project : {
						_id:1,approval_status:1,game_id:1,host_id:1,
						fullname:1,player_id:1,email:1,game_date:1,
						start_time:{"$arrayElemAt":["$gameavailability.start_time",0]},
						end_time:{"$arrayElemAt":["$gameavailability.end_time",0]},
						game_type:{"$arrayElemAt":["$game_category_data.game_type",0]},
						game_name:{"$arrayElemAt":["$game_data.name",0]},
						game_category_name:{"$arrayElemAt":["$game_category_data.games_level",0]},
						host_name:{"$arrayElemAt":["$hostData.full_name",0]},
						profile_picture:{"$arrayElemAt":["$hostData.profile_picture",0]},
					}}
				]).toArray((playerInvitationErr, playerInvitationResult)=>{
					if(playerInvitationErr) return next(playerInvitationErr);
					/** Set options for append image **/
					resolve({
				        status      		: STATUS_SUCCESS,
				        result 				:  (result)?result[0]:{},
				        player_invitations 	:  (playerInvitationResult)?playerInvitationResult:{},
				    });
	            });
            });
		}); 
	};// End getOrderDetails().


	/**
	 * Function to add Payment Crads
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.addPaymentCrads = (req,res,next)=>{
		return new Promise(async resolve=>{

			let userSlug 	= (req.body.user_slug) ? req.body.user_slug : "";
			let stripeToken = (req.body.token) ? req.body.token : "";

			if(!stripeToken)	return resolve({status	: STATUS_ERROR,message	: res.__("admin.user.stripe_token_not_access")});
			

			/** Set options for get player details **/
			let optionsForPlayer = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1,customer_id:1
				}
			};
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug		= userSlug;
			optionsForPlayer.conditions.user_type	= USER_TYPE_PLAYER;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			if(playerResponse.result.customer_id && stripeToken){
				const card = await stripe.customers.createSource(
				  playerResponse.result.customer_id,
				  {source: stripeToken}
				);
				if(card){
					return resolve({status	: STATUS_SUCCESS,message : res.__("admin.user.card_has_been_added_successfully")});
				}else{
					return resolve({status	: STATUS_ERROR,result	: {},message: res.__("admin.system.invalid_access")});
				}
			}
		});
	};// End addPaymentCrads().


	/**
	 * Function to add Payment Crads
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.userSavedCardLising = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug 	= (req.body.user_slug) ? req.body.user_slug : "";
			let limit 		= (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			/** Set options for get player details **/
			let optionsForPlayer = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1,customer_id:1,email:1
				}
			};
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug		= userSlug;
			optionsForPlayer.conditions.user_type	= USER_TYPE_PLAYER;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);
			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						
			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access1")});
			
			if(playerResponse.result.customer_id){
				try {
				    const cards = await stripe.customers.listSources(
					  playerResponse.result.customer_id,
					  {object: 'card', limit: limit}
					);
					if(cards){
						const customer = await stripe.customers.retrieve(
						  playerResponse.result.customer_id
						);
						if(customer){
							resolve({
						        status      			:  STATUS_SUCCESS,
						        result 					:  (cards)?cards:{},
						        customer_stripe_data 	:  (customer)?customer:{},
						    });
						}else{
							return resolve({status	: STATUS_ERROR,result	: {},message: res.__("admin.system.invalid_access")});
						}
					}else{
						return resolve({status	: STATUS_ERROR,result	: {},message: res.__("admin.system.invalid_access")});
					}
				}catch(e) {
					try {

						const customer = await stripe.customers.create({
						  name 			: playerResponse.result.full_name,
						  email 		: playerResponse.result.email,
						  description 	: 'My First Test Customer (created for API docs)',
						});
						if(customer){
							let updateData		=	{
								$set: {
									customer_id			: (customer && customer.id)	?	customer.id 	:	"",
									modified			: getUtcDate()
								}
							};
							const users = db.collection("users");
							users.updateOne({_id : ObjectId(playerResponse.result._id)},updateData,(updateErr,updateResult)=>{
								if(updateErr) return next(updateErr);
								return resolve({ status  : STATUS_SUCCESS,result : {}});		
							});
						}
					}catch(e) {
					    return resolve({status	: STATUS_ERROR,result	: {},message: e.message})
					}
				    
				}
			}
		});
	};// End userSavedCardLising().


	/**
	 * Function to Delete Payment Crads
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.userDeleteCard = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug 	= (req.body.user_slug)  ? req.body.user_slug : "";
			let cardNum  	= (req.body.card_no) 	? req.body.card_no : "";
			/** Set options for get player details **/
			let optionsForPlayer = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1,customer_id:1
				}
			};
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug		= userSlug;
			optionsForPlayer.conditions.user_type	= USER_TYPE_PLAYER;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						
			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			if(playerResponse.result.customer_id && cardNum){

				
				try {
					const deletedData = await stripe.customers.deleteSource(
					  playerResponse.result.customer_id,
					  cardNum
					);
					if(deletedData && deletedData.deleted){
						resolve({
					        status      		:  STATUS_SUCCESS,
					        message 			: res.__("admin.user.card_has_been_deleted_successfully")
					    });
					}else{
						return resolve({status	: STATUS_ERROR,result	: {},message: res.__("admin.system.invalid_access")});
					}
				}catch(e) {
				    return resolve({status	: STATUS_ERROR,result	: {},message: e.message})
				}
				
			}
		});
	};// End userDeleteCard().



	/**
	 * Function to Make Default Crad
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.userDefaultCard = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug 	= (req.body.user_slug)  ? req.body.user_slug : "";
			let cardNum  	= (req.body.card_id) 	? req.body.card_id : "";
			/** Set options for get player details **/
			let optionsForPlayer = {
				conditions			: 	{ 
									     	user_role_id: FRONT_USER_ROLE_ID,
									     	active 		: ACTIVE,
									     	is_deleted 	: NOT_DELETED,
									     	is_verified	: VERIFIED,
									    },
				fields	:	{
					_id :1,full_name:1,customer_id:1
				}
			};
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug		= userSlug;
			optionsForPlayer.conditions.user_type	= USER_TYPE_PLAYER;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						
			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
			
			if(playerResponse.result.customer_id && cardNum){

				try {
					let updatecard = await stripe.customers.update(playerResponse.result.customer_id, {
						default_source: cardNum
					});
					if(updatecard){
						resolve({
					        status      		:  STATUS_SUCCESS,
					        update_card      	:  updatecard,
					        message 			: res.__("admin.user.card_has_been_deleted_successfully")
					    });
					}else{
						return resolve({status	: STATUS_ERROR,result	: {},message: res.__("admin.system.invalid_access")});
					}
				}catch(e) {
				    return resolve({status	: STATUS_ERROR,result	: {},message: e.message})
				}
			}
		});
	};// End userDefaultCard().


	/**
	 * Function to user(player) Cancel Game Booking
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.userCancelGameBooking = (req,res,next)=>{
		return new Promise(async resolve=>{

			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			let orderCancelId  	=   (req.body.cancel_booking_id)  ? decodeId(req.body.cancel_booking_id) : "";
			
			if(orderCancelId && !objectID.isValid(orderCancelId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}
						
			let conditions 	= 	{ 
				"_id" : ObjectId(orderCancelId), 
				$and: [
			        { $or: [ { 	order_status: { $ne: ORDER_STATUS_REJECTED } } ] },
			        { $or: [ { 	order_status: { $ne: ORDER_STATUS_PENDING } } ] },
			    ]
			};

			const order 	= 	db.collection('order');
			/** Get list of users's **/
			order.findOne(conditions,async(orderErr,orderResult)=>{
				if(orderErr) return next(orderErr);

				if(!orderResult) return resolve({ status:STATUS_SUCCESS,message:res.__("user.already_booking_cancelled_or_order_not_found")});
				
				if(orderResult.charge_id && orderResult.order_book && orderResult.order_book.plan_amount){
					let gameBookedDate  =   '';
	                let startTime       =   '';
	                let endTime         =   '';
	                if(orderResult && orderResult.order_book){
	                    if(orderResult.order_book.game_type == PUBLIC){
	                        gameBookedDate  =   orderResult.order_book.event_date;
	                        startTime       =   orderResult.order_book.start_time;
	                        endTime         =   orderResult.order_book.end_time;
	                    }else{
	                        if(orderResult.order_book.preferred_date){
	                            gameBookedDate  =   orderResult.order_book.preferred_date;
	                            startTime       =   orderResult.order_book.start_time;
	                            endTime         =   orderResult.order_book.end_time;
	                        }else{
	                            gameBookedDate  =   orderResult.order_book.game_date;
	                            if(orderResult.order_book.gameavailability && orderResult.order_book.gameavailability.length > 0){
	                                startTime       =   orderResult.order_book.gameavailability[0].start_time;
	                                endTime         =   orderResult.order_book.gameavailability[0].end_time;
	                            }
	                        }
	                    }
	                }

					let currentTimeStamp	=	new Date().getTime();
					let afterFixTimeStamp	=	getAsDate(gameBookedDate,covertFullHourtoAMPM(startTime));
					afterFixTimeStamp.setHours(afterFixTimeStamp.getHours() - PLAYER_CANCELLATION_TIME); // when 48 hours completed

					if(currentTimeStamp <= afterFixTimeStamp.getTime()){ // when today is greate from this date
						// refund back again,
						let updateData	=	{
							$set: {
								order_status  		: ORDER_STATUS_PENDING,
								modified			: getUtcDate()
							}
						};
						if(orderResult && orderResult.game_type == PRIVATE){

							/** Update Order Details **/
							order.updateOne(conditions,updateData,(updateErr,updateResult)=>{
								if(updateErr) return next(updateErr);
								const booking_cancel_logs = db.collection("booking_cancel_logs");
								booking_cancel_logs.insertOne({
									order_id 			: ObjectId(orderResult._id),
									cancel_status 		: CANCEL_REQ_ACTIVE,
									cancel_req_status 	: CANCEL_STATUS_PENDING,
									cancel_by 			: ObjectId(playerResponse.result._id),
									cancel_by_user_type : USER_TYPE_PLAYER,
									modified 			: getUtcDate(),
									created 			: getUtcDate(),
								},(err,result)=>{
									if(err) return next(err);
									/** Send success response **/
									resolve({ status  : STATUS_SUCCESS,message:res.__("user.booking_cancelled_request_sent_to_admin_successfully")});
									/*************** Send Booking Cancel Mail To User  ***************/
									let sendMailOptions	= {
										event_type 		: HOST_BOOKING_CANCEL_EMAIL_EVENTS,
										full_name		: playerResponse.result.full_name,
										user_id			: playerResponse.result._id,
										host_id			: orderResult.host_id,
										booking_id		: orderResult._id,
									};
									sendMailToUsers(req,res,sendMailOptions);
									/*************** Send Booking Cancel Mail To User  ***************/
								});

							});
						}else{
							let conditionsForInv 	= 	{ 
							    $and: [
							        { $or: [ { 	order_status: { $ne: ORDER_STATUS_REJECTED } },{ order_status: { $ne: ORDER_STATUS_PENDING } } ] },
							    ],
							    player_id : (playerResponse.result && playerResponse.result._id)?ObjectId(playerResponse.result._id):''
							};
							const public_player_invitation 	= 	db.collection('public_player_invitation');
							public_player_invitation.updateOne(conditionsForInv,updateData,(updateErr,updateResult)=>{
								public_player_invitation.countDocuments({ 
									"order_id" :(orderCancelId)?ObjectId(orderCancelId):'', 
									$and: [
								        { $or: [ { 	order_status: { $eq: ORDER_STATUS_APPROVED } },{ order_status: { $eq: ORDER_STATUS_PENDING } } ] },
								    ],
								},(err,countResult)=>{
								
									/** Update Order Details **/
									if(updateErr) return next(updateErr);
									//if(countResult 	<=	1){
										/** Update Order Details **/
										//order.updateOne(conditions,updateData,(updateOrderErrVal,updateOrderResultVal)=>{});
									//}	
									const booking_cancel_logs = db.collection("booking_cancel_logs");
									booking_cancel_logs.insertOne({
										order_id 			: ObjectId(orderResult._id),
										cancel_status 		: CANCEL_REQ_ACTIVE,
										cancel_req_status 	: CANCEL_STATUS_PENDING,
										cancel_by 			: ObjectId(playerResponse.result._id),
										cancel_by_user_type : USER_TYPE_PLAYER,
										modified 			: getUtcDate(),
										created 			: getUtcDate(),
									},(err,result)=>{
										if(err) return next(err);
										/** Send success response **/
										resolve({ status  : STATUS_SUCCESS,message:res.__("user.booking_cancelled_request_sent_to_admin_successfully")});
										/*************** Send Booking Cancel Mail To User  ***************/
										let sendMailOptions	= {
											event_type 		: HOST_BOOKING_CANCEL_EMAIL_EVENTS,
											full_name		: playerResponse.result.full_name,
											user_id			: playerResponse.result._id,
											host_id			: orderResult.host_id,
											booking_id		: orderResult._id,
										};
										sendMailToUsers(req,res,sendMailOptions);
										/*************** Send Booking Cancel Mai; To User  ***************/
									});
								});
							});
						}
					}else{
						try {
							const refund = await stripe.refunds.create({
								charge: orderResult.charge_id,
								amount: orderResult.order_book.plan_amount*100,
							});
							if(refund && refund.status == "succeeded"){
								let updateData	=	{
									$set: {
										order_status  		: ORDER_STATUS_REJECTED,
										modified			: getUtcDate()
									}
								};
								if(orderResult && orderResult.game_type == PRIVATE){
									/** Update Order Details **/
									order.updateOne(conditions,updateData,(updateErr,updateResult)=>{
										if(updateErr) return next(updateErr);

										let updateFields	=  {
										    approval_status     : INVITATION_STATUS_REJECTED,
										    payment_status      : INVITATION_PAYMENT_REJECTED,
										    modified            : getUtcDate()
										};
										let dataToBeUpdated     = {$set : updateFields};
										const player_invitation = db.collection("player_invitation");
										player_invitation.updateMany({
											'user_id'					: ObjectId(orderResult.player_id),
											'game_id'					: ObjectId(orderResult.game_id),
											'host_id'					: ObjectId(orderResult.host_id),
											'gameavailability'			: { $elemMatch: { start_time: { $eq: startTime }, end_time: { $eq: endTime } } }, 
											'game_date'					: orderResult.order_book.game_date
										},dataToBeUpdated,(updateResultErr,updateResultInvitation)=>{
											if(updateResultErr) return next(updateResultErr);

											// order payment maintain in case of cancel booking before time //
											const order_payment = db.collection('order_payment');
											let orderPaymentPublic 	=	{
												order_id 				: ObjectId(orderResult._id),
												player_id 				: ObjectId(orderResult.player_id),
												host_id 				: ObjectId(orderResult.host_id),
												refund_result 			: refund,
												final_charge_amount 	: orderResult.order_book.plan_amount,
												type 					: CREDIT,
												modified 				: getUtcDate(),
												created 				: getUtcDate(),
											}
											order_payment.insertOne(orderPaymentPublic,(orderPaymentErr,orderPaymentResult)=>{
												if(orderPaymentErr) return next(orderPaymentErr);
												const booking_cancel_logs = db.collection("booking_cancel_logs");
												booking_cancel_logs.insertOne({
													order_id 			: ObjectId(orderResult._id),
													cancel_by 			: ObjectId(playerResponse.result._id),
													cancel_status 		: CANCEL_REQ_CLOSE,
													cancel_req_status 	: CANCEL_STATUS_APPROVED,
													cancel_by_user_type : USER_TYPE_PLAYER,
													modified 			: getUtcDate(),
													created 			: getUtcDate(),
												},(err,result)=>{
													if(err) return next(err);
													/** Send success response **/
													resolve({ status  : STATUS_SUCCESS,message:res.__("user.booking_cancelled_successfully")});
													
													let sendMailOptions	= {
														event_type 		: HOST_BOOKING_CANCEL_EMAIL_EVENTS,
														full_name		: playerResponse.result.full_name,
														user_id			: playerResponse.result._id,
														host_id			: orderResult.host_id,
														booking_id		: orderResult._id,
														//noti_wants 		: true
													};
													sendMailToUsers(req,res,sendMailOptions);

													let sendMailOptionsTwo	= {
														event_type 		: BOOKING_CANCEL_CONFIRMATION_EMAIL_EVENTS,
														user_id			: playerResponse.result._id,
														booking_id		: orderResult._id,
													};
													sendMailToUsers(req,res,sendMailOptionsTwo);

													let sendMailOptionsThree	= {
														event_type 		: PLAYER_CANCELLATION_HOST_NOTIFY_EMAIL_EVENTS,
														user_id			: orderResult.host_id,
														player_full_name: playerResponse.result.full_name,
														booking_id		: orderResult._id,
													};
													sendMailToUsers(req,res,sendMailOptionsThree);
												});
											});
										});
									});
								}else{
									let conditionsForInv 	= 	{ 
										"order_id" : ObjectId(orderCancelId), 
										$and: [
									        { $or: [ { 	order_status: { $ne: ORDER_STATUS_REJECTED } },{ order_status: { $ne: ORDER_STATUS_PENDING } } ] },
									    ],
									    player_id : ObjectId(playerResponse.result._id)
									};
									const public_player_invitation 	= 	db.collection('public_player_invitation');

									/** Update Order Details **/
									public_player_invitation.updateOne(conditionsForInv,updateData,(updatePublicErr,updatePublicResult)=>{

										public_player_invitation.countDocuments({ 
											"order_id" :(orderCancelId)?ObjectId(orderCancelId):'', 
											$and: [
										        { $or: [ { 	order_status: { $ne: ORDER_STATUS_APPROVED } },{ order_status: { $ne: ORDER_STATUS_PENDING } } ] },
										    ],
										},(err,countResult)=>{
											
											//if(countResult 	<=	0){
												/** Update Order Details **/
												//order.updateOne(conditions,updateData,(updateOrderErrVal,updateOrderResultVal)=>{});
											//}	
											let updateFields	=  {
											    approval_status     : INVITATION_STATUS_REJECTED,
											    payment_status      : INVITATION_PAYMENT_REJECTED,
											    modified            : getUtcDate()
											};
											let dataToBeUpdated     = {$set : updateFields};
											const player_invitation = db.collection("player_invitation");
											player_invitation.updateMany({
												'user_id'					: ObjectId(orderResult.player_id),
												'game_id'					: ObjectId(orderResult.game_id),
												'host_id'					: ObjectId(orderResult.host_id),
												'gameavailability'			: { $elemMatch: { start_time: { $eq: startTime }, end_time: { $eq: endTime } } }, 
												'game_date'					: orderResult.order_book.game_date
											},dataToBeUpdated,(updateResultErr,updateResultInvitation)=>{
												if(updateResultErr) return next(updateResultErr);

												// order payment maintain in case of cancel booking before time //
												const order_payment = db.collection('order_payment');
												let orderPaymentPublic 	=	{
													order_id 				: ObjectId(orderResult._id),
													player_id 				: ObjectId(orderResult.player_id),
													host_id 				: ObjectId(orderResult.host_id),
													refund_result 			: refund,
													final_charge_amount 	: orderResult.order_book.plan_amount,
													type 					: CREDIT,
													modified 				: getUtcDate(),
													created 				: getUtcDate(),
												}
												order_payment.insertOne(orderPaymentPublic,(orderPaymentErr,orderPaymentResult)=>{
													if(orderPaymentErr) return next(orderPaymentErr);
													const booking_cancel_logs = db.collection("booking_cancel_logs");
													booking_cancel_logs.insertOne({
														order_id 			: ObjectId(orderResult._id),
														cancel_by 			: ObjectId(playerResponse.result._id),
														cancel_status 		: CANCEL_REQ_CLOSE,
														cancel_req_status 	: CANCEL_STATUS_APPROVED,
														cancel_by_user_type : USER_TYPE_PLAYER,
														modified 			: getUtcDate(),
														created 			: getUtcDate(),
													},(err,result)=>{
														if(err) return next(err);
														/** Send success response **/
														resolve({ status  : STATUS_SUCCESS,message:res.__("user.booking_cancelled_successfully")});
														
														let sendMailOptions	= {
															event_type 		: HOST_BOOKING_CANCEL_EMAIL_EVENTS,
															full_name		: playerResponse.result.full_name,
															user_id			: playerResponse.result._id,
															host_id			: orderResult.host_id,
															booking_id		: orderResult._id,
															//noti_wants 		: true
														};
														sendMailToUsers(req,res,sendMailOptions);

														let sendMailOptionsTwo	= {
															event_type 		: BOOKING_CANCEL_CONFIRMATION_EMAIL_EVENTS,
															user_id			: playerResponse.result._id,
															booking_id		: orderResult._id,
														};
														sendMailToUsers(req,res,sendMailOptionsTwo);

														let sendMailOptionsThree	= {
															event_type 		: PLAYER_CANCELLATION_HOST_NOTIFY_EMAIL_EVENTS,
															user_id			: orderResult.host_id,
															player_full_name: playerResponse.result.full_name,
															booking_id		: orderResult._id,
														};
														sendMailToUsers(req,res,sendMailOptionsThree);
													});
												});
											});
										});
									});
								}
							}else{
								return resolve({ status  : STATUS_ERROR,message:res.__("admin.system.something_going_wrong_please_try_again")});
							}
						}catch(e) {
						    return resolve({status	: STATUS_ERROR,message: e.message})
						}
					}
				}else{
					return resolve({ status  : STATUS_ERROR,message:res.__("user.already_booking_cancelled_or_order_not_found")});
				}
			});
		}); 
	};// End userCancelGameBooking().


	/**
	 * Function to get Player Booking Game's Listing  detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getHostBookings = (req,res,next)=>{
		return new Promise(async resolve=>{
			//let conditions 	= {order_status: { $ne: ORDER_STATUS_REJECTED }};
			let conditions 		= {};

			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			let gameName = (req.body.selected_game) ? ObjectId(req.body.selected_game) : "";
			let gameType = (req.body.game_type) ? req.body.game_type : "";
			let gameDate = (req.body.game_date) ? req.body.game_date : "";

			let upcoming = (req.body.upcoming) ? req.body.upcoming : "";

			/** Set options for get player details **/

			let optionsForHost = {
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
			/**Condition for player Slug*/
			optionsForHost.conditions.slug	= userSlug;

			/** Get host details **/
			let hostResponse =  await getUserData(req,res,next,optionsForHost);

			if(hostResponse.status != STATUS_SUCCESS) return next(hostResponse.message);						


			if(!hostResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			//For Specfic Host Up Booking On Dashboard//
			conditions.host_id 	=	ObjectId(hostResponse.result._id);

			if(gameName != '') 	conditions.game_id 		=	gameName;
			if(gameType != '') 	conditions.game_type 	=	gameType;

			let newConditions 	= 	{ };
			if(gameDate){
				Object.assign(newConditions,{ 
					$or: [
				        { 	"order_book.game_date" : gameDate },
				        { 	"order_book.preferred_date" : gameDate } ,
				        { 	"order_book.event_date" : gameDate } ,
				    ]
				});
				
			}

			let currentDate =  newDate('',API_DATE_FORMAT);
			if(upcoming){
				Object.assign(newConditions,{ 
					$or: [
				        { 	"order_book.game_date" : { $gte: currentDate } },
				        { 	"order_book.preferred_date" : { $gte: currentDate } } ,
				        { 	"order_book.event_date" : { $gte: currentDate } } ,
				    ],
				    order_status: { $ne: ORDER_STATUS_REJECTED }
				});
			}


			const order 	= db.collection('order');
			let limit 		= (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			asyncParallel([
                (callback)=>{
                    /** Get list of users's **/
                    order.aggregate([
						{$match : conditions},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"player_id",
							foreignField: 	"_id",
							as 			: 	"playerData"
						}},
						{ $lookup: {
						    from: "public_player_invitation",
						    let: {
						     orderId: "$_id"
						    },
						    pipeline: [
						      	{ 
						      	$match: {
								        $expr:{ $and: [
						              		{ $eq: ["$order_id", "$$orderId"] },
						              		
						          		] }
							      	} 
							    }
						    ],
						    as: "publicPlayerInvitation"
						} },
						{$project : {
							_id:1,order_book:1,player_id:1,host_id:1,billing_info:1,
							host_commission:1,modified:1,booking_id:1,game_type:1,upload_xls:1,
							player_name:{"$arrayElemAt":["$playerData.full_name",0]},
							profile_picture:{"$arrayElemAt":["$playerData.profile_picture",0]},
							order_status:1,size_of_game_current_avaiblity: {$size: "$publicPlayerInvitation"}
						}},
						{$match : newConditions},
						{$sort: {_id : SORT_DESC}},
						{$limit: limit },
					]).toArray((err, result)=>{
						if(err) return next(err);
						/** Set options for append image **/
						let imageOptions = {
							"file_url" 			: USERS_URL,
							"file_path" 		: USERS_FILE_PATH,
							"result" 			: result,
							"database_field" 	: "profile_picture"
						};

						/** Append image with full path **/
						appendFileExistData(imageOptions).then(fileResponse=>{
							/** Send success response **/
							callback(err, (fileResponse && fileResponse.result)	?	fileResponse.result	:{});
						}).catch(next);
                    });
                },
                (callback)=>{
                    /** Get total number of records in orders collection **/
                    order.aggregate([
						{$match : conditions},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"player_id",
							foreignField: 	"_id",
							as 			: 	"playerData"
						}},
						{$project : {
							_id:1,order_book:1,player_id:1,host_id:1,billing_info:1,
							host_commission:1,modified:1,booking_id:1,game_type:1,
							player_name:{"$arrayElemAt":["$playerData.full_name",0]},
							profile_picture:{"$arrayElemAt":["$playerData.profile_picture",0]},
						}},
						{$match : newConditions},
					]).toArray((err, countResult)=>{
						if(err) return next(err);
                        callback(err, countResult.length);
                    });
                }
            ], (err,response)=>{
                /** Send response **/
                if(err) return next(err);
				if(!response) return resolve({status : STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				let orderListArray =	[]
				asyncEach(response[0],(orderResult, asyncCallback)=>{
					let gameBookedDate  =   '';
					let startTime       =   '';
					let endTime         =   '';
					if(orderResult){
						if(orderResult && orderResult.order_book){
						    if(orderResult.order_book.game_type == PUBLIC){
						        gameBookedDate  =   orderResult.order_book.event_date;
						        startTime       =   orderResult.order_book.start_time;
						        endTime         =   orderResult.order_book.end_time;
						    }else{
						        if(orderResult.order_book.preferred_date){
						            gameBookedDate  =   orderResult.order_book.preferred_date;
						            startTime       =   orderResult.order_book.start_time;
						            endTime         =   orderResult.order_book.end_time;
						        }else{
						            gameBookedDate  =   orderResult.order_book.game_date;
						            if(orderResult.order_book.gameavailability && orderResult.order_book.gameavailability.length > 0){
						                startTime       =   orderResult.order_book.gameavailability[0].start_time;
						                endTime         =   orderResult.order_book.gameavailability[0].end_time;
						            }
						        }
						    }
						}
					}
					orderResult.game_booked_date	=	gameBookedDate;
					orderResult.game_start_time	=	startTime;
					orderResult.game_end_time	=	endTime;


					if(upcoming){
						let startTimeValue	=	startTime;
						if(parseInt(startTimeValue) < 10){
							startTimeValue 	=	'0'+String(parseInt(startTimeValue))+':00';
						}else{
							if(parseInt(startTimeValue) == 12){
								startTimeValue 	=	'12:00';
							}else{
								startTimeValue 	=	String(parseInt(startTimeValue))+':00';
							}
						}
						let currentTime	 		= 	currentTimeStamp();
						let now 				=   new Date(gameBookedDate+' '+startTimeValue);
						if(currentTime <= now.getTime()){
							orderListArray.push(orderResult);
						}
					}else{
						orderListArray.push(orderResult);
					}
					asyncCallback(null);
				},(asyncErr,asyncContent)=>{
					resolve({ 
						status  		: STATUS_SUCCESS,
						//result 			: (response[0]) ? response[0] 	: [],
						result 			: orderListArray,
						recordsTotal    : (response[1]) ? response[1] 	: 0,
					});	

				});
			   			
            });
		}); 
	};// End getHostBookings().


	/**
	 * Function to get Player Booking Game's Listing  detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getPlayerBookedGameSlots = (req,res,next)=>{
		return new Promise(async resolve=>{

			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);

			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						

			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			const order 	   =   db.collection('order');

			order.aggregate([
				{$match : {player_id :{ $in: playerResponse.result._id ? [ObjectId(playerResponse.result._id)]:[]}}},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"host_id",
					foreignField: 	"_id",
					as 			: 	"hostData"
				}},
				{$project : {
					_id:1,order_book:1,game_book_date:1,game_start_time:1,game_end_time:1,
					host_name:{"$arrayElemAt":["$hostData.full_name",0]},game_type:1,
					host_time_zone_val:{"$arrayElemAt":["$hostData.time_zone_val",0]},
				}},

			]).toArray((err, result)=>{
				if(err) return next(err);
				
			    resolve({ 
					status  		: STATUS_SUCCESS,
					result 			: result,
				});		
            });

		}); 
	};// End getPlayerBookedGameSlots().


	/**
	 * Function to create Zoom Host User
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.createZoomHostUser = (req,res,next)=>{
		return new Promise(async resolve=>{
			let fullName = (req.body.full_name) ? req.body.full_name : "";
			let emailId  = (req.body.email) 	? req.body.email : "";
			let userId   = (req.body.user_id) 	? ObjectId(req.body.user_id) : "";

			if(fullName && emailId && userId){
				const jwt = require('jsonwebtoken');
				const payload = {
				    iss: ZOOM_API_KEY,
				    exp: ((new Date()).getTime() + 5000)
				};
				const token = jwt.sign(payload, ZOOM_API_SECRET);
				
				const options = {
				  	method 		: 'POST',
				  	url 		: 'https://api.zoom.us/v2/users',
				  	headers		: {'content-type': 'application/json', authorization: `Bearer ${token}`},
				  	body 		: {
					  "action" 			: "create",
					  "user_info" 		: {
					    "email" 		: emailId, //'anuj@devtechnosys.com'
					    "type" 			: 2,
					    "first_name" 	: fullName,
					    "last_name"		: ""
					  }
					},
				  	json: true
				};


				request(options, function (error, response, body) {
					if (error) throw new Error(error);
					if(body && body.id){
						let updateData		=	{
							$set: {
								zoom_user_create	: body,
								modified			: getUtcDate()
							}
						};
						const users = db.collection("users");
						users.updateOne({_id : userId},updateData,(updateErr,updateResult)=>{
							if(updateErr) return next(updateErr);
							/** Send success response **/
							return resolve({ status  : STATUS_SUCCESS,result : body});		
						});
					}else{
						return resolve({ status  : STATUS_ERROR,result : {}});	
					}
				});
			}else{
 				return resolve({ status  : STATUS_ERROR,result : {}});		
			}
		}); 
	};// End createZoomHostUser().

	/**
	 * Function to create Zoom Meeting
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let createZoomMeeting = (req,res,next,meetingoption)=>{
		return new Promise(async resolve=>{
			if(meetingoption){
				const jwt = require('jsonwebtoken');
				const payload = {
				    iss: ZOOM_API_KEY,
				    exp: ((new Date()).getTime() + 5000)
				};
				const token = jwt.sign(payload, ZOOM_API_SECRET);
				
				const options = {
				  	method 		: 'POST',
				  	url 		: MEETING_ZOOM_URL,
				  	headers		: {'content-type': 'application/json', authorization: `Bearer ${token}`},
				  	body 		: {
					    topic 		: 	meetingoption.game_type+' ('+meetingoption.game_name+'-'+meetingoption.game_category_name+')',
					    type 		: 	2,
					    start_time 	: 	'2021-01-30 12:00:00',
					    agenda 		: 	 meetingoption.game_type+' ('+meetingoption.game_name+'-'+meetingoption.game_category_name+')',
					    settings 	: 	{
							host_video: true,
							participant_video: true,
							join_before_host: false,
							mute_upon_entry: true,
							use_pmi: false,
							approval_type: 0,
							alternative_hosts:'anuj@devtechnosys.com'
					    }
				  	},
				  	json: true
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);
				  	return resolve({ status  : STATUS_SUCCESS,result : body});		
				});
			}else{
 				return resolve({ status  : STATUS_ERROR,result : {}});		
			}
		}); 
	};// End createZoomMeeting().


	/**
	 * Function to delete Zoom user
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.deleteZoomUser = (req,res,next,meetingoption)=>{
		return new Promise(async resolve=>{

			let zoomUserId  = (req.body.zoom_user_id) 	? req.body.zoom_user_id : "";

			if(zoomUserId){
				const jwt = require('jsonwebtoken');
				const payload = {
				    iss: ZOOM_API_KEY,
				    exp: ((new Date()).getTime() + 5000)
				};
				const token = jwt.sign(payload, ZOOM_API_SECRET);
				
				const options = {
				  	method 		: 'DELETE',
				  	url 		: DELETE_ZOOM_URL+zoomUserId,
				  	headers		: {'content-type': 'application/json', authorization: `Bearer ${token}`},
				  	body 		: {
					   action   : "disassociate"
				  	},
				  	json: true
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					let updateData		=	{
						$set: {
							zoom_user_create	: body,
							modified			: getUtcDate()
						},
						$unset: {
							zoom_user_create	: 1,
						}
					};
					const users = db.collection("users");
					users.updateOne({_id : userId},updateData,(updateErr,updateResult)=>{
						if(updateErr) return next(updateErr);
						/** Send success response **/
						return resolve({ status  : STATUS_SUCCESS,result : body});		
					});
				});
			}else{
 				return resolve({ status  : STATUS_ERROR,result : {}});		
			}
		}); 
	};// End deletZoomUser().

	/**
	 * Function for get Zoom Meeting Details
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getZoomMeetingDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			let orderId 		= 	(req.body && req.body.order_id) 	? decodeId(req.body.order_id) : "";	
			if(orderId && !objectID.isValid(orderId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}

			const user_order_zoom_meeting = db.collection('user_order_zoom_meeting');
			user_order_zoom_meeting.findOne({order_id:ObjectId(orderId)},(zoomMeetingErr, zoomMeetingResult)=>{
				if(zoomMeetingErr) return next(zoomMeetingErr);
				if(!zoomMeetingResult) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				/** Send error response */
				return resolve({
					status		:	STATUS_SUCCESS,
					result		:	zoomMeetingResult,
				});	
			});
		});
	};//End getZoomMeetingDetails()


	/**
	 * Function for get User Referral Amount
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getUserReferralAmount = (req,res,next,option)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			let userId 		= 	(option && option.user_id) 	? option.user_id : "";	
			if(!userId)			return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})

			const user_referrals = db.collection('user_referrals');

			user_referrals.find({referral_user_by:ObjectId(userId),redeem_credits: { $gt: 0 },status:NOT_CREDITES}).toArray((userReferralErr,userReferralCount)=>{
				if(userReferralErr) return next(userReferralErr);			
				let referralCharge =	(res.locals.settings["Referral.charge"])?res.locals.settings["Referral.charge"]:0

				let userReferralCountVal	=	0;
				asyncEach(userReferralCount,(values, asyncCallback)=>{
					userReferralCountVal 	+=	values.redeem_credits;
					asyncCallback(null);
				},(asyncErr,asyncContent)=>{
					resolve({ 
						status  				: STATUS_SUCCESS,
						user_referrals_points  	: userReferralCountVal,
						admin_referrals_charge  : referralCharge,
						user_referrals      	: (userReferralCountVal*referralCharge),
					});
				});
			});
		});
	};//End getUserReferralAmount()


	/**
	 * Function to Host Cancel Game Booking
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.hostCancelGameBooking = (req,res,next)=>{
		return new Promise(async resolve=>{
			let orderCancelId  	=   (req.body.cancel_booking_id)  ? decodeId(req.body.cancel_booking_id) : "";
			if(orderCancelId && !objectID.isValid(orderCancelId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}
			let userSlug 	= 	(req.body && req.body.user_slug)? req.body.user_slug : "";
			/** Set options for get user details **/
			let options = {
				conditions			: 	{slug:userSlug},
				fields				:	{_id :1,full_name:1}
			};
			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,options);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			let conditions 	= 	{ 
				"_id" : ObjectId(orderCancelId), 
				$and: [
			        { $or: [ { 	order_status: { $ne: ORDER_STATUS_REJECTED } } ] },
			        { $or: [ { 	order_status: { $ne: ORDER_STATUS_PENDING } } ] },
			    ]
			};
			const order 	= 	db.collection('order');
			/** Get list of users's **/

			order.findOne(conditions,async(orderErr,orderResult)=>{
				if(orderErr) return next(orderErr);
				if(!orderResult) return resolve({ status:STATUS_SUCCESS,message:res.__("user.already_booking_cancelled_or_order_not_found")});
			
				/*let gameBookedDate  =   '';
                let startTime       =   '';
                let endTime         =   '';
                if(result && result.order_book){
                    if(result.order_book.game_type == PUBLIC){
                        gameBookedDate  =   result.order_book.event_date;
                        startTime       =   result.order_book.start_time;
                        endTime         =   result.order_book.end_time;
                    }else{
                        if(result.order_book.preferred_date){
                            gameBookedDate  =   result.order_book.preferred_date;
                            startTime       =   result.order_book.start_time;
                            endTime         =   result.order_book.end_time;
                        }else{
                            gameBookedDate  =   result.order_book.game_date;
                            if(result.order_book.gameavailability && result.order_book.gameavailability.length > 0){
                                startTime       =   result.order_book.gameavailability[0].start_time;
                                endTime         =   result.order_book.gameavailability[0].end_time;
                            }
                        }
                    }
                }*/

				let updateData	=	{
					$set: {
						order_status  		: ORDER_STATUS_PENDING,
						modified			: getUtcDate()
					}
				};
				
				/** Update Order Details **/
				order.updateOne(conditions,updateData,(updateErr,updateResult)=>{
					if(updateErr) return next(updateErr);

					const booking_cancel_logs = db.collection("booking_cancel_logs");
					booking_cancel_logs.insertOne({
						order_id 			: ObjectId(orderResult._id),
						cancel_status 		: CANCEL_REQ_ACTIVE,
						cancel_req_status 	: CANCEL_STATUS_PENDING,
						cancel_by_user_type : USER_TYPE_HOST,
						cancel_by 			: ObjectId(userResponse.result._id),
						modified 			: getUtcDate(),
						created 			: getUtcDate(),
					},(err,result)=>{
						if(err) return next(result);
						/** Send success response **/
						resolve({ status  : STATUS_SUCCESS,message:res.__("user.booking_cancelled_request_sent_to_admin_successfully")});
						/*************** Send Booking Cancel Mai; To User  ***************/
						let sendMailOptions	= {
							event_type 		: HOST_BOOKING_CANCEL_EMAIL_EVENTS,
							full_name		: userResponse.result.full_name,
							user_id			: userResponse.result._id,
							booking_id		: orderResult._id,
						};
						sendMailToUsers(req,res,sendMailOptions);
						/*************** Send Booking Cancel Mai; To User  ***************/
					});
				});
			});
		}); 
	};// End hostCancelGameBooking().


	/**
	 * Function to Player Transaction Point History
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	*/
	this.userTransactionPointHistory = (req,res,next)=>{
		return new Promise(async resolve=>{
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);
			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						
			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});


			const order_payment = db.collection('order_payment');			
			order_payment.aggregate([
				{$match : {player_id :ObjectId(playerResponse.result._id),referrals_wants:"true"}},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"host_id",
					foreignField: 	"_id",
					as 			: 	"hostData"
				}},
				{$lookup: {
					from 		: 	"users",
					localField	: 	"player_id",
					foreignField: 	"_id",
					as 			: 	"playerData"
				}},
				{$lookup: {
					from 		: 	"order",
					localField	: 	"order_id",
					foreignField: 	"_id",
					as 			: 	"orderData"
				}},
				
				{$project : {
					__id:1,final_charge_amount:1,referrals_wants:1,type:1,
					redeem_points_amount_details:1,player_id:1,order_id:1,host_id:1,
					host_name:{"$arrayElemAt":["$hostData.full_name",0]},
					player_name:{"$arrayElemAt":["$playerData.full_name",0]},
				}}
			]).toArray((err, result)=>{
				if(err) return next(err);
				/** Send success response **/
				resolve({
			        status      			:  STATUS_SUCCESS,
			        result 					:  result,
			    });
			});
		});
	}


	/**
	 * Function to Player Referral Point History
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	*/
	this.userReferralPointHistory = (req,res,next)=>{
		return new Promise(async resolve=>{

			let limit = (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
				
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			/** Set options for get player details **/
			let optionsForPlayer = {
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
			/**Condition for player Slug*/
			optionsForPlayer.conditions.slug	= userSlug;
			/** Get player details **/
			let playerResponse =  await getUserData(req,res,next,optionsForPlayer);
			if(playerResponse.status != STATUS_SUCCESS) return next(playerResponse.message);						
			if(!playerResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});


			const user_referral_logs = db.collection('user_referral_logs');			
			
			asyncParallel([
                (callback)=>{
                    /** Get list of users's **/
                   	user_referral_logs.aggregate([
						{$match : {referral_user_by :ObjectId(playerResponse.result._id)}},
						{$limit: limit },
						{$lookup: {
							from 		: 	"users",
							localField	: 	"referral_user",
							foreignField: 	"_id",
							as 			: 	"referralUserData"
						}},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"referral_user_by",
							foreignField: 	"_id",
							as 			: 	"referralUserByData"
						}},
		 				{$lookup: {
							from 		: 	"order",
							localField	: 	"order_id",
							foreignField: 	"_id",
							as 			: 	"orderData"
						}},
						{$project : {
							__id:1,referral_user:1,referral_user_by:1,type:1,
							redeem_credits:1,status:1,modified:1,created:1,
							referral_user_name:{"$arrayElemAt":["$referralUserData.full_name",0]},
							referral_user_by_name:{"$arrayElemAt":["$referralUserByData.full_name",0]},
							order_book:{"$arrayElemAt":["$orderData.order_book",0]},
						}}
					]).toArray(async(err, result)=>{
						if(err) return next(err);
						/** Send success response **/
						callback(err, result);
                    });
                },
                (callback)=>{
                    /** Get total number of records in user referral logs collection **/
                    user_referral_logs.countDocuments({referral_user_by :ObjectId(playerResponse.result._id)},(err,countResult)=>{
                        callback(err, countResult);
                    });
                },
            ],async(err,response)=>{
                /** Send response **/
                if(err) return next(err);
				
				if(!response) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				let getReferralAmount =  await getUserReferralAmount(req,res,next,{user_id:ObjectId(playerResponse.result._id)});
			    
				resolve({
			        status      			:  STATUS_SUCCESS,
			        result 					: (response[0]) ? response[0] 	: [],
			        recordsTotal    		: (response[1]) ? response[1] 	: 0,
			        user_referrals_points  	: (getReferralAmount && getReferralAmount.user_referrals_points)?getReferralAmount.user_referrals_points:0,
					admin_referrals_charge  : (getReferralAmount && getReferralAmount.admin_referrals_charge)?getReferralAmount.admin_referrals_charge:0,
					user_referrals  		: (getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0,
			    });

            });
		});
	}

	/**
	 * Function to User Payment Transactions List
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	*/
	this.userPaymentTransactionsList = (req,res,next)=>{
		return new Promise(async resolve=>{

			let limit 			= (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			let userSlug 		= (req.body.user_slug) ? req.body.user_slug : "";
			let fromDate        = (req.body.fromDate)       ? req.body.fromDate                 : "";
            let toDate          = (req.body.toDate)         ? req.body.toDate                   : "";

			/** Set options for get player details **/
			let optionsForUser = {
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
			/**Condition for player Slug*/
			optionsForUser.conditions.slug	= userSlug;
			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,optionsForUser);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);						
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			let conditionsData 	=	{player_id :ObjectId(userResponse.result._id)};
			
		 	if (fromDate !== typeof undefined  && fromDate && toDate !== typeof undefined  && toDate) {
                conditionsData["created"] = {
                    $gte    : new Date(newDate(fromDate,CURRENTDATE_START_DATE_FORMAT)), 
                    $lte    : new Date(newDate(toDate,CURRENTDATE_END_DATE_FORMAT)) 
                };
            }

			const order_payment = db.collection('order_payment');			

			asyncParallel([
                (callback)=>{
                    /** Get list of order payment's **/
                   	order_payment.aggregate([
						{$match : conditionsData},
						{$limit: limit },
						{$lookup: {
							from 		: 	"users",
							localField	: 	"player_id",
							foreignField: 	"_id",
							as 			: 	"playerData"
						}},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"host_id",
							foreignField: 	"_id",
							as 			: 	"hostData"
						}},
						{$lookup: {
							from 		: 	"order",
							localField	: 	"order_id",
							foreignField: 	"_id",
							as 			: 	"orderData"
						}},
						{$sort: {_id : SORT_DESC}},
						{$project : {
							__id:1,redeem_points_amount_details:1,type:1,order_id:1,
							final_charge_amount:1,referrals_wants:1,modified:1,created:1,
							player_name:{"$arrayElemAt":["$playerData.full_name",0]},
							host_name:{"$arrayElemAt":["$hostData.full_name",0]},
							order_book:{"$arrayElemAt":["$orderData.order_book",0]},
							booking_id:{"$arrayElemAt":["$orderData.booking_id",0]},
						}}
					]).toArray(async(err, result)=>{
						if(err) return next(err);
						/** Send success response **/
						callback(err, result);
                    });
                },
                (callback)=>{
                    /** Get total number of records in order payments collection **/
                    order_payment.countDocuments(conditionsData,(err,countResult)=>{
                        callback(err, countResult);
                    });
                },
            ],async(err,response)=>{
                /** Send response **/
                if(err) return next(err);
				
				if(!response) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				resolve({
			        status      			:  STATUS_SUCCESS,
			        result 					: (response[0]) ? response[0] 	: [],
			        recordsTotal    		: (response[1]) ? response[1] 	: 0,
			    });

            });
		});
	}


	/**
	 * Function to Host Payment Transactions List
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	*/
	this.hostPaymentTransactionsList = (req,res,next)=>{
		return new Promise(async resolve=>{
			let limit = (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			let userSlug = (req.body.user_slug) ? req.body.user_slug : "";
			
			/** Set options for get player details **/
			let optionsForUser = {
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
			/**Condition for player Slug*/
			optionsForUser.conditions.slug	= userSlug;
			/** Get user details **/
			let userResponse =  await getUserData(req,res,next,optionsForUser);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);						
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});


			let fromDate        = (req.body.fromDate)       ? req.body.fromDate                 : "";
            let toDate          = (req.body.toDate)         ? req.body.toDate                   : "";
			let conditionsData 	=	{host_id :ObjectId(userResponse.result._id)};

			if (fromDate !== typeof undefined  && fromDate && toDate !== typeof undefined  && toDate) {
			    conditionsData["created"] = {
			        $gte    : new Date(newDate(fromDate,CURRENTDATE_START_DATE_FORMAT)), 
			        $lte    : new Date(newDate(toDate,CURRENTDATE_END_DATE_FORMAT)) 
			    };
			}



			const host_order_payment = db.collection('host_order_payment');			

			asyncParallel([
                (callback)=>{
                    /** Get list of order payment's **/
                   	host_order_payment.aggregate([
						{$match : conditionsData},
						{$limit: limit },
						{$lookup: {
							from 		: 	"users",
							localField	: 	"player_id",
							foreignField: 	"_id",
							as 			: 	"playerData"
						}},
						{$lookup: {
							from 		: 	"users",
							localField	: 	"host_id",
							foreignField: 	"_id",
							as 			: 	"hostData"
						}},
						{$lookup: {
							from 		: 	"order",
							localField	: 	"order_id",
							foreignField: 	"_id",
							as 			: 	"orderData"
						}},
						{$project : {
							_id:1,host_commission:1,host_payment_relige:1,order_id:1,
							final_charge_amount:1,modified:1,created:1,
							player_name:{"$arrayElemAt":["$playerData.full_name",0]},
							host_name:{"$arrayElemAt":["$hostData.full_name",0]},
							order_book:{"$arrayElemAt":["$orderData.order_book",0]},
							booking_id:{"$arrayElemAt":["$orderData.booking_id",0]},
						}},
						{$sort: {_id : SORT_DESC}},
					]).toArray(async(err, result)=>{
						if(err) return next(err);
						/** Send success response **/
						callback(err, result);
                    });
                },
                (callback)=>{
                    /** Get total number of records in collection **/
                    host_order_payment.countDocuments(conditionsData,(err,countResult)=>{
                        callback(err, countResult);
                    });
                },
                (callback)=>{
                    /** Get total host commission of records collection **/
                    host_order_payment.aggregate([
	                    { $match: conditionsData },
	                    { $group: { _id : null, totalAmount : { $sum: "$host_commission" } } }
				    ]).toArray(async(err, result)=>{
						if(err) return next(err);
						/** Send success response **/
						let totalAmount	=	(result && result[0] && result[0].totalAmount)?result[0].totalAmount:0
						callback(err, totalAmount);
                    });
                },

            ],async(err,response)=>{
                /** Send response **/
                if(err) return next(err);
				
				if(!response) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});
				resolve({
			        status      				:  STATUS_SUCCESS,
			        result 						: (response[0]) ? response[0] 	: [],
			        recordsTotal    			: (response[1]) ? response[1] 	: 0,
			        recordsTotalHostCommission  : (response[2]) ? response[2] 	: 0,
			    });

            });
		});
	}


	/**
	 * Function for get Essential Pack Details
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getEssentialPackDetails = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			const essential_pack = db.collection('essential_pack');
			essential_pack.find({}).toArray((essentialPackErr,essentialPackResult)=>{
				if(essentialPackErr) return next(essentialPackErr);
				if(!essentialPackResult && essentialPackResult.length <= 0) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

				/** Set options for append image full path **/
               let options = {
                    "file_url"          :   ESSENTIAL_PACK_URL,
                    "file_path"         :   ESSENTIAL_PACK_FILE_PATH,
                    "result"            :   essentialPackResult,
                    "database_field"    :   "essential_pack_image"
                };
                /** Append image with full path **/
                appendFileExistData(options).then(fileResponse=>{
                    resolve({
                        status  			: STATUS_SUCCESS,
                        result  			: (fileResponse && fileResponse.result)   ?   fileResponse.result[0]  :{},
                        essential_pack_url  : ESSENTIAL_PACK_URL
                    });
                });
            });

		});
	};//End getEssentialPackDetails()


	/**
	 * Function for User Review Rating added comment form
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.userReviewRatingUpdate = (req,res,next)=>{
		return new Promise(async resolve=>{
			/** Sanitize Data **/
			let reviewId 	= 	(req.body && req.body.review_rate_id) 	? decodeId(req.body.review_rate_id) : "";
			let comment 	= 	(req.body && req.body.comment)? req.body.comment : "";

			if(reviewId && !objectID.isValid(reviewId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}
			

			req.checkBody({
				"comment": {
                    notEmpty: true,
	                isLength:{
                        options: {
                        	min    : COMMENT_MIN_LENGTH,
                    		max    : COMMENT_MAX_LENGTH,
                        },
                        errorMessage: res.__("admin.review.please_enter_comment_min",COMMENT_MIN_LENGTH,COMMENT_MAX_LENGTH)
                    },
                    errorMessage: res.__("admin.review.please_enter_comment")
                },
			});

			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);

			/** Send error response **/
			if(errors) return resolve({status : STATUS_ERROR, message : errors});

			let updateData	=	{
				$set: {
					comment  		: comment,
					modified		: getUtcDate()
				}
			};
			
			const user_review_ratings = db.collection('user_review_ratings');
			user_review_ratings.findOneAndUpdate({_id:ObjectId(reviewId)},updateData,(reviewRatingErr,reviewRatingResult)=>{
				if(reviewRatingErr) return next(reviewRatingErr);
				/** Send success response **/
				return resolve({
					status		:	STATUS_SUCCESS,
					message		:	res.__("front.comment_has_been_added_successfully"),
				});	
			});
		});
	};//End userReviewRatingUpdate()


	/**
	 * Function to get notification list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getNotificationLists = (req, res,next)=>{
		return new Promise(async resolve=>{
			let limit 			= (req.body.limit)  ? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			let userSlug 		= (req.body.user_slug) ? req.body.user_slug : "";						
			/** Set options for get user details **/
			let optionsForUser  = {
				conditions			: 	{slug : userSlug},
				fields	:	{
					_id :1,full_name:1
				}
			};

			let userResponse =  await getUserData(req,res,next,optionsForUser);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);						
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			const collection	=	db.collection('notifications');

			asyncParallel([
				(callback)=>{
					/** Get list of notification **/
					collection.aggregate([
						{$match	: {user_id	:	ObjectId(userResponse.result._id)}},
						{$lookup :{
							"from" 			: "users",
							"localField"	: "created_by",
							"foreignField"	: "_id",
							"as" 			: "users_created_by"
						}},
						{$project :{
							_id:1,message:1,created:1,created_by:1,created_role_id:1,user_role_id:1,
							user_id:1,url:1,extra_parameters:1, notification_type:1,
							created_by_name	: {$arrayElemAt : ["$users_created_by.full_name",0]},parent_table_id:1
						}},
						{$sort: {_id : SORT_DESC}},
						{$limit : limit},
					]).toArray((err, result)=>{
						if(err || !result || result.length <=0) return callback(err, result);
						callback(err, result);
					});
				},
				(callback)=>{
					/** Get filtered records counting in notification **/
					collection.aggregate([
						{$match	: {user_id	:	ObjectId(userResponse.result._id)}},
						{$lookup :{
							"from" 			: "users",
							"localField"	: "created_by",
							"foreignField"	: "_id",
							"as" 			: "users_created_by"
						}},
						{$project :{
							_id:1,message:1,created:1,created_by:1,created_role_id:1,user_role_id:1,user_id:1,url:1,extra_parameters:1, notification_type:1,
							created_by_name	: {$arrayElemAt : ["$users_created_by.full_name",0]},parent_table_id:1
						}},
						{$count : "count"},
					]).toArray((err, filterContResult)=>{
						filterContResult	=	(filterContResult && filterContResult[0] && filterContResult[0].count)	?	filterContResult[0].count	:0;
						callback(err,filterContResult);
					});
				}
			],(err,response)=>{
				if(err) return next(err);
				let notificationsData	= (response[0]) ? response[0] : [];
				asyncEach(notificationsData,(values, asyncCallback)=>{
					let updateData	=	{
						$set: {
							"is_seen" 		: SEEN,  		
							"is_read" 		: READ,  		
							modified		: getUtcDate()
						}
					};
					collection.updateOne({_id:ObjectId(values._id),"is_seen": NOT_SEEN,"is_read": NOT_READ},updateData,(updateErr,updateResult)=>{});
					asyncCallback(null);
				},(asyncErr,asyncContent)=>{
					/** Send response **/
					return resolve({
						status			: (!asyncErr) ? STATUS_SUCCESS : STATUS_ERROR,
						notifications	: notificationsData,
						recordsTotal	: (response[1]) ? response[1] : 0,
					});
				});
			});
		});
	};//End getNotificationLists()


	/**
	 * Function to get count list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getheaderPointCounterLists = (req, res,next)=>{
		return new Promise(async resolve=>{
			//let limit 		= 	(req.body.limit)  	? parseInt(req.body.limit) : ADMIN_LISTING_LIMIT;
			let userSlug 	= 	(req.body.user_slug)? req.body.user_slug : "";						
			/** Set options for get user details **/
			let optionsForUser  = {
				conditions			: 	{slug : userSlug},
				fields	:	{
					_id :1,full_name:1
				}
			};

			let userResponse =  await getUserData(req,res,next,optionsForUser);
			if(userResponse.status != STATUS_SUCCESS) return next(userResponse.message);						
			if(!userResponse.result) return resolve({status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")});

			const collection	=	db.collection('notifications');
			asyncParallel([
				(callback)=>{
					/** Get list of notification **/
					collection.aggregate([
						{$match	: {user_id	:	ObjectId(userResponse.result._id)}},
						{$lookup :{
							"from" 			: "users",
							"localField"	: "created_by",
							"foreignField"	: "_id",
							"as" 			: "users_created_by"
						}},
						{$project :{
							_id:1,message:1,created:1,created_by:1,created_role_id:1,user_role_id:1,
							user_id:1,url:1,extra_parameters:1, notification_type:1,parent_table_id:1,
							created_by_name	: {$arrayElemAt : ["$users_created_by.full_name",0]}
						}},
						{$sort: {_id : SORT_DESC}},
						{$limit : NOTIFICATION_LIST_LIMIT},
					]).toArray((err, result)=>{
						if(err || !result || result.length <=0) return callback(err, result);
						callback(err, result);
					});
				},
				(callback)=>{
					/** Get filtered records counting in notification **/
					collection.aggregate([
						{$match	: {user_id	:	ObjectId(userResponse.result._id),"is_seen": NOT_SEEN,"is_read": NOT_READ}},
						{$count : "count"},
					]).toArray((err, filterContResult)=>{
						filterContResult	=	(filterContResult && filterContResult[0] && filterContResult[0].count)	?	filterContResult[0].count	:0;
						callback(err,filterContResult);
					});
				}
			],async(err,response)=>{
				if(err) return next(err);
				/** Send response **/
				let getReferralAmount =  await getUserReferralAmount(req,res,next,{user_id:ObjectId(userResponse.result._id)});
				return resolve({
					status				: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
					notification_data	: (response[0]) ? response[0] : [],
					notifications_count	: (response[1]) ? response[1] : [],
					user_referrals  	: (getReferralAmount && getReferralAmount.user_referrals)?getReferralAmount.user_referrals:0,
				});
				
			});
		}).catch(next);
	};//End getheaderPointCounterLists()

	/**
     * Function for host Upload Game Xls
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
    this.hostUploadGameXls = (req,res,next)=>{
    	return new Promise(async resolve=>{
	        /** Sanitize Data **/
	        req.body            = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
	        let orderId  = (req.body.order_id)  ? decodeId(req.body.order_id) : "";

			if(orderId && !objectID.isValid(orderId)){
				return resolve({ status	: STATUS_ERROR,message	: res.__("admin.system.invalid_access")})
			}


	        let conditions		= 	{_id:ObjectId(orderId)};

	        /** Configure user unique conditions **/
	        const order 	= db.collection('order');
	        order.findOne(conditions,{projection: {_id:1,order_book:1}},(err,result)=>{
	            if(err) return next(err);
	            	    
   

	            if(!result) return resolve({status : STATUS_ERROR, "message" : res.__("admin.system.invalid_access")});

	            let fileOptions    		=   {};
				let xlsxFile      		=   (req.files && req.files.upload_xls)  ?   req.files.upload_xls :"";
			    fileOptions.image     	=   xlsxFile;
			    fileOptions.filePath  	=   ORDERS_FILE_PATH;
				fileOptions.allowedExtensions	= ALLOWED_XLSX_EXTENSIONS;
				fileOptions.allowedImageError	= ALLOWED_XLSX_ERROR_MESSAGE;
				fileOptions.allowedMimeTypes	= ALLOWED_XLSX_MIME_EXTENSIONS;
				fileOptions.allowedMimeError	= ALLOWED_XLSX_MIME_ERROR_MESSAGE;


	            /** Upload user  image **/
	            moveUploadedFile(req,res,fileOptions).then(response=>{
	            	/** Send error response **/

	                if(response.status == STATUS_ERROR) return resolve({status  : STATUS_ERROR,message : [{'param':'upload_xls','msg':response.message}] });
	                /** Set update data **/
	                let updateData  =   {
	                    modified        : getUtcDate(),
	                    upload_xls 		: (response.fileName)  ?  response.fileName :""
	                };

	                /** Update user data **/
	                order.updateOne(conditions,{$set : updateData},(updateErr,result)=>{
	                	if(updateErr) return next(updateErr);
	                	return resolve({
	                        status      : STATUS_SUCCESS,
	                        message     : res.__("admin.order_xls_has_been_upload_successfully"),
	                    });
	                });
	            }).catch(next); 
	        });
	    });
    };//End hostUploadGameXls()

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

}
module.exports = new Player();
