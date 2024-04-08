const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const PolicyCategorySchema = new Schema({
    categoryName :String,
}, {
  timestamps: false,
});

const PolicyCategoryModel = model('Category', PolicyCategorySchema);
module.exports = PolicyCategoryModel;