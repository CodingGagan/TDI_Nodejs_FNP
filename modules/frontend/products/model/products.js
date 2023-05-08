const asyncParallel		= require("async/parallel");
const asyncForEachOf  	= require("async/forEachOf");
const { ObjectId } 		= require("mongodb");
function Products() {

	/**
	 * Function for render index file
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */
	this.index = (req,res,next)=>{
		asyncParallel({
			products_banner : (callback)=>{
				let collection = db.collection("banners")
				collection.findOne({"_id" : ObjectId("6052e3e05c6803f2e04da4f3")},(err,result)=>{
					/** Set options for append image full path **/
					let options = {
						"file_url"		: USERS_URL,
						"file_path"		: USERS_FILE_PATH,
						"result"		: [result],
						"database_field": "banner_image"
					};

					/** Append image with full path **/
					appendFileExistData(options).then(fileResponse => {
						callback(err, (fileResponse && fileResponse.result && fileResponse.result[0]) ? fileResponse.result[0] : {});
					});
				})
			},
			products_details : (callback)=>{

				/** Set options **/
				let options = {type : ['category', 'body', 'characteristics', 'size', 'sweetness']};
				/** Get faq master list **/
				getMasterList(req,res,next,options).then(response => {
					if(response.status !== STATUS_SUCCESS) callback(null, null);

					/** Send  susscess response */
					let bodies          = (response.result && response.result['body'])            ? response.result['body'] :[];
					let sizes           = (response.result && response.result['size'])            ? response.result['size'] :[];
					let sweetness       = (response.result && response.result['sweetness'])       ? response.result['sweetness'] :[];
					let categories      = (response.result && response.result['category'])        ? response.result['category'] :[];
					let characteristics = (response.result && response.result['characteristics']) ? response.result['characteristics'] :[];
					let result = {
						sizes	        : sizes,
						bodies	        : bodies,
						sweetness       : sweetness,
						categories	    : categories,
						characteristics	: characteristics
					}
					callback(null, result);
				}).catch(next); 
			},
			category_products : (callback)=>{
				let collection = db.collection("masters");
				collection.aggregate([
					{$match : {dropdown_type : 'category', status: ACTIVE}},
					{$sort : {order:SORT_ASC}},
					{$lookup:{
					  from: "products",
					  let: { categoryId: "$_id" },
					  pipeline: [
						{$match: {
						  $expr: {
							$and: [
							  { $eq: ["$category", "$$categoryId"] },
							  { $eq: ["$is_active", ACTIVE] },
							  { $eq: ["$is_deleted", NOT_DELETED] },
							],
						  },
						}},
						{$project :{
							slug:1, default_image :1
						}},
					  ],
					  as: "productList",
					}},
					{$project :{
					  product_list   : '$productList',
					  name      : 1, slug:1, description :1
					}},
				]).toArray((err, result)=>{
					callback(err, result);
				})
			},
			newsletter_subscribers : (callback) => {
				const collection = db.collection("pages");
				collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
					callback(err, result);
				})
			}
		},(err,response)=>{
			
			/** Render to products page **/
			res.render('products', {
				banner_detail     	: (response.products_banner) ? response.products_banner : {},
				products_details 	: (response.products_details) ? response.products_details : {},
				category_products 	: (response.category_products) ? response.category_products : [],
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : {},
				active_url 			: "products"
			});
		});
	};// end index()

	/**
	 * Function for submit contact us form
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */

	/**
	 * Function for get product's detail
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */
	this.productDetails = (req,res,next)=>{
		let slug = (req.params.slug) ? req.params.slug :'';
		asyncParallel({
			products_banner : (callback)=>{
				let collection = db.collection("banners")
				collection.findOne({"_id" : ObjectId("6052ee3dc000e90c55d0cb86")},(err,result)=>{
					/** Set options for append image full path **/
					let options = {
						"file_url": USERS_URL,
						"file_path": USERS_FILE_PATH,
						"result": [result],
						"database_field": "banner_image"
					};

					/** Append image with full path **/
					appendFileExistData(options).then(fileResponse => {
						callback(err, (fileResponse && fileResponse.result && fileResponse.result[0]) ? fileResponse.result[0] : {});
					});
				})
			},
			products_specification : (callback)=>{

				/** Set options **/
				let options = {type : ['category','sweetness', 'body']};
				/** Get faq master list **/
				getMasterList(req,res,next,options).then(response => {
					if(response.status !== STATUS_SUCCESS) callback(null, null);
					let bodies          = (response.result && response.result['body'])      ? response.result['body'] :[];
					let sweetness       = (response.result && response.result['sweetness']) ? response.result['sweetness'] :[];
					let categories   	= (response.result && response.result['category'])  ? response.result['category'] :[];
					let result = {
						bodies	        : bodies,
						sweetness       : sweetness,
						categories	    : categories
					}
					callback(null, result);
				}).catch(next); 
			},
			products_details : (callback)=>{
				let collection = db.collection("products");
				collection.aggregate([
					{$match : {slug : slug}},
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
					  as: "categoryDetials",
					}},
					{$lookup:{
						from: "masters",
						let: { sweetnessId: "$sweetness" },
						pipeline: [
						  {$match: {
							$expr: {
							  $and: [
								{ $eq: ["$_id", "$$sweetnessId"] },
							  ],
							},
						  }},
						],
						as: "sweetnessDetials",
					}},
					{$lookup:{
						from: "masters",
						let: { bodyId: "$body" },
						pipeline: [
						  {$match: {
							$expr: {
							  $and: [
								{ $eq: ["$_id", "$$bodyId"] },
							  ],
							},
						  }},
						],
						as: "bodyDetials",
					}},
					{$lookup:{
						from: "masters",
						let: { characteristicsIds: "$characteristics" },
						pipeline: [
						  {$match: {
							$expr: {
							  $and: [
								{ $in: ["$_id", "$$characteristicsIds"] },
							  ],
							},
						  }},
						  {$group:{
							_id : null,
							"data": { "$push": "$name"},
						  }}
						],
						as: "characteristicsDetials",
					}},
					{$project :{
						product_name  : 1, product_images : 1,category : 1,body:1, slug:1,
						sweetness:1,serving_temperature:1,polish_rate :1,acidity_level:1,is_sale_on:1, 
						alcohol_level:1,flavor:1,sake_meter:1, pairing_foods:1, description:1,
						shelf_talker:1,product_sheet:1,product_origin:1,pairing_foods_images:1,
						category_name : {'$arrayElemAt' : ['$categoryDetials.name',0]},
						body_name : {'$arrayElemAt' : ['$bodyDetials.name',0]},
						sweetness_name : {'$arrayElemAt' : ['$sweetnessDetials.name',0]},
						characteristics : '$characteristicsDetials.data',
					}},
				]).toArray((err, result)=>{
					if(result && result.length >NOT){
						let productDetails 			= (result[0]) ? result[0] : {};
						let productImages  			= (productDetails.product_images) ? productDetails.product_images : [];
						let servingTemperature  	= (productDetails.serving_temperature) ? productDetails.serving_temperature : [];

						/** Set options for append image full path **/
						let options = {
							"file_url"          :   PRODUCTS_URL,
							"file_path"         :   PRODUCTS_FILE_PATH,
							"result"            :   productImages,
							"database_field"    :   "image"
						};
						/** get product image **/
						appendFileExistData(options).then(fileResponse=>{
							productImages = (fileResponse && fileResponse.result && fileResponse.result)   ?   fileResponse.result :[];
							
							/*** Get product sizes */
							asyncForEachOf(productImages, (row, index, callback) => {
								let size = (row.size) ? [row.size] : []
								getMasterValues(req,res,next,{master_ids : size}).then(masterResponse=>{
									let sizeName = (masterResponse[''+row.size+'']) ? masterResponse[''+row.size+''] :'';
									productImages[index]['size_name'] = sizeName
									callback(err, productImages);
								})
							}, err => {
								
								/** Product images sort by size **/ 
								productDetails['size_images'] = productImages.sort((firstArray, seconArray) => {
									let sizeFirstArray = firstArray.size_name.toLowerCase(), sizeSecondArray = seconArray.size_name.toLowerCase();
								    if (sizeFirstArray < sizeSecondArray) return -1;
								    if (sizeFirstArray > sizeSecondArray)  return 1;
								    return 0;
								});


								/*** Get temperature type */
								asyncForEachOf(servingTemperature, (row, index, callback) => {
									let categoryId = (row.category_id) ? [row.category_id] : []
									getMasterValues(req,res,next,{master_ids : categoryId}).then(masterResponse=>{
										let tempType = (masterResponse[''+row.category_id+'']) ? masterResponse[''+row.category_id+''] :'';
										servingTemperature[index]['temp_type'] = tempType
										callback(err, servingTemperature);
									})
								}, err => {
									productDetails['serving_temperature'] = servingTemperature;

									/*** Get temperature */
									asyncForEachOf(servingTemperature, (row, index, callback) => {
										let temperatureId = (row.temperature_id) ? [row.temperature_id] : []
										getMasterValues(req,res,next,{master_ids : temperatureId}).then(masterResponse=>{
											let temperature = (masterResponse[''+row.temperature_id+'']) ? masterResponse[''+row.temperature_id+''] :'';
											servingTemperature[index]['temperature'] = temperature
											callback(err, servingTemperature);
										})
									}, err => {
										productDetails['serving_temperature'] = servingTemperature;
										callback(err, productDetails);
									})
								})
							})
						}); 
					}else{
					  callback(err, {});
					}
				})
			},
			newsletter_subscribers : (callback) => {
				const collection = db.collection("pages");
				collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
					callback(err, result);
				})
			}
		},(err,response)=>{

			/** Render to products page **/
			res.render('product-details', {
				banner_detail     		: (response.products_banner) ? response.products_banner : {},
				products_details 		: (response.products_details) ? response.products_details : {},
				products_specification	: (response.products_specification) ? response.products_specification : [],
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : {},
				active_url 				: "products"
			});
		});
	};// end index()


	/**
	 * Function for list product with filter
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */

	/** Search common condition */
	let searchCondition = {is_deleted: NOT_DELETED, is_active : ACTIVE};
	this.productList = (req,res,next)=>{
		asyncParallel({
			products_list : (callback)=>{
				/** Sanitize Data **/
				req.body        	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
				let size 			= (req.body.size) ? JSON.parse(req.body.size) : [];
				let body 			= (req.body.body) ? JSON.parse(req.body.body) : [];
				let sweetness 		= (req.body.sweetness) ? JSON.parse(req.body.sweetness) : [];
				let productName 	= (req.body.product_name) ? req.body.product_name : '';
				let characteristics = (req.body.characteristics) ? JSON.parse(req.body.characteristics) : [];
				
				/** Search size condition */
				if(size && size.length > NOT){
					let sizeObjectIds = [];
					size.map(records=>{
						sizeObjectIds.push(ObjectId(records))
					})
					searchCondition = Object.assign(searchCondition, {default_size : {$in: sizeObjectIds}})
				}else{
					searchCondition = (searchCondition['default_size']) ? delete searchCondition['default_size'] : searchCondition
				}

				/** Search body condition */
				if(body && body.length > NOT){
					let bodyObjectIds = [];
					body.map(records=>{
						bodyObjectIds.push(ObjectId(records))
					})
					searchCondition = Object.assign(searchCondition, {body : {$in: bodyObjectIds}})
				}else{
					searchCondition = (searchCondition['body']) ? delete searchCondition['body'] : searchCondition
				}

				/** Search sweetness condition */
				if(sweetness && sweetness.length > NOT){
					let sweetnessObjectIds = [];
					sweetness.map(records=>{
						sweetnessObjectIds.push(ObjectId(records))
					})
					searchCondition = Object.assign(searchCondition, {sweetness : {$in: sweetnessObjectIds}})
				}else{
					searchCondition = (searchCondition['sweetness']) ? delete searchCondition['sweetness'] : searchCondition
				}  

				/** Search characteristics condition */
				if(characteristics && characteristics.length > NOT){
					let characteristicsObjectIds = [];
					characteristics.map(records=>{
						characteristicsObjectIds.push(ObjectId(records))
					})
					searchCondition = Object.assign(searchCondition, {characteristics : {$in: characteristicsObjectIds}})
				}else{
					searchCondition = (searchCondition['characteristics']) ? delete searchCondition['characteristics'] : searchCondition
				}

				if(productName) searchCondition = Object.assign(searchCondition, {product_name : {$regex : productName, $options : 'i'}})

				/** Get list of product's **/
				let collection = db.collection("products");
				collection.find(
					searchCondition,
					{projection: {
						_id:1,slug : 1,product_name:1,default_image:1,created:1,active:1,flavor:1
					}}
				).collation(COLLATION_VALUE).sort({created : -1}).skip(0).limit(8).toArray((err, result)=>{
					/** Set options for append image full path **/
					let options = {
						"file_url"          :   PRODUCTS_URL,
						"file_path"         :   PRODUCTS_FILE_PATH,
						"result"            :   result,
						"database_field"    :   "default_image"
					};
					
					/** Append image with full path **/
					appendFileExistData(options).then(fileResponse=>{
						callback(err, (fileResponse && fileResponse.result && fileResponse.result)   ?   fileResponse.result :[]);
					});
				});
			},
			total_products : (callback)=>{
				/** Get total number of records in product collection **/
				let collection = db.collection("products");
				collection.countDocuments({is_deleted : NOT_DELETED},(err,countResult)=>{
					callback(err, countResult);
				});
			},
		},(err,response)=>{

			/** Render to products page **/
			res.send({
				status          : STATUS_SUCCESS,
				result 			: (response.products_list) ? response.products_list :[],
				products_total 	: (response.total_products) ? response.total_products :NOT,
			});
		});
	};// end productList()

	/**
	 * Function for render index file
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */

	this.vinoshipperProductList = (req,res,next)=>{
		asyncParallel({
			banner_detail : (callback) => {
                let collection = db.collection("banners")
				collection.findOne({"_id" : ObjectId("6052e49b5c6803f2e04da4f6")},(err,result)=>{
					/** Set options for append image full path **/
					let options = {
						"file_url"		: USERS_URL,
						"file_path"		: USERS_FILE_PATH,
						"result"		: [result],
						"database_field": "banner_image"
					};

					/** Append image with full path **/
					appendFileExistData(options).then(fileResponse => {
						callback(err, (fileResponse && fileResponse.result && fileResponse.result[0]) ? fileResponse.result[0] : {});
					});
				})
            },
			newsletter_subscribers : (callback) => {
				const collection = db.collection("pages");
				collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
					callback(err, result);
				})
			}
        },
		(err,response) => {
			/** Render to history page **/
			res.render('vinoshipper', {
				active_url 	: "vinoshipper", 
				banner_detail 	: (response.banner_detail) ? response.banner_detail : {},
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
			});
		});	
	}// end vinoshipperProductList()

}
module.exports = new Products();
