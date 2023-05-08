const asyncParallel		= require("async/parallel");
function PresidentMessage() {
	/**
	   * Function for render index file
	   *
	   * @param req 	As Request Data
	   * @param res 	As Response Data
	   *
	   * @return json
	   */
	this.showPresidentMessage = (req, res, next) => {
		asyncParallel({
			president_message : (callback) => {
                const collection = db.collection("pages");
                collection.findOne({ slug: "president-message" }, (err, result) => {
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
			/** Render to president-message page **/
			res.render('president-message', {
				active_url 	: "president-message", 
				response 	: (response.president_message) ? response.president_message : '',
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
			});
		});
	}
}

module.exports = new PresidentMessage();