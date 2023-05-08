/** Model file path for current plugin **/
const modelPath  				= 	__dirname+"/model/region";
const modulePath				= 	"/"+ADMIN_NAME+"/region/";
const adminRegion 				=	require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   	req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get Region list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	adminRegion.getRegionList(req, res);
});

/** Routing is used to add or edit Region **/
app.all([modulePath+"add",modulePath+"edit/:id"],checkLoggedInAdmin,(req, res, next) => {
	adminRegion.addEditRegion(req, res, next);
});

/** Routing is used to delete Region details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req, res, next) => {
	adminRegion.RegionDelete(req, res, next);
});

app.post(modulePath+"category/get_subcategory",checkLoggedInAdmin,(req, res, next) => {
	adminRegion.getSubCategoryList(req, res,next);
});

app.post(modulePath+"get_filter_type",checkLoggedInAdmin,(req, res, next) => {
	adminRegion.getFilterTypeList(req, res,next);
});
