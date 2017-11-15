require('dotenv').config()
const Intranet = require('intra-api')
const mongoose = require('mongoose')
const intraModels = require('intra-models');

const winston = require('winston');
winston.loggers.add('debug', {
  console: {
    level: 'info',
    colorize: true,
    label: 'debug'
  }
});
winston.loggers.add('error', {
  console: {
    level: 'error',
    colorize: true,
    label: 'debug'
  }
});
const infoLogger = winston.loggers.get('debug');
const errorLogger = winston.loggers.get('error');

// Load lib src
const Planning = require('./lib/planning')
const Module = require('./lib/module')
const Event = require('./lib/event');
const Rollbar = require("rollbar");
const rollbar = new Rollbar(process.env.ROLLBAR_KEY);

// Load models src
const { ModulesModel, ActivityModel, EventModel, InstanceModel } = intraModels;

// Connection configuration
const Intra = new Intranet(process.env.AUTOLOGIN_TOKEN)
// Because mongoose promises are deprecated
mongoose.Promise = global.Promise;
mongoose
  .connect(`mongodb://${process.env.MONGO_HOST}/${process.env.MONGO_DB}`, {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWORD,
    useMongoClient: false
  })
  .then(() => {
    // Models
    const conn = mongoose.connection,
      models = {
        event: new EventModel(conn),
        instance: new InstanceModel(conn),
        module: new ModulesModel(conn),
        activity: new ActivityModel(conn),
      }
    infoLogger.info(`Connected to ${process.env.MONGO_DB}@${process.env.MONGO_HOST}`);
    const planning = new Planning(Intra, models);
    const module = new Module(Intra, models);
    const event = new Event(Intra, models);
    infoLogger.info('Refreshing modules');
    return module.refresh()
      .then((res) => {
        infoLogger.info('Module refreshed');
        infoLogger.info("Refreshing events");
        return event
          .refresh()
      })
      .then((res) => {
        infoLogger.info("events refreshed");
        conn.close();
      })
      .catch((err) => {
        rollbar.error(err)
        errorLogger.error('Fetching failed');
        conn.close();
        throw err
      })
  })
  .then(() => {
    console.log('All data refreshed')
  })
  .catch((err) => {
    rollbar.error(err)
    errorLogger.error(err)
  })
