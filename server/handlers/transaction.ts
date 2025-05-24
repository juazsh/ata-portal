import { Request, Response } from 'express';
import Transaction from '../models/transaction';

export const addTransaction = async (data: any, session?: any) => {
  const tx = new Transaction(data);
  return session ? tx.save({ session }) : tx.save();
};

export const getTransactionsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
}; 