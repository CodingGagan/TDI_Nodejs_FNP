/**
 *   Function for Submit form on Enter (Pass Submit Button class in Form data-form-submit-class attribute)
 */
$(document).on('keypress','.on_click_submit',function(e){
	var key = e.which;
	if (key == 13) {
		var className = e.target.className;
		if(className.indexOf('notSubmitOnEnter') < 0){
			if(e.shiftKey == 0 || (e.shiftKey == 1 && $(e.target)[0].type!="textarea")){
				var submitId = $(this).attr('data-submit-btn-id');
				$('#'+submitId).trigger('click');
				return false;
			}
		}
	}
});

/**
 *  For chosen resize function
 *
 **/
$(window).on('resize', resizeChosen);

function resizeChosen() {
   $(".chosen-container").each(function() {
       $(this).attr('style', 'width: 100%');
   });
}

/**
 * Function to change language tabs for multi language form
 *
 * @param selectedLangCode As current selected language
 *
 * @return null
 */
function changeTab(selectedLangCode){
	$('.multilanguage_tab').removeClass('current').addClass('done');
	$('.multilanguage_tab_'+selectedLangCode).removeClass('done').addClass('current');
	$('.multi-lang-tab-pane').removeClass('active');
	$('#multi_lang_'+selectedLangCode).addClass('active');
}//end changeTab()

/**
 *	Function for custom ajax submit
 *
 * 	@param var formId 	As form id for submitting form
 * 	@param var callback As Callback Function
 *
 *	@return null
 */
function ajax_submit(formId,callback){
	var options = {
		success:function(response){
			if(response.status == 'success'){
				callback(true,response);
			}else{
				display_errors(response.message,formId);
				callback(false,response);
			}
		},
		resetForm:false
	};
	$("form#"+formId).ajaxSubmit(options);
}//end ajax_submit()

/**
 *	Function for custom ajax submit for multipart form data with multilevel array
 *
 * 	@param var formId as form id for submitting form
 * 	@param var callback for callback function
 *
 *	@return null
 */
function submit_multipart_form(formId,callback){
	/** take all form input values in Object format */
	var formData	= $('#'+formId).serializeObject();

	/** FormData is used to submit multipart/form-data */
	var fd 			= new FormData();
	if(formData != undefined){
		$.each(formData,function(key,value){
			/** Append all input values into FormData object */
			if(typeof value == 'object'){
				fd.append(key, JSON.stringify(value));
			}else{
				fd.append(key, value);
			}
		});
	}

	/** Form data is used to submit multipart/form-data */
	var fileData	= $('input[type="file"]');
	if(fileData != undefined){
		$.each(fileData,function(key,value){
			if(value.files[0]!= undefined){
				var name = (value.name) ? value.name : '';
				if(value.multiple != undefined && value.multiple != false){
					var filesValue = (value.files) ? value.files : '';
					$.each(filesValue,function(keyFile,valueFile){
						fd.append(name+"["+keyFile+"]", valueFile);
					});
				}else{
					var filesValue = (value.files[0]) ? value.files[0] : '';
					fd.append(name, filesValue);
				}

				/** Append all file input values into FormData object */
			}
		});
	}
	var currentUrl = (window.location && window.location.href) ? window.location.href : '';
	var options = {
		url: currentUrl,
		type: "POST",
		data : fd,
		processData : false,
		contentType : false,
		success:function(response){
			if(response.status == 'success'){
				callback(true,response);
			}else{
				display_errors(response.message,formId);
				callback(false,response);
			}
		}
	};
	$.ajax(options);
}//end submit_multipart_form()

/**
 *	Function for display validation errors
 *
 * 	@param var errors As Array or errors
 * 	@param var formId As Form id for display errors
 *
 *	@return null
 */
function display_errors(errors,formId){
	$firstError = '';
	$('#'+formId+' span.error').html('');
	$('#'+formId).find('.form-line').removeClass('error');
	if(typeof errors == "object"){
		try{
			$.each(errors,function(index,html){
				if(html.param == 'invalid-access'){
					if($firstError == ''){
						$firstError = 'user-defined-notice';
					}
					notice('error',html.msg);
				}else{
					var errorId = html.param;
					if($firstError == ''){
						$firstError = errorId;
					}
					$('#'+formId+' #'+errorId+'_error').prev('.form-line').addClass('error');
					$('#'+formId+' #'+errorId+'_error').html(html.msg).show();
				}
			});
		}catch(e){
			notice('error','Something went wrong, Please try again.');
			$firstError = 'user-defined-notice';
		}
	}else{
		notice('error',errors);
		$firstError = 'user-defined-notice';
	}
	if($firstError != ''){
		var scrollTopId = '#'+$firstError;
		if($firstError != 'user-defined-notice'){
			if($('#'+$firstError+'_error').length > 0){
				$('#'+$firstError+'_error').focus();
			}
			scrollTopId = '#'+formId+' #'+$firstError+'_error';
		}
		if($(scrollTopId).length > 0){
			$("html,body").animate({scrollTop: $(scrollTopId).offset().top - 150}, "slow");
		}
	}
}//end display_errors()

