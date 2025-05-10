const express = require("express");
const sql = require("mssql");
const dbConfig = require("../config/dbConfig");

const router = express.Router();

// Warden logs location
router.post("/fire-wardens", async (req, res) => {
  const { staff_number, first_name, last_name, location } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const request = new sql.Request(transaction);

    // Insert into main table
    await request
      .input("staff_number", sql.Int, staff_number)
      .input("first_name", sql.NVarChar, first_name)
      .input("last_name", sql.NVarChar, last_name)
      .input("location", sql.NVarChar, location)
      .query(`
        INSERT INTO fire_wardens (staff_number, first_name, last_name, location, entry_time)
        VALUES (@staff_number, @first_name, @last_name, @location, GETDATE())
      `);

    // Insert into log table
    await request.query(`
      INSERT INTO fire_wardens_log (staff_number, first_name, last_name, location, entry_time)
      VALUES (@staff_number, @first_name, @last_name, @location, GETDATE())
    `);

    await transaction.commit();

    res.json({ message: "Location logged successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wardens by role
router.get("/wardens/:role", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("role", sql.NVarChar, req.params.role)
      .query(`SELECT * FROM users WHERE role = @role`);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific warden's current entries
router.get("/fire-wardens/:staff_number", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("staff_number", sql.Int, req.params.staff_number)
      .query(`
        SELECT * FROM fire_wardens
        WHERE staff_number = @staff_number
        ORDER BY entry_time DESC
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin view of wardens in the last 24 hours
router.get("/fire-wardens", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .query(`
        SELECT * FROM fire_wardens
        WHERE DATEDIFF(HOUR, entry_time, GETDATE()) <= 24
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific fire_wardens entry
router.delete("/fire-wardens/:entry_id", async (req, res) => {
  const { entry_id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input("entry_id", sql.Int, entry_id)
      .query("DELETE FROM fire_wardens WHERE id = @entry_id");

    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all entries from fire_wardens_log (for archive)
router.get("/fire-wardens-log", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .query("SELECT * FROM fire_wardens_log ORDER BY entry_time DESC");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching fire_wardens_log:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
