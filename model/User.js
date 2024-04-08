const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const UserSchema = new Schema({
    firstName :String,
    dob: String,
    address: String,
    phoneNumber: String,
    state: String,
    city: String,
    zip: String,
    email: String,
    gender: String,
    userType: String
}, {
  timestamps: false,
});

const UserModel = model('User', UserSchema);
module.exports = UserModel;