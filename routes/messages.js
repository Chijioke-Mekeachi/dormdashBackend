const express = require('express');
const route = express.Router();
const db = require('../database/SqliteAuto');

// Ensure tables
db.createTable('inquiries', ['propertyId', 'fromName', 'fromEmail', 'fromPhone', 'message', 'createdAt']);
db.createTable('messages', ['fromUser', 'toUser', 'propertyId', 'body', 'createdAt']);

// POST /inquiries
route.post('/inquiries', async (req, res) => {
  try {
    const { propertyId, fromName, fromEmail, fromPhone, message } = req.body;
    const createdAt = new Date().toISOString();
    const result = await db.insert('inquiries', { propertyId, fromName, fromEmail, fromPhone, message, createdAt });
    return res.json({ id: result.lastID || null, createdAt, sent: true });
  } catch (err) {
    console.error('inquiries create error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /inquiries
route.get('/inquiries', async (req, res) => {
  try {
    const { propertyId } = req.query;
    if (propertyId) {
      const data = await db.findAllBy('inquiries', 'propertyId', propertyId);
      return res.json(data);
    }
    const data = await db.getAll('inquiries');
    return res.json(data);
  } catch (err) {
    console.error('inquiries list error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /messages/user/:userId
route.get('/messages/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = await db.findAllBy('messages', 'toUser', userId);
    return res.json(data);
  } catch (err) {
    console.error('messages user error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /messages/conversations
route.get('/messages/conversations', async (req, res) => {
  try {
    // Simple: return all messages grouped by propertyId
    const data = await db.getAll('messages');
    return res.json(data);
  } catch (err) {
    console.error('messages conv error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /messages/send
route.post('/messages/send', async (req, res) => {
  try {
    const { toUserId, fromUserId, propertyId, body } = req.body;
    const createdAt = new Date().toISOString();
    const result = await db.insert('messages', { fromUser: fromUserId, toUser: toUserId, propertyId, body, createdAt });
    return res.json({ id: result.lastID || null, sent: true });
  } catch (err) {
    console.error('messages send error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = route;
