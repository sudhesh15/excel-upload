const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const PolicyInfoSchema = new Schema({
    policyNumber :String,
    policyStartDate: String,
    policyEndDate: String,
    policyType: String,
    policyMode: String,
    premiumAmount: String,
    csr: String,
    policyCategory: Array,
}, {
  timestamps: false,
});

const PolicyModel = model('Policy', PolicyInfoSchema);
module.exports = PolicyModel;