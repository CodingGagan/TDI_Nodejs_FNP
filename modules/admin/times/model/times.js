const asyncParallel	=	require('async/parallel');

function Time() {

	/**
	 * Function to get  Time list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return render/json
	 */
	this.getTimeList = (req,res)=>{
		if(isPost(req)){
			let limit			 =	(req.body.length) ? parseInt(req.body.length) :ADMIN_LISTING_LIMIT;
			let skip			 = 	(req.body.start)  ? parseInt(req.body.start)  :DEFAULT_SKIP;
			const collection	 = 	db.collection('times');
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions);

				asyncParallel({
					records :(callback)=>{
						/** Get list of  Pricing Package's **/
						// collection.aggregate([
						// 	{$match : dataTableConfig.conditions},
						// 	{$sort 	: dataTableConfig.sort_conditions},
						// 	{$limit : limit},
						// 	{$skip  : skip},
						// 	{$project : {name:1,modified:1}},
						// ]).toArray((err, result)=>{
						// 	callback(err, result);
						// }); 
						collection.find(dataTableConfig.conditions,{projection: {_id:1,name:1,start_time:1,end_time:1,shedules_category:1,modified:1}}).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err, result)=>{
							callback(err, result);
						}); 
					},
					total_records:(callback)=>{
						/** Get total number of records in  time collection **/
						collection.countDocuments({},(err,countResult)=>{
							callback(err, countResult);
						});
					},
					filter_records:(callback)=>{
						/** Get filtered records counting in  time **/
						collection.countDocuments(dataTableConfig.conditions,(err,filterContResult)=>{
							callback(err, filterContResult);
						});
					}
				},(err, response)=>{
					/** Send response **/
					res.send({
						status			: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
						draw			: dataTableConfig.result_draw,
						data			: (response.records) ? response.records :[],
						recordsFiltered	: (response.filter_records) ? response.filter_records :0,
						recordsTotal	: (response.total_records) ? response.total_records :0
					});
				});
			});
		}else{
			/** render PricingPackage listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/times/list']);
			res.render('list');
		}
	};//End getTimeList()

	/**
	 * Function to get  Time detail
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getTimeDetails = (req, res, next)=>{
		return new Promise(resolve=>{
			let TimeId =	(req.params.id)   ? req.params.id   :"";

			/** Get  Time details **/
			const times = db.collection('times');
			times.findOne({
				_id  : ObjectId(TimeId),
			},
			{projection: {
				_id:1,name:1,start_time:1,end_time:1,modified:1,shedules_category:1
			}},(err, result)=>{
				if(err) return next(err);
				/** Send error response */
				if(!result) return resolve({status : STATUS_ERROR, message	: res.__("admin.system.invalid_access") });

				/** Send success response **/
				resolve({
					status	: STATUS_SUCCESS,
					result	: result
				});
			});
		}).catch(next);
	};// End getTimeDetails()

	/**
	 * Function for add or update  Time
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addEditTime = async (req, res,next)=>{
		let isEditable	= (req.params.id) ?	true :false;

		if(isPost(req)){
			/** Sanitize Data **/
			req.body 				= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let TimeId			=	(req.params.id) 	? 	ObjectId(req.params.id)	:ObjectId();
			console.log(req.body );
			/** Check validation **/
			req.checkBody({
				'name': {
					notEmpty: true,
					errorMessage: res.__("admin.time.please_enter_name")
				},
				'start_time': {
					notEmpty: true,
					errorMessage: res.__("admin.time.please_enter_start_time")
				},
				'end_time': {
					notEmpty: true,
					errorMessage: res.__("admin.time.please_enter_end_time")
				},
				'shedules_category': {
					notEmpty: true,
					errorMessage: res.__("admin.faq.please_enter_shedules_category"),
				},
			});


			/** parse Validation array  **/
			let errors = await parseValidation(req.validationErrors(),req);
			/** Send error response **/
			if(errors) return res.send({status	: STATUS_ERROR, message	: errors});
			const times = db.collection('times');
			/** Save  Time details **/
			times.updateOne({
				_id : TimeId
			},
			{
				$set : {
					name			:	(req.body.name) 	? req.body.name 				: '',
					start_time		:	(req.body.start_time) 	? req.body.start_time 		: '',
					end_time		:	(req.body.end_time) 	? req.body.end_time 		: '',
					shedules_category 	: 	(req.body.shedules_category) ? ObjectId(req.body.shedules_category) 	: '',
					modified 		: 	getUtcDate()
				},
				$setOnInsert: {
					created 	: 	getUtcDate(),
				}
			},{upsert: true},(err) => {
				if(err) return next(err);

				/** Send success response **/
				let message = (isEditable) ? res.__("admin.time_management.time_has_been_updated_successfully") :res.__("admin.time.time_has_been_added_successfully");
				req.flash(STATUS_SUCCESS,message);
				res.send({
					status		:	STATUS_SUCCESS,
					redirect_url:  	WEBSITE_ADMIN_URL+"times",
					message		:	message,
				});
			});
		}else{
			let result = {};
			if(isEditable){
				/** Get  Time details **/
				response  =	await getTimeDetails(req, res, next);
				if(response.status != STATUS_SUCCESS){
					/** Send error response **/
					req.flash(STATUS_ERROR,response.message);
					return res.redirect(WEBSITE_ADMIN_URL+"time");
				}
				result = response.result;
			}

			/** Render edit page  **/
			let breadcrumbs = (isEditable) ?  'admin/times/edit' :'admin/times/add';
			req.breadcrumbs(BREADCRUMBS[breadcrumbs]);

			/** Set options **/
			let options ={type : ['delivery_types']};
			/** Get Time master list **/
			getMasterList(req,res,next,options).then(response=>{
				if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				
				/** Send  susscess response */
				let finalResult = (response.result && response.result['delivery_types']) ? response.result['delivery_types'] :[];

				res.render('add_edit',{
					result		       : result,
					is_editable	       : isEditable,
					dynamic_variable   : res.__('admin.times.pricing_package'),
					shedulesCategory   : finalResult
				});

			}).catch(next);
			
		}
	};//End addEdittime()

	/**
	 * Function for delete Time
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.TimeDelete = (req, res, next)=>{
		let timeId = 	(req.params.id)	? req.params.id	:"";
		/** Remove  Time record **/
		const times = db.collection('times');
		times.deleteOne({_id : ObjectId(timeId)},(err)=>{
			if(err) return next(err);
			/** Send success response **/
			req.flash(STATUS_SUCCESS,res.__("admin.times.times_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL+"times");
		});
	};//End TimeDelete()
}
module.exports = new Time();
