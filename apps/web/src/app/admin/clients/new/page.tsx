"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  CreditCard,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, Button, Input } from "@cjdquick/ui";

interface CreateClientData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  gstNumber?: string;
  billingAddress: string;
  creditLimit?: number;
  paymentTermsDays?: number;
}

async function createClient(data: CreateClientData): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetch("/api/admin/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateClientData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    gstNumber: "",
    billingAddress: "",
    creditLimit: 0,
    paymentTermsDays: 15,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/clients");
        }, 2000);
      } else {
        setError(data.error || "Failed to create client");
      }
    },
    onError: () => {
      setError("An error occurred. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.companyName || !formData.contactName || !formData.email || !formData.password || !formData.billingAddress) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    createMutation.mutate(formData);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Client Created Successfully!</h2>
          <p className="text-gray-600 mt-2">
            The client account has been created. They can now log in using their email and password.
          </p>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
            <p className="text-sm text-gray-500">Login Credentials:</p>
            <p className="font-medium">Email: {formData.email}</p>
            <p className="font-medium">Password: {formData.password}</p>
          </div>
          <Link href="/admin/clients">
            <Button className="mt-6">Back to Clients</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Add New Client</h1>
          <p className="text-sm text-gray-500">Onboard a new client to CJDQuick</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name *</label>
              <Input
                id="companyName"
                type="text"
                placeholder="e.g., ABC Enterprises Pvt Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            <div>
              <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">GST Number</label>
              <Input
                id="gstNumber"
                type="text"
                placeholder="e.g., 27AABCU9603R1ZM"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">Billing Address *</label>
              <textarea
                id="billingAddress"
                placeholder="Full billing address including pincode"
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                required
              />
            </div>
          </div>
        </Card>

        {/* Contact Person */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Primary Contact (Account Owner)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Full Name *</label>
              <Input
                id="contactName"
                type="text"
                placeholder="e.g., Rahul Sharma"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., rahul@abcenterprises.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used for login and notifications
              </p>
            </div>
            <div className="col-span-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Initial Password *</label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="password"
                  type="text"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1"
                  required
                  minLength={8}
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this password with the client. They can change it after first login.
              </p>
            </div>
          </div>
        </Card>

        {/* Billing Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Settings
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">Credit Limit (INR)</label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                placeholder="e.g., 50000"
                value={formData.creditLimit || ""}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="paymentTermsDays" className="block text-sm font-medium text-gray-700">Payment Terms (Days)</label>
              <Input
                id="paymentTermsDays"
                type="number"
                min="0"
                max="90"
                placeholder="e.g., 15"
                value={formData.paymentTermsDays || ""}
                onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 15 })}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/clients">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Client"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
