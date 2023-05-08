/** Website root directory path */
if (!process.env.PWD) {
  process.env.PWD = process.cwd();
}
WEBSITE_ROOT_PATH	=	process.env.PWD + "/";

/** Website Push notification server key for Android devices */
WEBSITE_PN_ANDROID_SERVER_KEY =	process.env.ANDROID_SERVER_KEY;
/** Website Header Auth Key for mobile api */
WEBSITE_HEADER_AUTH_KEY	= 	process.env.API_HEADER_AUTH_KEY;

/** Website/Socket Url*/
WEBSITE_URL			=	process.env.URL+":"+process.env.PORT+"/";
WEBSITE_SOCKET_URL	=  	process.env.URL+":"+process.env.PORT;

/** Front end name **/
FRONT_END_NAME          = "/";
/** Admin name **/
ADMIN_NAME              = "admin";
/** Front end folder name */
FRONT_END_FOLDER_NAME   = "frontend";
/** Admin folder name */
ADMIN_FOLDER_NAME       = "admin";

/** Website public directory path */
WEBSITE_PUBLIC_PATH 			= 	WEBSITE_URL + "public/";
/** Website public folder path of front end*/
WEBSITE_FILES_URL				= 	WEBSITE_URL + FRONT_END_FOLDER_NAME+"/";
/** Js file path for front pages of website */
WEBSITE_JS_PATH 				= 	WEBSITE_FILES_URL + "js/";
/** Js Path for specific pages */
WEBSITE_JS_PAGE_PATH			= 	WEBSITE_JS_PATH + "pages/";
/** Css file path for front pages of website*/
WEBSITE_CSS_PATH 				= 	WEBSITE_FILES_URL + "css/";
/** vendor file path for front pages of website*/
WEBSITE_VENDOR_PATH 			= 	WEBSITE_FILES_URL + "vendor/";
/** Website images directory url */
WEBSITE_IMG_URL 				= 	WEBSITE_FILES_URL + "images/";
/** Website public images directory url */
WEBSITE_PUBLIC_IMG_URL			= 	WEBSITE_PUBLIC_PATH + FRONT_END_FOLDER_NAME+'/';
/**Js plugin directory path */
WEBSITE_JS_PLUGIN_PATH			= 	WEBSITE_FILES_URL + "plugins/";
/** Website Modules root path */
WEBSITE_MODULES_PATH		    = 	WEBSITE_ROOT_PATH + "modules/"+FRONT_END_FOLDER_NAME+"/";
WEBSITE_API_MODULES_PATH		    = 	WEBSITE_ROOT_PATH + "modules/front/";

/** Front layout root path */
WEBSITE_LAYOUT_PATH				= 	WEBSITE_ROOT_PATH + "modules/"+FRONT_END_FOLDER_NAME+"/layouts/";

/** Website Admin site Url */
WEBSITE_ADMIN_URL				= 	WEBSITE_URL+ADMIN_NAME+"/";
/** Website public folder path of Admin panel*/
WEBSITE_ADMIN_FILES_URL			= 	WEBSITE_URL + ADMIN_FOLDER_NAME+"/";
/** Js file path for admin pages of website */
WEBSITE_ADMIN_JS_PATH 			= 	WEBSITE_ADMIN_FILES_URL + "js/";
/** Js Path for specific pages */
WEBSITE_ADMIN_JS_PAGE_PATH		= 	WEBSITE_ADMIN_JS_PATH + "pages/";
/** Css file path for admin pages of website*/
WEBSITE_ADMIN_CSS_PATH 			= 	WEBSITE_ADMIN_FILES_URL + "css/";
/** Website images directory url for admin */
WEBSITE_ADMIN_IMG_URL 			= 	WEBSITE_ADMIN_FILES_URL + "images/";
/**Js plugin directory path */
WEBSITE_ADMIN_JS_PLUGIN_PATH	= 	WEBSITE_ADMIN_FILES_URL + "plugins/";
/** Admin Modules root path */
WEBSITE_ADMIN_MODULES_PATH		= 	WEBSITE_ROOT_PATH + "modules/"+ADMIN_FOLDER_NAME+"/";
/** Admin layout root path */
WEBSITE_ADMIN_LAYOUT_PATH		= 	WEBSITE_ROOT_PATH + "modules/"+ADMIN_FOLDER_NAME+"/layouts/";

