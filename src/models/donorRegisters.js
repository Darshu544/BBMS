const mongoose = require("mongoose");

// Define the donor schema
const donorSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Ensure that email is unique
    },
    phone: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true // Changed from 'city' to 'address' as per your requirement
    },
    password: {
        type: String,
        required: true // Store the hashed password
    },
    appointments: [{
        date: { type: Date, required: true },
        hospital: { type: String, required: true },
        time: { type: String, required: true },
        status: { type: String, default: 'Pending' }
    }]

});

// Creating a new collection for donors
const Donor = new mongoose.model("DonorData", donorSchema);
module.exports = Donor;