const asyncParallel	=	require('async/parallel');

function FilterType() {

	/**
	 * Function to get  FilterType list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return render/json
	 */
	this.getFilterTypeList = (req,res)=>{
		if(isPost(req)){
			let limit			 =	(req.body.length) ? parseInt(req.body.length) :ADMIN_LISTING_LIMIT;
			let skip			 = 	(req.body.start)  ? parseInt(req.body.start)  :DEFAULT_SKIP;
			const collection	 = 	db.collection('filter_types');
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions);

				asyncParallel({
					records :(callback)=>{
						

						collection.aggregate([
							{$match	 : dataTableConfig.conditions},
							{$lookup:{
                                from: "masters",
                                let: { categoryId: "$category" },
                                pipeline: [
                                  {$match: {
                                    $expr: {
                                      $and: [
                                        { $eq: ["$_id", "$$categoryId"] },
                                      ],
                                    },
                                  }},
                                ],
                                as: "categoryDetail",
                            }},
							{$lookup:{
                                from: "masters",
                                let: { subcategoryId: "$sub_category" },
                                pipeline: [
                                  {$match: {
                                    $expr: {
                                      $and: [
                                        { $eq: ["$category_id", "$$subcategoryId"] },
                                      ],
                                    },
                                  }},
                                ],
                                as: "subCategoryDetail",
                            }},
							{$project :	{
								id:1,name:1,modified:1,
								category_name : {'$arrayElemAt': ["$categoryDetail.name",0]},
								sub_category_name : {'$arrayElemAt': ["$subCategoryDetail.name",0]}
							}},
							{$sort  : dataTableConfig.sort_conditions},
							{$skip 	: skip},
							{$limit : limit},
						]).toArray((err, result)=>{
							callback(err,result);
						});
					},
					total_records:(callback)=>{
						/** Get total number of records in  filter_type collection **/
						collection.countDocuments({},(err,countResult)=>{
							callback(err, countResult);
						});
					},
					filter_records:(callback)=>{
						/** Get filtered records counting in  filter_type **/
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
			req.breadcrumbs(BREADCRUMBS['admin/filter_type/list']);
			res.render('list');
		}
	};//End getFilterTypeList()

	/**
	 * Function to get  FilterType detail
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getFilterTypeDetails = (req, res, next)=>{
		return new Promise(resolve=>{
			let FilterTypeId =	(req.params.id)   ? req.params.id   :"";

			/** Get  FilterType details **/
			const filter_types = db.collection('filter_types');
			filter_types.findOne({
				_id  : ObjectId(FilterTypeId),
			},
			{projection: {
				_id:1,name:1,category:1,sub_category:1,modified:1,image:1
			}},(err, result)=>{
				if(err) return next(err);
				/** Send error response */
				if(!result) return resolve({status : STATUS_ERROR, message	: res.__("admin.system.invalid_access") });

				/** Send success response **/
				// resolve({
				// 	status	: STATUS_SUCCESS,
				// 	result	: result
				// });



				/** Set options for appened image full path **/
				let options = {
					"file_url" 			: 	MASTER_FILE_URL,
					"file_path" 		: 	MASTER_FILE_PATH,
					"result" 			: 	[result],
					"database_field" 	: 	"image"
				};
				
				/** Appened image with full path **/
				appendFileExistData(options).then(imageResponse=>{
					/** Send success response **/
					let response = {
						status	: STATUS_SUCCESS,
						result	: (imageResponse && imageResponse.result && imageResponse.result[0])	?	imageResponse.result[0]	:{}
					};
					resolve(response);
				}).catch(next)

			});
		}).catch(next);
	};// End getFilterTypeDetails()

	/**
	 * Function for add or update  FilterType
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addEditFilterType = async (req, res,next)=>{
		let isEditable	= (req.params.id) ?	true :false;

		if(isPost(req)){
			/** Sanitize Data **/
			req.body 				= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let FilterTypeId			=	(req.params.id) 	? 	ObjectId(req.params.id)	:ObjectId();
			/** Check validation **/
			req.checkBody({
				'name': {
					notEmpty: true,
					errorMessage: res.__("admin.filter_type.please_enter_name")
				},
				'category': {
					notEmpty: true,
					errorMessage: res.__("admin.filter_type.please_enter_category")
				},
				'sub_category': {
					notEmpty: true,
					errorMessage: res.__("admin.faq.please_enter_sub_category"),
				},
			});


			/** parse Validation array  **/
			let errors = await parseValidation(req.validationErrors(),req);
			/** Send error response **/
			if(errors) return res.send({status	: STATUS_ERROR, message	: errors});


			/** Set options for upload image **/
			let image	= 	(req.files && req.files.image)	?	req.files.image	:"";
			let options = {
				'image' 	:	image,
				'filePath' 	: 	MASTER_FILE_PATH,
				'oldPath' 	: 	""
			};
			console.log(image,options);
			let errMessageArray = 	[];
			/** Upload master  image **/
			moveUploadedFile(req, res,options).then(response=>{	

				if(response.status == STATUS_ERROR){
					errMessageArray.push({'param':'image','msg':response.message});
				}else{
					var imageName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
				}
				console.log(imageName);

				
				if(errMessageArray.length > 0){
					/** Send error response **/
					return res.send({
						status	: STATUS_ERROR,
						message	: errMessageArray,
					});
				}

					const filter_types = db.collection('filter_types');
					/** Save  FilterType details **/
					filter_types.updateOne({
						_id : FilterTypeId
					},
					{
						$set : {
							name			:	(req.body.name) 	? req.body.name 				: '',
							category		:	(req.body.category) 	? ObjectId(req.body.category) 		: '',
							sub_category 	: 	(req.body.sub_category) ? ObjectId(req.body.sub_category) 	: '',
							modified 		: 	getUtcDate(),
							image			: 	imageName,

						},
						$setOnInsert: {
							created 	: 	getUtcDate(),
						}
					},{upsert: true},(err) => {
						if(err) return next(err);

						/** Send success response **/
						let message = (isEditable) ? res.__("admin.time_management.time_has_been_updated_successfully") :res.__("admin.filter_type.time_has_been_added_successfully");
						req.flash(STATUS_SUCCESS,message);
						res.send({
							status		:	STATUS_SUCCESS,
							redirect_url:  	WEBSITE_ADMIN_URL+"filter_type",
							message		:	message,
						});
					});
			}).catch(next);
		}else{
			let result = {};
			if(isEditable){
				/** Get  FilterType details **/
				response  =	await getFilterTypeDetails(req, res, next);
				if(response.status != STATUS_SUCCESS){
					/** Send error response **/
					req.flash(STATUS_ERROR,response.message);
					return res.redirect(WEBSITE_ADMIN_URL+"filter_type");
				}
				result = response.result;
			}

			/** Render edit page  **/
			let breadcrumbs = (isEditable) ?  'admin/filter_type/edit' :'admin/filter_type/add';
			req.breadcrumbs(BREADCRUMBS[breadcrumbs]);

			/** Set options **/
			let options ={type : ['category']};
			/** Get FilterType master list **/
			getMasterList(req,res,next,options).then(response=>{
				if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				
				/** Send  susscess response */
				let finalResult = (response.result && response.result['category']) ? response.result['category'] :[];

				res.render('add_edit',{
					result		       : result,
					is_editable	       : isEditable,
					dynamic_variable   : res.__('admin.filter_types.pricing_package'),
					categoryList   	   : finalResult
				});

			}).catch(next);
			
		}
	};//End addEdittime()

	/**
	 * Function for delete FilterType
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.FilterTypeDelete = (req, res, next)=>{
		let filterTypeId = 	(req.params.id)	? req.params.id	:"";
		/** Remove  FilterType record **/
		const filter_types = db.collection('filter_types');
		filter_types.deleteOne({_id : ObjectId(filterTypeId)},(err)=>{
			if(err) return next(err);
			/** Send success response **/
			req.flash(STATUS_SUCCESS,res.__("admin.filter_types.filter_type_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL+"filter_type");
		});
	};//End FilterTypeDelete()
}
module.exports = new FilterType();
