const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sql = require("mssql");
const dbConfig = require("../config/dbConfig");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Signup Route
router.post("/signup", async (req, res) => {
  const { email, password, first_name, last_name, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("email", sql.NVarChar, email)
      .input("password", sql.NVarChar, hashedPassword)
      .input("first_name", sql.NVarChar, first_name)
      .input("last_name", sql.NVarChar, last_name)
      .input("role", sql.NVarChar, role)
      .query(
        `INSERT INTO users (email, password, first_name, last_name, role)
         VALUES (@email, @password, @first_name, @last_name, @role)`
      );

    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        staff_number: user.staff_number,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      staff_number: user.staff_number,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Password Route
router.put("/update-password", async (req, res) => {
  const { staff_number, new_password } = req.body;

  if (!new_password) {
    return res.status(400).json({ error: "New password required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(new_password, 10);
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("staff_number", sql.Int, staff_number)
      .input("password", sql.NVarChar, hashedPassword)
      .query(
        `UPDATE users SET password = @password WHERE staff_number = @staff_number`
      );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update First or Last Name
router.put("/update-user", async (req, res) => {
  const { staff_number, first_name, last_name } = req.body;

  if (!staff_number) {
    return res.status(400).json({ error: "Staff number required" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    if (first_name) {
      await pool.request()
        .input("staff_number", sql.Int, staff_number)
        .input("first_name", sql.NVarChar, first_name)
        .query(`UPDATE users SET first_name = @first_name WHERE staff_number = @staff_number`);
    }

    if (last_name) {
      await pool.request()
        .input("staff_number", sql.Int, staff_number)
        .input("last_name", sql.NVarChar, last_name)
        .query(`UPDATE users SET last_name = @last_name WHERE staff_number = @staff_number`);
    }

    res.json({ message: "User details updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
