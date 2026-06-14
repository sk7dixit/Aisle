const express = require('express');
const router = express.Router();
const { triggerIncidentResponsePlaybook } = require('../controllers/incidentController');
const { protect, authorize, requireElevatedPrivilege } = require('../middleware/authMiddleware');

// Only Super Admins can trigger containment and mitigation playbooks with elevated privilege verified
router.post('/playbook/trigger', protect, authorize('super_admin'), requireElevatedPrivilege, triggerIncidentResponsePlaybook);

module.exports = router;
