const express = require('express');
const router = express.Router();
const Archive = require('../models/Archive');

router.get('/', async (req, res) => {
  try {
    const archives = await Archive.find().sort({ createdAt: -1 });
    res.json(archives);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const archive = await Archive.create(req.body);
    res.status(201).json(archive);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const archive = await Archive.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(archive);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Archive.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