/** Website public uploads directory path */
WEBSITE_PUBLIC_UPLOADS_PATH 	=	WEBSITE_PUBLIC_PATH + FRONT_END_FOLDER_NAME+"/uploads/";

/** Website upload directory root path */
WEBSITE_UPLOADS_ROOT_PATH		= 	WEBSITE_ROOT_PATH + "public/"+FRONT_END_FOLDER_NAME+"/uploads/";

/** For User images file directory path and url*/
USERS_FILE_PATH		=	WEBSITE_UPLOADS_ROOT_PATH+"user/";
USERS_URL			=	WEBSITE_PUBLIC_UPLOADS_PATH+"user/";

/** For Slider images file directory path and url*/
SLIDERS_FILE_PATH	=	WEBSITE_UPLOADS_ROOT_PATH+"slider/";
SLIDERS_URL			=	WEBSITE_PUBLIC_UPLOADS_PATH+"slider/";

/** For ckeditor file directory path and url*/
CKEDITOR_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH+"ckeditor/";
CKEDITOR_URL 		= WEBSITE_PUBLIC_UPLOADS_PATH+"ckeditor/";

/** For Resume file directory path and url*/
RESUME_FILE_PATH	=	WEBSITE_UPLOADS_ROOT_PATH+"resume/";
RESUME_URL			=	WEBSITE_PUBLIC_UPLOADS_PATH+"resume/";

/** For product images file directory path and url*/
PRODUCTS_FILE_PATH	=	WEBSITE_UPLOADS_ROOT_PATH+"products/";
PRODUCTS_URL		=	WEBSITE_PUBLIC_UPLOADS_PATH+"products/";

/** For Master images file directory path and url*/
MASTER_FILE_PATH		=	WEBSITE_UPLOADS_ROOT_PATH+"masters/";
MASTER_FILE_URL			=	WEBSITE_PUBLIC_UPLOADS_PATH+"masters/";
MASTER_IMAGE_RESOLUTION	=	"1202*424";

/** For testimonials images file directory path and url */
TESTIMONIAL_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "testimonials/";
TESTIMONIAL_FILE_URL  = WEBSITE_PUBLIC_UPLOADS_PATH + "testimonials/";

/** Urls of commonly used images */
NO_IMAGE_AVAILABLE		=	WEBSITE_PUBLIC_UPLOADS_PATH + "no-image.png";
ADD_PROFILE_IMAGE_ICON	= 	WEBSITE_PUBLIC_UPLOADS_PATH+'user-no-image.png';
IMAGE_FIELD_NAME 		= 	"full_image_path";

/** User role ids */
SUPER_ADMIN_ROLE_ID	= 	"5b6bc8111dd6a1219e632b03";
FRONT_USER_ROLE_ID	= 	"5b6bc82b1dd6a1219e632b04";

/** Text Setting types*/
TEXT_SETTINGS_ADMIN	= "admin";
TEXT_SETTINGS_FRONT	= "front";

/** Name of text setting types*/
TEXT_SETTINGS_NAME						=	{};
TEXT_SETTINGS_NAME[TEXT_SETTINGS_ADMIN]	=	"Admin Text Settings";
TEXT_SETTINGS_NAME[TEXT_SETTINGS_FRONT]	=	"Front Text Settings";

/** Text Setting types*/
TEXT_SEARCH_DROPDOWN = [
	{status_id	: TEXT_SETTINGS_ADMIN, status_name	: "Admin"},
	{status_id	: TEXT_SETTINGS_FRONT, status_name	: "Front"},
];


/** Time Configurations */
DAYS_IN_A_WEEK				= 	7;
HOURS_IN_A_DAY				= 	24;
MINUTES_IN_A_HOUR 			= 	60;
SECONDS_IN_A_MINUTE 		= 	60;
MILLISECONDS_IN_A_SECOND	=	1000;
SECONDS_IN_A_HOUR			= 	3600;
DAY_IN_A_MONTH				= 	30;
HOURS_IN_A_YEAR				= 	HOURS_IN_A_DAY*365;

