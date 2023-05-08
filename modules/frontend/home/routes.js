/** Model file path for current module **/
const modelPath  	= __dirname+"/model/home";
const modulePath	= FRONT_END_NAME;


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get home page data **/
app.all(modulePath,(req, res,next) => {
    const home   =  require(modelPath);
    home.index(req,res,next);
});


/** Routing is used to post newsletter **/
app.post(modulePath+'newsletter',(req, res,next) => {
    const home   =  require(modelPath);
    home.newsletter(req,res,next);
});
