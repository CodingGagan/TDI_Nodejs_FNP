/** Model file path for current module **/
const modelPath  	= __dirname+"/model/types-sake";
const modulePath	= FRONT_END_NAME+"types-sake";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to post and render career **/
app.all(modulePath,(req, res,next) => {
    const types_of_sake   =  require(modelPath);
    types_of_sake.showTypesOfSake(req,res,next);
});
