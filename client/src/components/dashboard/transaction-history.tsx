import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import * as XLSX from 'xlsx';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  status: string;
  processor: string;
  transactionId: string;
  date: string;
  metadata?: Record<string, any>;
}

export const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`/api/transactions/user/${user.id}`)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(tx => ({
      Date: new Date(tx.date).toLocaleString(),
      Amount: tx.amount,
      Type: tx.type,
      Status: tx.status,
      Processor: tx.processor,
      'Transaction ID': tx.transactionId,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'transaction-history.xlsx');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Transaction History</h2>
        <Button onClick={downloadExcel} disabled={transactions.length === 0}>
          Download as Excel
        </Button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : transactions.length === 0 ? (
        <div>No transactions found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processor</TableHead>
              <TableHead>Transaction ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow key={tx._id}>
                <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                <TableCell>${tx.amount.toFixed(2)}</TableCell>
                <TableCell>{tx.type}</TableCell>
                <TableCell>{tx.status}</TableCell>
                <TableCell>{tx.processor}</TableCell>
                <TableCell>{tx.transactionId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default TransactionHistory; 