/**
 * Function For For notification messages
 *
 *	@param title 	as Title
 *  @param message 	as Notification Message
 *  @param type 	as Type ('success'/'error'/'info')
 *
 *  @return null
 */
function notice(type,message,timeout){
	timeout = (timeout) ? timeout : 10000;
	$class 	= '';
	switch(type){
		case 'error':
			$class = 'bg-pink';
		break;
		case 'success':
			$class = 'bg-green';
		break
	}
	$html = '<div class="alert '+$class+' alert-dismissible" role="alert">\
				<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>\
				'+message+'\
			</div>';
	if(type=="error"){
		$('#user-defined-error-notice').html($html).show();
		if($('#user-defined-error-notice').length > 0){
			$("html,body").animate({scrollTop: $('#user-defined-error-notice').offset().top - 150}, "slow");
		}
		if(timeout != 0){
			setTimeout(function(){
				$('#user-defined-error-notice').fadeOut(500,function(){
					$('#user-defined-error-notice').html('');
				});
			},timeout);
		}
	}
	if(type=="success"){
		$('#user-defined-notice').html($html).show();
		if($('#user-defined-notice').length > 0){
			$("html,body").animate({scrollTop: $('#user-defined-notice').offset().top - 150}, "slow");
		}
		if(timeout != 0){
			setTimeout(function(){
				$('#user-defined-notice').fadeOut(500,function(){
					$('#user-defined-notice').html('');
				});
			},timeout);
		}
	}
}// end notice()

/**
 * Function to show confirm box
 *
 * @param type		As Type of mesage
 * @param title		As Title of comfirm Box
 * @param message	As Confirmation message
 * @param callback  As Callback function
 *
 * @return null
 */
var timer;
function confirmBox(type,title,message,callback){
	clearTimeout(timer);
	swal({
		title: title,
		text: message,
		type: type,
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Ok",
		closeOnConfirm: false,
		showLoaderOnConfirm: true,
	}, function () {
		callback();
	});
}//end confirmBox()

/**
 * Function to show success message
 *
 * @param type		As Type of mesage
 * @param title 	As Title of comfirm Box
 * @param message	As Confirmation message
 *
 * @return null
 */
function popup_success(type,title,message){
	swal(title, message, type);
	timer = setTimeout(function(){
		swal.close();
	},3000);
}//end popup_success()

/**
 * Function to show html popup message
 *
 * @param type		As Type of mesage
 * @param title 	As Title of comfirm Box
 * @param message	As Confirmation message
 *
 * @return null
 */
function html_popup_success(type,title,message,timerCount){
	swal({
		type : type,
		title: title,
		text: message,
		html: true
	});
	timer = setTimeout(function(){
		swal.close();
	},timerCount);
}//end html_popup_success()

/**
 * This funciton in used replace submit button with loading button
 *
 * @params buttonId = Button Id
 *
 * @return null
 **/
function startTextLoading(buttonId){
	$('#'+buttonId).button('loading');
}//end startTextLoading()

/**
 * This funciton in used replace loading button with submit button
 *
 * @params buttonId = Button Id
 *
 * @return null
 **/
function stopTextLoading(buttonId){
	$('#'+buttonId).button('reset');
	setTimeout(function(){
		$('#'+buttonId+' .waves-ripple').remove();
	},1);
}//end stopTextLoading()

/**
 * This funciton in used to set date time format using moment js
 *
 * @params void
 *
 * @return null
 **/
function setDateTimeformat(){
	$('.setDateTimeFormat').each(function(){
		var dateTime 		= ($(this).attr('data-timestamp')) ? parseInt($(this).attr('data-timestamp')) : $(this).attr('data-date-time');
		var dateTimeFormat 	= ($(this).attr('data-time-format')) ? $(this).attr('data-time-format') : DATATABLE_DATE_TIME_FORMAT;
		var newTime 		= (dateTime) ? moment(dateTime).tz(DEFAULT_TIME_ZONE).format(dateTimeFormat) : "N/A";
		$(this).text(newTime);
	});
}//end setDateTimeformat()
setDateTimeformat();