/** Time stamp of one day*/
ONE_DAY_TIMESTAMP = HOURS_IN_A_DAY*MINUTES_IN_A_HOUR*SECONDS_IN_A_MINUTE*MILLISECONDS_IN_A_SECOND;

/** One mile value in meter use in get store by miles  **/
ONE_MILE_IN_METER =	1609.344;

/** One mile value in km use in convert km into miles  **/
ONE_MILE_IN_KMS =	0.621371;

/** Commonly used status **/
ACTIVE 			=	1;
DEACTIVE 		= 	0;
VERIFIED 		= 	1;
NOT_VERIFIED	= 	0;
DELETED			= 	1;
NOT_DELETED		= 	0;
NOT_SEEN		= 	0;
SEEN			= 	1;
NOT_READ		= 	0;
READ			= 	1;
SENT			=	1;
NOT_SENT		=	0;
SHOWN    		= 	1;
NOT_SHOWN   	= 	0;
NOT_REGISTER	= 	0;
REGISTER 	 	= 	1;
NOT_VISIBLE   	= 	0;
VISIBLE   		= 	1;
NOT_AVAILABLE   = 	0;
AVAILABLE   	= 	1;
REJECTED		=	2;
OFFLINE   		= 	0;
ONLINE			=	1;
NOT             =   0;
POPULAR         =   1;
NOT_POPULAR     =   0;

/** Activity Type */
ONLINE_OFFLINE_ACTIVITY = "online_offline";
LOGIN_LOGOUT_ACTIVITY 	= "login_logout";

ONLINE_ACTIVITY 	= "online_activity";
OFFLINE_ACTIVITY 	= "offline_activity";
LOGIN_ACTIVITY 		= "login_activity";
LOGOUT_ACTIVITY 	= "logout_activity";

/** Gender type*/
MALE			= "male";
FEMALE			= "female";
GENDER_OTHER	= "other";

GENDER_DROPDOWN 				= {};
GENDER_DROPDOWN[MALE] 			= "Male";
GENDER_DROPDOWN[FEMALE]			= "Female";
GENDER_DROPDOWN[GENDER_OTHER]	= "Other";

SENT_STATUS_SEARCH_DROPDOWN = {
	"sent" : {
		status_id   : SENT,
		status_name : 'Sent'
	},
	"not_sent" : {
		status_id   : NOT_SENT,
		status_name : 'Not Sent'
	}
}

/** "Stay Signed In" Expire time for admin  */
ADMIN_LOGGED_IN_COOKIE_EXPIRE_TIME = 14 * ONE_DAY_TIMESTAMP;

/** Type of Flash messages */
STATUS_SUCCESS 	= "success";
STATUS_ERROR 	= "error";

/** Show / Hide "Stay Signed In" Option in admin */
ALLOWED_ADMIN_TO_SET_COOKIE	=	DEACTIVE;

/** Default number of records to be shown in admin */
ADMIN_LISTING_LIMIT		=	10;
FRONT_LISTING_LIMIT		=	10;

/** On submit loading text */
ADMIN_LOADING_TEXT	= 'data-loading-text=\'<i class="material-icons font-14">save</i> Loading...\'';
FRONT_LOADING_TEXT	= 'data-loading-text=\'<i class="material-icons font-14">save</i> Loading...\'';


LANGUAGE_CODES = {};
/** English language configurations */
ENGLISH_LANGUAGE_MONGO_ID		= "5fa923fb8fb791c512f7dc9a";
ENGLISH_LANGUAGE_CODE			= "en";
ENGLISH_LANGUAGE_FOLDER_CODE	= "en";
LANGUAGE_CODES[ENGLISH_LANGUAGE_MONGO_ID] = ENGLISH_LANGUAGE_CODE;

