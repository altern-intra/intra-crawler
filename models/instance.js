const mongoose = require('mongoose')

const ObjectID = mongoose.Schema.ObjectID

const Instance = new mongoose.Schema({
  title: String,
  location: String,
  code: String
})

module.exports = Instance
