const async = require("async");
function FAQ() {
	/**
	   * Function for render index file
	   *
	   * @param req 	As Request Data
	   * @param res 	As Response Data
	   *
	   * @return json
	   */
	this.showFAQ = (req, res, next) => {
		async.parallel({
			faq_list: (callback) => {
				const collection = db.collection("faqs");
				collection.find({}).toArray((err, result) => {
					callback(err, result);

				})
			},
			faq_header: (callback) => {
				const collection = db.collection("pages");
				collection.findOne({ slug: "frequently-asked-questions" }, (err, result) => {
					callback(err, result);
				})
			},
			newsletter_subscribers : (callback)=>{
				const collection = db.collection("pages");
				collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
					callback(err, result);
				})
			},
		}, (err, response) => {
			/** Render to index page **/
			res.render('faq', {
				active_url	: "faq",
				faq_list	: (response.faq_list) 	? response.faq_list 	: [],
				faq_header	: (response.faq_header) ? response.faq_header.body 	: {},
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : {},
			});
		})
	}
}

module.exports = new FAQ();