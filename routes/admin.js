const express = require('express');
const route = express.Router();
const db = require('../database/SqliteAuto');

// GET /admin/properties
route.get('/properties', async (req, res) => {
  try {
    const data = await db.getAll('product');
    return res.json(data);
  } catch (err) {
    console.error('admin properties error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /admin/property/:id
route.delete('/property/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.delete('product', 'id', id);
    return res.json({ deleted: true });
  } catch (err) {
    console.error('admin delete property error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/stats
route.get('/stats', async (req, res) => {
  try {
    const users = await db.getAll('userAuth');
    const properties = await db.getAll('product');
    const stats = { users: users.length, properties: properties.length };
    return res.json(stats);
  } catch (err) {
    console.error('admin stats error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = route;
