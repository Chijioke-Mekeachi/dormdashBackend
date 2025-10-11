const express = require('express');
const route = express.Router();
const db = require('../database/SqliteAuto');

db.createTable('favorites', ['userId', 'productId', 'createdAt']);

// POST /favorites
route.post('/', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const createdAt = new Date().toISOString();
    const result = await db.insert('favorites', { userId, productId, createdAt });
    return res.json({ id: result.lastID || null });
  } catch (err) {
    console.error('favorites create error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /favorites/:id
route.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.delete('favorites', 'id', id);
    return res.json({ deleted: true });
  } catch (err) {
    console.error('favorites delete error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /favorites
route.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      const data = await db.findAllBy('favorites', 'userId', userId);
      return res.json(data);
    }
    const data = await db.getAll('favorites');
    return res.json(data);
  } catch (err) {
    console.error('favorites list error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = route;
