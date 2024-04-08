const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const AccountSchema = new Schema({
    accountName :String,
}, {
  timestamps: false,
});

const AccountModel = model('Account', AccountSchema);
module.exports = AccountModel;