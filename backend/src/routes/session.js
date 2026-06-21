import express from 'express';
import { getDistrict, setDistrict, listDistricts } from '../controllers/sessionController.js';

const router = express.Router();

router.get('/session/district', getDistrict);
router.post('/session/district', setDistrict);
router.get('/session/districts', listDistricts);

export default router;
