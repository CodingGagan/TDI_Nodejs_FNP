/** Model file path for current plugin **/
const modelPath  				= 	__dirname+"/model/filter_type";
const modulePath				= 	"/"+ADMIN_NAME+"/filter_type/";
const adminFilterType 				=	require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   	req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get FilterType list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	adminFilterType.getFilterTypeList(req, res);
});

/** Routing is used to add or edit FilterType **/
app.all([modulePath+"add",modulePath+"edit/:id"],checkLoggedInAdmin,(req, res, next) => {
	adminFilterType.addEditFilterType(req, res, next);
});

/** Routing is used to delete FilterType details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req, res, next) => {
	adminFilterType.FilterTypeDelete(req, res, next);
});
