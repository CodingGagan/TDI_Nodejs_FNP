const asyncParallel		= require("async/parallel");
function PrivacyPolicy() {
    /**
       * Function for render index file
       *
       * @param req 	As Request Data
       * @param res 	As Response Data
       *
       * @return json
       */
    this.index = (req, res, next) => {
        asyncParallel({
			privacy_policy : (callback) => {
                const collection = db.collection("pages");
                collection.findOne({ slug: "privacy-policy" }, (err, result) => {
                    callback(err, result);
                })
            },
			newsletter_subscribers : (callback) => {
				const collection = db.collection("pages");
				collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
					callback(err, result);
				})
			}
        },
		(err,response) => {
			/** Render to privacy-policy page **/
			res.render('privacy-policy', {
				active_url 	: "privacy-policy", 
				response 	: (response.privacy_policy) ? response.privacy_policy : '',
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
			});
		});
    }
}

module.exports = new PrivacyPolicy();