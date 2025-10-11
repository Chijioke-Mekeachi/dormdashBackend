const express = require('express');
const route = express.Router();
const db = require('../database/SqliteAuto');

// Simple boost plans (static)
const boostPlans = [
  { id: 'basic', name: 'Basic', price: 5, durationDays: 7, features: ['priority-listing'] },
  { id: 'pro', name: 'Pro', price: 15, durationDays: 30, features: ['priority-listing', 'featured'] },
];

db.createTable('payments', ['paymentId', 'amount', 'currency', 'metadata', 'status']);

// GET /boost/plans
route.get('/boost/plans', (req, res) => {
  return res.json(boostPlans);
});

// POST /payments/initiate
route.post('/payments/initiate', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    const paymentId = `pay_${Date.now()}`;
    await db.insert('payments', { paymentId, amount, currency, metadata: JSON.stringify(metadata || {}), status: 'pending' });
    // Default to a mock paymentUrl; frontend may instead call Paystack-specific initiate endpoint below
    return res.json({ paymentUrl: `https://payments.example/checkout/${paymentId}`, paymentId });
  } catch (err) {
    console.error('payments initiate error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /payments/:paymentId/status
route.get('/payments/:paymentId/status', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const data = await db.findBy('payments', 'paymentId', paymentId);
    if (!data) return res.status(404).json({ error: 'Payment not found' });
    return res.json({ status: data.status, receipt: data.metadata || null });
  } catch (err) {
    console.error('payment status error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /transactions
route.get('/transactions', async (req, res) => {
  try {
    const data = await db.getAll('payments');
    return res.json(data);
  } catch (err) {
    console.error('transactions error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Paystack integration
// POST /payments/paystack/initiate
// body: { amount, email, metadata }
route.post('/paystack/initiate', async (req, res) => {
  try {
    const { amount, email, metadata } = req.body;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
    if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'Paystack not configured' });

    const reference = `ps_${Date.now()}`;
    const body = { amount: Number(amount) * 100, email, metadata: metadata || {}, reference };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!data.status) return res.status(502).json({ error: 'Paystack initiation failed', details: data });

    // store payment record
    await db.insert('payments', { paymentId: reference, amount, currency: 'NGN', metadata: JSON.stringify(metadata || {}), status: 'initialized' });

    return res.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
  } catch (err) {
    console.error('paystack initiate error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /payments/paystack/verify/:reference
route.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
    if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'Paystack not configured' });

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await response.json();
    if (!data.status) return res.status(502).json({ error: 'Paystack verify failed', details: data });

    // update payment status in DB
    await db.update('payments', { status: data.data.status }, 'paymentId', reference);
    return res.json(data.data);
  } catch (err) {
    console.error('paystack verify error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = route;
