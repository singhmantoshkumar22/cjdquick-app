"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  MapPin,
  Users,
  Package,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data for companies
const companies = [
  {
    id: "1",
    code: "DEMO",
    name: "Demo Company",
    legalName: "Demo Company Pvt. Ltd.",
    gst: "27AABCU9603R1ZM",
    locations: 3,
    users: 12,
    brands: 5,
    orders: 1234,
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    code: "ABC",
    name: "ABC Corporation",
    legalName: "ABC Corporation Ltd.",
    gst: "29AABCU9603R1ZN",
    locations: 2,
    users: 8,
    brands: 3,
    orders: 856,
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    code: "XYZ",
    name: "XYZ Industries",
    legalName: "XYZ Industries Pvt. Ltd.",
    gst: "07AABCU9603R1ZO",
    locations: 5,
    users: 24,
    brands: 8,
    orders: 2456,
    status: "active",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    code: "GLOBAL",
    name: "Global Retail",
    legalName: "Global Retail Solutions Ltd.",
    gst: "33AABCU9603R1ZP",
    locations: 1,
    users: 4,
    brands: 2,
    orders: 342,
    status: "inactive",
    createdAt: "2024-04-05",
  },
];

const stats = [
  { label: "Total Companies", value: "12", icon: Building2, color: "blue" },
  { label: "Active Companies", value: "10", icon: Building2, color: "green" },
  { label: "Total Warehouses", value: "24", icon: MapPin, color: "purple" },
  { label: "Total Users", value: "156", icon: Users, color: "orange" },
];

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Companies Management
          </h1>
          <p className="text-muted-foreground">
            Manage all registered companies in the OMS Master Panel
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`rounded-lg p-3 bg-${stat.color}-100`}
                style={{
                  backgroundColor:
                    stat.color === "blue"
                      ? "#dbeafe"
                      : stat.color === "green"
                        ? "#dcfce7"
                        : stat.color === "purple"
                          ? "#f3e8ff"
                          : "#ffedd5",
                }}
              >
                <stat.icon
                  className={`h-5 w-5`}
                  style={{
                    color:
                      stat.color === "blue"
                        ? "#2563eb"
                        : stat.color === "green"
                          ? "#16a34a"
                          : stat.color === "purple"
                            ? "#9333ea"
                            : "#ea580c",
                  }}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Companies</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>GST</TableHead>
                <TableHead className="text-center">Locations</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead className="text-center">Brands</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {company.legalName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.code}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {company.gst}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {company.locations}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {company.users}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{company.brands}</TableCell>
                  <TableCell className="text-center font-medium">
                    {company.orders.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        company.status === "active" ? "default" : "secondary"
                      }
                      className={
                        company.status === "active"
                          ? "bg-green-100 text-green-700"
                          : ""
                      }
                    >
                      {company.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Company
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Users
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MapPin className="mr-2 h-4 w-4" />
                          Manage Locations
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
