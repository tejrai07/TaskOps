const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, habitController.getHabits);
router.post('/', authMiddleware, habitController.addHabit);
router.post('/:id/complete', authMiddleware, habitController.completeHabit);

module.exports = router;
