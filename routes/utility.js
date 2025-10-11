const express = require('express');
const route = express.Router();

// GET /navigation
route.get('/navigation', (req, res) => {
  // TODO: Return navigation items
  res.json([]);
});

// GET /safety-rating/:propertyId
route.get('/safety-rating/:propertyId', (req, res) => {
  // TODO: Return safety rating
  res.json({});
});

// GET /suggestions
route.get('/suggestions', (req, res) => {
  // TODO: Return suggestions
  res.json([]);
});

module.exports = route;
