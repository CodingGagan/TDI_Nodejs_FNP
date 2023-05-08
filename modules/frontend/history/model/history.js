const asyncParallel		= require("async/parallel");
function History() {
    /**
       * Function for render index file
       *
       * @param req 	As Request Data
       * @param res 	As Response Data
       *
       * @return json
       */
    this.showHistory = (req, res, next) => {
        asyncParallel({
			history : (callback) => {
                const collection = db.collection("pages");
                collection.findOne({ slug: "history" }, (err, result) => {
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
			/** Render to history page **/
			res.render('history', {
				active_url 	: "history", 
				response 	: (response.history) ? response.history : '',
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
			});
		});
        
    }
}

module.exports = new History();