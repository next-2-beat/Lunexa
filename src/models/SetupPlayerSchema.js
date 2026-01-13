const mongoose = require('mongoose');

const SetupPlayerSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  playerMode: {
    type: String,
    required: true,
    enum: ['classic', 'spotify', 'simple', 'special', 'nobuttons', 'oldschool', 'musicard'], // Restrict valid player modes
  }
});

module.exports = mongoose.model('SetupPlayer', SetupPlayerSchema);
