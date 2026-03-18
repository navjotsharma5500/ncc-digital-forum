const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

// GET content
router.get('/', async (req, res) => {
  try {
    let content = await Content.findOne();
    if (!content) content = await Content.create({});
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE content
router.put('/', async (req, res) => {
  try {
    let content = await Content.findOne();
    if (!content) content = new Content();
    Object.assign(content, req.body);
    await content.save();
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
