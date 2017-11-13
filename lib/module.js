const camel = require('to-camel-case');

class Module {
  constructor(intra, mongo) {
    this.intra = intra
    this.mongo = mongo
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
            moduleIter[property].instance = tmp;
            moduleReady[property].push(moduleIter[property]);
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
    });
  }

  refresh() {
    console.log('Requesting Modules')
    const Event = this.mongo.event;
    const Module = this.mongo.module;
    const Instance = this.mongo.event;
    let updateModule = Module.collection.initializeUnorderedBulkOp();
    return this.intra
      .units
      .all({
        startDate: "2017-11-31",
        endDate: "2017-12-15"
      })
      .then((units) => {
        let modulesFiltered =  [...new Set(units.map(unit => unit.codemodule ))];
        modulesFiltered = modulesFiltered.map(code => {
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
                moduleIter[property].instance = tmp;
                moduleReady[property].push(moduleIter[property]);
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
          updateModule
            .find({
              codemodule: moduleReady.codemodule,
              scolaryear: moduleReady.scolaryear,
              semester: moduleReady.semester
            })
            .upsert()
            .update({
              $set: moduleReady
            })
          return moduleReady
        })
        return new Promise((resolve, reject) => {
          updateModule.execute((err, res) => {
            console.log('ENd:', err, res)
            if (err) {
              return reject(err)
            }
            resolve(res)
          })
        })
      })
      .catch((err) => {
        console.error(err)
      })

  }
}

module.exports = Module;
