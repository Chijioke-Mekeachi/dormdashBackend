const express = require('express');
const route = express.Router();
const db = require('../database/SqliteAuto');

db.createTable('commissions', ['agentId', 'month', 'amount', 'reference', 'status']);

// GET /agents/:id/commissions
route.get('/:id/commissions', async (req, res) => {
  try {
    const agentId = req.params.id;
    const data = await db.findAllBy('commissions', 'agentId', agentId);
    return res.json(data);
  } catch (err) {
    console.error('commissions list error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /commissions/settle
route.post('/commissions/settle', async (req, res) => {
  try {
    const { agentId, month, amount, reference } = req.body;
    await db.insert('commissions', { agentId, month, amount, reference, status: 'settled' });
    return res.json({ status: 'settled' });
  } catch (err) {
    console.error('commissions settle error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = route;
