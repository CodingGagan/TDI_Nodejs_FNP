/** Model file path for current plugin **/
const modelPath  				= 	__dirname+"/model/times";
const modulePath				= 	"/"+ADMIN_NAME+"/times/";
const adminTime 				=	require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   	req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get Time list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	adminTime.getTimeList(req, res);
});

/** Routing is used to add or edit Time **/
app.all([modulePath+"add",modulePath+"edit/:id"],checkLoggedInAdmin,(req, res, next) => {
	adminTime.addEditTime(req, res, next);
});

/** Routing is used to delete Time details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req, res, next) => {
	adminTime.TimeDelete(req, res, next);
});
