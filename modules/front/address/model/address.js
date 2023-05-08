const { body } = require("express-validator");

function Address (req, res, next){
  /* get countries list from database*/
  this.getCountriesList = (req, res, next) => {
    let collection = db.collection("regions");
    collection.find({}, { projection: {name: 1}}).sort({'name': 1}).toArray(async (err, result) => {
      if(!err && result){
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_country_list_successfully"),
          result: result,
          error: [],
        });
      }else{
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
      })
    }
    })
  }

  this.getCitiesList = (req, res, next) => {
    /* get states list from database*/
    let collection = db.collection("citys");
    const regionId = req.body.regionId ? req.body.regionId : '';
    collection.find({ region_id: ObjectId(regionId)}, {projection: {city_name: 1}}).sort({'city_name': 1}).toArray(async (err, result) => {
      if(!err && result){
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_state_list_successfully"),
          result: result,
          error: [],
        });
      }else{
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
      })
    }
    })
  }


  this.getZipList = (req, res, next) => {
    /* get cities list from database*/
    let collection = db.collection("zipcodes");
    const regionId = req.body.regionId ? req.body.regionId : '';
    const cityId = req.body.cityId ? req.body.cityId : '';
    collection.find({ city_id: ObjectId(cityId), region_id: ObjectId(regionId)}, {projection: {zip_code: 1}}).toArray(async (err, result) => {
      if(!err && result){
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_city_list_successfully"),
          result: result,
          error: [],
        });
      }else{
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
      })
    }
    })
  }
}


module.exports = new Address();