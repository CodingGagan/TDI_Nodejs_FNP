/** Model file path for current module **/
const modelPath  	= __dirname+"/model/history";
const modulePath	= FRONT_END_NAME+"history";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,(req, res,next) => {
    const history   =  require(modelPath);
    history.showHistory(req,res,next);
});

