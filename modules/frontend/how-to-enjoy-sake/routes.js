/** Model file path for current module **/
const modelPath  	= __dirname+"/model/how-to-enjoy-sake";
const modulePath	= FRONT_END_NAME+"how-to-enjoy-sake";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,(req, res,next) => {
    const howToEnjoySake   =  require(modelPath);
    howToEnjoySake.showHowToEnjoySake(req,res,next);
});

