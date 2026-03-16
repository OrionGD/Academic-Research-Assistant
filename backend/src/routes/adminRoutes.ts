import express from 'express';
import { getSystemMetrics, getUsers, deleteUser } from '../controllers/adminController';

const router = express.Router();

router.get('/system-metrics', getSystemMetrics);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

export default router;
