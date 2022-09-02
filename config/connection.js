require("dotenv").config();
var MongoClient = require("mongodb").MongoClient;
const state = {
  db: null, 
}; 
module.exports.connect = function (done) {
  const url = `mongodb+srv://dennys:${process.env.MONGO_PASSWORD}@cluster0.guojgqv.mongodb.net/?retryWrites=true&w=majority`;
  //const url='mongodb://localhost:27017'
  const dbname = "z-fashions";
  MongoClient.connect(url, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
    done();
  }); 
};

module.exports.get = function () {
  return state.db;
};
