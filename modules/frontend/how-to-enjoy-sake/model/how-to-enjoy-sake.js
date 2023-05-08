const asyncParallel		= require("async/parallel");
function HowToEnjoySake() {
    /**
       * Function for render index file
       *
       * @param req 	As Request Data
       * @param res 	As Response Data
       *
       * @return json
       */
    this.showHowToEnjoySake = (req, res, next) => {
        asyncParallel({
			how_to_enjoy_sake : (callback)=>{
				const collection = db.collection("pages");
				collection.findOne({ slug: "how-to-enjoy-sake" }, (err, result) => {
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
			/** Render to how-to-enjoy-sake page **/
			res.render('how-to-enjoy-sake', {
				active_url 	: "how-to-enjoy-sake", 
				response 	: (response.how_to_enjoy_sake) ? response.how_to_enjoy_sake : {},
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : {},
			});
		});
    }
}

module.exports = new HowToEnjoySake();