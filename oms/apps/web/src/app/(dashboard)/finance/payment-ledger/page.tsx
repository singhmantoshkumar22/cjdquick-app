"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function PaymentLedgerPage() {
  const transactions = [
    {
      id: "TXN001",
      date: "2024-01-15",
      type: "COD_REMITTANCE",
      description: "COD collection - Delhivery Batch #456",
      reference: "DEL/COD/2024/001",
      credit: 45600,
      debit: 0,
      balance: 145600,
    },
    {
      id: "TXN002",
      date: "2024-01-14",
      type: "FREIGHT_DEDUCTION",
      description: "Freight charges - BlueDart Invoice #INV-2024-002",
      reference: "BLU/FRT/2024/002",
      credit: 0,
      debit: 28010,
      balance: 100000,
    },
    {
      id: "TXN003",
      date: "2024-01-13",
      type: "COD_REMITTANCE",
      description: "COD collection - DTDC Batch #123",
      reference: "DTC/COD/2024/001",
      credit: 28010,
      debit: 0,
      balance: 128010,
    },
    {
      id: "TXN004",
      date: "2024-01-12",
      type: "WEIGHT_ADJUSTMENT",
      description: "Weight dispute credit - Delhivery",
      reference: "DEL/ADJ/2024/001",
      credit: 1250,
      debit: 0,
      balance: 100000,
    },
  ];

  const typeColors: Record<string, string> = {
    COD_REMITTANCE: "bg-green-100 text-green-800",
    FREIGHT_DEDUCTION: "bg-red-100 text-red-800",
    WEIGHT_ADJUSTMENT: "bg-blue-100 text-blue-800",
    REFUND: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Ledger</h1>
          <p className="text-muted-foreground">
            Track all financial transactions and balances
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Statement
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">₹1,45,600</p>
                <p className="text-sm text-muted-foreground">Current Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">₹74,860</p>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">₹28,010</p>
                <p className="text-sm text-muted-foreground">Total Debits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">45</p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="COD_REMITTANCE">COD Remittance</SelectItem>
                <SelectItem value="FREIGHT_DEDUCTION">Freight Deduction</SelectItem>
                <SelectItem value="WEIGHT_ADJUSTMENT">Weight Adjustment</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Courier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Couriers</SelectItem>
                <SelectItem value="delhivery">Delhivery</SelectItem>
                <SelectItem value="bluedart">BlueDart</SelectItem>
                <SelectItem value="dtdc">DTDC</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <input type="date" className="border rounded px-3 py-2 text-sm" />
              <span className="self-center">to</span>
              <input type="date" className="border rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All credits and debits for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-muted-foreground">{txn.date}</TableCell>
                  <TableCell>
                    <Badge className={typeColors[txn.type]}>
                      {txn.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className="font-mono text-sm">{txn.reference}</TableCell>
                  <TableCell className="text-right">
                    {txn.credit > 0 && (
                      <span className="text-green-600 flex items-center justify-end gap-1">
                        <ArrowDownLeft className="h-3 w-3" />
                        ₹{txn.credit.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {txn.debit > 0 && (
                      <span className="text-red-600 flex items-center justify-end gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        ₹{txn.debit.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ₹{txn.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
