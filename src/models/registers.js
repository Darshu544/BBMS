const mongoose = require("mongoose");
const reciversSchema = new mongoose.Schema({
    
full_name : {
    type:String,
    required:true
},
email : {
    type:String,
    required:true,
    unique:true
},
district : {
    type:String,
    required:true
},
city : {
    type:String,
    required:true
},
blood_groups : {
    type:String,
    required:true
},
mob_no : {
    type:String,
    required:true
},
gender : {
    type:String,
    required:true
}
})

//creating new collection

const Register = new mongoose.model("ReciverData", reciversSchema);
module.exports = Register;