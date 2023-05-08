/** Model file path for current module **/
const modelPath  	= __dirname+"/model/president-message";
const modulePath	= FRONT_END_NAME+"president-message";
/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,(req, res,next) => {
    const presidentMessage   =  require(modelPath);
    presidentMessage.showPresidentMessage(req,res,next);
});
