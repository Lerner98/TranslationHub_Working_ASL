const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', reportsController.submitReport);
router.get('/:id', authMiddleware, reportsController.getReport);
router.get('/', authMiddleware, reportsController.getAllReports);
router.put('/:id', authMiddleware, reportsController.updateReport);
router.delete('/:id', authMiddleware, reportsController.deleteReport);
router.get('/statistics/errors-by-day', authMiddleware, reportsController.getErrorsByDay);
router.get('/statistics/most-reported', authMiddleware, reportsController.getMostReported);
router.get('/statistics/translation-stats/:userId', authMiddleware, reportsController.getTranslationStatsByUser);
router.get('/statistics/top-active-users', authMiddleware, reportsController.getTopActiveUsers);
router.get('/statistics/audit-logs/:userId', authMiddleware, reportsController.getRecentAuditLogs);

module.exports = router;