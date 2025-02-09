const mongoose = require("mongoose");

// Define the hospital schema
const hospitalSchema = new mongoose.Schema({
    hospital_name: {
        type: String,
        required: true
    },
    hospital_id: {
        type: String,
        required: true,
        unique: true // Ensure that hospital ID is unique
    },
    hospital_address: {
        type: String,
        required: true
    },
    hospital_email: {
        type: String,
        required: true,
        unique: true // Ensure that email is unique
    },
    applicant_name: {
        type: String,
        required: true
    },
    contact_number: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true // Store the hashed password
    }
});

// Creating a new collection for hospitals
const Hospital = mongoose.model("HospitalData", hospitalSchema);
module.exports = Hospital;