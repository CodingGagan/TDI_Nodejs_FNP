/** Model file path for current plugin **/
const modelPath  				= 	__dirname+"/model/zipcode";
const modulePath				= 	"/"+ADMIN_NAME+"/zipcode/";
const adminZipcode 				=	require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   	req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get Zipcode list **/
app.all(modulePath+':city_id',checkLoggedInAdmin,(req, res) => {
	adminZipcode.getZipcodeList(req, res);
});

/** Routing is used to add or edit Zipcode **/
app.all([modulePath+"add/"+':city_id',modulePath+"edit/:id"],checkLoggedInAdmin,(req, res, next) => {
	adminZipcode.addEditZipcode(req, res, next);
});

/** Routing is used to delete Zipcode details **/
app.get(modulePath+"delete/:id/:city_id",checkLoggedInAdmin,(req, res, next) => {
	adminZipcode.ZipcodeDelete(req, res, next);
});
