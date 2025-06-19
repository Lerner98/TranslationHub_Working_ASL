const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');

router.post('/create', adminController.createAdmin);
router.get('/:id', authMiddleware, adminController.getAdmin);
router.get('/', authMiddleware, adminController.getAllAdmins);
router.put('/:id', authMiddleware, adminController.updateAdmin);
router.delete('/:id', authMiddleware, adminController.deleteAdmin);
router.post('/login', adminController.loginAdmin);

module.exports = router;