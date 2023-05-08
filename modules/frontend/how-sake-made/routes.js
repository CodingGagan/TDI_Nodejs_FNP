/** Model file path for current module **/
const modelPath  	= __dirname+"/model/how-sake-made";
const modulePath	= FRONT_END_NAME+"how-sake-made";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,(req, res,next) => {
    const howSakeMade   =  require(modelPath);
    howSakeMade.showHowSakeMade(req,res,next);
});

