const asyncParallel	= require('async/parallel');

function City() {

	/**
	 * Function to get  City list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return render/json
	 */
	this.getCityList = (req,res)=>{
		if(isPost(req)){
			let limit			 =	(req.body.length) ? parseInt(req.body.length) :ADMIN_LISTING_LIMIT;
			let skip			 = 	(req.body.start)  ? parseInt(req.body.start)  :DEFAULT_SKIP;

			const collection	 = 	db.collection('citys');
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				let commonConditions = {
                    region_id      : (req.params.region_id)   ? ObjectId(req.params.region_id)   :"",
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
						collection.find(dataTableConfig.conditions,{projection: {_id:1,city_name:1,region_id:1,modified:1}}).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err, result)=>{
							callback(err, result);
						}); 
					},
					total_records:(callback)=>{
						/** Get total number of records in  city collection **/
						collection.countDocuments({},(err,countResult)=>{
							callback(err, countResult);
						});
					},
					filter_records:(callback)=>{
						/** Get filtered records counting in  city **/
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
						regionId		: (req.params.region_id)   ? ObjectId(req.params.region_id)	: ''
					});
				});
			});
		}else{
			/** render PricingPackage listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/citys/list']);
			res.render('list',{
				regionId	: (req.params.region_id)   ? ObjectId(req.params.region_id)	: ''
			});
		}
	};//End getCityList()

	/**
	 * Function to get  City detail
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getCityDetails = (req, res, next)=>{
		return new Promise(resolve=>{
			let CityId =	(req.params.id)   ? req.params.id   :"";

			/** Get  City details **/
			const citys = db.collection('citys');
			citys.findOne({
				_id  : ObjectId(CityId),
			},
			{projection: {
				_id:1,city_name:1,modified:1,region_id:1
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
	};// End getCityDetails()

	/**
	 * Function for add or update  City
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addEditCity = async (req, res,next)=>{
		let isEditable	= (req.params.id) ?	true :false;

		if(isPost(req)){
			/** Sanitize Data **/
			req.body 			= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let CityId			=	(req.params.id) 	? 	ObjectId(req.params.id)	:ObjectId();
			/** Check validation **/
			req.checkBody({
				'city_name': {
					notEmpty: true,
					errorMessage: res.__("admin.city.please_enter_city_name")
				}
			});

			/** parse Validation array  **/
			let errors = await parseValidation(req.validationErrors(),req);
			/** Send error response **/
			if(errors) return res.send({status	: STATUS_ERROR, message	: errors});
			const citys = db.collection('citys');
			
			let regionId = (req.body.region_id)  	? ObjectId(req.body.region_id)   :"";
			/** Save  City details **/
			citys.updateOne({
				_id : CityId
			},
			{
				$set : {
					city_name			:	(req.body.city_name) 	? req.body.city_name  : '',
					region_id			:	regionId,
					modified 			: 	getUtcDate()
				},
				$setOnInsert: {
					created 	: 	getUtcDate(),
				}
			},{upsert: true},(err) => {
				if(err) return next(err);

				/** Send success response **/
				let message = (isEditable) ? res.__("admin.city_management.city_has_been_updated_successfully") :res.__("admin.city.city_has_been_added_successfully");
				req.flash(STATUS_SUCCESS,message);
				res.send({
					status		:	STATUS_SUCCESS,
					redirect_url:  	WEBSITE_ADMIN_URL+"city/"+regionId,
					message		:	message,
				});
			});
		}else{
			let result = {};
			let regionId = (req.body.region_id)  	? req.body.region_id   :"";
			if(isEditable){
				/** Get  City details **/
				response  =	await getCityDetails(req, res, next);
				if(response.status != STATUS_SUCCESS){
					/** Send error response **/
					req.flash(STATUS_ERROR,response.message);
					return res.redirect(WEBSITE_ADMIN_URL+"city/"+regionId);
				}
				result = response.result;
			}

			/** Render edit page  **/
			let breadcrumbs = (isEditable) ?  'admin/citys/edit' :'admin/citys/add';
			req.breadcrumbs(BREADCRUMBS[breadcrumbs]);
			/** Set options **/
			let options ={type : ['city_category']};
			/** Get city master list **/
			getMasterList(req,res,next,options).then(response=>{
				if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				
				/** Send  susscess response */
				let finalResult = (response.result && response.result['city_category']) ? response.result['city_category'] :[];

				res.render('add_edit',{
					result		       : result,
					is_editable	       : isEditable,
					dynamic_variable   : res.__('admin.citys.pricing_package'),
					cityCategories	   : finalResult,
					regionId		   : (req.params.region_id)   ? ObjectId(req.params.region_id)	: ''
				});

			}).catch(next);
			
		}
	};//End addEditcity()

	/**
	 * Function for delete City
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.CityDelete = (req, res, next)=>{
		let cityId 	= 	(req.params.id)	? req.params.id	:"";
		let regionId = 	(req.params.region_id)	? req.params.region_id	:"";

		/** Remove  City record **/
		const citys = db.collection('citys');
		citys.deleteOne({_id : ObjectId(cityId)},(err)=>{
			if(err) return next(err);
			/** Send success response **/
			req.flash(STATUS_SUCCESS,res.__("admin.citys.citys_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL+"city/"+regionId);
		});
	};//End CityDelete()
}
module.exports = new  City();
