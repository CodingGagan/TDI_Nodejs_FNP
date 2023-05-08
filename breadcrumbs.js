BREADCRUMBS = {
	/** Admin Breadcrumbs */
		/** DASHBOARD SECTION**/
		'admin/dashboard' : [{name:'Dashboard',url:'',icon:'dashboard'}],

		/**EDIT PROFILE SECTION**/
		'admin/user_profile/edit' : [{name:'Edit profile',url:'',icon:'mode_edit'}],

		/**CMS SECTION**/
		'admin/cms/list' :	[{name:'CMS Management',url:'',icon:'picture_in_picture'}],
		'admin/cms/edit' : 	[{name:'CMS Management',url:WEBSITE_ADMIN_URL+'cms',icon:'picture_in_picture'},{name:'Edit CMS',url:'',icon:'mode_edit'}],
		'admin/cms/add'	 : 	[{name:'CMS Management',url:WEBSITE_ADMIN_URL+'cms',icon:'picture_in_picture'},{name:'Add CMS',url:'',icon:'add'}],

		/**Slider SECTION**/
		'admin/slider/list' :	[{name:'Slider Management',url:'',icon:'picture_in_picture'}],
		'admin/slider/edit' : 	[{name:'Slider Management',url:WEBSITE_ADMIN_URL+'slider',icon:'picture_in_picture'},{name:'Edit slider',url:'',icon:'mode_edit'}],
		'admin/slider/add'	 : 	[{name:'Slider Management',url:WEBSITE_ADMIN_URL+'slider',icon:'picture_in_picture'},{name:'Add slider',url:'',icon:'add'}],
		
		/**TEXT SETTING SECTION**/
		'admin/text_setting/list' : [{name:'dynamic_variable',url:'',icon:'text_format'}],
		'admin/text_setting/edit' : [{name:'dynamic_variable',url:WEBSITE_ADMIN_URL+'text-setting/{dynamic_variable}',icon:'text_format'},{name:'Edit Text Setting',url:'',icon:'mode_edit'}],
		'admin/text_setting/add' : [{name:'dynamic_variable',url:WEBSITE_ADMIN_URL+'text-setting/{dynamic_variable}',icon:'text_format'},{name:'Add Text Setting',url:'',icon:'add'}],

		/**EMAIL MANAGEMENT SECTION**/
		'admin/email_template/list' : [{name:'Email Templates',url:'',icon:'email'}],
		'admin/email_template/edit' : [{name:'Email Templates',url:WEBSITE_ADMIN_URL+'email_template',icon:'email'},{name:'Edit email template',url:'',icon:'mode_edit'}],


		/** EMAIL LOGS SECTION**/
		'admin/email_logs/list' : [{name:'Email Logs',url:'',icon:'mail_outline'}],
		'admin/email_logs/view' : [{name:'Email Logs',url:WEBSITE_ADMIN_URL+'email_logs',icon:'mail_outline'},{name:'Email Logs Details',url:'',icon:'find_in_page'}],

		
		/** Sms LOGS SECTION**/
		'admin/sms_logs/list' : [{name:'Sms Logs',url:'',icon:'textsms'}],
		'admin/sms_logs/view' : [{name:'Sms Logs',url:WEBSITE_ADMIN_URL+'sms_logs',icon:'textsms'},{name:'Sms Log Details',url:'',icon:'find_in_page'}],

		/**SETTING MANAGEMENT SECTION**/
		'admin/setting/list' 	: [{name:'Settings',url:'',icon:'settings'}],
		'admin/setting/add'  	: [{name:'Settings',url:WEBSITE_ADMIN_URL+'settings',icon:'settings'},{name:'Add Setting',url:'',icon:'add'}],
		'admin/setting/edit' 	: [{name:'Settings',url:WEBSITE_ADMIN_URL+'settings',icon:'settings'},{name:'Edit Setting',url:'',icon:'mode_edit'}],
		'admin/setting/prefix' 	: [{name:'dynamic_variable',url:'',icon:'settings'}],

		/**MASTER MANAGEMENT SECTION**/
		'admin/master/list' : [{name:'dynamic_variable',url:'',icon:'subject'}],
		'admin/master/add' 	: [{name:'dynamic_variable',url:WEBSITE_ADMIN_URL+'master/{dynamic_variable}',icon:'subject'},{name:'Add',url:'',icon:'add'}],
		'admin/master/edit' : [{name:'dynamic_variable',url:WEBSITE_ADMIN_URL+'master/{dynamic_variable}',icon:'subject'},{name:'Edit',url:'',icon:'mode_edit'}],
		'admin/master/view' : [{name:'dynamic_variable',url:WEBSITE_ADMIN_URL+'master/{dynamic_variable}',icon:'subject'},{name:'View',url:'',icon:'find_in_page'}],

		/**ADMIN ROLE SECTION**/
		'admin/admin_role/list' : [{name:'Manage Roles',url:'',icon:'security'}],
		'admin/admin_role/add'  : [{name:'Manage Roles',url:WEBSITE_ADMIN_URL+'admin_role',icon:'security'},{name:'Add Role',url:'',icon:'add'}],
		'admin/admin_role/edit' : [{name:'Manage Roles',url:WEBSITE_ADMIN_URL+'admin_role',icon:'security'},{name:'Edit Role',url:'',icon:'edit'}],

		/**ADMIN PERMISSIONS SECTION**/
		'admin/admin_permissions/list' : [{name:'Sub-admin',url:'',icon:'perm_data_setting'}],
		'admin/admin_permissions/add'  : [{name:'Sub-admin',url:WEBSITE_ADMIN_URL+'admin_permissions',icon:'perm_data_setting'},{name:'Add Sub-admin ',url:'',icon:'add'}],
		'admin/admin_permissions/edit' : [{name:'Sub-admin',url:WEBSITE_ADMIN_URL+'admin_permissions',icon:'perm_data_setting'},{name:'Edit Sub-admin ',url:'',icon:'edit'}],
		'admin/admin_permissions/view' : [{name:'Sub-admin',url:WEBSITE_ADMIN_URL+'admin_permissions',icon:'perm_data_setting'},{name:'View Sub-admin ',url:'',icon:'find_in_page'}],

		/** ADMIN MODULES SECTION**/
		'admin/admin_modules/list' : [{name:'Admin Modules',url:'',icon:'pages'}],
		'admin/admin_modules/add'  : [{name:'Admin Modules',url:WEBSITE_ADMIN_URL+'admin_modules',icon:'pages'},{name:'Add Admin Modules',url:'',icon:'add'}],
		'admin/admin_modules/edit' : [{name:'Admin Modules',url:WEBSITE_ADMIN_URL+'admin_modules',icon:'pages'},{name:'Edit Admin Modules',url:'',icon:'edit'}],

		/**TEXT GROUP SETTING SECTION**/
		'admin/text_group_setting/list' : [{name:'Text Group Setting',url:'',icon:'new_releases'}],
		'admin/text_group_setting/view' : [{name:'Text Group Setting',url:WEBSITE_ADMIN_URL+'text_group_setting',icon:'new_releases'},{name:'View Text Group Setting',url:'',icon:'find_in_page'}],
		'admin/text_group_setting/edit' : [{name:'View Text Group Setting ',url:WEBSITE_ADMIN_URL+'text_group_setting/{dynamic_variable}/view',icon:'text_format'},{name:'Edit Text Setting',url:'',icon:'mode_edit'}],
		'admin/text_group_setting/import': [{name:'Text Group Setting',url:WEBSITE_ADMIN_URL+'text_group_setting',icon:'new_releases'},{name:'Import Text Group Setting',url:'',icon:'find_in_page'}],

		/** Contact SECTION**/
		'admin/contact_us/list' 	: [{name:'Contact Us',url:'',icon:'cast_connected'}],
		'admin/contact_us/view'	: [{name:'Contact Us',url:WEBSITE_ADMIN_URL+'contact_us',icon:'cast_connected'},{name:'View',url:'',icon:'find_in_page'}],
		
		/** FAQ SECTION**/
		'admin/faqs/list' : [{name:'Faq',url:'',icon:'live_help'}],
		'admin/faqs/add'  : [{name:'Faq',url:WEBSITE_ADMIN_URL+'faq',icon:'live_help'},{name:'Add',url:'',icon:'add'}],
		'admin/faqs/edit' : [{name:'Faq',url:WEBSITE_ADMIN_URL+'faq',icon:'live_help'},{name:'Edit',url:'',icon:'mode_edit'}],

		/**PRODUCT MANAGEMENT SECTION**/
		'admin/products/list' : [{name:'Products',url:'',icon:'layers'}],
		'admin/products/edit' : [{name:'Products',url:WEBSITE_ADMIN_URL+'products/',icon:'layers'},{name:'Edit',url:'',icon:'mode_edit'}],
		'admin/products/add'  : [{name:'Products',url:WEBSITE_ADMIN_URL+'products/',icon:'layers'},{name:'Add',url:'',icon:'add'}],
		'admin/products/view' : [{name:'Products',url:WEBSITE_ADMIN_URL+'products/',icon:'layers'},{name:'View',url:'',icon:'find_in_page'}],

		/**JOB MANAGEMENT SECTION**/
		'admin/jobs/list' : [{name:'Jobs',url:'',icon:'person_search'}],
		'admin/jobs/edit' : [{name:'Jobs',url:WEBSITE_ADMIN_URL+'jobs/',icon:'person_search'},{name:'Edit',url:'',icon:'mode_edit'}],
		'admin/jobs/add'  : [{name:'Jobs',url:WEBSITE_ADMIN_URL+'jobs/',icon:'person_search'},{name:'Add',url:'',icon:'add'}],
		'admin/jobs/view' : [{name:'Jobs',url:WEBSITE_ADMIN_URL+'jobs/',icon:'person_search'},{name:'View',url:'',icon:'find_in_page'}],

		/**NEWSLETTER SUBSCRIBER SECTION**/
		'admin/newsletter_subscribers/list' : [{name:'Subscribers',url:'',icon:'email'}],
		'admin/newsletter_subscribers/edit' : [{name:'Subscribers',url:WEBSITE_ADMIN_URL+'newsletter_subscribers/',icon:'email'},{name:'Edit',url:'',icon:'mode_edit'}],
		'admin/newsletter_subscribers/add'  : [{name:'Subscribers',url:WEBSITE_ADMIN_URL+'newsletter_subscribers/',icon:'email'},{name:'Add',url:'',icon:'add'}],

		/**NEWSLETTER TEMPLATE SECTION**/
		'admin/newsletter_template/list' : [{name:'Newsletter Templates',url:'',icon:'email'}],
		'admin/newsletter_template/edit' : [{name:'Newsletter Templates',url:WEBSITE_ADMIN_URL+'newsletter_templates/',icon:'email'},{name:'Edit',url:'',icon:'mode_edit'}],
		'admin/newsletter_template/add'  : [{name:'Newsletter Templates',url:WEBSITE_ADMIN_URL+'newsletter_templates/',icon:'email'},{name:'Add',url:'',icon:'add'}],
		'admin/newsletter_template/send'  : [{name:'Newsletter Templates',url:WEBSITE_ADMIN_URL+'newsletter_templates/',icon:'email'},{name:'Add',url:'',icon:'add'}],

		/**SCHEDULED NEWSLETTER SECTION**/
		'admin/scheduled_newsletter/list' : [{name:'Scheduled Newsletters',url:'',icon:'email'}],
		'admin/scheduled_newsletter/edit' : [{name:'Scheduled Newsletters',url:WEBSITE_ADMIN_URL+'scheduled_newsletters/',icon:'email'},{name:'Edit',url:'',icon:'mode_edit'}],

		/** DISTRIBUTORS SECTION**/
		'admin/distributors/list' : [{name:'Distributors',url:'',icon:'person'}],
		'admin/distributors/edit' : [{name:'Distributors',url:WEBSITE_ADMIN_URL+'distributors/',icon:'person'},{name:'Edit',url:'',icon:'mode_edit'}],
		'admin/distributors/add'  : [{name:'Distributors',url:WEBSITE_ADMIN_URL+'distributors/',icon:'person'},{name:'Add',url:'',icon:'add'}],

		/** BANNERS SECTION**/
		'admin/banners/list' : [{name:'Banners',url:'',icon:'image'}],
		'admin/banners/edit' : [{name:'Banners',url:WEBSITE_ADMIN_URL+'banners/',icon:'image'},{name:'Edit',url:'',icon:'mode_edit'}],
		
};

