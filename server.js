// Import necessary modules
const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const session = require("express-session");
const jwt = require("jsonwebtoken");

// Load environment variables from .env file
dotenv.config();

// Create an Express application
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse URL-encoded and JSON request bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Create a MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.log("Error connecting to the database!", err.message);
    process.exit(1);
  } else {
    console.log("Database connected successfully!");
  }
});

// Serve the home page as the landing page
app.get("/", (req, res) => {
  res.sendFile("home.html", { root: path.join(__dirname, "public") });
});

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile("login.html", { root: path.join(__dirname, "public") });
});

// Serve the registration page
app.get("/register", (req, res) => {
  res.sendFile("register.html", { root: path.join(__dirname, "public") });
});

// Serve the dashboard page
app.get("/dashboard", (req, res) => {
  if (req.session.user && req.session.user.id) {
    res.sendFile("dashboard.html", { root: path.join(__dirname, "public") });
  } else {
    res.redirect("/login");
  }
});

// Route to get all categories
app.get("/api/categories", (req, res) => {
  const sql = "SELECT * FROM categories";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// Handle user registration
app.post("/api/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";
    const values = [email, username, hashedPassword];

    db.query(sql, values, (err) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: "Error registering user" });
      } else {
        res.json({ message: "User registered successfully" });
      }
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Handle user login and token generation
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ?";
    db.query(sql, [username], async (err, results) => {
      if (err) {
        console.log("Error fetching users", err.message);
        res.status(500).json({ error: "Internal Server Error" });
      } else if (results.length > 0) {
        const match = await bcrypt.compare(password, results[0].password);
        if (match) {
          const user = results[0];
          const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );
          res.json({ token });
          console.log(`User with username ${username} successfully logged in`);
        } else {
          res.status(401).json({ error: "Invalid Username or Password!" });
        }
      } else {
        res.status(401).json({ error: "Invalid Username or Password!" });
      }
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
  const token =
    req.headers["authorization"] && req.headers["authorization"].split(" ")[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Route to add an expense
app.post("/api/expense", authenticateJWT, (req, res) => {
  const { categoryId, amount } = req.body;
  const userId = req.user.id; // Get user ID from JWT
  const sql =
    "INSERT INTO expenses (userId, categoryId, amount) VALUES (?, ?, ?)";
  db.query(sql, [userId, categoryId, amount], (err) => {
    if (err) {
      console.error("Error adding expense:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json({ message: "Expense added successfully" });
  });
});

// Route to delete an expense by ID
app.delete("/api/expense/:id", authenticateJWT, (req, res) => {
  const expenseId = req.params.id;
  const sql = "DELETE FROM expenses WHERE id = ?";
  db.query(sql, [expenseId], (err) => {
    if (err) {
      console.error("Error deleting expense:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json({ message: "Expense deleted successfully" });
  });
});

// Handle logout
app.post("/api/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Fallback for handling undefined routes
app.use((req, res) => {
  res
    .status(404)
    .sendFile("404.html", { root: path.join(__dirname, "public") });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
