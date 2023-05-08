const asyncParallel	=	require('async/parallel');

function Region() {

	/**
	 * Function to get  Region list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return render/json
	 */
	this.getRegionList = (req,res)=>{
		if(isPost(req)){
			let limit			 =	(req.body.length) ? parseInt(req.body.length) :ADMIN_LISTING_LIMIT;
			let skip			 = 	(req.body.start)  ? parseInt(req.body.start)  :DEFAULT_SKIP;
			const collection	 = 	db.collection('regions');
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
						collection.find(dataTableConfig.conditions,{projection: {_id:1,name:1,modified:1}}).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err, result)=>{
							callback(err, result);
						}); 
					},
					total_records:(callback)=>{
						/** Get total number of records in  region collection **/
						collection.countDocuments({},(err,countResult)=>{
							callback(err, countResult);
						});
					},
					filter_records:(callback)=>{
						/** Get filtered records counting in  region **/
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
			req.breadcrumbs(BREADCRUMBS['admin/regions/list']);
			res.render('list');
		}
	};//End getRegionList()

	/**
	 * Function to get  Region detail
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getRegionDetails = (req, res, next)=>{
		return new Promise(resolve=>{
			let RegionId =	(req.params.id)   ? req.params.id   :"";

			/** Get  Region details **/
			const regions = db.collection('regions');
			regions.findOne({
				_id  : ObjectId(RegionId),
			},
			{projection: {
				_id:1,name:1,region_ans:1,order:1,region_category:1,modified:1,user_type:1
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
	};// End getRegionDetails()

	/**
	 * Function for add or update  region
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addEditRegion = async (req, res,next)=>{
		let isEditable	= (req.params.id) ?	true :false;

		if(isPost(req)){
			/** Sanitize Data **/
			req.body 				= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let RegionId			=	(req.params.id) 	? 	ObjectId(req.params.id)	:ObjectId();
			/** Check validation **/
			req.checkBody({
				'name': {
					notEmpty: true,
					errorMessage: res.__("admin.region.please_enter_name")
				}
			});


			/** parse Validation array  **/
			let errors = await parseValidation(req.validationErrors(),req);
			/** Send error response **/
			if(errors) return res.send({status	: STATUS_ERROR, message	: errors});
			const regions = db.collection('regions');

			
			/** Save  Region details **/
			regions.updateOne({
				_id : RegionId
			},
			{
				$set : {
					name			:	(req.body.name) 	? req.body.name 				: '',
					modified 			: 	getUtcDate()
				},
				$setOnInsert: {
					created 	: 	getUtcDate(),
				}
			},{upsert: true},(err) => {
				if(err) return next(err);

				/** Send success response **/
				let message = (isEditable) ? res.__("admin.region_management.region_has_been_updated_successfully") :res.__("admin.region.region_has_been_added_successfully");
				req.flash(STATUS_SUCCESS,message);
				res.send({
					status		:	STATUS_SUCCESS,
					redirect_url:  	WEBSITE_ADMIN_URL+"region",
					message		:	message,
				});
			});
		}else{
			let result = {};
			if(isEditable){
				/** Get  Region details **/
				response  =	await getRegionDetails(req, res, next);
				if(response.status != STATUS_SUCCESS){
					/** Send error response **/
					req.flash(STATUS_ERROR,response.message);
					return res.redirect(WEBSITE_ADMIN_URL+"region");
				}
				result = response.result;
			}

			/** Render edit page  **/
			let breadcrumbs = (isEditable) ?  'admin/regions/edit' :'admin/regions/add';
			req.breadcrumbs(BREADCRUMBS[breadcrumbs]);

			/** Set options **/
			let options ={type : ['region_category']};
			/** Get region master list **/
			getMasterList(req,res,next,options).then(response=>{
				if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				
				/** Send  susscess response */
				let finalResult = (response.result && response.result['region_category']) ? response.result['region_category'] :[];


				res.render('add_edit',{
					result		       : result,
					is_editable	       : isEditable,
					dynamic_variable   : res.__('admin.regions.pricing_package'),
					regionCategories	   : finalResult
				});

			}).catch(next);
			
		}
	};//End addEditregion()

	/**
	 * Function for delete Region
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.RegionDelete = (req, res, next)=>{
		let regionId = 	(req.params.id)	? req.params.id	:"";
		/** Remove  Region record **/
		const regions = db.collection('regions');
		regions.deleteOne({_id : ObjectId(regionId)},(err)=>{
			if(err) return next(err);
			/** Send success response **/
			req.flash(STATUS_SUCCESS,res.__("admin.regions.regions_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL+"region");
		});
	};//End RegionDelete()


	/** Function to get sub category list **/
	this.getSubCategoryList = async (req, res, next) => {
		let categoryId = req.body.category_id ? ObjectId(req.body.category_id) : "";
		let options = {
			collections : [{
				collection			: "masters",
				columns				: ["category_id","name"],
				conditions			: {
					status 			: ACTIVE,
					dropdown_type 	: "category",
					category_id 	: categoryId,
				}
			}]
		};
		let subCategoryList = await getDropdownList(req, res, next, options);
		res.send(subCategoryList);
	}; //End getSubCategoryList

	/** Function to get Filter Type list **/
	this.getFilterTypeList = async (req, res, next) => {
		let subCategoryId = req.body.sub_category_id ? ObjectId(req.body.sub_category_id) : "";
		let options = {
			collections : [{
				collection			: "filter_types",
				columns				: ["_id","name"],
				conditions			: {
					sub_category 	: subCategoryId,
				}
			}]
		};
		let subCategoryList = await getDropdownList(req, res, next, options);
		res.send(subCategoryList);
	}; //End getFilterTypeList
	
}
module.exports = new  Region();
