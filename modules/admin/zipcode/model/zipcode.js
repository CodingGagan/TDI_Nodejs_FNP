const asyncParallel	= require('async/parallel');

function Zipcode() {

	/**
	 * Function to get  Zipcode list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return render/json
	 */
	this.getZipcodeList = (req,res)=>{
		if(isPost(req)){
			let limit			 =	(req.body.length) ? parseInt(req.body.length) :ADMIN_LISTING_LIMIT;
			let skip			 = 	(req.body.start)  ? parseInt(req.body.start)  :DEFAULT_SKIP;

			const collection	 = 	db.collection('zipcodes');
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				let commonConditions = {
					city_id      : (req.params.city_id)   ? ObjectId(req.params.city_id)   :"",
                };
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);
				asyncParallel({
					records :(callback)=>{
						/** Get list of  Pricing Package's **/
						// collection.aggregate([
						// 	{$match : dataTableConfig.conditions},
						// 	{$sort 	: dataTableConfig.sort_conditions},
						// 	{$limit : limit},
						// 	{$skip  : skip},
						// 	{$project : {question:1,modified:1}},
						// ]).toArray((err, result)=>{
						// 	callback(err, result);
						// }); 
						collection.find(dataTableConfig.conditions,{projection: {_id:1,zip_code:1,city_id:1,modified:1}}).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err, result)=>{
							callback(err, result);
						}); 
					},
					total_records:(callback)=>{
						/** Get total number of records in  zipcode collection **/
						collection.countDocuments({},(err,countResult)=>{
							callback(err, countResult);
						});
					},
					filter_records:(callback)=>{
						/** Get filtered records counting in  zipcode **/
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
						recordsTotal	: (response.total_records) ? response.total_records :0,
						cityId		: (req.params.city_id)   ? ObjectId(req.params.city_id)	: ''
					});
				});
			});
		}else{
			/** render PricingPackage listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/zipcodes/list']);
			res.render('list',{
				cityId	: (req.params.city_id)   ? ObjectId(req.params.city_id)	: ''
			});
		}
	};//End getZipcodeList()

	/**
	 * Function to get  Zipcode detail
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getZipcodeDetails = (req, res, next)=>{
		return new Promise(resolve=>{
			let ZipcodeId =	(req.params.id)   ? req.params.id   :"";

			/** Get  Zipcode details **/
			const zipcodes = db.collection('zipcodes');
			zipcodes.findOne({
				_id  : ObjectId(ZipcodeId),
			},
			{projection: {
				_id:1,zip_code:1,modified:1,city_id:1
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
	};// End getZipcodeDetails()

	/**
	 * Function for add or update  Zipcode
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addEditZipcode = async (req, res,next)=>{
		let isEditable	= (req.params.id) ?	true :false;
			
		if(isPost(req)){
			/** Sanitize Data **/
			req.body 			= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			let ZipcodeId		=	(req.params.id) 	? 	ObjectId(req.params.id)	:ObjectId();
			let cityId			=	(req.body.city_id)  ? 	ObjectId(req.body.city_id)   		:"";
			/** Check validation **/
			req.checkBody({
				'zip_code': {
					notEmpty: true,
					errorMessage: res.__("admin.zipcode.please_enter_zip_code")
				}
			});

			/** parse Validation array  **/
			let errors = await parseValidation(req.validationErrors(),req);
			/** Send error response **/
			if(errors) return res.send({status	: STATUS_ERROR, message	: errors});

			const citys = db.collection('citys');
			citys.findOne({
				_id  : cityId,
			},
			{projection: {
				_id:1,region_id:1
			}},(errCity,resultCity)=>{

				if(errCity) return next(errCity);
				/** Send error response */
				if(!resultCity) return resolve({status : STATUS_ERROR, message	: res.__("admin.system.invalid_access") });
				const zipcodes = db.collection('zipcodes');
				/** Save  Zipcode details **/
				zipcodes.updateOne({
					_id : ZipcodeId
				},
				{
					$set : {
						zip_code			:	(req.body.zip_code) 	? req.body.zip_code  : '',
						city_id				:	cityId,
						region_id			:	resultCity.region_id,
						modified 			: 	getUtcDate()
					},
					$setOnInsert: {
						created 	: 	getUtcDate(),
					}
				},{upsert: true},(err) => {
					if(err) return next(err);

					/** Send success response **/
					let message = (isEditable) ? res.__("admin.zipcode_management.zipcode_has_been_updated_successfully") :res.__("admin.zipcode.zipcode_has_been_added_successfully");
					req.flash(STATUS_SUCCESS,message);
					res.send({
						status		:	STATUS_SUCCESS,
						redirect_url:  	WEBSITE_ADMIN_URL+"zipcode/"+cityId,
						message		:	message,
					});
				});
			});
						
		}else{
			let result = {};
			let cityId			=	(req.body.city_id)  ? 	req.body.city_id   		:"";
			if(isEditable){
				/** Get  Zipcode details **/
				response  =	await getZipcodeDetails(req, res, next);
				if(response.status != STATUS_SUCCESS){
					/** Send error response **/
					req.flash(STATUS_ERROR,response.message);
					return res.redirect(WEBSITE_ADMIN_URL+"zipcode/"+cityId);
				}
				result = response.result;
			}

			/** Render edit page  **/
			let breadcrumbs = (isEditable) ?  'admin/zipcodes/edit' :'admin/zipcodes/add';
			req.breadcrumbs(BREADCRUMBS[breadcrumbs]);
			/** Set options **/
			let options ={type : ['zipcode_category']};
			/** Get zipcode master list **/
			getMasterList(req,res,next,options).then(response=>{
				if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				
				/** Send  susscess response */
				let finalResult = (response.result && response.result['zipcode_category']) ? response.result['zipcode_category'] :[];

				res.render('add_edit',{
					result		       : result,
					is_editable	       : isEditable,
					dynamic_variable   : res.__('admin.zipcodes.pricing_package'),
					zipcodeCategories  : finalResult,
					cityId		   	   : (req.params.city_id)   ? ObjectId(req.params.city_id)	: ''
				});

			}).catch(next);
			
		}
	};//End addEditzipcode()

	/**
	 * Function for delete Zipcode
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.ZipcodeDelete = (req, res, next)=>{
		let zipcodeId = 	(req.params.id)	? req.params.id	:"";
		let cityId 	  = 	(req.params.city_id)	? req.params.city_id	:"";
		/** Remove  Zipcode record **/
		const zipcodes = db.collection('zipcodes');
		zipcodes.deleteOne({_id : ObjectId(zipcodeId)},(err)=>{
			if(err) return next(err);
			/** Send success response **/
			req.flash(STATUS_SUCCESS,res.__("admin.zipcodes.zipcodes_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL+"zipcode/"+cityId);
		});
	};//End ZipcodeDelete()
}
module.exports = new  Zipcode();
