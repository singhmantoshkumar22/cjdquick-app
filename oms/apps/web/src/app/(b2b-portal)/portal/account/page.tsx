"use client";

import { useEffect, useState } from "react";
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  gst: string;
  customerType: string;
  status: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentTerms: string;
  creditLimit: number;
  priceList?: string;
}

export default function B2BAccountPage() {
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const response = await fetch("/api/v1/b2b/account");
      if (response.ok) {
        const result = await response.json();
        setAccount(result.account);
      }
    } catch (error) {
      console.error("Failed to fetch account:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use account data from API
  const accountData: CustomerAccount | null = account;

  const formatPaymentTerms = (terms: string) => {
    const termMap: Record<string, string> = {
      IMMEDIATE: "Immediate Payment",
      NET_7: "Net 7 Days",
      NET_15: "Net 15 Days",
      NET_30: "Net 30 Days",
      NET_45: "Net 45 Days",
      NET_60: "Net 60 Days",
    };
    return termMap[terms] || terms;
  };

  const getCustomerTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      RETAIL: "bg-blue-100 text-blue-800",
      WHOLESALE: "bg-purple-100 text-purple-800",
      DISTRIBUTOR: "bg-green-100 text-green-800",
      DEALER: "bg-orange-100 text-orange-800",
      CORPORATE: "bg-indigo-100 text-indigo-800",
    };
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <User className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Account not found</h3>
        <p className="text-gray-500 mt-1">Unable to load account information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">My Account</h1>
          <p className="text-gray-500">Manage your account information</p>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Company Name</span>
              <span className="font-medium">{accountData.companyName}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">GST Number</span>
              <span className="font-mono">{accountData.gst}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Customer Type</span>
              {getCustomerTypeBadge(accountData.customerType)}
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              <Badge
                className={
                  accountData.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {accountData.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Person
              </span>
              <span className="font-medium">{accountData.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <span>{accountData.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </span>
              <span>{accountData.phone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p>{accountData.billingAddress.line1}</p>
                {accountData.billingAddress.line2 && (
                  <p>{accountData.billingAddress.line2}</p>
                )}
                <p>
                  {accountData.billingAddress.city}, {accountData.billingAddress.state}
                </p>
                <p className="font-mono">{accountData.billingAddress.pincode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p>{accountData.shippingAddress.line1}</p>
                {accountData.shippingAddress.line2 && (
                  <p>{accountData.shippingAddress.line2}</p>
                )}
                <p>
                  {accountData.shippingAddress.city}, {accountData.shippingAddress.state}
                </p>
                <p className="font-mono">{accountData.shippingAddress.pincode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Terms */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Account Terms
            </CardTitle>
            <CardDescription>Your pricing and payment terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="text-lg font-medium mt-1">
                  {formatPaymentTerms(accountData.paymentTerms)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Credit Limit</p>
                <p className="text-lg font-medium mt-1">
                  {accountData.creditLimit.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Price List</p>
                <p className="text-lg font-medium mt-1">
                  {accountData.priceList || "Standard Pricing"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
