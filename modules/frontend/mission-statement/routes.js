/** Model file path for current module **/
const modelPath  	= __dirname+"/model/mission-statement";
const modulePath	= FRONT_END_NAME+"mission-statement";


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views/";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,(req, res,next) => {
    const missionStatement   =  require(modelPath);
    missionStatement.showMissionStatement(req,res,next);
});


