const express = require("express");
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const app = express();
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

require("./db/conn"); 
const Register = require("./models/registers");
const Donor = require("./models/donorRegisters");
const Hospital = require("./models/hlRegisters");

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const templates_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: true }));
const flash = require('connect-flash'); // Require connect-flash
app.use(flash()); // Initialize flash

let appointments = []; // In-memory storage for appointments

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(static_path));

// Session and Passport setup
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Hard-coded admin credentials
const adminUser  = {
    email: 'admin@gmail.com',
    password: 'admin123' // In a real application, use hashed passwords
};

// Passport configuration
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async function (email, password, done) {
        try {
            // Check in Donor model
            let user = await Donor.findOne({ email });
            if (user && await bcrypt.compare(password, user.password)) {
                return done(null, { ...user.toObject(), role: 'donor' });
            }

            // Check in Hospital model
            user = await Hospital.findOne({ hospital_email: email });
            if (user && await bcrypt.compare(password, user.password)) {
                return done(null, { ...user.toObject(), role: 'hospital' });
            }

            // Check admin credentials
            if (email === adminUser .email && password === adminUser .password) {
                return done(null, { ...adminUser , role: 'admin' });
            }

            return done(null, false, { message: 'Invalid credentials' });
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser (function (user, done) {
    done(null, { email: user.email, role: user.role });
});

passport.deserializeUser (async function (obj, done) {
    let user;
    if (obj.role === 'donor') {
        user = await Donor.findOne({ email: obj.email });
    } else if (obj.role === 'hospital') {
        user = await Hospital.findOne({ hospital_email: obj.email });
    } else {
        user = adminUser ; // For admin
    }
    done(null, user);
});

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
    res.render("hospital-login");
});

app.get("/privacy", (req, res) => {
    res.render("privacy");
});

app.get("/terms", (req, res) => {
    res.render("terms");
});

app.get("/hospital-dashboard", async (req, res) => {
    try {
        const donors = await Donor.find(); // Fetch all donors
        const appointments = donors.flatMap(donor => donor.appointments.map(appointment => ({
            donorName: donor.fullname,
            bloodGroup: donor.bloodGroup, // Assuming bloodGroup is a field in the Donor model
            contactNumber: donor.phone, // Assuming phone is the contact number
            date: appointment.date,
            time: appointment.time,
            status: appointment.status
        }))); // Flatten appointments from all donors with additional details

        const receivers = await Register.find(); // Fetch all receivers
        const receiverRequests = receivers.map(receiver => ({
            receiverName: receiver.full_name,
            bloodGroup: receiver.blood_groups, // Assuming blood_groups is a field in the Register model
            contactNumber: receiver.mob_no, // Assuming mob_no is the contact number
            date: receiver.appointmentDate, // Ensure this field exists in the Register model
            time: receiver.appointmentTime // Ensure this field exists in the Register model
        }));

        res.render("hospital-dashboard", { appointments, receiverRequests }); // Pass appointments and receiverRequests to the template

    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).send("Error fetching appointments");
    }
});

// Fetch hospital records
app.get("/admin/hospital-records", async (req, res) => {
    try {
        const hospitals = await Hospital.find();
        res.json(hospitals);
    } catch (error) {
        console.error("Error fetching hospital records:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Fetch donor records
app.get("/admin/donor-records", async (req, res) => {
    try {
        const donors = await Donor.find();
        res.json(donors);
    } catch (error) {
        console.error("Error fetching donor records:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Sign-In Routes
app.get("/signin", (req, res) => {
    res.render("signin");
});

app.post("/signin", passport.authenticate('local', {
    failureRedirect: '/signin',
    failureFlash: true // Optional: to show flash messages
}), (req, res) => {
    // Check user type and redirect accordingly
    if (req.user.role === 'donor') {
        return res.redirect('/donorHomePage');
    } else if (req.user.role === 'hospital') {
        return res.redirect('/hospital-dashboard');
    } else {
        return res.redirect('/admin');
    }
});

app.get("/admin", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("admin");
    } else {
        res.redirect('/admin-signin');
    }
});

app.get("/reset-password", (req, res) => {
    res.render("reset-password");
});

app.get("/donorHomePage", async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const donor = await Donor.findById(req.user._id);
            res.render("donorHomePage", { appointments: donor.appointments });
        } catch (error) {
            console.error("Error fetching appointments:", error);
            res.status(500).send("Error fetching appointments");
        }
    } else {
        res.redirect('/signin');
    }
});

app.get("/donor-scheduling", async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const donor = await Donor.findById(req.user._id);
            const hospitals = await Hospital.find({}, 'hospital_name city');
            res.render("donor-scheduling", { 
                appointments: donor.appointments,
                hospitals: hospitals 
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            res.status(500).send("Error fetching data");
        }
    } else {
        res.redirect('/signin');
    }
});

app.post('/schedule-appointment', async (req, res) => {
    const { city, blood_camp, blood_group, date, time } = req.body;
    const appointment = {
        date,
        hospital: blood_camp,
        time,
        status: 'Scheduled' // You can set the status as needed
    };
    try {
        const donor = await Donor.findById(req.user._id);
        donor.appointments.push(appointment);
        await donor.save();
        res.redirect('/donorHomePage'); // Redirect to donor home page
    } catch (error) {
        console.error("Error scheduling appointment:", error);
        res.status(500).send("Error scheduling appointment");
    }
});

app.get('/donor-home', (req, res) => {
    res.render('donorHomePage', { appointments: req.session.appointments || [] });
});

// Create a new user in our database for receivers
app.post("/request", async (req, res) => {
    try {
        const user = {
            full_name: req.body.full_name,
            email: req.body.email,
            mob_no: req.body.mob_no,
            district: req.body.district,
            city: req.body.city,
            blood_groups: req.body.blood_groups,
            gender: req.body.gender
        };

        await Register.create(user);
        res.redirect("/?success=true");
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(400).json({
            message: "Error creating user",
            error: error.message
        });
    }
});

// Create a new user in our database for donors
app.post("/donor-registration", async (req, res) => {
    try {
        const { fullname, email, phone, city, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const donor = new Donor({
            fullname,
            email,
            phone,
            city,
            password: hashedPassword
        });
        
        await donor.save();
        res.redirect('/donorHomePage');
    } catch (error) {
        console.error("Error registering donor:", error);
        res.status(400).json({ message: "Error registering donor", error: error.message });
    }
});

// Create a new user in our database for hospitals
app.post("/hospital-registration", async (req, res) => {
    try {
        const { hospital_name, hospital_id, hospital_address, hospital_email, applicant_name, contact_number, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const hospital = new Hospital({
            hospital_name,
            hospital_id,
            hospital_address,
            hospital_email,
            applicant_name,
            contact_number,
            password: hashedPassword
        });

        await hospital.save();
        res.redirect("/hospital-dashboard");
        
    } catch (error) {
        console.error("Error registering hospital:", error);
        res.status(400).json({ message: "Error registering hospital", error: error.message });
    }
});

// Reset password
app.post("/reset-password", async (req, res) => {
    const { userType, email, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }

    try {
        let user;
        if (userType === 'donor') {
            user = await Donor.findOne({ email });
        } else if (userType === 'hospital') {
            user = await Hospital.findOne({ hospital_email: email });
        }

        if (!user) {
            return res.status(404).json({ message: "User  not found." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

app.listen(port, () => {
    console.log(`Server is running at port no ${port}`);
});
