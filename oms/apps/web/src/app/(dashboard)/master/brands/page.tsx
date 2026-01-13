"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Building2,
  Package,
  ShoppingCart,
  Eye,
  Edit,
  Trash2,
  UserPlus,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for brands/clients
const brands = [
  {
    id: "1",
    code: "DEMO-BRAND",
    name: "Demo Brand",
    company: "Demo Company",
    companyCode: "DEMO",
    contactPerson: "John Doe",
    contactEmail: "john@demobrand.com",
    users: 3,
    skus: 45,
    orders: 456,
    status: "active",
    createdAt: "2024-01-20",
  },
  {
    id: "2",
    code: "FASHION-X",
    name: "Fashion X",
    company: "Demo Company",
    companyCode: "DEMO",
    contactPerson: "Jane Smith",
    contactEmail: "jane@fashionx.com",
    users: 2,
    skus: 120,
    orders: 892,
    status: "active",
    createdAt: "2024-02-15",
  },
  {
    id: "3",
    code: "TECH-GADGETS",
    name: "Tech Gadgets",
    company: "ABC Corporation",
    companyCode: "ABC",
    contactPerson: "Mike Wilson",
    contactEmail: "mike@techgadgets.com",
    users: 4,
    skus: 78,
    orders: 234,
    status: "active",
    createdAt: "2024-03-01",
  },
  {
    id: "4",
    code: "HOME-DECOR",
    name: "Home Decor Plus",
    company: "XYZ Industries",
    companyCode: "XYZ",
    contactPerson: "Sarah Johnson",
    contactEmail: "sarah@homedecor.com",
    users: 2,
    skus: 200,
    orders: 567,
    status: "active",
    createdAt: "2024-03-15",
  },
  {
    id: "5",
    code: "SPORTS-GEAR",
    name: "Sports Gear Pro",
    company: "Global Retail",
    companyCode: "GLOBAL",
    contactPerson: "David Brown",
    contactEmail: "david@sportsgear.com",
    users: 1,
    skus: 56,
    orders: 123,
    status: "inactive",
    createdAt: "2024-04-10",
  },
];

const stats = [
  { label: "Total Brands", value: "48", icon: Users, color: "blue" },
  { label: "Active Brands", value: "42", icon: Users, color: "green" },
  { label: "Total SKUs", value: "2,456", icon: Package, color: "purple" },
  { label: "Total Orders", value: "12,456", icon: ShoppingCart, color: "orange" },
];

const companies = ["All Companies", "Demo Company", "ABC Corporation", "XYZ Industries", "Global Retail"];

export default function BrandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("All Companies");

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch =
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany =
      selectedCompany === "All Companies" || brand.company === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Clients & Brands Management
          </h1>
          <p className="text-muted-foreground">
            Manage all brands and clients across companies in the OMS Master Panel
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Brand/Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`rounded-lg p-3`}
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

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Brands & Clients</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand/Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead className="text-center">SKUs</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {brand.code}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{brand.company}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{brand.contactPerson}</p>
                      <p className="text-sm text-muted-foreground">
                        {brand.contactEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{brand.users}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {brand.skus}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {brand.orders.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        brand.status === "active" ? "default" : "secondary"
                      }
                      className={
                        brand.status === "active"
                          ? "bg-green-100 text-green-700"
                          : ""
                      }
                    >
                      {brand.status}
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
                          Edit Brand
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Brand User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Package className="mr-2 h-4 w-4" />
                          Manage SKUs
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          View Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Brand
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
