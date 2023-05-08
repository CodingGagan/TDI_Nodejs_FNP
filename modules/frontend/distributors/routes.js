/** Model file path for current module **/
const modelPath  	= __dirname+"/model/distributors";
const modulePath	= FRONT_END_NAME+"distributors";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get distributor list **/
app.all(modulePath,(req, res,next) => {
    const distributors   =  require(modelPath);
    distributors.index(req,res,next);
});

/** Routing is used to get distributor list **/
app.all(modulePath+'/list',(req, res,next) => {
    const distributors   =  require(modelPath);
    distributors.getAllDistributors(req,res,next);
});


