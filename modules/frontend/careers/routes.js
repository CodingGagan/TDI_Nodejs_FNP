/** Model file path for current module **/
const modelPath  	= __dirname+"/model/careers";
const modulePath	= FRONT_END_NAME+"careers";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to post and render career **/
app.all(modulePath,(req, res,next) => {
    const careers   =  require(modelPath);
    careers.addCareers(req,res,next);
});

