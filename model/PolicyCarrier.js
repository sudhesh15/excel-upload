const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const PolicyCarrierSchema = new Schema({
    companyName :String,
}, {
  timestamps: false,
});

const PolicyCarrierModel = model('Company', PolicyCarrierSchema);
module.exports = PolicyCarrierModel;