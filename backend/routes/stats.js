const express = require('express');
const router = express.Router();
const Stats = require('../models/Stats');

// GET stats
router.get('/', async (req, res) => {
  try {
    let stats = await Stats.findOne();
    if (!stats) stats = await Stats.create({});
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE stats
router.put('/', async (req, res) => {
  try {
    let stats = await Stats.findOne();
    if (!stats) stats = new Stats();
    Object.assign(stats, req.body);
    await stats.save();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INCREMENT visitor count
router.post('/increment-visitor', async (req, res) => {
  try {
    let stats = await Stats.findOne();
    if (!stats) stats = await Stats.create({});
    stats.visitors += 1;
    await stats.save();
    res.json({ visitors: stats.visitors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