/** Default language configurations */
DEFAULT_LANGUAGE_MONGO_ID		= ENGLISH_LANGUAGE_MONGO_ID;
DEFAULT_LANGUAGE_FOLDER_CODE	= ENGLISH_LANGUAGE_FOLDER_CODE;
DEFAULT_LANGUAGE_CODE			= ENGLISH_LANGUAGE_CODE;

LANGUAGES_IN_SYSTEM = [
	ENGLISH_LANGUAGE_MONGO_ID,
];

/** Upload file configurations*/
ALLOWED_FILE_EXTENSIONS 			=	["pdf"];
ALLOWED_FILE_ERROR_MESSAGE			= 	"Please select valid file, Valid file extensions are "+ALLOWED_FILE_EXTENSIONS.join(", ")+".";
ALLOWED_FILE_MIME_EXTENSIONS 		= 	["application/pdf"];
ALLOWED_FILE_MIME_ERROR_MESSAGE		= 	"Please select valid mime type, Valid mime types are "+ALLOWED_FILE_MIME_EXTENSIONS.join(", ")+".";


/** Upload image configurations*/
ALLOWED_IMAGE_EXTENSIONS 			=	["jpg","jpeg","png"];
ALLOWED_IMAGE_ERROR_MESSAGE			= 	"Please select valid file, Valid file extensions are "+ALLOWED_IMAGE_EXTENSIONS.join(", ")+".";

ALLOWED_IMAGE_MIME_EXTENSIONS 		= 	["image/jpg","image/jpeg","image/png","application/pdf"];
ALLOWED_IMAGE_MIME_ERROR_MESSAGE	= 	"Please select valid mime type, Valid mime types are "+ALLOWED_IMAGE_MIME_EXTENSIONS.join(", ")+".";
IMAGE_RESOLUTION		 			=	"1202*424";

/** Not allowed html tags list*/
NOT_ALLOWED_TAGS_XSS = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*/gi];

/** Allow iframe in add/edit product (Youtube embedded code) **/
NOT_ALLOWED_TAGS_XSS_WITHOUT_IFRAME = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi];

/** Date Formats  for server side (node js) **/
DATABASE_DATE_TIME_FORMAT	= 	"yyyy-mm-dd HH:MM:ss";	// 2019-01-01 00:00:00
DATABASE_DATE_FORMAT		= 	"yyyy-mm-dd"; 			// 2019-01-01
DATE_FORMAT_EXPORT 			=	"dd/mm/yyyy";
EXPIRY_DATE_FORMAT	 		=	"dd/mm/yyyy";
DATE_TIME_FORMAT_EXPORT 	=	"dd/mm/yyyy hh:MM TT"; // 01/01/2019 11:00 AM
DATE_OF_BIRTH_FORMAT		= 	"yyyy-mm-dd"; 			// 2019-01-01
AM_PM_FORMAT_WITH_DATE 		= 	"yyyy-mm-dd hh:MM TT"; 	// 2019-01-01 11:00 AM
API_DATE_TIME_FORMAT		= 	"yyyy-mm-dd HH:MM:ss";	// 2019-01-01 00:00:00
API_DATE_FORMAT				= 	"yyyy-mm-dd";	// 2019-01-01 00:00:00
DATE_TIME_FORMAT			=   "dd/mm/yyyy hh:MM TT";
START_DATE_TIME_FORMAT		= 	"00:00:00";	// 2019-01-01 00:00:00

/**Date formats For client side only */
FRONT_DATE_FORMAT			= 	"DD/MM/YYYY hh:MM A"; 			// 31/01/2018 00:00 PM
DATATABLE_DATE_TIME_FORMAT	=	"DD/MM/YYYY hh:mm a";
DATATABLE_DATE_FORMAT		=	"DD/MM/YYYY";
DATE_FORMAT_HTML			=	"DD/MM/YYYY";
GRAPH_DATE_FORMAT			=	"dd/MM/yyyy";

CURRENTDATE_START_DATE_FORMAT	=	"yyyy-mm-dd 00:00:00";
CURRENTDATE_END_DATE_FORMAT		=	"yyyy-mm-dd 23:59:59";

