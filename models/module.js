const mongoose = require('mongoose')

const ObjectID = mongoose.Schema.ObjectID

const Module = new mongoose.Schema({
  title: String,
  codeModule: String,
  competence: String,
  description: String,
  semester: Number,
  credits: Number,
  timeline: {
    begin: Date,
    end: Date,
    end_register: Date
  },
  instances: [],
  registered: [],
  assistant: [],
  resp: []
})

module.exports = Module
