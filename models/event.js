const mongoose = require('mongoose');

const Event = new mongoose.Schema({
  scolaryear: 'string',
});

module.exports = Event;
