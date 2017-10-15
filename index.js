require('dotenv').config();
const Intranet = require('intra-api');
const mongoose = require('mongoose');

const Planning = require('./lib/planning');

// Connection configuration
const Intra = new Intranet(process.env.AUTOLOGIN_TOKEN);
mongoose
  .connect(`mongodb://${process.env.MONGO_HOST}/${process.env.MONGO_DB}`, {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWORD,
  })
  .then(() => {
  // Models
    const conn = mongoose.connection,
      models = {
        event: conn.model('Event', require('./models/event')),
      };
    console.log(`Connected to ${process.env.MONGO_DB}@${process.env.MONGO_HOST}`);
    const planning = new Planning(Intra, models);
    planning.refresh()
      .then((err, res) => {
        console.log('ya');
      });
  })
  .catch((err) => {
    throw err;
  });
