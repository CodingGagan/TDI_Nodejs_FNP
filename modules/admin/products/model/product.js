const asyncParallel = require("async/parallel");
const asyncForEachOf = require("async/forEachOf");
const { ObjectId } = require('mongodb');
const e = require("express");

function Product() {
    /**
     * Function for get list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getProductList = (req, res)=>{
        if(isPost(req)){

            let limit           = (req.body.length)         ? parseInt(req.body.length)         : ADMIN_LISTING_LIMIT;
            let skip            = (req.body.start)          ? parseInt(req.body.start)          : DEFAULT_SKIP;
            let statusSearch    = (req.body.status_search)  ? parseInt(req.body.status_search)  : "";

            /** Configure DataTable conditions*/
            configDatatable(req,res,null).then(dataTableConfig=>{
                /** Set conditions **/
                let commonConditions = {
                    is_deleted      : NOT_DELETED
                };

                /** Conditions for search using status*/
                if (statusSearch != "") {
                    switch(statusSearch){
                        case SEARCHING_ACTIVE:
                            dataTableConfig.conditions.is_active       = ACTIVE;
                        break;

                        case SEARCHING_DEACTIVE:
                            dataTableConfig.conditions.is_active       = DEACTIVE;
                        break;
                        case SEARCHING_POPULAR:
                            dataTableConfig.conditions.is_popular       = ACTIVE;
                        break;

                        case SEARCHING_NOT_POPULAR:
                            dataTableConfig.conditions.is_popular       = DEACTIVE;
                        break;
                    }
                }

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);

                const collection    = db.collection("products");
                asyncParallel([
                    (callback)=>{
                        /** Get list of user's **/
                        collection.aggregate([
                            {$match: dataTableConfig.conditions},
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
                            {$project: {
                                _id:1,product_name:1,created:1,is_active:1,is_popular :1,is_sale_on:1,
                                category_name : {'$arrayElemAt': ["$categoryDetail.name",0]}
                            }},
                            {$sort : dataTableConfig.sort_conditions},
                            {$skip : skip},
                            {$limit: limit}
                        ]).collation(COLLATION_VALUE).toArray((err, result)=>{
                            callback(err, result);
                        });
                    },
                    (callback)=>{
                        /** Get total number of records in product collection **/
                        collection.countDocuments(commonConditions,(err,countResult)=>{
                            callback(err, countResult);
                        });
                    },
                    (callback)=>{
                        /** Get filtered records couting in product **/
                        collection.countDocuments(dataTableConfig.conditions,(err,filterContResult)=>{
                            callback(err, filterContResult);
                        });
                    }
                ],
                (err,response)=>{
                    /** Send response **/
                    res.send({
                        status          : (!err) ? STATUS_SUCCESS : STATUS_ERROR,
                        draw            : dataTableConfig.result_draw,
                        data            : (response[0]) ? response[0] : [],
                        recordsFiltered : (response[2]) ? response[2] : 0,
                        recordsTotal    : (response[1]) ? response[1] : 0
                    });
                });
            });
        }else{
           
            let dynamicVariable = 'Products'         
            /** render listing page **/
            req.breadcrumbs(BREADCRUMBS["admin/products/list"]);
            res.render("list",{
                dynamic_variable    : dynamicVariable,
                dynamic_url         : dynamicVariable,
            });
        }
    };//End getProductList()

    /**
     * Function for add product
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addProduct = (req,res,next)=>{
        if(isPost(req)){

            /** Sanitize Data **/
            req.body        =   sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
           
            /** Check validation **/
            req.checkBody({
                "product_name": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_name")
                },
                "category": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_category"),
                },
                "sub_category": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_sub_category"),
                },
                "filter_type": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_filter_type"),
                },
                "size": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_size"),
                },
                "weight_type": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_filter_weight_type"),
                },
                "dimention_type": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_filter_dimention_type"),
                },
                "seo_url": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_seo_url"),
                },
                "weight_value": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_weight_value"),
                },
                "dimention_value": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_dimention_value"),
                },
                "summary": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_summary")
                },
                "delivery_information": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_delivery_information")
                },
                "care_instruction": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_care_instruction")
                },
                "sku": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_sku")
                },
                "item_stock": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_item_stock")
                },
                "main_price": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_main_price")
                },
                "discount_price": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_discount_price")
                },
                "quantity": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_quantity")
                },
                "minimum_quantity": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_minimum_quantity")
                },
                "sort_order": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_sort_order")
                },
                "stock_status": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_stock_status")
                }
            });
            
            let productName         = (req.body.product_name)   ? req.body.product_name : '';
            let category            = (req.body.category)       ? req.body.category : '';
            let subCategory         = (req.body.sub_category)   ? req.body.sub_category : '';
            let weightValue        = (req.body.weight_value)   ? req.body.weight_value : '';
            let seoUrl              = (req.body.seo_url)   ? req.body.seo_url : '';
            let dimentionType       = (req.body.dimention_type)   ? req.body.dimention_type : '';
            let weightType          = (req.body.weight_type)   ? req.body.weight_type : '';
            let careInstruction     = (req.body.care_instruction)   ? req.body.care_instruction : '';
            let sku                 = (req.body.sku)         ? req.body.sku : '';
            let itemStock           = (req.body.item_stock)  ? req.body.item_stock : '';
            let mainPrice           = (req.body.main_price)  ? req.body.main_price : '';
            let discountPrice       = (req.body.discount_price)    ? req.body.discount_price : '';
            let quantity            = (req.body.quantity)      ? req.body.quantity : '';
            let minimumQuantity     = (req.body.minimum_quantity)           ? req.body.minimum_quantity : '';
            let sortOrder           = (req.body.sort_order)  ? req.body.sort_order : '';
            let summary             = (req.body.summary)        ? req.body.summary : '';
            let stockStatus         = (req.body.stock_status)   ? req.body.stock_status : '';
            let dimentionValue      = (req.body.dimention_value)   ? req.body.dimention_value : '';
            let deliveryInformation = (req.body.delivery_information)   ? req.body.delivery_information : '';
            let size                = (req.body.size)   ? req.body.size : '';
            let filterType          = (req.body.filter_type)   ? req.body.filter_type : '';
            let tagKeyword1         = (req.body.tag_keyword_1)   ? req.body.tag_keyword_1 : '';
            let tagKeyword2         = (req.body.tag_keyword_2)   ? req.body.tag_keyword_2 : '';
            let tagKeyword3         = (req.body.tag_keyword_3)   ? req.body.tag_keyword_3 : '';
            let tagKeyword4         = (req.body.tag_keyword_4)   ? req.body.tag_keyword_4 : '';

         
            /** parse Validation array  **/
            let errors = parseValidation(req.validationErrors(),req);

            /** Product sheet images validation **/
            if(!req.files || !req.files.feature_image){
                if(!errors) errors =[];
                errors.push({'param':'feature_image','msg':res.__("admin.user.please_select_feature_image")});
            }

            if(errors && errors.length != 0){
                /** Send error response **/
                return res.send({
                    status  : STATUS_ERROR,
                    message : errors,
                });
            }
            
            let insertedData = {
                product_name        :   productName,
                category            :   ObjectId(category),
                sub_category        :   ObjectId(subCategory),
                discount_price      :   discountPrice,
                main_price          :   mainPrice,
                item_stock          :   itemStock,
                sku                 :   sku,
                care_instruction    :   careInstruction,
                size                :   ObjectId(size),
                filter_type         :   ObjectId(filterType),
                weight_type         :   weightType,
                dimention_type      :   dimentionType,
                seo_url             :   seoUrl,
                weight_value        :   weightValue,
                is_active           :   ACTIVE,
                is_popular          :   NOT_POPULAR,
                is_deleted          :   NOT_DELETED,
                created             :   getUtcDate(),
                quantity            :   quantity,
                minimum_quantity    :   minimumQuantity,
                sort_order          :   sortOrder,
                summary             :   summary,
                stock_status        :   stockStatus,
                dimention_value     :   dimentionValue,
                delivery_info       :   deliveryInformation,
                tag_keyword_1       :   tagKeyword1,
                tag_keyword_2       :   tagKeyword2,
                tag_keyword_3       :   tagKeyword3,
                tag_keyword_4       :   tagKeyword4,
            }
         

            /** Set options for upload image **/
			let featureImage	= 	(req.files && req.files.feature_image)	?	req.files.feature_image	:"";
			let options = {
				'image' 	:	featureImage,
				'filePath' 	: 	MASTER_FILE_PATH,
				'oldPath' 	: 	""
			};
			let errMessageArray = 	[];
			/** Upload master  image **/
			moveUploadedFile(req, res,options).then(response=>{	

				if(response.status == STATUS_ERROR){
					errMessageArray.push({'param':'feature_image','msg':response.message});
				}else{
					insertedData.feature_image = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
				}

				if(errMessageArray.length > 0){
					/** Send error response **/
					return res.send({
						status	: STATUS_ERROR,
						message	: errMessageArray,
					});
				}

                /** Set options for upload image **/
                let recommendedImage	= 	(req.files && req.files.recommended_image_1)	?	req.files.recommended_image_1	:"";
                options = {
                    'image' 	:	recommendedImage,
                    'filePath' 	: 	MASTER_FILE_PATH,
                    'oldPath' 	: 	""
                };
                errMessageArray = 	[];
                /** Upload master  image **/
                moveUploadedFile(req, res,options).then(response=>{	

                    if(response.status == STATUS_ERROR){
                        errMessageArray.push({'param':'recommended_image_1','msg':response.message});
                    }else{
                        insertedData.recommended_image_1 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                    }

                    if(errMessageArray.length > 0){
                        /** Send error response **/
                        return res.send({
                            status	: STATUS_ERROR,
                            message	: errMessageArray,
                        });
                    }


                    /** Set options for upload image **/
                    let recommendedImage2	= 	(req.files && req.files.recommended_image_2)	?	req.files.recommended_image_2	:"";
                    options = {
                        'image' 	:	recommendedImage2,
                        'filePath' 	: 	MASTER_FILE_PATH,
                        'oldPath' 	: 	""
                    };
                    errMessageArray = 	[];
                    /** Upload master  image **/
                    moveUploadedFile(req, res,options).then(response=>{	

                        if(response.status == STATUS_ERROR){
                            errMessageArray.push({'param':'recommended_image_2','msg':response.message});
                        }else{
                            insertedData.recommended_image_2 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                        }

                        if(errMessageArray.length > 0){
                            /** Send error response **/
                            return res.send({
                                status	: STATUS_ERROR,
                                message	: errMessageArray,
                            });
                        }


                        /** Set options for upload image **/
                        let recommendedImage3	= 	(req.files && req.files.recommended_image_3)	?	req.files.recommended_image_3	:"";
                        options = {
                            'image' 	:	recommendedImage3,
                            'filePath' 	: 	MASTER_FILE_PATH,
                            'oldPath' 	: 	""
                        };
                        errMessageArray = 	[];
                        /** Upload master  image **/
                        moveUploadedFile(req, res,options).then(response=>{	

                            if(response.status == STATUS_ERROR){
                                errMessageArray.push({'param':'recommended_image_3','msg':response.message});
                            }else{
                                insertedData.recommended_image_3 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                            }

                            if(errMessageArray.length > 0){
                                /** Send error response **/
                                return res.send({
                                    status	: STATUS_ERROR,
                                    message	: errMessageArray,
                                });
                            }
                        
                            /** Set options for upload image **/
                            let recommendedImage4	= 	(req.files && req.files.recommended_image_4)	?	req.files.recommended_image_4	:"";
                            options = {
                                'image' 	:	recommendedImage4,
                                'filePath' 	: 	MASTER_FILE_PATH,
                                'oldPath' 	: 	""
                            };
                            errMessageArray = 	[];
                            /** Upload master  image **/
                            moveUploadedFile(req, res,options).then(response=>{	

                                if(response.status == STATUS_ERROR){
                                    errMessageArray.push({'param':'recommended_image_4','msg':response.message});
                                }else{
                                    insertedData.recommended_image_4 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                                }

                                if(errMessageArray.length > 0){
                                    /** Send error response **/
                                    return res.send({
                                        status	: STATUS_ERROR,
                                        message	: errMessageArray,
                                    });
                                }


                                /** Set options for upload image **/
                                let recommendedImage5	= 	(req.files && req.files.recommended_image_5)	?	req.files.recommended_image_5	:"";
                                options = {
                                    'image' 	:	recommendedImage5,
                                    'filePath' 	: 	MASTER_FILE_PATH,
                                    'oldPath' 	: 	""
                                };
                                errMessageArray = 	[];
                                /** Upload master  image **/
                                moveUploadedFile(req, res,options).then(response=>{	

                                    if(response.status == STATUS_ERROR){
                                        errMessageArray.push({'param':'recommended_image_5','msg':response.message});
                                    }else{
                                        insertedData.recommended_image_5 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                                    }

                                    if(errMessageArray.length > 0){
                                        /** Send error response **/
                                        return res.send({
                                            status	: STATUS_ERROR,
                                            message	: errMessageArray,
                                        });
                                    }

                                    /** Set options for get user slug **/
                                    let slugOptions = {
                                        title       : productName,
                                        table_name  : "products",
                                        slug_field  : "slug"
                                    };

                                    let authUserId = (req.session.user && req.session.user._id) ? req.session.user._id :'';

                                    /** Get slug **/
                                    getDatabaseSlug(slugOptions).then(slugResponse=>{
                                        insertedData['slug']        =  (slugResponse && slugResponse.title) ? slugResponse.title :"";
                                        insertedData['created_by']  =  ObjectId(authUserId);

                                        let collection = db.collection("products");
                                        /** Save product data **/
                                        collection.insertOne(insertedData,(err,result)=>{
                                            if(err) return next(err);
                                            

                                            /** Send success response **/
                                            req.flash(STATUS_SUCCESS,res.__("admin.products.product_has_been_added_successfully"));
                                            res.send({
                                                status      : STATUS_SUCCESS,
                                                redirect_url: WEBSITE_ADMIN_URL+"products",
                                                message     : res.__("admin.products.product_has_been_added_successfully"),
                                            });
                                        });
                                    }).catch(next);


                                      
			                    }).catch(next);
                            }).catch(next);
                        }).catch(next);
                    }).catch(next);
                }).catch(next);
            }).catch(next);

           
        }else{
            /** Set options **/
			let options ={type : ['category', 'body', 'characteristics', 'size', 'sweetness', 'food_pairing', 'temperature_category', 'serving_temperature']};
			/** Get faq master list **/
			getMasterList(req,res,next,options).then(response=>{
				if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				
				/** Send  susscess response */
                let bodies          = (response.result && response.result['body'])            ? response.result['body'] :[];
                let sizes           = (response.result && response.result['size'])            ? response.result['size'] :[];
                let sweetness       = (response.result && response.result['sweetness'])       ? response.result['sweetness'] :[];
                let categories      = (response.result && response.result['category'])        ? response.result['category'] :[];
                let foodPairing     = (response.result && response.result['food_pairing'])    ? response.result['food_pairing'] :[];
                let characteristics = (response.result && response.result['characteristics']) ? response.result['characteristics'] :[];
                let servingTemperature = (response.result && response.result['serving_temperature']) ? response.result['serving_temperature'] :[];
                let servingTemperatureCategory = (response.result && response.result['temperature_category']) ? response.result['temperature_category'] :[];

                /** Render add page **/
                req.breadcrumbs(BREADCRUMBS["admin/products/add"]);
				res.render('add',{
					sizes	        : sizes,
                    bodies	        : bodies,
                    sweetness       : sweetness,
                    categories	    : categories,
                    food_pairing    : foodPairing,
                    characteristics	: characteristics,
                    serving_temperature	: servingTemperature,
                    serving_temperature_category : servingTemperatureCategory,
				});

			}).catch(next); 
        }
    };//End addProduct()

    /**
     * Function for get product's Detail
     *
     * @param req   As Request Data
     * @param res   As Response Data
     *
     * @return json
     */
    let getProductDetails = (req,res,next)=>{
        return new Promise(resolve=>{
            let productId      = (req.params.id)   ?   req.params.id   :"";
            let condition   = {
                _id             : ObjectId(productId),
                is_deleted      : NOT_DELETED,
            };

            const collection = db.collection("products");
            collection.findOne(condition,(err, result)=>{
                if(err) return next(err);

                if(!result){
                    /** Send error response **/
                    let response = {
                        status  : STATUS_ERROR,
                        message : res.__("admin.system.invalid_access")
                    };
                    return resolve(response);
                }

                resolve({
                    status  : STATUS_SUCCESS,
                    result  : result
                });
            });
        });
    };//End getProductDetails()

    /**
     * Function for update product's Detail
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
    this.editProduct  = (req,res,next)=>{
        if(isPost(req)){

            /** Sanitize Data **/
            req.body        =   sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

            /** Check validation **/
            req.checkBody({
                "product_name": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_name")
                },
                "category": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_category"),
                },
                "sub_category": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_sub_category"),
                },
                "filter_type": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_filter_type"),
                },
                "size": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_size"),
                },
                "weight_type": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_filter_weight_type"),
                },
                "dimention_type": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_filter_dimention_type"),
                },
                "seo_url": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_seo_url"),
                },
                "weight_value": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_weight_value"),
                },
                "dimention_value": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_dimention_value"),
                },
                "summary": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_summary")
                },
                "delivery_information": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_delivery_information")
                },
                "care_instruction": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_care_instruction")
                },
                "sku": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_sku")
                },
                "item_stock": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_item_stock")
                },
                "main_price": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_main_price")
                },
                "discount_price": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_discount_price")
                },
                "quantity": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_quantity")
                },
                "minimum_quantity": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_minimum_quantity")
                },
                "sort_order": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_sort_order")
                },
                "stock_status": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_stock_status")
                }
            });

            let productName         = (req.body.product_name)   ? req.body.product_name : '';
            let category            = (req.body.category)       ? req.body.category : '';
            let subCategory         = (req.body.sub_category)   ? req.body.sub_category : '';
            let weightValue        = (req.body.weight_value)   ? req.body.weight_value : '';
            let seoUrl              = (req.body.seo_url)   ? req.body.seo_url : '';
            let dimentionType       = (req.body.dimention_type)   ? req.body.dimention_type : '';
            let weightType          = (req.body.weight_type)   ? req.body.weight_type : '';
            let careInstruction     = (req.body.care_instruction)   ? req.body.care_instruction : '';
            let sku                 = (req.body.sku)         ? req.body.sku : '';
            let itemStock           = (req.body.item_stock)  ? req.body.item_stock : '';
            let mainPrice           = (req.body.main_price)  ? req.body.main_price : '';
            let discountPrice       = (req.body.discount_price)    ? req.body.discount_price : '';
            let quantity            = (req.body.quantity)      ? req.body.quantity : '';
            let minimumQuantity     = (req.body.minimum_quantity)           ? req.body.minimum_quantity : '';
            let sortOrder           = (req.body.sort_order)  ? req.body.sort_order : '';
            let summary             = (req.body.summary)        ? req.body.summary : '';
            let stockStatus         = (req.body.stock_status)   ? req.body.stock_status : '';
            let dimentionValue      = (req.body.dimention_value)   ? req.body.dimention_value : '';
            let deliveryInformation = (req.body.delivery_information)   ? req.body.delivery_information : '';
            let size                = (req.body.size)   ? req.body.size : '';
            let filterType          = (req.body.filter_type)   ? req.body.filter_type : '';
            let tagKeyword1         = (req.body.tag_keyword_1)   ? req.body.tag_keyword_1 : '';
            let tagKeyword2         = (req.body.tag_keyword_2)   ? req.body.tag_keyword_2 : '';
            let tagKeyword3         = (req.body.tag_keyword_3)   ? req.body.tag_keyword_3 : '';
            let tagKeyword4         = (req.body.tag_keyword_4)   ? req.body.tag_keyword_4 : '';
            
            /** parse Validation array  **/
            let errors = parseValidation(req.validationErrors(),req);

            if(errors && errors.length != 0){
                /** Send error response **/
                return res.send({
                    status  : STATUS_ERROR,
                    message : errors,
                });
            }

            let authUserId = (req.session.user && req.session.user._id) ? req.session.user._id :'';
            let sizeWithImage = [];
            let removeImages  = [];
           
            let updatedData = {
                product_name        :   productName,
                category            :   ObjectId(category),
                sub_category        :   ObjectId(subCategory),
                discount_price      :   discountPrice,
                main_price          :   mainPrice,
                item_stock          :   itemStock,
                sku                 :   sku,
                care_instruction    :   careInstruction,
                size                :   ObjectId(size),
                filter_type         :   ObjectId(filterType),
                weight_type         :   weightType,
                dimention_type      :   dimentionType,
                seo_url             :   seoUrl,
                weight_value        :   weightValue,
               // is_active           :   ACTIVE,
               // is_popular          :   NOT_POPULAR,
               // is_deleted          :   NOT_DELETED,
                modified            :   getUtcDate(),
                quantity            :   quantity,
                minimum_quantity    :   minimumQuantity,
                sort_order          :   sortOrder,
                summary             :   summary,
                stock_status        :   stockStatus,
                dimention_value     :   dimentionValue,
                delivery_info       :   deliveryInformation,
                tag_keyword_1       :   tagKeyword1,
                tag_keyword_2       :   tagKeyword2,
                tag_keyword_3       :   tagKeyword3,
                tag_keyword_4       :   tagKeyword4,
            }

             /** Set options for upload image **/
			let featureImage	= 	(req.files && req.files.feature_image)	?	req.files.feature_image	:"";
			let options = {
				'image' 	:	featureImage,
				'filePath' 	: 	MASTER_FILE_PATH,
				'oldPath' 	: 	""
			};
			let errMessageArray = 	[];
			/** Upload master  image **/
			moveUploadedFile(req, res,options).then(response=>{	

				if(response.status == STATUS_ERROR){
					errMessageArray.push({'param':'feature_image','msg':response.message});
				}else{
					updatedData.feature_image = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
				}

				if(errMessageArray.length > 0){
					/** Send error response **/
					return res.send({
						status	: STATUS_ERROR,
						message	: errMessageArray,
					});
				}

                /** Set options for upload image **/
                let recommendedImage	= 	(req.files && req.files.recommended_image_1)	?	req.files.recommended_image_1	:"";
                options = {
                    'image' 	:	recommendedImage,
                    'filePath' 	: 	MASTER_FILE_PATH,
                    'oldPath' 	: 	""
                };
                errMessageArray = 	[];
                /** Upload master  image **/
                moveUploadedFile(req, res,options).then(response=>{	

                    if(response.status == STATUS_ERROR){
                        errMessageArray.push({'param':'recommended_image_1','msg':response.message});
                    }else{
                        updatedData.recommended_image_1 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                    }

                    if(errMessageArray.length > 0){
                        /** Send error response **/
                        return res.send({
                            status	: STATUS_ERROR,
                            message	: errMessageArray,
                        });
                    }


                    /** Set options for upload image **/
                    let recommendedImage2	= 	(req.files && req.files.recommended_image_2)	?	req.files.recommended_image_2	:"";
                    options = {
                        'image' 	:	recommendedImage2,
                        'filePath' 	: 	MASTER_FILE_PATH,
                        'oldPath' 	: 	""
                    };
                    errMessageArray = 	[];
                    /** Upload master  image **/
                    moveUploadedFile(req, res,options).then(response=>{	

                        if(response.status == STATUS_ERROR){
                            errMessageArray.push({'param':'recommended_image_2','msg':response.message});
                        }else{
                            updatedData.recommended_image_2 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                        }

                        if(errMessageArray.length > 0){
                            /** Send error response **/
                            return res.send({
                                status	: STATUS_ERROR,
                                message	: errMessageArray,
                            });
                        }


                        /** Set options for upload image **/
                        let recommendedImage3	= 	(req.files && req.files.recommended_image_3)	?	req.files.recommended_image_3	:"";
                        options = {
                            'image' 	:	recommendedImage3,
                            'filePath' 	: 	MASTER_FILE_PATH,
                            'oldPath' 	: 	""
                        };
                        errMessageArray = 	[];
                        /** Upload master  image **/
                        moveUploadedFile(req, res,options).then(response=>{	

                            if(response.status == STATUS_ERROR){
                                errMessageArray.push({'param':'recommended_image_3','msg':response.message});
                            }else{
                                updatedData.recommended_image_3 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                            }

                            if(errMessageArray.length > 0){
                                /** Send error response **/
                                return res.send({
                                    status	: STATUS_ERROR,
                                    message	: errMessageArray,
                                });
                            }
                        
                            /** Set options for upload image **/
                            let recommendedImage4	= 	(req.files && req.files.recommended_image_4)	?	req.files.recommended_image_4	:"";
                            options = {
                                'image' 	:	recommendedImage4,
                                'filePath' 	: 	MASTER_FILE_PATH,
                                'oldPath' 	: 	""
                            };
                            errMessageArray = 	[];
                            /** Upload master  image **/
                            moveUploadedFile(req, res,options).then(response=>{	

                                if(response.status == STATUS_ERROR){
                                    errMessageArray.push({'param':'recommended_image_4','msg':response.message});
                                }else{
                                    updatedData.recommended_image_4 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                                }

                                if(errMessageArray.length > 0){
                                    /** Send error response **/
                                    return res.send({
                                        status	: STATUS_ERROR,
                                        message	: errMessageArray,
                                    });
                                }


                                /** Set options for upload image **/
                                let recommendedImage5	= 	(req.files && req.files.recommended_image_5)	?	req.files.recommended_image_5	:"";
                                options = {
                                    'image' 	:	recommendedImage5,
                                    'filePath' 	: 	MASTER_FILE_PATH,
                                    'oldPath' 	: 	""
                                };
                                errMessageArray = 	[];
                                /** Upload master  image **/
                                moveUploadedFile(req, res,options).then(response=>{	

                                    if(response.status == STATUS_ERROR){
                                        errMessageArray.push({'param':'recommended_image_5','msg':response.message});
                                    }else{
                                        updatedData.recommended_image_5 = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                                    }

                                    if(errMessageArray.length > 0){
                                        /** Send error response **/
                                        return res.send({
                                            status	: STATUS_ERROR,
                                            message	: errMessageArray,
                                        });
                                    }

                                    /** Save product data **/
                                    let productId  = (req.params.id)   ?   req.params.id   :"";
                                    let collection = db.collection("products");
                                    collection.updateOne({_id : ObjectId(productId)},{$set:updatedData},(err,result)=>{
                                        if(err) return next(err);

                                        /** Send success response **/
                                        req.flash(STATUS_SUCCESS,res.__("admin.products.product_has_been_updated_successfully"));
                                        res.send({
                                            status      : STATUS_SUCCESS,
                                            redirect_url: WEBSITE_ADMIN_URL+"products",
                                            message     : res.__("admin.products.product_has_been_updated_successfully"),
                                        });
                                    });




                                      
			                    }).catch(next);
                            }).catch(next);
                        }).catch(next);
                    }).catch(next);
                }).catch(next);
            }).catch(next);

           
        }else{

            /** Get product details **/
            getProductDetails(req, res,next).then(response=>{
                if(response.status != STATUS_SUCCESS){
                    /** Send error response **/
                    req.flash(STATUS_ERROR,response.message);
                    return res.redirect(WEBSITE_ADMIN_URL+"products/");
                }
                let result =  (response.result) ? response.result :{};

                /** Set options **/
                let options ={type : ['category', 'body', 'characteristics', 'size', 'sweetness', 'food_pairing', 'temperature_category', 'serving_temperature']};
                /** Get faq master list **/
                getMasterList(req,res,next,options).then(response=>{
                    if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
                    
                    /** Send  susscess response */
                    let bodies          = (response.result && response.result['body'])            ? response.result['body'] :[];
                    let sizes           = (response.result && response.result['size'])            ? response.result['size'] :[];
                    let sweetness       = (response.result && response.result['sweetness'])       ? response.result['sweetness'] :[];
                    let categories      = (response.result && response.result['category'])        ? response.result['category'] :[];
                    let foodPairing     = (response.result && response.result['food_pairing'])    ? response.result['food_pairing'] :[];
                    let characteristics = (response.result && response.result['characteristics']) ? response.result['characteristics'] :[];
                    let servingTemperature = (response.result && response.result['serving_temperature']) ? response.result['serving_temperature'] :[];
                    let servingTemperatureCategory = (response.result && response.result['temperature_category']) ? response.result['temperature_category'] :[];

                    /*** Set Characteristics  as string in array */
                    let selectedCharacteristics = (result.characteristics) ? result.characteristics :[]
                    let selCharacteristics = [];
                    asyncForEachOf(selectedCharacteristics, (row, index, callback) => {
                        selCharacteristics.push(String(selectedCharacteristics[index]))
                        callback();
                    }, err => {
                        if(err) return next();

                        result['characteristics'] = selCharacteristics
                        
                        /** Render edit page **/
                        req.breadcrumbs(BREADCRUMBS["admin/products/edit"]);
                        res.render('edit',{
                            sizes	        : sizes,
                            result          : result,
                            bodies	        : bodies,
                            sweetness       : sweetness,
                            sizes           : sizes,
                            categories	    : categories,
                            food_pairing    : foodPairing,
                            characteristics	: characteristics,
                            serving_temperature	: servingTemperature,
                            serving_temperature_category : servingTemperatureCategory,
                        });
                    });  
                }).catch(next);
            }).catch(next);
        }
    };//End editUser()

    /**
     * Function for view user's Detail
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render
     */
    this.viewProductDetails = (req,res,next)=>{
        console.log("sdsdsdds");
        let productId      = (req.params.id)  ? req.params.id  : "";

        /*** Set conditions */
        let conditions =  {
            _id  : ObjectId(productId),
        };

        /** Get Product details **/
        const collection = db.collection("products");
        collection.aggregate([
            {$match : conditions},
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
                as: "sweetnessDetail",
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
                as: "bodyDetail",
            }},
            {$lookup:{
                from: "masters",
                let: { characteristicsId: "$characteristics" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $in: ["$_id", "$$characteristicsId"] },
                      ],
                    },
                  }},
                  {$group:{
                    _id : null,
                    "data": { "$push": "$name"},
                  }}
                ],
                as: "characteristicsDetail",
            }},
            
            {$project:{
                product_name  : 1, product_images : 1,category : 1,body:1, slug:1,product_origin:1,
                sweetness:1,serving_temperature:1,polish_rate :1,acidity_level:1, product_sheet:1,
                alcohol_level:1,flavor:1,sake_meter:1, pairing_foods:1, description:1,shelf_talker:1,
                is_active : 1, modified :1, created: 1,is_popular:1,pairing_foods_images:1,polish_rate:1,
                category_name : {'$arrayElemAt' : ['$categoryDetail.name',0]},
                body_name : {'$arrayElemAt' : ['$bodyDetail.name',0]},
                sweetness_name : {'$arrayElemAt' : ['$sweetnessDetail.name',0]},
                characteristics : '$characteristicsDetail.data',
            }},
            {$unwind : "$serving_temperature"},
            {$lookup:{
                from: "masters",
                let: { categoryId: "$serving_temperature.category_id" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$categoryId"] },
                      ],
                    },
                  }},
                ],
                as: "servingTemperatureCategoryDetail",
            }},
            {$lookup:{
                from: "masters",
                let: { temperatureId: "$serving_temperature.temperature_id" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$temperatureId"] },
                      ],
                    },
                  }},
                ],
                as: "servingTemperatureTemperatureDetail",
            }},
            {$group:{
                _id : "$_id",
                product_name : { $first: '$product_name'},
                product_images : { $first: '$product_images'},
                category : { $first: '$category'},
                slug : { $first: '$slug'},
                is_popular : { $first: '$is_popular'},
                serving_temperature : { $push: { 
                    temp_name : {'$arrayElemAt':['$servingTemperatureTemperatureDetail.name',0]},
                    category_name : {'$arrayElemAt':['$servingTemperatureCategoryDetail.name',0]},
                    rating : '$serving_temperature.rating',
                }},
                alcohol_level : { $first: '$alcohol_level'},
                polish_rate : { $first: '$polish_rate'},
                acidity_level : { $first: '$acidity_level'},
                flavor : { $first: '$flavor'},
                sake_meter : { $first: '$sake_meter'},
                pairing_foods : { $first: '$pairing_foods'},
                product_origin : { $first: '$product_origin'},
                product_sheet : { $first: '$product_sheet'},
                shelf_talker : { $first: '$shelf_talker'},
                pairing_foods_images : { $first: '$pairing_foods_images'},
                description : { $first: '$description'}, 
                is_active : { $first: '$is_active'}, 
                modified : { $first: '$modified'}, 
                created : { $first: '$created'}, 
                category_name : { $first: '$category_name'}, 
                body_name : { $first: '$body_name'}, 
                sweetness_name : { $first: '$sweetness_name'}, 
                characteristics : { $first: '$characteristics'}, 
            }}
        ]).toArray((err, results)=>{
            if(err) return next(err);
            let result = (results && results.length > 0 && results[0]) ? results[0] : null;
            if(!result){
                /** Send error response **/
                req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
                res.redirect(WEBSITE_ADMIN_URL+"products/");
                return;
            }

            if(result && result.is_deleted == DELETED){
                /** Send error response **/
                req.flash(STATUS_ERROR,res.__("admin.product.this_product_is_deleted_from_the_system"));
                res.redirect(WEBSITE_ADMIN_URL+"products/");
                return;
            }

            /** Set options for append image full path **/
            let options = {
                "file_url"          :   PRODUCTS_URL,
                "file_path"         :   PRODUCTS_FILE_PATH,
                "result"            :   result.product_images,
                "database_field"    :   "image"
            };
            
            /** Append image with full path **/
            appendFileExistData(options).then(fileResponse=>{
                let productImages = (fileResponse && fileResponse.result && fileResponse.result)   ?   fileResponse.result :[]
                result['product_images'] = productImages

                /** Render view page*/
                req.breadcrumbs(BREADCRUMBS["admin/products/view"]);
                res.render("view",{
                    result  : result,
                });
            });
        });
    };//End viewProductDetails()

    /**
     * Function for update product's status
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.updateProductStatus = (req,res,next)=>{
        let productId   = (req.params.id)           ? req.params.id         : "";
        let userStatus  = (req.params.status)       ? req.params.status     : "";
        let statusType  = (req.params.status_type)  ? req.params.status_type: "";

        /** Set update data **/
        let updateData = {modified  : getUtcDate()};
        if(statusType == ACTIVE_INACTIVE_STATUS) updateData.is_active = (userStatus==ACTIVE) ? DEACTIVE :ACTIVE;

        /** Update products status*/
        const collection = db.collection("products");
        collection.updateOne({_id : ObjectId(productId)},{$set :updateData},(err,result)=>{
            if(err) return next(err);

            /** Send success response **/
            req.flash(STATUS_SUCCESS,res.__("admin.products.product_status_has_been_updated_successfully"));
            res.redirect(WEBSITE_ADMIN_URL+"products/");
        });
    };//End updateProductStatus()

        /**
     * Function for update product's status(Popular)
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.popularProductStatus = (req,res,next)=>{
        let productId   = (req.params.id)           ? req.params.id         : "";
        let userStatus  = (req.params.status)       ? req.params.status     : "";
        let statusType  = (req.params.status_type)  ? req.params.status_type: "";

        /** Set update data **/
        let updateData = {modified  : getUtcDate()};
        if(statusType == ACTIVE_INACTIVE_STATUS) updateData.is_popular = (userStatus==ACTIVE) ? DEACTIVE :ACTIVE;

        /** Update products status*/
        const collection = db.collection("products");
        collection.updateOne({_id : ObjectId(productId)},{$set :updateData},(err,result)=>{
            if(err) return next(err);

            /** Send success response **/
            req.flash(STATUS_SUCCESS,res.__("admin.products.product_status_has_been_updated_successfully"));
            res.redirect(WEBSITE_ADMIN_URL+"products/");
        });
    };//End updateProductStatus()

    /**
     * Function for update product's status(sale on)
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.isSaleOnProductStatus = (req,res,next)=>{
        let productId   = (req.params.id)           ? req.params.id         : "";
        let userStatus  = (req.params.status)       ? req.params.status     : "";
        let statusType  = (req.params.status_type)  ? req.params.status_type: "";

        /** Set update data **/
        let updateData = {modified  : getUtcDate()};
        if(statusType == ACTIVE_INACTIVE_STATUS) updateData.is_sale_on = (userStatus==ACTIVE) ? DEACTIVE :ACTIVE;

        /** Update products status*/
        const collection = db.collection("products");
        collection.updateOne({_id : ObjectId(productId)},{$set :updateData},(err,result)=>{
            if(err) return next(err);

            /** Send success response **/
            req.flash(STATUS_SUCCESS,res.__("admin.products.product_status_has_been_updated_successfully"));
            res.redirect(WEBSITE_ADMIN_URL+"products/");
        });
    };//End isSaleOnProductStatus()

    /**
     * Function for delete product
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.deleteProduct = (req,res,next)=>{
        /** Delete user*/
        let productId       =   (req.params.id) ? req.params.id : "";
        const collection    =   db.collection("products");
        collection.updateOne(
            {_id : ObjectId(productId)},
            {$set : {
                is_deleted  : DELETED,
                deleted_at  : getUtcDate(),
                modified    : getUtcDate()
            }},(err,result)=>{
                if(err) return next(err);

                /** Send success response **/
                req.flash(STATUS_SUCCESS,res.__("admin.products.product_has_been_deleted_successfully"));
                res.redirect(WEBSITE_ADMIN_URL+"products");
            }
        );
    };//End deleteProduct()


    /**
     * Function for get list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getProductPlacesList = (req,res,next)=>{

        if(req.method == 'POST'){
            
            /** Sanitize Data **/
            req.body        =   sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
            let productId   =   (req.params.product_id) ? ObjectId(req.params.product_id) :"";
            let regionId    =   req.body.region_id ? JSON.parse(req.body.region_id) : req.body.region_id;
            let cityId      =   req.body.city_id ? JSON.parse(req.body.city_id) : req.body.city_id;
            let zipcodeId   =   req.body.zipcode_id ? JSON.parse(req.body.zipcode_id) : req.body.zipcode_id;
            let collection = db.collection("products_places");
            /** Save product data **/
            if(typeof regionId !== typeof undefined && typeof cityId !== typeof undefined && typeof zipcodeId !== typeof undefined){
 
                        // let insertedData = {
                        //     product_id          :   productId,
                        //     zipcode_id          :   zipcodeId,
                        //     city_id             :   cityId,
                        //     region_id           :   regionId,
                        // }
                        // console.log(insertedData);


                        let insertedDataContent = [];
                        asyncForEachOf(zipcodeId, (row, index, callback) => {
                            asyncForEachOf(row, (row1, index1, callback1) => {
                                insertedDataContent.push({
                                    "zip": row1,
                                    "region_id": ObjectId(index),
                                    "city_id": ObjectId(index1),
                                    "product_id": productId,
                                    "city_ids": cityId,
                                });
                                callback1();
                            }, err => {    
                                if(err) return next();
                            });
                            callback();
                        }, err => {     
                            if(err) return next();                    
                            collection.deleteMany({product_id: productId},(errDelete)=>{
                                if(errDelete) return next(errDelete);
                                collection.insertMany(insertedDataContent,(err,result)=>{
                                    console.log(result,err);
                                    if(err) return next(err);
                                    /** Send success response **/
                                    req.flash(STATUS_SUCCESS,res.__("Product has been added places successfully"));
                                    res.send({
                                        status      : STATUS_SUCCESS,
                                        redirect_url: WEBSITE_ADMIN_URL+"products/product_places_details/"+productId,
                                        message     : res.__("Product has been added places successfully"),
                                    });
                                    return;

                                });
                            });
                        }); 
            }else{            
               // req.flash(STATUS_ERROR,res.__("Please select valid value"));
                res.send({
                    status      : STATUS_ERROR,
                    redirect_url: WEBSITE_ADMIN_URL+"products/product_places_details/"+productId,
                    message     : res.__("Please select valid value"),
                });
            }
            

        }else{

            return new Promise(resolve=>{
                let productId   =   (req.params.product_id)   ?   req.params.product_id   :"";
                let dynamicVariable = 'Products'         

                /** Get  Time details **/
                const regions = db.collection('regions');
                
                regions.find({},{projection : {_id:1,name:1,modified:1}}).toArray((err,result)=>{
                    if(err && result.length < 1) return resolve({});
                    /** Send response **/
                    req.breadcrumbs(BREADCRUMBS["admin/products/list"]);
                    res.render("product_places_list",{
                        dynamic_variable : dynamicVariable,
                        dynamic_url      : dynamicVariable,
                        product_id       : productId,
                        result           : result,
                    });
                });
            }).catch(next);
        }
    };//End viewMaster()


    this.getProductPlaceCityList = (req,res,next)=>{
        return new Promise(resolve=>{
            let regionId   =   (req.params.region_id) ? ObjectId(req.params.region_id) :"";
			/** Get  Time details **/
			const citys = db.collection('citys');
            let finalHtml	= "";
            citys.find({region_id 	: regionId},{projection : {_id:1,city_name:1,modified:1}}).toArray((err,result)=>{
                if(err && result.length < 1) return resolve({});
                /** Send response **/
                for(let i=0;i<result.length;i++){
                    let records 		= (result[i]) ? result[i] : "";
                    finalHtml 	+= '<input type="checkbox" id='+records['_id']+' name="city_id[]"  class="checkbox_city" value='+records['_id']+'><label for="vehicle1">'+records['city_name']+'</label></br>'+
                    '<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12 hide zipdata" id=main_zip_'+records['_id']+'><div class="card"><div class="body bg-cyan" id=body_content_zip_'+records['_id']+'></div></div></div>';
                }
                return res.send({
                    status  : STATUS_SUCCESS,
                    final_html_data	: 	finalHtml
                });
            });
		}).catch(next);
    };//End viewMaster()


    this.getProductPlaceZipCodeList = (req,res,next)=>{
        return new Promise(resolve=>{
            let cityId   =   (req.params.city_id) ? ObjectId(req.params.city_id) :"";
			/** Get  Time details **/
			const zipcodes = db.collection('zipcodes');
            let finalHtml	= "";
            zipcodes.find({city_id :cityId},{projection : {_id:1,zip_code:1,modified:1,city_id:1,region_id:1}}).toArray((err,result)=>{
                if(err && result.length < 1) return resolve({});
                /** Send response **/
                for(let i=0;i<result.length;i++){
                    let records 		= (result[i]) ? result[i] : "";
                    console.log(records);
                    finalHtml 	+= '<input type="checkbox" id='+records['_id']+' name=zipcode_id['+records['region_id']+']['+records['city_id']+'][] value='+records['_id']+'><label for="vehicle1">'+records['zip_code']+'</label></br>';
                }
                return res.send({
                    status  : STATUS_SUCCESS,
                    final_html_data	: 	finalHtml
                });
            });
		}).catch(next);
    };//End viewMaster()


    /**
     * Function for get list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getProductShedulePriceList = (req,res,next)=>{

        if(req.method == 'POST'){
            
            /** Sanitize Data **/
            req.body        =   sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
            let productId   =   (req.params.product_id) ? ObjectId(req.params.product_id) :"";
            let charges     =   req.body.charges ? JSON.parse(req.body.charges) : req.body.charges;
            let zipcodeIds  =   req.body.zipcheck ? JSON.parse(req.body.zipcheck) : req.body.zipcheck;
            let collection = db.collection("products_delivery_time");
            /** Save product data **/
            if(typeof zipcodeIds !== typeof undefined && typeof charges !== typeof undefined && typeof productId !== typeof undefined){
    
                        let insertedData = {
                            product_id          :   productId,
                            charges             :   charges,
                            zips                :   zipcodeIds,
                        }

                        collection.deleteOne({product_id: productId},(errDelete)=>{
                            if(errDelete) return next(errDelete);
                            
                            collection.insertOne(insertedData,(err,result)=>{
                                if(err) return next(err);
                                /** Send success response **/
                                req.flash(STATUS_SUCCESS,res.__("Product has been added places successfully"));
                                res.send({
                                    status      : STATUS_SUCCESS,
                                    redirect_url: WEBSITE_ADMIN_URL+"products",
                                    message     : res.__("Product has been added places successfully"),
                                });
                                return;

                            });
                        });
                    
            }else{            
                // req.flash(STATUS_ERROR,res.__("Please select valid value"));
                res.send({
                    status      : STATUS_ERROR,
                    redirect_url: WEBSITE_ADMIN_URL+"products/product_places_details/"+productId,
                    message     : res.__("Please select valid value"),
                });
            }
            

        }else{

            return new Promise(resolve=>{
                let productId   =   (req.params.product_id) ? ObjectId(req.params.product_id) :"";
                let dynamicVariable = 'Products'         
                /** Get  Time details **/
                const productsPlaces = db.collection('products_places');

                // productsPlaces.aggregate([
                //     {$match: {}},
                //     {$lookup:{
                //         from: "citys",
                //         let: { cityId: "$city_id" },
                //         pipeline: [
                //           {$match: {
                //             $expr: {
                //               $and: [
                //                 { $eq: ["$_id", "$$cityId"] },
                //               ],
                //             },
                //           }},
                //         ],
                //         as: "cityDetail",
                //     }},
                //     {$project: {
                //         _id:1,region_id:1,city_id:1,product_id:1,
                //         city_name : {'$arrayElemAt': ["$cityDetail.city_name",0]},
                //         zip:1
                //     }},
                //     {$unwind : "$zip"},
                //     {
                //         $addFields: {
                //             zip: { $toObjectId: "$zip" }
                //         }
                //      },
                //     {$lookup:{
                //         from: "zipcodes",
                //         let: { zipId: "$zip" },
                //         pipeline: [
                //           {$match: {
                //             $expr: {
                //               $and: [
                //                 { $eq: ["$_id", "$$zipId"] },
                //               ],
                //             },
                //           }},
                //         ],
                //         as: "zipDetail",
                //     }},
                //     {$group:{
                //         _id : "$city_id",
                //         region_id : { $first: '$region_id'},
                //         city_name : { $first: '$city_name'},
                //         zip : { $first: '$zip'},
                //         product_id : { $first: '$product_id'},
                //         city_name : { $first: '$city_name'},
                //         zip_codes : { $push: { 
                //             zip_code : {'$arrayElemAt': ["$zipDetail.zip_code",0]},
                //             zip_id : {'$arrayElemAt': ["$zipDetail._id",0]},
                //         }},
                //     }}
                // ]).collation(COLLATION_VALUE).toArray((err, result)=>{
                //     /** Send response **/
                //     req.breadcrumbs(BREADCRUMBS["admin/products/list"]);
                //     res.render("product_zip_add",{
                //         dynamic_variable : dynamicVariable,
                //         dynamic_url      : dynamicVariable,
                //         product_id       : productId,
                //         result           : result,
                //     });
                // });

                const collection    = db.collection("products_places");
                asyncParallel([
                    (callback)=>{
                        /** Get list of user's **/
                        collection.aggregate([
                            {$match: {}},
                            {$lookup:{
                                from: "citys",
                                let: { cityId: "$city_id" },
                                pipeline: [
                                  {$match: {
                                    $expr: {
                                      $and: [
                                        { $eq: ["$_id", "$$cityId"] },
                                      ],
                                    },
                                  }},
                                ],
                                as: "cityDetail",
                            }},
                            {$project: {
                                _id:1,region_id:1,city_id:1,product_id:1,
                                city_name : {'$arrayElemAt': ["$cityDetail.city_name",0]},
                                zip:1
                            }},
                            {$unwind : "$zip"},
                            {
                                $addFields: {
                                    zip: { $toObjectId: "$zip" }
                                }
                             },
                            {$lookup:{
                                from: "zipcodes",
                                let: { zipId: "$zip" },
                                pipeline: [
                                  {$match: {
                                    $expr: {
                                      $and: [
                                        { $eq: ["$_id", "$$zipId"] },
                                      ],
                                    },
                                  }},
                                ],
                                as: "zipDetail",
                            }},
                            {$group:{
                                _id : "$city_id",
                                region_id : { $first: '$region_id'},
                                city_name : { $first: '$city_name'},
                                zip : { $first: '$zip'},
                                product_id : { $first: '$product_id'},
                                city_name : { $first: '$city_name'},
                                zip_codes : { $push: { 
                                    zip_code : {'$arrayElemAt': ["$zipDetail.zip_code",0]},
                                    zip_id : {'$arrayElemAt': ["$zipDetail._id",0]},
                                }},
                            }}
                        ]).collation(COLLATION_VALUE).toArray((err, result)=>{
                            callback(err, result);
                        });
                    },
                    (callback)=>{
                        const collectionTime    = db.collection("times");
                        collectionTime.aggregate([
                            {$match: {}},
                            {$lookup:{
                                from: "masters",
                                let: { categoryId: "$shedules_category" },
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
                            {$project: {
                                _id:1,end_time:1,start_time:1,name:1,shedules_category:1,
                                category_name : {'$arrayElemAt': ["$categoryDetail.name",0]},
                                charge : {'$arrayElemAt': ["$categoryDetail.charge",0]},
                            }},                           
                            {$group:{
                                _id : "$shedules_category",
                                end_time : { $first: '$end_time'},
                                start_time : { $first: '$start_time'},
                                name : { $first: '$name'},
                                charge : { $first: '$charge'},
                                times : { $push: { 
                                    end_time : '$end_time',
                                    start_time : '$start_time',
                                }},
                            }}
                            
                        ]).collation(COLLATION_VALUE).toArray((err, result)=>{
                            callback(err, result);
                        });
                    }
                ],
                (err,response)=>{
                    req.breadcrumbs(BREADCRUMBS["admin/products/list"]);
                    /** Send response **/
                    res.render("product_zip_add",{
                        status          : (!err) ? STATUS_SUCCESS : STATUS_ERROR,
                        result          : (response[0]) ? response[0] : [],
                        timeDetails     : (response[1]) ? response[1] : 0,
                        dynamic_variable : dynamicVariable,
                        dynamic_url      : dynamicVariable,
                        product_id       : productId,
                    });
                });

            }).catch(next);
        }
    };//End viewMaster()
}
module.exports = new Product();
