const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/evaluate', authMiddleware, taskController.evaluateTask);
router.get('/', authMiddleware, taskController.getTasks);

module.exports = router;
