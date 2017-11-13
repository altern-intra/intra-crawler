require('dotenv').config()
const Intranet = require('intra-api')
const mongoose = require('mongoose')

const Planning = require('./lib/planning')
const Module = require('./lib/module')

// Connection configuration
const Intra = new Intranet(process.env.AUTOLOGIN_TOKEN)
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
        instance: conn.model('Instance', require('./models/instance')),
        module: conn.model('Module', require('./models/module')),
      }
    console.log(`Connected to ${process.env.MONGO_DB}@${process.env.MONGO_HOST}`)
    const planning = new Planning(Intra, models);
    const module = new Module(Intra, models);
    return module.refresh()
      .then((err, res) => {
        console.log('Module refreshed')
      })
    // planning.refresh()
    //   .then((err, res) => {
    //     console.log('Planning refreshed')
    //   })
  })
  .catch((err) => {
    throw err
  })
