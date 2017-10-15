class Planning {
  constructor(intra, mongo) {
    this.intra = intra;
    this.mongo = mongo;
  }

  refresh() {
    console.log('Fetching planning');
    return this.intra
      .planning
      .get()
      .then((events) => {
        const Event = this.mongo.event;
        const update = Event.collection.initializeOrderedBulkOp();
        events.map((event) => {
          event._id = event.codeevent;
          update.find({ _id: { $in: [event.codeevent] } }).upsert().update({ $set: event });
        });
        return new Promise((resolve, reject) => {
          update.execute((err, res) => {
            if (err) { return reject(err); }
            resolve(res);
          });
        });
      });
  }
}

module.exports = Planning;
