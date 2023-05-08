const asyncParallel		= require("async/parallel");
function HowSakeMade() {
	/**
	   * Function for render index file
	   *
	   * @param req 	As Request Data
	   * @param res 	As Response Data
	   *
	   * @return json
	   */
	this.showHowSakeMade = (req, res, next) => {
		asyncParallel({
			how_sake_made : (callback)=>{
				const collection = db.collection("pages");
				collection.findOne({ slug: "how-sake-made" }, (err, result) => {
					callback(err, result);
				})
			},
			newsletter_subscribers : (callback)=>{
				const collection = db.collection("pages");
				collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
					callback(err, result);
				})
			},
		},
		(err,response) => {
			/** Render to how-sake-made page **/
			res.render('how-sake-made', {
				active_url 	: "how-sake-made", 
				response 	: (response.how_sake_made) ? response.how_sake_made : {},
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : {},
			});
		});
	}
}

module.exports = new HowSakeMade();