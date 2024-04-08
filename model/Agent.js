const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const AgentSchema = new Schema({
    agent :{
      type: String,
      unique: true,
    },
}, {
  timestamps: false,
});

const AgentModel = model('Agent', AgentSchema);
module.exports = AgentModel;