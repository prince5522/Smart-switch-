require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();

// Safeguard against missing environment variables
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("FATAL ERROR: Missing MONGO_URI or JWT_SECRET environment variables.");
    process.exit(1);
}

app.use(cors());
app.use(express.json());

// MongoDB Cloud Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Cloud"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// Middleware to verify JWT Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. Token missing." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

// ================= USER AUTHENTICATION ================= //

// 1. REGISTER
app.post("/api/auth/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: "Username already taken." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username: username.toLowerCase(),
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            message: "Account created successfully. You can now log in."
        });

    } catch (err) {
        res.status(500).json({ error: "Server error during registration." });
    }
});

// 2. LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.json({
            token,
            user: { username: user.username }
        });

    } catch (err) {
        res.status(500).json({ error: "Server error during login." });
    }
});

// 3. VERIFY SESSION
app.get("/api/auth/me", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server error." });
    }
});

// ================= DEVICE CONTROL ================= //

app.post("/api/device/control", verifyToken, async (req, res) => {
    try {
        const { state } = req.body;

        if (!["ON", "OFF"].includes(state)) {
            return res.status(400).json({ error: "Invalid state. Use 'ON' or 'OFF'." });
        }

        // Relay command logic (e.g., MQTT publish to ESP8266)
        res.json({ message: `Switch turned ${state}`, state });

    } catch (err) {
        res.status(500).json({ error: "Failed to issue device command." });
    }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
