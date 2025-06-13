const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.register = async (req, res) => {
  const { name,  email, password, role, business_id ,bname } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, email, password_hash, role, business_id, business_name, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`;

    db.query(sql, [name, email, hashedPassword, role, business_id ,bname || null], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(`SELECT * FROM users WHERE email = ?`, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        business_id: user.business_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 🎯 Send everything needed for the frontend
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        business_id: user.business_id,
        business_name: user.business_name, // <-- Make sure this column exists in your `users` table
      },
    });
  });
};

exports.getAllServices = async (req, res) => {
  const sql = 'SELECT * FROM services';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve services' });
    }

    res.status(200).json(results);
  });
};

exports.postService = (req, res) => {
  const { name, price, duration_minutes, business_id } = req.body;

  if (!name || !price || !duration_minutes || !business_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO services (name, price, duration_minutes, business_id)
               VALUES (?, ?, ?, ?)`;

  db.query(sql, [name, price, duration_minutes, business_id], (err, result) => {
    if (err) {
      console.error('Error inserting service:', err.message);
      return res.status(500).json({ error: 'Failed to add service backend ' });
    }

    res.status(201).json({ message: 'Service added successfully' });
  });
};

exports.deleteService = (req, res) => {
  db.query('DELETE FROM services WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Service deleted' });
  });
};

exports.updateService = (req, res) => {
  const { name, price, duration_minutes, business_id } = req.body;
  db.query('UPDATE services SET name = ?, price = ?, duration_minutes = ?, business_id = ? WHERE id = ?',
    [name, price, duration_minutes, business_id, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Service updated' });
    });
};

exports.bulkDeleteServices = (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ID list' });

  const placeholders = ids.map(() => '?').join(',');
  db.query(`DELETE FROM services WHERE id IN (${placeholders})`, ids, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Services deleted' });
  });
};




