/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/model/master";
var modulePath	= 	"/"+ADMIN_NAME+"/master/";

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});



/** Routing is used to update master status **/
app.all(modulePath+":type/change_status/:id/:status/:category_id?",checkLoggedInAdmin,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.updateMasterStatus(req,res,next);
});

/** Routing is used to add master **/
app.all(modulePath+":type/add/:category_id?",checkLoggedInAdmin,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.addMaster(req,res,next);
});

/** Routing is used to edit master **/
app.all(modulePath+":type/edit/:id/:category_id?",checkLoggedInAdmin,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.masterUpdate(req,res,next);
});

/** Routing is used to delete master **/
app.all(modulePath+":type/delete/:id/:category_id?",checkLoggedInAdmin,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.masterDelete(req,res,next);
});

/** Routing is used to view master details **/
app.all(modulePath+":type/view/:id/:category_id?",checkLoggedInAdmin,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.viewMaster(req,res,next);
});

/** Routing is used to get master list **/
app.all(modulePath+":type/:category_id?",checkLoggedInAdmin,(req, res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.getMasterList(req, res,next);
});

