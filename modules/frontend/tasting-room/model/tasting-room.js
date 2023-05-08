const asyncParallel		= require("async/parallel");
function TastingRoom() {

	/**
	 * Function for render index file
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */
	this.index = (req,res,next)=>{
		asyncParallel({
			tasting_room : (callback) => {
                const collection = db.collection("pages");
                collection.findOne({ slug: "tasting-room" }, (err, result) => {
                    callback(err, result);
                })
            },
			newsletter_subscribers : (callback) => {
				const collection = db.collection("pages");
				collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
					callback(err, result);
				})
			}
		},(err,response)=>{
			/** Render to index page **/
			res.render('tasting-room', {
				active_url 	: "tasting-room", 
				tasting_room 	: (response.tasting_room) ? response.tasting_room.body : '',
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
			});
		});
	};// end index()
}
module.exports = new TastingRoom();
