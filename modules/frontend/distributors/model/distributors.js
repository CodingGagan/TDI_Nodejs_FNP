const asyncParallel		= require("async/parallel");
function Distributors() {

	/**
	 * Function for render index file
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */
	this.index = (req,res,next)=>{
		if(isPost(req)){
			let state = (req.body.state) ? req.body.state : '';
			let commonCondition = {}
			if(state) commonCondition['state'] = state

			/** Get list of distributors**/
			const collection	= db.collection("distributors");
			collection.find(commonCondition).toArray((err, result)=>{
				res.send({
					result : result
				})
			});
		}else{

			asyncParallel({
				distributors : (callback) => {
					const collection = db.collection("pages");
					collection.findOne({ slug: "distributors" }, (err, result) => {
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
				/** Render to distributors page **/
				res.render('distributors', {
					active_url 	: "distributors", 
					distributors 	: (response.distributors) ? response.distributors.body : '',
					newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
				});
			});
		}
	};// end index()


	/**
	 * Function for get all distributor list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return json
	 */
	 this.getAllDistributors = (req,res,next)=>{
		asyncParallel({
			/** Get list of distributors**/
			distributors : (callback) => {
				let collection	= db.collection("distributors");
				collection.aggregate([
					{$match: {}},
					{$group:{
						_id  : '$state_name',
						distributors : {$push: {
							state 		: '$state',
							state_name 	: '$state_name',
							address 	: '$address',
							name 		: '$name'
						}}
					}}
				]).toArray((err, result)=>{
					callback(err, result);
				});
			},
			newsletter_subscribers : (callback) => {
				let collection = db.collection("pages");
				collection.findOne({ slug : 'newsletter-subscriber' },(err, result) => {
					callback(err, result);
				})
			}
		},
		(err,response) => {
			/** Render to distributors page **/
			res.render('distributor_list', {
				active_url 	: "distributors", 
				result 		: (response.distributors) ? response.distributors : [],
				newsletter_subscribers 	: (response.newsletter_subscribers) ? response.newsletter_subscribers.body : '',
			});
		});
	};// end getAllDistributors()

};
module.exports = new Distributors();
