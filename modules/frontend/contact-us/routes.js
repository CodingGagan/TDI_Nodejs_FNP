/** Model file path for current module **/
const modelPath  	= __dirname+"/model/contact-us";
const modulePath	= FRONT_END_NAME+"contact-us";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,(req, res,next) => {
    const contact   =  require(modelPath);
    contact.addContact(req,res,next);
});

