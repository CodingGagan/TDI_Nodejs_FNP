/** Model file path for current module **/
const modelPath  	= __dirname+"/model/products";
const modulePath	= FRONT_END_NAME+"products";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get product list **/
app.all(modulePath,(req, res,next) => {
    const products   =  require(modelPath);
    products.index(req,res,next);
});

/** Routing is used to get filtered product **/
app.post(modulePath+'/get_products',(req, res,next) => {
    const products   =  require(modelPath);
    products.productList(req,res,next);
});


/** Routing is used to get product list **/
app.get(modulePath+'/vinoshipper',(req, res,next) => {
    const products   =  require(modelPath);
    products.vinoshipperProductList(req,res,next);
});

/** Routing is used to get product detail **/
app.all(modulePath+'/:slug',(req, res,next) => {
    const products   =  require(modelPath);
    products.productDetails(req,res,next);
});