/**Date formats used in datetange picker	 */
DATEPICKER_DATE_FORMAT					=	"DD/MM/YYYY";
DATEPICKER_START_DATE_FORMAT			=	"YYYY-MM-DD 00:00:00";
DATEPICKER_END_DATE_FORMAT				=	"YYYY-MM-DD 23:59:59";
DATE_RANGE_DISPLAY_FORMAT_FOR_START_DATE=	"YYYY-MM-DD HH:mm:00";
DATE_RANGE_DISPLAY_FORMAT_FOR_END_DATE 	=	"YYYY-MM-DD HH:mm:59";
DATE_RANGE_DATE_TIME_FORMAT				=	"YYYY-MM-DD HH:mm";
DATE_RANGE_DATE_FORMAT				 	=	"YYYY-MM-DD";
DATEPICKER_TIME_FORMAT					=	"HH:mm";

/** Date picker date example*/
DATEPICKER_DATE_EXAMPLE		=	"Ex: 2019-03-24 23:59";
ADMIN_JS_AM_PM_DATE_FORMAT  =   "DD/MM/YYYY hh:MM A";

/** Time zone used in html **/
DEFAULT_TIME_ZONE	= process.env.TZ;

/** To show error message on top of page **/
ADMIN_GLOBAL_ERROR 	= "invalid-access";
FRONT_GLOBAL_ERROR 	= "invalid-access";

/** Datatable configurations **/
SORT_DESC	 	= 	-1;
SORT_ASC	 	= 	1;
DEFAULT_SKIP	=	0;

/** Loading button text, default is loading.. **/
LOADING_BUTTON_TEXT = 'data-loading-text=\'<i class="fa fa-save"></i> Loading...\'';
LOADING_SPINNER = '<div class=\'ld ld-ring ld-spin\'></div>';

/** Default country code */
DEFAULT_COUNTRY_CODE	=	"+91";

/** Allowed Mobile number length configuration **/
MOBILE_NUMBER_MIN_LENGTH		= 	9;
MOBILE_NUMBER_MAX_LENGTH		= 	11;
MOBILE_LENGTH_VALIDATION		=	{};
MOBILE_LENGTH_VALIDATION["min"]	=	MOBILE_NUMBER_MIN_LENGTH;
MOBILE_LENGTH_VALIDATION["max"]	=	MOBILE_NUMBER_MAX_LENGTH;
MOBILE_NUMBER_LENGTH			=	[MOBILE_LENGTH_VALIDATION];

MOBILE_NUMBER_REGULAR_EXPRESSION=	"^[0-9]{10,11}$";

/** Password length configuration **/
PASSWORD_MIN_LENGTH					= 	6;
PASSWORD_LENGTH_VALIDATION			=	{};
PASSWORD_LENGTH_VALIDATION["min"]	=	PASSWORD_MIN_LENGTH;
PASSWORD_LENGTH						=	[PASSWORD_LENGTH_VALIDATION];

/** Slider length configuration **/
SLIDER_NAME_MIN_LENGTH  = 10;
SLIDER_NAME_MAX_LENGTH  = 250;
SLIDER_DESCRIPTION_MIN_LENGTH  = 10;
SLIDER_DESCRIPTION_MAX_LENGTH  = 500;

/** Email and Mobile validation regular expression (use in login function for front) **/
/** Email and 10 digit mobile number validation */
EMAIL_AND_MOBILE_REGULAR_EXPRESSION					= /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})|(^[0-9]{10,11})+$/;
EMAIL_AND_MOBILE_REGULAR_EXPRESSION_FOR_CLIENT_SIDE	= "^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})|(^[0-9]{10,11})+$";

EMAIL_REGULAR_EXPRESSION					= /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
/** settings input value required and editable status **/
REQUIRED 	=	1;
EDITABLE 	=	1;

/** Round precision (default number of decimal digits to round to) **/
ROUND_PRECISION = 2;

/** to ignore Case sensitive searching/sorting in mongo collections  **/
COLLATION_VALUE		=	{ locale: "en_US", caseLevel: true};

/** Dashboard redirect type **/
TYPE_ACTIVE		=	"active";
TYPE_DEACTIVE 	= 	"deactive";

