/** Model file path for current plugin **/
const modelPath     =	__dirname+"/model/product";
const modulePath	= 	"/"+ADMIN_NAME+"/products/";
const adminProduct	    =   require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
   req.rendering.views	=	__dirname + "/views";
   next();
});

/** Routing is used to add product **/
app.all(modulePath+"add",checkLoggedInAdmin,(req,res,next)=>{
    adminProduct.addProduct(req,res,next);
});

/** Routing is used to edit product **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,(req,res,next)=>{
    adminProduct.editProduct(req,res,next);
});

/** Routing is used to view product details **/
app.get(modulePath+"view/:id",checkLoggedInAdmin,(req, res,next)=>{
    adminProduct.viewProductDetails(req, res,next);
});

/** Routing is used to update product status **/
app.all(modulePath+"update_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res,next)=>{
    adminProduct.updateProductStatus(req,res,next);
});


/** Routing is used to update popular product status **/
app.all(modulePath+"update_popular_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res,next)=>{
    adminProduct.popularProductStatus(req,res,next);
});

/** Routing is used to update is sale on product status **/
app.all(modulePath+"update_is_on_sale/:id/:status/:status_type",checkLoggedInAdmin,(req, res,next)=>{
    adminProduct.isSaleOnProductStatus(req,res,next);
});

/** Routing is used to delete product details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
    adminProduct.deleteProduct(req,res,next);
});

/** Routing is used to get product list **/
app.all(modulePath+":status_type?",checkLoggedInAdmin,(req, res)=>{
    adminProduct.getProductList(req, res);
});

/** Routing is used to delete product details **/
app.all(modulePath+"product_places_details/:product_id",checkLoggedInAdmin,(req,res,next)=>{
    adminProduct.getProductPlacesList(req,res,next);
});

app.post(modulePath+"product_places/:region_id",checkLoggedInAdmin,(req,res,next)=>{
    adminProduct.getProductPlaceCityList(req,res,next);
});

app.post(modulePath+"product_zipcodes/:city_id",checkLoggedInAdmin,(req,res,next)=>{
    adminProduct.getProductPlaceZipCodeList(req,res,next);
});

app.all(modulePath+"product_shedule_prices/:product_id",checkLoggedInAdmin,(req,res,next)=>{
    adminProduct.getProductShedulePriceList(req,res,next);
});
