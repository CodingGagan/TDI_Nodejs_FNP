/** Model file path for current module **/
const modelPath  	= __dirname+"/model/api";
const modulePath	= FRONT_END_NAME+"api/";
const {} 			= require(modelPath);

/** Routing is used to render index page **/
app.all(FRONT_END_NAME,(req,res,next)=>{
	/** Set current view folder **/
	res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
	req.rendering.views		= __dirname + "/views";
	index(req,res,next);
});

app.use(FRONT_END_NAME,(req,res,next) => {
	req.rendering.views		= __dirname + "/views";
    next();
});
/** Set current view folder **/
app.use(modulePath,(req,res,next) => {
	req.rendering.views		= __dirname + "/views";
    next();
});