/** Type Of Export Records **/
EXPORT_ALL		= "export_all";
EXPORT_FILTERED	= "export_filtered";

/** Search status for global section **/
GLOBAL_STATUS_SEARCH_DROPDOWN			=	{};
GLOBAL_STATUS_SEARCH_DROPDOWN[ACTIVE]	=	{
	status_name	:	"Active",
	status_type	: 	TYPE_ACTIVE,
	label_class	: 	"label-success"
};
GLOBAL_STATUS_SEARCH_DROPDOWN[DEACTIVE]	=	{
	status_name	:	"Inactive",
	status_type	: 	TYPE_DEACTIVE,
	label_class	: 	"label-danger"
};

/** For data table data types **/
NUMERIC_FIELD 	= 'numeric';
OBJECT_ID_FIELD = 'objectId';
EXACT_FIELD		= 'exact';

/** For status use in redirect page with status (user listing) **/
ACTIVE_INACTIVE_STATUS	=	"active_inactive";
VERIFIED_STATUS			=	"verified_user";

/** Setting validate type dropdown **/
SETTINGS_VALIDATE_TYPE_DROPDOWN = [
	{
		input_id	: "number",
		input_name	: "Number"
	},
	{
		input_id	: "float",
		input_name	: "Float"
	},
];

/** Setting input type dropdown **/
SETTING_INPUT_TYPE_DROPDOWN = [
	{
		input_id	: "text",
		input_name	: "Text"
	},
	{
		input_id	: "textarea",
		input_name	: "Textarea"
	}
];

/** Not allowed characters in regular expresssion **/
NOT_ALLOWED_CHARACTERS_FOR_REGEX = ['(',')','+','*','?','[',']'];

/**Not deletable role */
NOT_DELETABLE_ROLE	= 1;

/** Two show only subadmin */
IS_SUBADMIN	= 1;

/**Notificaiton dispaly limit in admin header */
ADMIN_HEADER_NOTIFICATION_DISPLAY_LIMIT = 5;
FRONT_HEADER_NOTIFICATION_DISPLAY_LIMIT = 5;

/**Maximum character allowed to display on listing page */
MAX_CHARACTER_ALLOWED_IN_LISTING = 200;

/**To genrate random numbers */
DEFAULT_RANDOM_NUMBER_LENGTH = 6;

/**Search Status for pn logs **/
SEARCHING_ANDROID	= "Android";
SEARCHING_IPHONE	= "iPhone";

/** Search status for pn logs **/
PN_LOGS_DEVICE_TYPE_SEARCH_DROPDOWN = [
	{device_id	: SEARCHING_ANDROID,device_name	: "Android"},
	{device_id	: SEARCHING_IPHONE,device_name	: "iPhone"},
];

/** Used for genrate password */
BCRYPT_PASSWORD_SALT_ROUNDS = 1;

/***Payment configration */
CURRENCY = "NGN";
/** Default currency for payments */
CURRENCY_SYMBOL	=	'₦';
/** To test message functionality in development */
INDIA_COUNTRY_CODE  	= '+91';



/*** Newsletter template */
CONSTANT_FOR_NEWSLETTER_TEMPLATE = [
	{constant_id	: "NAME",constant_name	: "NAME"},
]

TESTIMONIAL_LIMIT = 5;
FAQ_QUESTION_MIN_LENGTH = 10;
FAQ_QUESTION_MAX_LENGTH = 5000;
FAQ_ANS_MIN_LENGTH		= 10;
FAQ_ANS_MAX_LENGTH		= 10000;

NEWSLETTER_DEFAULT_USER_NAME = '';


/**Email sent events */
USER_REGISTRATION_EMAIL_EVENTS 				 = "user_registration";
USER_CONTACT_US_EVENTS 				 		 = "contact_us";
USER_VERIFICATION_EMAIL_EVENTS				 = "account_verification";
USER_ACCOUNT_APPROVAL_EMAIL_EVENTS			 = "user_account_approval";
USER_NEWS_LETTER_SUBSCRIPTION_EVENTS		 = "new_subscription_request";
NEWS_LETTER_MAILTO_USER_SUBSCRIPTION_EVENTS  = "reply_to_user_subscription_request";

