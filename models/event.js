const mongoose = require('mongoose')

const ObjectId = mongoose.Schema.Types.ObjectId

const Event = new mongoose.Schema({
  eventId: String,
  schoolYear: Number,
  semester: Number,
  location: String,
  eventTitle: String,
  startDate: Date,
  endDate: Date,
  teacher: Array,
  duration: Number,
  room: Array,
  moduleId: ObjectId,
  instanceId: ObjectId
})

module.exports = Event
