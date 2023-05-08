const asyncParallel		= require("async/parallel");
function TypesOfSake() {

	/**
	 * Function for render index file
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */
	this.showTypesOfSake = (req, res, next) => {
		asyncParallel({
			type_of_sakes : (callback)=>{
				const collection = db.collection("pages");
				collection.findOne({ slug: "types-of-sake" }, (err, result) => {
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
			/** Render to types-of-sake page **/
			res.render('types-sake', {
				active_url 	: "types-sake", 
				response 	: (response.type_of_sakes) ? response.type_of_sakes : {},
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : {},
			});
		});
	};// end showTypesOfSake()

};//End TypesOfSake()
module.exports = new TypesOfSake();