/**Contact us message max length */
CONTACT_MESSAGE_TEXT_LENGTH			= 200;
REJECTION_MESSAGE_TEXT_LENGTH		= 200;


/**Constant for user status **/
USER_STATUS_PENDING 		= "pending";
USER_STATUS_APPROVED		= "approved";
USER_STATUS_REJECTED		= "rejected";

/**Search Status for users **/
SEARCHING_ACTIVE 				= 1;
SEARCHING_DEACTIVE 				= 2;
SEARCHING_POPULAR 				= 3;
SEARCHING_NOT_POPULAR			= 4;
SEARCHING_APPROVED 				= 5;
SEARCHING_PENDING				= 6;
SEARCHING_REJECTED				= 7;

/** Search status for user **/
USER_STATUS_SEARCH_DROPDOWN = [
	{
		status_id	: SEARCHING_ACTIVE,
		status_name	: "Active",
		status_type	: TYPE_ACTIVE
	},
	{
		status_id	: SEARCHING_DEACTIVE,
		status_name	: "Inactive",
		status_type	: TYPE_DEACTIVE
	},
	{
		status_id	: SEARCHING_POPULAR,
		status_name	: "Popular"
	},
	{
		status_id	: SEARCHING_NOT_POPULAR,
		status_name	: "Unpopular"
	}
];


ONEDAY 						= 1000 * 60 * 60 * 24;

/** Constant for display on home page */
DISPLAY 		=	1;
NOT_DISPLAY 	=	0;

/*GOOGLE_SECRET_KEY 	=	"6LcFPeEUAAAAABlBdxUsc_yUt8tpuff3iP0l28R2";
GOOGLE_DATA_KEY		=	"6LcFPeEUAAAAAM0SVkEQSj_f1awQtVOlf40LS-n_";*/
//GOOGLE_SECRET_KEY 	=	"6LcFPeEUAAAAABlBdxUsc_yUt8tpuff3iP0l28R2";
//GOOGLE_DATA_KEY		=	"6LcFPeEUAAAAAM0SVkEQSj_f1awQtVOlf40LS-n_";


STATUS_OTHER 	= "other";

FRONT_USER_COMMON_CONDITIONS = {
	active			:	ACTIVE,
	user_role_id 	: 	FRONT_USER_ROLE_ID,
	is_deleted 		:	NOT_DELETED,
	is_verified 	: 	VERIFIED
};

COMPLETED 		= 	1;
NOT_COMPLETED	=	0;

/** Constant for latest causes limit on  */
LATEST_DASHBOARD_CAUSES_LIMIT =	3;

COUNTRY_STATE_CITY_URL				= 	WEBSITE_URL+ADMIN_NAME+"/country_state_city";
COUNTRY_INDIA 						=   "5b56b1aff190ae08d94474cd";

KYC_SEND_TYPE_ONE 		= 	0;
KYC_SEND_TYPE_TWO		=	1;


MAIL_SENT 		= 	1;
FORM_OPEN 		= 	2;
FORM_COMPLETE 	= 	3;

SUBSCRIBED		=	1;

