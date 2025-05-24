import express from 'express';
import { getTransactionsByUserId } from '../handlers/transaction';

const router = express.Router();

router.get('/user/:userId', getTransactionsByUserId);

export default router; 