/** Node express */
const express	= 	require('express');
const app 		=	express();

/**  Configure i18n options, this module is used for multi language site */
const i18n 	= require("i18n");
i18n.configure({
    locales:['en'],
    defaultLocale: 'en',
    directory: __dirname + '/locales',
    directoryPermissions: '755',
    autoReload: true,
    updateFiles: false
});
app.use(i18n.init);

/** required for Helmet (Secure Web) */
const helmet = require('helmet');
app.use(helmet());


/** required for Compression */
const compression = require('compression')

/* compress all responses */
app.use(compression({
	level : 9,
	memLevel : 9
}));

/**  Set Breadcrumbs home information */
const breadcrumbs = require('express-breadcrumbs');
app.use(breadcrumbs.init());
app.use(breadcrumbs.setHome());

/** Mount the breadcrumbs at `/admin` */
app.use('/admin', breadcrumbs.setHome({
    name: 'Home',
    url: '/admin'
}));

/** Mount the breadcrumbs at `/` */
app.use('/', breadcrumbs.setHome({
    name: 'Home',
    url: '/admin/dashboard'
}));

/** Form Input validation */
const expressValidator = require('express-validator');
app.use(expressValidator());

/** bodyParser for node js */
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
	extended: true,
	limit	: '50mb',
    parameterLimit : 1000000
}));
app.use(bodyParser.json());

/**  read cookies (needed for auth) */
const cookieParser = require('cookie-parser');
app.use(cookieParser());

/** Initialize Ejs Layout  */
const ejsLayouts = require("express-ejs-layouts");
app.use(ejsLayouts);
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

/** Used for create thumbs of images */
const	qt = require('./vendor/quickthumb');
app.use('/public/',qt.static(__dirname + '/public',{type:'resize'}));

/** Set publically accessable folder */
app.use(express.static(__dirname + '/public'));

/** Use to upload files */
const	fileUpload = require('express-fileupload');
app.use(fileUpload());

/**  This module is used for flash messages in the system */
const flash  = require('express-flash');
app.use(flash());

/**  including .env file */
require('dotenv').config();

/**  including render file */
const renderHtml = require('./vendor/render');
app.use(renderHtml);

const fs 		= 	require("fs");
// const privateKey  = fs.readFileSync( "/var/SSL/Ozekisake.devtechnosys.tech/private.key", "utf8");
// const certificate = fs.readFileSync( "/var/SSL/Ozekisake.devtechnosys.tech/certificate.crt", "utf8");
// const chain       = fs.readFileSync( "/var/SSL/Ozekisake.devtechnosys.tech/ca_bundle.crt", "utf8");

// const credentials = {
//   key   : privateKey,
//   cert  : certificate,
//   ca    : chain,
// };

const https 	= 	require('https');
// const server = https.createServer(credentials, app).listen(process.env.PORT, function () {
// 	server.timeout = parseInt(process.env.MAX_EXECUTION_TIME);
//    console.log('Server listening on port' + process.env.PORT); 
// });


const server = app.listen(process.env.PORT,()=>{
	server.timeout = parseInt(process.env.MAX_EXECUTION_TIME);
    console.log('Server listening on port ' + process.env.PORT);
});

SOCKET_ENABLE = JSON.parse(process.env.SOCKET_ENABLE);
if(SOCKET_ENABLE){
	var io	= require('socket.io').listen(server);
}else{
	var io	= "";
}

/** Function to get unhandled errors and prevent to stop nodejs server **/
process.on("uncaughtException", function (err) {
	console.log("error name ---------"+err.name);    // Print the error name
	console.log("error date ---------"+new Date());    // Print the error name
	console.log("error message ---------"+err.message); // Print the error message
	console.log("error stack ---------"+err.stack);   // Print the stack trace
	setTimeout(function(){
		process.exit(1);
	},1000);
});

/** Including mongo connection file */
const mongo	= require("./config/connection");
mongo.connectToServer(err=>{

    /** Including mongo connection file **/
	let db              = 	mongo.getDb();

	/** required for Session */
	const expressSession  	 = require('express-session');
	const MongoStore      	 = require('./vendor/connect-mongo')(expressSession);
	var sessionTimeInSeconds = 15 * 24 * 60 * 60;
	app.use(expressSession({
		name: 'session',
		resave: false,
		saveUninitialized: false,
		proxy:false,
		secret: 'NodeJs9799530SecretKey515',
		store: new MongoStore({
			db: db,
			//When the session cookie has an expiration date, connect-mongo will use it. Otherwise, it will create a new one, using ttl option.
			ttl: sessionTimeInSeconds, // 15 days,
			autoRemove: 'interval',
			autoRemoveInterval: 60*24, // In a day
		}),
		cookie : {
			maxAge: sessionTimeInSeconds*1000,
		},
    }));

    const routes = require('./routes/web_routing');
	var routesApi = require("./routes/api");
    routes.configure(app,io,mongo);
	routesApi.configure(app,io,mongo);
});