/*** Distributor char limit*/
DISTRIBUTOR_NAME_MIN_LENGTH = 10;
DISTRIBUTOR_NAME_MAX_LENGTH = 500;
DISTRIBUTOR_ADDRESS_MIN_LENGTH = 10;
DISTRIBUTOR_ADDRESS_MAX_LENGTH = 1000;
FULLSTATENAME = [
	{
		state_code : "HI",
		state_name : "Hawaii"
	},
	{
		state_code : "AK",
		state_name : "Alaska"
	},
	{
		state_code : "FL",
		state_name : "Florida"
	},
	{
		state_code : "SC",
		state_name : "South Carolina"
	},
	{
		state_code : "GA",
		state_name : "Georgia"
	},
	{
		state_code : "AL",
		state_name : "Alabama"
	},
	{
		state_code : "NC",
		state_name : "North Carolina"
	},
	{
		state_code : "TN",
		state_name : "Tennessee"
	},
	{
		state_code : "RI",
		state_name : "Rhode Island"
	},
	{
		state_code : "CT",
		state_name : "Connecticut"
	},
	{
		state_code : "MA",
		state_name : "Massachusetts"
	},
	{
		state_code : "ME",
		state_name : "Maine"
	},
	{
		state_code : "NH",
		state_name : "New Hampshire"
	},
	{
		state_code : "VT",
		state_name : "Vermont"
	},
	{
		state_code : "NY",
		state_name : "New York"
	},
	{
		state_code : "NJ",
		state_name : "New Jersey"
	},
	{
		state_code : "PA",
		state_name : "Pennsylvania"
	},
	{
		state_code : "DE",
		state_name : "Delaware"
	},
	{
		state_code : "MD",
		state_name : "Maryland"
	},
	{
		state_code : "WV",
		state_name : "West Virginia"
	},
	{
		state_code : "KY",
		state_name : "Kentucky"
	},
	{
		state_code : "OH",
		state_name : "Ohio"
	},
	{
		state_code : "MI",
		state_name : "Michigan"
	},
	{
		state_code : "WY",
		state_name : "Wyoming"
	},
	{
		state_code : "MT",
		state_name : "Montana"
	},
	{
		state_code : "ID",
		state_name : "Idaho"
	},
	{
		state_code : "WA",
		state_name : "Washington"
	},
	{
		state_code : "TX",
		state_name : "Texas"
	},
	{
		state_code : "CA",
		state_name : "California"
	},
	{
		state_code : "AZ",
		state_name : "Arizona"
	},
	{
		state_code : "NV",
		state_name : "Nevada"
	},
	{
		state_code : "UT",
		state_name : "Utah"
	},
	{
		state_code : "CO",
		state_name : "Colorado"
	},
	{
		state_code : "NM",
		state_name : "New Mexico"
	},
	{
		state_code : "OR",
		state_name : "Oregon"
	},
	{
		state_code : "ND",
		state_name : "North Dakota"
	},
	{
		state_code : "SD",
		state_name : "South Dakota"
	},
	{
		state_code : "NE",
		state_name : "Nebraska"
	},
	{
		state_code : "IA",
		state_name : "Iowa"
	},
	{
		state_code : "MS",
		state_name : "Mississippi"
	},
	{
		state_code : "IN",
		state_name : "Indiana"
	},
	{
		state_code : "IL",
		state_name : "Illinois"
	},
	{
		state_code : "MN",
		state_name : "Minnesota"
	},
	{
		state_code : "WI",
		state_name : "Wisconsin"
	},
	{
		state_code : "MO",
		state_name : "Missouri"
	},
	{
		state_code : "AR",
		state_name : "Arkansas"
	},
	{
		state_code : "OK",
		state_name : "Oklahoma"
	},
	{
		state_code : "KS",
		state_name : "Kansas"
	},
	{
		state_code : "MO",
		state_name : "Missouri"
	},
	{
		state_code : "LA",
		state_name : "Louisiana"
	},
	{
		state_code : "VA",
		state_name : "Virginia"
	},
	{
		state_code : "DC",
		state_name : "Washington D.C."
	}
]



GLOBAL_CATEGORY_LEVEL_DROPDOWN = [
	{
		type : "top",
		name : "TOP Level"
	},
	{
		type : "medium",
		name : "Medium Level"
	},
	{
		type : "low",
		name : "Low Level"
	}
]


GLOBAL_WEIGHT_TYPE_LEVEL_DROPDOWN = [
	{
		type : "kg",
		name : "Kg"
	},
	{
		type : "ponds",
		name : "Ponds"
	}
]

GLOBAL_DIMENTION_TYPE_LEVEL_DROPDOWN = [
	{
		type : "mtr",
		name : "Mtr"
	},
	{
		type : "cm",
		name : "Cm"
	},
]


NO_SKIP   	          	= 0;
NO_LIMIT  		        = 0;

API_STATUS_SUCCESS = 'success';
API_STATUS_ERROR = 'error';

DEFAULT_API_LIMIT = 10;

PRODUCT_FILE_URL = '';