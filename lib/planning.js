class Planning {
  constructor(intra, mongo) {
    this.intra = intra
    this.mongo = mongo
  }

  refresh() {
    return this.intra
      .planning
      .get()
      .then((events) => {
        const Event = this.mongo.event
        const Module = this.mongo.module
        const Instance = this.mongo.event
        let update = Event.collection.initializeUnorderedBulkOp()
        return Promise.all(events.map((event) => {
          console.log(event)
          const duration = event.nb_hours.split(':')[0] * 60 + event.nb_hours.split(':')[0]
          let mod = Module.find({
            title: event.titlemodule,
          })
          let inst = Instance.find({
            title: event.codeinstance
          })
          return Promise.all([mod, inst])
            .then((res) => {
              const [ module, instance ] = res
              update
                .find({
                  eventId: {
                    $in: [
                      event.codeevent,
                    ],
                  },
                })
                .upsert()
                .update({
                  $set: {
                    eventId: event.codeevent,
                    schoolYear: event.scolaryear,
                    semester: event.semester,
                    location: event.instanceLocation,
                    eventTitle: event.acti_title,
                    startDate: event.start,
                    endDate: event.end,
                    teacher: event.prof_inst,
                    duration,
                    room: event.room,
                    moduleId: module._id,
                    instanceId: instance._id
                  },
                })
              })
        }))
        .then((res) => {
          return new Promise((resolve, reject) => {
            update.execute((err, res) => {
              console.log('ENd:', err, res)
              if (err) {
                return reject(err)
              }
              resolve(res)
            })
          })
        })
      })

  }
}

module.exports = Planning
