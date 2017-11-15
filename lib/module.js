const camel = require('to-camel-case');
const moment = require('moment');

class Module {
  constructor(intra, mongo) {
    this.intra = intra
    this.mongo = mongo
    this.Event = this.mongo.event;
    this.Module = this.mongo.module;
    this.Instance = this.mongo.event;
    this.Activity = this.mongo.activity;
  }

  formatModuleTree(units) {
    let modulesFiltered =  [...new Set(units.map(unit => unit.codemodule))];
    return modulesFiltered.map(code => {
      let concernedModules = units.filter(unit => unit.codemodule === code);
      // Sadly, there is no norm on the request response,
      // so we convert what we can to camelCase
      concernedModules = concernedModules.map(concerned => {
        Object.assign(concerned, ...Object.keys(concerned)
          .map(key => {
            let tmp = {[camel(key)]: concerned[key] };
            delete concerned[key]
            return tmp
          }))
          return concerned
      })
      const properties = Object.keys(Object.assign(...concernedModules));
      // In the old Intranet, modules are duplicated through instances
      // We'll fix this by building one Module with a set of modifications by instance if needed
      let moduleReady = {
        title: code,
        overwriteInstances: [],
        activites: [],
        registered: [],
        resp: [],
        assistant: [],
        templateResp: [],
        instances: [...new Set(concernedModules.map(unit => unit.instanceLocation ))]
      }
      for (let property in properties) {
        property = properties[property];
        if (['codeinstance', 'instanceLocation'].includes(property)) {
          continue ;
        }
        // Some properties are instance-specific, so we store them differently
        // and not in the overwriteInstances rules
        if (!['activites', 'registered', 'resp', 'assistant', 'templateResp'].includes(property)) {
          moduleReady[property] = concernedModules[0][property];
        }
        // Most of a module properties are common to every instances,
        // but it happends that an instance redefine some of them. We build
        // an array of the differences per instance
        for (let moduleIter in concernedModules) {
          moduleIter = concernedModules[moduleIter]
          if (['activites', 'registered', 'resp', 'assistant', 'templateResp'].includes(property)) {
            let tmp = moduleIter.codeinstance;
            moduleIter[property] = moduleIter[property].map((item) => {
              item.instance = tmp;
              return item;
            })
            moduleReady[property] = moduleReady[property].concat(moduleIter[property]);
            continue ;
          }
          if (!moduleReady.overwriteInstances[moduleIter.codeinstance]) {
            moduleReady.overwriteInstances[moduleIter.codeinstance] = {}
          }
          if (moduleIter[property] != moduleReady[property]) {
            moduleReady.overwriteInstances[moduleIter.codeinstance][property] = moduleIter[property]
          }
        }
      }
      return moduleReady;
    });
  }

  saveModules(modules) {
    // This allows us to save modules by lots of 1000, which is faster
    return new Promise((resolve, reject) => {
      let updateModule = this.Module.collection.initializeOrderedBulkOp();
      modules.map((module) => {
        this.Module.buildBulkFromIntranet(updateModule, module);
      })
      return updateModule.execute((err, res) => {
        // We need the id of the newly added modules to add them to their activities
        const upserted = res.getUpsertedIds();
        if (upserted) {
          upserted.map((upsert) => {
            modules[upsert.index].activites = modules[upsert.index].activites.map((activity) => {
              const module = modules[upsert.index];
              activity.moduleId = upsert._id;
              activity.scolaryear = module.scolaryear;
              activity.codeModule = module.codemodule;
              activity.semester = module.semester;
              return activity;
            })
          })
        }
        Promise.all(modules.map((module) => this.saveActivities(module.activites)))
          .then(() => {resolve()})
          .catch(reject)
      })
    })
  }

  saveActivities(activities) {
    // This allows us to save activities by lots of 1000, which is faster
    return new Promise((resolve, reject) => {
      let updateActivity = this.Activity.collection.initializeOrderedBulkOp();
      activities.map(activity => {
        this.Activity.buildBulkFromIntranet(updateActivity, activity);
      })
      return updateActivity.execute((err, res) => {
        const upserted = res.getUpsertedIds();
        if (upserted) {
          upserted.map((upsert) => {
            activities[upsert.index].events = activities[upsert.index].events.map((event) => {
              const activity = activities[upsert.index];
              event.activityId = upsert._id
              event.codeActi = activity.codeacti;
              event.codeInstance = activity.instance_location;
              event.scolaryear = activity.scolaryear;
              event.codeModule = activity.codeModule;
              event.codeEvent = event.code;
              event.semester = activity.semester;
              delete event.code;
              return event
            })
          })
        }
        Promise.all(activities.map((activity) => this.saveEvents(activity.events)))
          .then(resolve)
          .catch(reject)
      })
    })
  }

  saveEvents(events) {
    return new Promise((resolve, reject) => {
      if (!events || events.length === 0)
        resolve();
      let updateEvent = this.Event.collection.initializeUnorderedBulkOp();
      events.map((event) =>
        updateEvent
          .find({
            codeEvent: event.codeEvent
          })
          .upsert()
          .update({
            $set: event
          })
        )
      return updateEvent.execute((err, res) => {
        resolve(res);
      })
    });
  }

  refresh() {
    // For debugging purposes:
    // const util = require('util');
    // const fs = require('fs');
    // const readPromised = util.promisify(fs.readFile);
    let modulePromises = [];
    let date = moment();
    // Actually, the old intranet crashes if you request more than one day at a time
    // We don't know yet if it's a bug or a pedagogic feature
    for (let i = 0; i < 1; i++) {
      modulePromises.push(this.intra
        .units
        .all({
          startDate: date.format("YYYY-MM-DD"),
          endDate: date.add(1, 'day').format("YYYY-MM-DD")
        })
        .then((units) => {
          const modules = this.formatModuleTree(units);
          return this.saveModules(modules);
        }))
      date = date.add(1, 'week')
    }
    return Promise.all(modulePromises);
  }
}

module.exports = Module;
