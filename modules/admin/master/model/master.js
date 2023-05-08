function Master(){
	
	/**
	 * Function to get master list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 * 
	 * @return render/json
	 */
	this.getMasterList = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));

		if(isPost(req)){
			let limit			=	(req.body.length)	?	parseInt(req.body.length)	:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start)	? 	parseInt(req.body.start)	:DEFAULT_SKIP;
			const collection	=	db.collection("masters");
			const async			=	require("async");
			
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				/** Common Conditions **/
				let commonConditions = {
					dropdown_type	:	masterType
				};

				let categoryId		=	(req.params.category_id)	?	ObjectId(req.params.category_id)	: "";

				if(masterType == 'category' && categoryId != ''){
					commonConditions.category_id = categoryId;
				}

				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);
				async.parallel([
					(callback)=>{
						/** Get list of master **/
						collection.find(dataTableConfig.conditions,{projection: {_id:1,name:1,modified:1,status:1,image:1,order:1,charge:1,category_type:1,attribute_term:1,additional_term:1}}).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err,result)=>{
							/** Set options for appened image **/
							let options = {
								"file_url" 			: 	MASTER_FILE_URL,
								"file_path" 		: 	MASTER_FILE_PATH,
								"result" 			: 	result,
								"database_field" 	: 	"image"
							};
							/** Appened image with full path **/
							appendFileExistData(options).then(response=>{
								result = (response && response.result)	?	response.result	:[];
								callback(err, result);
							});	
						});
					},
					(callback)=>{
						/** Get total number of records in masters collection **/
						collection.countDocuments(commonConditions,(err,countResult)=>{ 
							callback(err, countResult);
						});
					},
					(callback)=>{
						/** Get filtered records counting in masters **/
						collection.countDocuments(dataTableConfig.conditions,(err,filterContResult)=>{
							callback(err, filterContResult);
						});
					}
				],
				(err,response)=>{
					/** Send response **/
					res.send({
						status			: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
						draw			: dataTableConfig.result_draw,
						data			: (response[0]) ? response[0] : [],
						recordsFiltered	: (response[2]) ? response[2] : 0,
						recordsTotal	: (response[1]) ? response[1] : 0
					});
				});
			});
		}else{
			let categoryId		=	(req.params.category_id)	?	req.params.category_id	: "";

			/** Render listing page **/
			req.breadcrumbs(BREADCRUMBS["admin/master/list"]);
			res.render("list",{
				type				: 	masterType,	
				displayType 		:	displayType,
				dynamic_variable	: 	displayType,
				dynamic_url			: 	masterType,
				category_id			: 	categoryId,

			});
		}		
	};//End getMasterList()
	
	/**
	 * Function for add master details
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addMaster = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));
		let categoryId		=	(req.params.category_id)	?	ObjectId(req.params.category_id)	: "";

		convertMultipartFormData(req,res).then(()=>{
			if(isPost(req)){
				/** Sanitize Data **/
				req.body = sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

				if(typeof req.body.master_descriptions === undefined || typeof req.body.master_descriptions[DEFAULT_LANGUAGE_MONGO_ID] === undefined || req.body.master_descriptions[DEFAULT_LANGUAGE_MONGO_ID] == ""){
					/** Send error response **/
					return res.send({
						status	: STATUS_ERROR,
						message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
					});
				}
				
				const clone			= 	require("clone");
				let allData			= 	req.body;
				req.body 			= 	clone(allData.master_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
				req.body.parent_id 	= 	(allData.parent_id)		?	allData.parent_id				:"";
				let name			=	(req.body.name)			? 	req.body.name.trim() 			:"";
				let description		=	(req.body.description)	? 	req.body.description 			:"";
				let parentId		=	(req.body.parent_id)	? 	ObjectId(req.body.parent_id) 	:"";
				let order			=	(req.body.order)		? 	parseInt(req.body.order)		:NOT;
				let charge			=	(req.body.charge)		? 	req.body.charge 				:"";
				let categoryType	=	(req.body.category_type)? 	req.body.category_type 			:"";
				let attributeTerm	=	(req.body.attribute_term)	? 	req.body.attribute_term 	:"";
				let additionalTerm	=	(req.body.additional_term)	? 	req.body.additional_term 	:"";



				/** Check validation **/
				req.checkBody({
					"name": {
						notEmpty: true,
						errorMessage: res.__("admin.master.please_enter_name")
					},
					'order': {
						notEmpty: true,
						errorMessage: res.__("admin.master.please_enter_order"),
						isInt: {
							errorMessage: res.__("admin.master.please_only_numeric_order",1)
						}
					},
				});

				if(masterType != 'category' && masterType != 'delivery_types'){
					req.checkBody({
						"attribute_term": {
							notEmpty: true,
							errorMessage: res.__("admin.master.please_enter_attribute_term")
						},
						"additional_term": {
							notEmpty: true,
							errorMessage: res.__("admin.master.please_enter_additional_term")
						}
					});
				}
				
				if(masterType == 'category'){
					req.checkBody({
						"description": {
							notEmpty: true,
							errorMessage: res.__("admin.master.please_enter_description")
						}
					});

					if(categoryId == ''){ 
						req.checkBody({
							"category_type": {
								notEmpty: true,
								errorMessage: res.__("admin.master.please_enter_category_type")
							}
						});
					}
				}

				if(masterType == 'delivery_types'){
					req.checkBody({
						"charge": {
							notEmpty: true,
							errorMessage: res.__("admin.master.please_enter_charge")
						},
					});
				}
				/** parse Validation array  **/
				let errors	=	parseValidation(req.validationErrors(),req);
				

				if(order <= NOT){
					if(!errors) errors =[];
					errors.push({'param':'order','msg':res.__("admin.master.please_only_numeric_order",1)});
				}


				/** Send error response **/				
				if(errors && errors.length > NOT) return res.send({status : STATUS_ERROR, message : errors});
					
				/** Check name is unique **/
				const masters = db.collection("masters");
				masters.findOne({
					dropdown_type	:	masterType,
					name			:	{$regex : '^'+cleanRegex(name)+'$',$options : 'i'}
				},{projection: {_id:1}},(err, result)=>{
					if(err) return next(err);
					
					let errMessageArray	=	[];
					if(result){
						errMessageArray.push({'param':'name','msg':res.__("admin.master.entered_name_already_exists")});
					}

					masters.findOne({dropdown_type:masterType,order:order},{projection: {_id:1,order:1}},(errOrder,resultOrder)=>{
						if(resultOrder){
							errMessageArray.push({'param':'order','msg':res.__("admin.master.order_exist")});
						}	
						/** Set options for upload image **/
						let image	= 	(req.files && req.files.category_image)	?	req.files.category_image	:"";
						let options = {
							'image' 	:	image,
							'filePath' 	: 	MASTER_FILE_PATH,
							'oldPath' 	: 	""
						};

						/** Upload master  image **/
						moveUploadedFile(req, res,options).then(response=>{	

							if(response.status == STATUS_ERROR){
								errMessageArray.push({'param':'category_image','msg':response.message});
							}else{
								var imageName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
							}
							
							if(errMessageArray.length > 0){
								/** Send error response **/
								return res.send({
									status	: STATUS_ERROR,
									message	: errMessageArray,
								});
							}
						
							/** Set requested Data **/
							let requestedData = {
								title 		:	name,	
								table_name 	: 	"masters",	
								slug_field 	: 	"slug"	
							};
						
							/** Make Slug */
							getDatabaseSlug(requestedData).then(response=>{

								let uploadTypeData = {
									name				:	name,
									description			:	description,
									charge				:	charge,
									dropdown_type		:	masterType,
									image				:	imageName,
									parent_id			:	parentId,
									order               :   order,
									master_descriptions	: 	(allData.master_descriptions) ? allData.master_descriptions :{},
									slug				: 	(response && response.title)	?	response.title	:"",
									status	 			:	ACTIVE,
									created 			:	getUtcDate(),
									modified 			: 	getUtcDate()
								}
								if(masterType == 'category') {
									uploadTypeData.category_id 	=	categoryId;
									if(categoryId == ''){ 
										uploadTypeData.category_type =	categoryType;
									}
								}
								if(masterType != 'category' && masterType != 'delivery_types'){
									uploadTypeData.attribute_term 	=	attributeTerm;
									uploadTypeData.additional_term 	=	additionalTerm;
								}

								/** Save master record **/
								masters.insertOne(uploadTypeData,(addErr,addResult)=>{
									if(addErr) return next(addErr);
									
									/** Send success response **/
									req.flash(STATUS_SUCCESS,res.__("admin.master.master_has_been_added_successfully",displayType));
									res.send({
										status			:	STATUS_SUCCESS,
										redirect_url	: 	WEBSITE_ADMIN_URL+"master/"+masterType+'/'+categoryId,
										message			:	res.__("admin.master.master_has_been_added_successfully",displayType),
									});
								});	
							});
						}).catch(next);	
					});				
				});
			}else{
				/** Render add page **/
				req.breadcrumbs(BREADCRUMBS["admin/master/add"]);
				getLanguages().then(languageList=>{
					res.render("add",{
						language_list		: 	languageList,						
						type				: 	masterType,
						displayType 		:	displayType,
						dynamic_variable	: 	displayType,
						dynamic_url			: 	masterType,
						category_id			: 	categoryId,
					});
				}).catch(next);	
			}
		});
	};//End addMaster()
	
	/**
	 * Function to get master's Detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getMasterDetails = (req,res,next)=>{	
		return new Promise(resolve=>{
			let masterId 	= 	(req.params.id) 	? 	req.params.id 	:"";
			let masterType	=	(req.params.type)	?	req.params.type	:"";
			
			/** Get master details **/
			const masters = db.collection("masters");
			masters.findOne({
					_id 			: 	ObjectId(masterId),
					dropdown_type	:	masterType,
				},
				{projection: {_id:1,name:1,status:1,master_descriptions:1,modified:1,image:1,order:1,charge:1,category_type:1,attribute_term:1,additional_term:1,image:1}},
				(err, result)=>{

					if(err) return next(err);
					
					if(!result){
						return resolve({
							status	: STATUS_ERROR,
							message	: res.__("admin.system.invalid_access")
						});
					}
					
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
				}
			);
		});
	};// End getMasterDetails().
    
	/**
	 * Function to update master's Detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.masterUpdate = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));
		let categoryId	=	(req.params.category_id)	?	req.params.category_id	: "";
		convertMultipartFormData(req,res).then(()=>{
			if(isPost(req)){

				/** Sanitize Data **/
				req.body	= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
				let id		= 	(req.params.id) 	? 	req.params.id 	:"";
				
				if(masterType =="" || id =="" || typeof req.body.master_descriptions === typeof undefined || (typeof req.body.master_descriptions[DEFAULT_LANGUAGE_MONGO_ID] === typeof undefined || !req.body.master_descriptions[DEFAULT_LANGUAGE_MONGO_ID] || req.body.master_descriptions[DEFAULT_LANGUAGE_MONGO_ID] =="")){
					/** Send error response **/
					return res.send({
						status	: STATUS_ERROR,
						message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
					});
					
				}
				
				const clone			= 	require("clone");
				let allData			=	req.body;
				req.body			=	clone(allData.master_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
				req.body.parent_id 	= 	(allData.parent_id)		?	allData.parent_id				:"";
				let name			=	(req.body.name)			? 	req.body.name.trim() 			:"";
				let description		=	(req.body.description)	? 	req.body.description 			:"";
				let charge			=	(req.body.charge)		? 	req.body.charge 				:"";
				let parentId		=	(req.body.parent_id)	? 	ObjectId(req.body.parent_id) 	:"";
				let order			=	(req.body.order)		? 	parseInt(req.body.order)		:NOT;
				let categoryType	=	(req.body.category_type)? 	req.body.category_type 			:"";
				let attributeTerm	=	(req.body.attribute_term)	? 	req.body.attribute_term 	:"";
				let additionalTerm	=	(req.body.additional_term)	? 	req.body.additional_term 	:"";

				/** Check validation **/
				req.checkBody({	
					"name": {
						notEmpty: true,
						errorMessage: res.__("admin.master.please_enter_name")
					},
					'order': {
						notEmpty: true,
						errorMessage: res.__("admin.master.please_enter_order"),
						isInt: {
							errorMessage: res.__("admin.master.please_only_numeric_order",1)
						}
					},
				});
				
				if(masterType == 'category'){
					req.checkBody({
						"description": {
							notEmpty: true,
							errorMessage: res.__("admin.master.please_enter_description")
						}
					});
					if(categoryId == ''){ 
						req.checkBody({
							"category_type": {
								notEmpty: true,
								errorMessage: res.__("admin.master.please_enter_category_type")
							}
						});
					}
				}

				if(masterType != 'category' && masterType != 'delivery_types'){
					req.checkBody({
						"attribute_term": {
							notEmpty: true,
							errorMessage: res.__("admin.master.please_enter_attribute_term")
						},
						"additional_term": {
							notEmpty: true,
							errorMessage: res.__("admin.master.please_enter_additional_term")
						}
					});
				}
				
				if(masterType == 'delivery_types'){
					req.checkBody({
						"charge": {
							notEmpty: true,
							errorMessage: res.__("admin.master.please_enter_charge")
						},
					});
				}
				
				/** parse Validation array  **/
				let errors = parseValidation(req.validationErrors(),req);

				if(order <= NOT){
					if(!errors) errors =[];
					errors.push({'param':'order','msg':res.__("admin.master.please_only_numeric_order",1)});
				}
				/** Send error response **/				
				if(errors) return res.send({status : STATUS_ERROR, message : errors});
				
				/** Check name is unique **/
				const masters = db.collection("masters");
				masters.findOne({
					dropdown_type	:	masterType,
					name			:	{$regex : '^'+cleanRegex(name)+'$',$options : 'i'},
					_id				:	{$ne : ObjectId(id)}
				},{projection: {_id:1}},
				(err, result)=>{
					if(err) return next(err);
					
					let errMessageArray = 	[];
					if(result){
						errMessageArray.push({'param':'name','msg':res.__("admin.master.entered_name_already_exists")});
					}
					masters.findOne({dropdown_type : masterType, order : order, _id	: {$ne : ObjectId(id)}},{projection: {_id:1,order:1}},(errOrder,resultOrder)=>{
						if(resultOrder){
							errMessageArray.push({'param':'order','msg':res.__("admin.master.order_exist")});
						}	

						/** Set options for upload image **/
						let image 			= 	(req.files && req.files.category_image)	? 	req.files.category_image 	:"";
						console.log(req.files,allData);
						let oldImage 		= 	(allData.old_image) 			?	allData.old_image	:"";
						let options	=	{
							'image' 	:	image,
							'filePath' 	: 	MASTER_FILE_PATH,
							'oldPath' 	: 	oldImage
						};
						
						/** Upload user image **/
						moveUploadedFile(req, res,options).then(response=>{	
							if(response.status == STATUS_ERROR){
								errMessageArray.push({'param':'category_image','msg':response.message});
							}else{
								console.log(response.fileName);
								var imageName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
							}
							
							if(errMessageArray.length > 0){
								/** Send error response **/
								return res.send({
									status	: STATUS_ERROR,
									message	: errMessageArray
								});								
							}	

							console.log(imageName,"imageName")
							let uploadTypeData = {
								name				: 	name,
								description         :   description,
								charge         		:   charge,
								parent_id			:	parentId,
								image				: 	imageName,
								order               :   order,
								master_descriptions	: 	(allData.master_descriptions) ? allData.master_descriptions :{},
								modified 			:	getUtcDate()
							}
							if(masterType == 'category') {
								if(categoryId == ''){ 
									uploadTypeData.category_type =	categoryType;
								}
							}

							if(masterType != 'category' && masterType != 'delivery_types'){
								uploadTypeData.attribute_term 	=	attributeTerm;
								uploadTypeData.additional_term 	=	additionalTerm;
							}
							
							/** Update master record **/
							masters.updateOne({
								_id : ObjectId(id)
							},
							{$set: uploadTypeData
							},(updateErr,updateResult)=>{
								if(updateErr) return next(updateErr);
								
								/** Send success response **/
								req.flash(STATUS_SUCCESS,res.__("admin.master.master_details_has_been_updated_successfully",displayType));
								res.send({
									status			: 	STATUS_SUCCESS,
									redirect_url	:	WEBSITE_ADMIN_URL+"master/"+masterType+'/'+categoryId,
									message			: 	res.__("admin.master.master_details_has_been_updated_successfully",displayType),
								});
							});
						}).catch(next);
					})
				});
			}else{
				/** Get master details **/
				getMasterDetails(req,res,next).then(masterResponse=>{
					if(masterResponse.status != STATUS_SUCCESS){
						/** Send error response **/
						req.flash("error",masterResponse.message);
						res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
						return;
					}
					/** Get language list **/
					getLanguages().then(languageList=>{
						/** Render edit page **/
						req.breadcrumbs(BREADCRUMBS["admin/master/edit"]);
						res.render("edit",{							
							language_list		: 	languageList,
							result				:	(masterResponse.result) ? masterResponse.result :{},
							type				: 	masterType,
							displayType 		:	displayType,
							dynamic_variable	: 	displayType,
							dynamic_url			: 	masterType,		
							category_id			: 	categoryId,		
						});
					}).catch(next);	
				}).catch(next);	
			}
		});
	};//End masterUpdate()
	  
	/**
	 * Function for update master status
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.updateMasterStatus = (req,res,next)=>{
		let masterType		=	(req.params.type)			?	req.params.type			: "";
		let masterId		=	(req.params.id)				?	req.params.id			: "";
		let masterStatus	=	(req.params.status==ACTIVE) ? 	DEACTIVE 				: ACTIVE;
		let displayType		= 	toTitleCase(masterType.replace(RegExp("_","g")," "));
		let categoryId		=	(req.params.category_id)	?	req.params.category_id	: "";

		/** Update master status **/
		const masters = db.collection("masters");
		masters.updateOne({
			_id : ObjectId(masterId)
		},
		{$set : {
			status		: 	masterStatus,
			modified	:	getUtcDate()			
		}},(err, result)=>{
			if(err) return next(err);
				
			/** Send success response **/
			req.flash("success",res.__("admin.master.status_has_been_updated_successfully",displayType));
			res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType+'/'+categoryId);	
		});
	};// end updateMasterStatus()
	
	/**
	 * Function for view master's Detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render
	 */
	this.viewMaster = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let masterId	=	(req.params.id)		?	req.params.id	: "";
		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));
		let categoryId	=	(req.params.category_id)	?	req.params.category_id	: "";

		/** Get master details **/
		getMasterDetails(req,res,next).then(response=>{
			if(response.status != STATUS_SUCCESS){
				/** Send error response **/
				req.flash("error",response.message);
				res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
				return;
			}
			
			/** Render view page*/
			req.breadcrumbs(BREADCRUMBS["admin/master/view"]);
			res.render("view",{
				result			: 	response.result,						
				type			: 	masterType,
				displayType 	:	displayType,
				dynamic_variable: 	displayType,
				dynamic_url		:	masterType,							
				category_id		:	categoryId,							
			});
		}).catch(next);	
	};//End viewMaster()


	/**
	 * Function for delete master
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	 this.masterDelete = (req, res, next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let masterId	=	(req.params.id)		?	req.params.id	: "";
		let categoryId	=	(req.params.category_id)	?	req.params.category_id	: "";

		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));
		const products = db.collection('products');
		products.find({ $or: [ { category : ObjectId(masterId), is_deleted : NOT_DELETED},{ size : ObjectId(masterId), is_deleted : NOT_DELETED}]}).toArray((error, result)=>{
			if(error) return next(err);
			if(result && result.length > NOT){
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.master.you_can_not_perform_this_action"));
				res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
			}else{
				/** Remove  master record **/
				const master = db.collection('masters');
				master.deleteOne({_id : ObjectId(masterId)},(err)=>{
					if(err) return next(err);
					/** Send success response **/
					req.flash(STATUS_SUCCESS,res.__("admin.master.master_deleted_successfully"));
					res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType+'/'+categoryId);
				});
			}
		});//End masterDelete()
	}
}
module.exports = new Master();
