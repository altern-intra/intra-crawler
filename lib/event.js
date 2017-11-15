class Event {
  constructor(intra, mongo) {
    this.intra = intra;
    this.mongo = mongo;
    this.Event = this.mongo.event;
    this.Module = this.mongo.module;
    this.Instance = this.mongo.event;
    this.Activity = this.mongo.activity;
  }

  refresh() {
    return this.Event
      .getSchema()
      .find({})
      .lean()
      .then((events) => {
        let updateEvent = this.Event.collection.initializeUnorderedBulkOp();
        return Promise.all(events.map(event => {
          return this.intra
            .events
            .registeredByEvent(event)
            .then((eventFilled) => {
              event.registered = eventFilled;
              delete event._id;
              updateEvent
                .find({
                  codeEvent: event.codeEvent
                })
                .update({
                  $set: event
                })
              return true;
            })
            .catch((err) => {
              // Yes, this is very dirty, but the old intranet returns a 500 error when there is no events for an activity :/
              if (err.body && err.body.error !== "Planned sessions for this activity have not been found")
                throw err;
              // console.error('Just an intranet error: ');
            })
        }))
        .then((res) => {
          return new Promise((resolve, reject) => {
            updateEvent.execute((err, res) => {
              if (err) {
                return reject(err);
              }
              resolve(res);
            })
          })
        })
      })
  }
}

module.exports = Event;
