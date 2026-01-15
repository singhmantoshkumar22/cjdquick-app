"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
} from "lucide-react";

export default function FinanceDashboardPage() {
  const stats = [
    {
      title: "COD Collected",
      value: "₹4,56,789",
      change: "+12%",
      icon: IndianRupee,
      color: "text-green-600",
    },
    {
      title: "Pending Remittance",
      value: "₹1,23,456",
      change: "-5%",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Weight Disputes",
      value: "23",
      change: "+8%",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Reconciled Today",
      value: "₹89,234",
      change: "+23%",
      icon: CheckCircle,
      color: "text-blue-600",
    },
  ];

  const recentTransactions = [
    { id: "TXN001", type: "COD Remittance", courier: "Delhivery", amount: 45600, status: "COMPLETED" },
    { id: "TXN002", type: "Weight Adjustment", courier: "BlueDart", amount: -1234, status: "PENDING" },
    { id: "TXN003", type: "COD Remittance", courier: "DTDC", amount: 23456, status: "COMPLETED" },
    { id: "TXN004", type: "Freight Charge", courier: "Ekart", amount: -5678, status: "DISPUTED" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of COD, reconciliation, and financial metrics
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span>{" "}
                from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              COD Reconciliation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹2,34,567</p>
            <p className="text-sm text-muted-foreground">Pending reconciliation</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Weight Discrepancies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">45</p>
            <p className="text-sm text-muted-foreground">Disputes to resolve</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Freight Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹56,789</p>
            <p className="text-sm text-muted-foreground">This month charges</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{txn.type}</p>
                  <p className="text-sm text-muted-foreground">{txn.courier}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${txn.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {txn.amount > 0 ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString()}
                  </p>
                  <Badge variant={txn.status === "COMPLETED" ? "default" : txn.status === "PENDING" ? "secondary" : "destructive"}>
                    {txn.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
