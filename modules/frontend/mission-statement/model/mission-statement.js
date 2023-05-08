const asyncParallel		= require("async/parallel");
function MissionStatement() {
    /**
       * Function for render index file
       *
       * @param req 	As Request Data
       * @param res 	As Response Data
       *
       * @return json
       */
    this.showMissionStatement = (req, res, next) => {
        asyncParallel({
			mission_statement : (callback) => {
                const collection = db.collection("pages");
                collection.findOne({ slug: "mission-statement" }, (err, result) => {
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
			res.render('mission-statement', {
				active_url 	: "mission-statement", 
				response 	: (response.mission_statement) ? response.mission_statement : '',
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
			});
		});
    }
}

module.exports = new MissionStatement();