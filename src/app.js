const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcrypt");




require("./db/conn"); 
const Register = require("./models/registers"); // Ensure this is the correct model

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const templates_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));




app.set("view engine", "hbs");
app.set("views", templates_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/registration", (req, res) => {
    res.render("registration");
});

app.get("/request", (req, res) => {
    res.render("request");
});

app.get("/donor-login", (req, res) => {
    res.render("donor-login");
});

app.get("/hospital-login", (req, res) => {
    res.render("hospital-login"); // Make sure you have this file created
});

app.get("/privacy", (req, res) => {
    res.render("privacy");
});

app.get("/terms", (req, res) => {
    res.render("terms");
});

app.get("/signin", (req, res) => {
    res.render("signin");
});

app.get("/reset-password", (req, res) => {
    res.render("reset-password");
});

// Create a new user in our database for recivers
app.post("/request", async (req, res) => {
    try {
        // Create a user object from the request body
        const user = {
            full_name: req.body.full_name,
            email: req.body.email,
            mob_no: req.body.mob_no,
            district: req.body.district,
            city: req.body.city,
            blood_groups: req.body.blood_groups,
            gender: req.body.gender
        };

        // Use the Register model to create a new user
        const newUser  = await Register.create(user); // Use Register instead of User

        // Send a success response
        res.status(201).json({
            message: "User  created successfully",
            user: newUser  
        });
    } catch (error) {
        // Send an error response
        res.status(400).send({
            message: "Error creating user",
            error: error.message
        });
    }
});

// Create a new user in our database for donors
const Donor = require("./models/donorRegisters"); // Adjust the path as necessary


app.post("/donor-registration", async (req, res) => {
    try {
        const { fullname, email, phone, city, password } = req.body; // Adjusted to match form input names

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const donor = new Donor({
            fullname, // Use 'fullname' instead of 'full_name'
            email,
            phone, // Use 'phone' instead of 'mob_no'
            city, // Use 'city' instead of 'address'
            password: hashedPassword // Save the hashed password
        });

        await donor.save();
        res.status(201).json({ message: "Donor registered successfully!" });
    } catch (error) {
        res.status(400).json({ message: "Error registering donor", error: error.message });
    }
});

// Create a new user in our database for hospitals
const Hospital = require("./models/hlRegisters"); // Adjust the path as necessary

app.post("/hospital-registration", async (req, res) => {
    try {
        const { hospital_name, hospital_id, hospital_address, hospital_email, applicant_name, contact_number, password } = req.body;

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const hospital = new Hospital({
            hospital_name,
            hospital_id,
            hospital_address,
            hospital_email,
            applicant_name,
            contact_number,
            password: hashedPassword // Save the hashed password
        });

        await hospital.save();
        res.status(201).json({ message: "Hospital registered successfully!" });
    } catch (error) {
        res.status(400).json({ message: "Error registering hospital", error: error.message });
    }
});



app.listen(port, () => {
    console.log(`Server is running at port no ${port}`);
});