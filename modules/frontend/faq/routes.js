/** Model file path for current module **/
const modelPath  	= __dirname+"/model/faq";
const modulePath	= FRONT_END_NAME+"faq";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,(req, res,next) => {
    const faq   =  require(modelPath);
    faq.showFAQ(req,res,next);
});


