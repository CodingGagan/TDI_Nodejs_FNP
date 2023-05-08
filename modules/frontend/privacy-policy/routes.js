/** Model file path for current module **/
const modelPath  	= __dirname+"/model/privacy-policy";
const modulePath	= FRONT_END_NAME+"privacy-policy";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,(req, res,next) => {
    const PrivacyPolicy   =  require(modelPath);
    PrivacyPolicy.index(req,res,next);
});


