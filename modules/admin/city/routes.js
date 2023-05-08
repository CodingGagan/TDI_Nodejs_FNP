/** Model file path for current plugin **/
const modelPath  				= 	__dirname+"/model/city";
const modulePath				= 	"/"+ADMIN_NAME+"/city/";
const adminCity 				=	require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   	req.rendering.views	=	__dirname + "/views";
    next();
});


/** Routing is used to get City list **/
app.all(modulePath+':region_id',checkLoggedInAdmin,(req, res) => {
	adminCity.getCityList(req, res);
});

/** Routing is used to add or edit City **/
app.all([modulePath+"add/"+':region_id',modulePath+"edit/:id"],checkLoggedInAdmin,(req, res, next) => {
	adminCity.addEditCity(req, res, next);
});

/** Routing is used to delete City details **/
app.get(modulePath+"delete/:id/:region_id",checkLoggedInAdmin,(req, res, next) => {
	adminCity.CityDelete(req, res, next);
});