/**
 * This funciton in used to replace \n tag with br tag
 *
 * @params void
 *
 * @return null
 **/
function nl2br(html){
	if(html){
		return html.replace(/\n/g, "<br />");
	}else{
		return html;
	}
}//end nl2br()
nl2br();


/**
 *  Function for Confirmation message
 */
$(document).on('click', '.confirm_box', function(e){
	e.stopImmediatePropagation();
	url 				= $(this).attr('data-href');
	confirmMessage 		= $(this).attr('data-confirm-message');
	confirmHeading 		= $(this).attr('data-confirm-heading');
	confirmBox("warning",confirmHeading,confirmMessage,function(result){
		window.location.replace(url);
	});
	e.preventDefault();
});

/**
 *  Read more text
 **/
function readMore(){
	// Configure/customize these variables.
	var defaultChar 	= 100;  // default characters value
	var ellipsestext 	= "...";
	var moretext 		= "Read more »";
	var lesstext 		= "Read less »";

	$('.readmore').each(function() {
		if(!($(this).hasClass("readmore_imported"))){
			showChar = ($(this).attr('data-content-length')) ? $(this).attr('data-content-length') : defaultChar;
			var content = $(this).html();
			if(content.length > showChar) {
				var c = content.substr(0, showChar);
				var h = content.substr(showChar, content.length - showChar);
				var html = c + '<span class="moreellipses">' + ellipsestext+ '&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a href="" class="morelink">' + moretext + '</a></span>';
				$(this).addClass('readmore_imported');
				$(this).html(html);
			}
		}
	});

	$(".morecontent span").hide();
}// end readMore()

/**
 *  Call read more function
 *
 **/
readMore();

/**
 * Show and hide text
 **/
$(document).on('click',".morelink",function(){
	var moretext 		= "Read more »";
	var lesstext 		= "Read less »";
	if($(this).hasClass("less")) {
		$(this).removeClass("less");
		$(this).html(moretext);
	} else {
		$(this).addClass("less");
		$(this).html(lesstext);
	}
	$(this).parent().prev().toggle();
	$(this).prev().toggle();
	return false;
});


/** Function to get product 
 * data as Object(searching data)
*/
var isProductLoaded = true;
function getProducts(data){
	var formData   = new FormData();
	$.each(data,function(key,value){
		/** Append all input values into FormData object */
		if(typeof value == 'object'){
			formData.append(key, JSON.stringify(value));
		}else{
			formData.append(key, value);
		}
	});

	/*** Set loader */ 
	$("#productList").html('<li class="text-center"><a href="javascript:void(0);" class="waves-effect waves-block not_anchor"><div class="menu-info"><img src="http://192.168.1.74:9080/public/frontend/uploads/pagination_loader.gif"/> </div></a></li>');
	$.ajax({
		url 		: WEBSITE_URL+'products/get_products',
		type		: "POST",
		data 		: formData,
		processData	: false,
		contentType	: false,
		success:function(response){
			if(response){
				$("#productList").html("");
				if(typeof response.result !== typeof undefined && response.result && response.result.length > 0){
					$("#main_product").html("");
					var productList = (response.result) ? response.result : [];
					productList.map(function(records, index){

						/** Append html */
						var productHtml = '<a href="'+WEBSITE_URL+'products/'+records.slug+'">'+
							'<div class="grid-inner">'+
								'<figure class="prod-img hovereffect">'+
									'<img src="'+records.full_image_path+'" alt="">'+
									'<div class="overlay prod-overlay-descp">'+
										'<h2 class="p-o-title">'+records.product_name+'</h2>'+
										'<p class="p-o-para">'+records.flavor+'</p>'+
									'</div>'+
								'</figure>'+
							'</div>'+
						'</a>';
						$("#productList").append(productHtml);
					});
				}else{
					/** No record found */
					var productHtml = (Object.keys(data).length > 0) ? '<div class="menu-info text-center"><img src="'+WEBSITE_URL+'public/frontend/uploads/no_porduct_found.png" alt="No product"/></div>' : ''
					$("#main_product").html(productHtml);
				}
			}
		}
	});
	
};//End getProducts()



$(document).ready(function() {
	$(".loader").remove();
});


