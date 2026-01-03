"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

interface AddressData {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface PincodeData {
  city: string;
  district: string;
  state: string;
  isServiceable: boolean;
  deliveryDays: number;
  codAvailable: boolean;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  onValidation?: (isValid: boolean, errors: string[]) => void;
  showServiceability?: boolean;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  useTranslations?: boolean; // Enable translations (requires I18nProvider)
}

export default function AddressInput({
  value,
  onChange,
  onValidation,
  showServiceability = true,
  required = false,
  label,
  disabled = false,
  useTranslations = false,
}: AddressInputProps) {
  const [pincodeData, setPincodeData] = useState<PincodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Try to use translations if available
  let t: ((key: string) => string) | null = null;
  try {
    if (useTranslations) {
      const i18n = useI18n();
      t = i18n.t as (key: string) => string;
    }
  } catch {
    // I18nProvider not available, use fallback
  }

  // Translation helper with fallback
  const getText = (key: string, fallback: string): string => {
    if (t) {
      const translated = t(key as any);
      return translated !== key ? translated : fallback;
    }
    return fallback;
  };

  const displayLabel = label || getText("address.title", "Delivery Address");

  // Debounced pincode lookup
  const lookupPincode = useCallback(
    debounce(async (pincode: string) => {
      if (!/^\d{6}$/.test(pincode)) {
        setPincodeData(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/address/validate?pincode=${pincode}&checkServiceability=true`);
        const data = await res.json();

        if (data.success) {
          setPincodeData(data.data);

          // Auto-fill city and state
          if (data.data.city) {
            onChange({
              ...value,
              city: data.data.district || data.data.city,
              state: data.data.state,
            });
          }
        }
      } catch (err) {
        console.error("Pincode lookup error:", err);
      } finally {
        setLoading(false);
      }
    }, 500),
    [value]
  );

  // Validate on change
  useEffect(() => {
    const newErrors: string[] = [];

    if (required) {
      if (!value.addressLine1 || value.addressLine1.length < 5) {
        newErrors.push(getText("address.errors.addressRequired", "Address is required (min 5 characters)"));
      }
      if (!value.pincode || !/^\d{6}$/.test(value.pincode)) {
        newErrors.push(getText("address.errors.pincodeRequired", "Valid 6-digit pincode is required"));
      }
      if (!value.phone || !/^[6-9]\d{9}$/.test(value.phone.replace(/\D/g, ""))) {
        newErrors.push(getText("address.errors.phoneRequired", "Valid 10-digit phone number is required"));
      }
    }

    if (pincodeData && !pincodeData.isServiceable) {
      newErrors.push(getText("address.errors.notServiceable", "This pincode is not serviceable"));
    }

    setErrors(newErrors);
    onValidation?.(newErrors.length === 0, newErrors);
  }, [value, pincodeData, required, onValidation]);

  // Lookup pincode when it changes
  useEffect(() => {
    if (value.pincode) {
      lookupPincode(value.pincode);
    }
  }, [value.pincode, lookupPincode]);

  const handleChange = (field: keyof AddressData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  return (
    <div className="space-y-4">
      {displayLabel && (
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">{displayLabel}</span>
          {required && <span className="text-red-500">*</span>}
        </div>
      )}

      {/* Pincode - First for auto-fill */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            {getText("address.pincode", "Pincode")}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder={getText("address.pincodeHint", "6-digit pincode")}
              value={value.pincode}
              onChange={(e) => handleChange("pincode", e.target.value.replace(/\D/g, ""))}
              onBlur={() => handleBlur("pincode")}
              disabled={disabled}
              className={`w-full px-4 py-2 border rounded-lg pr-10 ${
                touched.pincode && !/^\d{6}$/.test(value.pincode)
                  ? "border-red-300 focus:border-red-500"
                  : pincodeData?.isServiceable
                    ? "border-green-300 focus:border-green-500"
                    : "border-gray-300 focus:border-cyan-500"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {loading ? (
                <Loader className="h-4 w-4 text-gray-400 animate-spin" />
              ) : pincodeData?.isServiceable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : pincodeData && !pincodeData.isServiceable ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            {getText("address.phone", "Phone")}
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder={getText("address.phoneHint", "10-digit phone")}
            value={value.phone}
            onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
            onBlur={() => handleBlur("phone")}
            disabled={disabled}
            className={`w-full px-4 py-2 border rounded-lg ${
              touched.phone && !/^[6-9]\d{9}$/.test(value.phone)
                ? "border-red-300"
                : "border-gray-300"
            }`}
          />
        </div>
      </div>

      {/* Serviceability Badge */}
      {showServiceability && pincodeData && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between ${
            pincodeData.isServiceable
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {pincodeData.isServiceable ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700">
                  {getText("address.serviceable", "Serviceable")} • {pincodeData.deliveryDays}{" "}
                  {pincodeData.deliveryDays === 1
                    ? getText("address.dayDelivery", "day delivery")
                    : getText("address.daysDelivery", "days delivery")}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-700">
                  {getText("address.notServiceable", "Not serviceable")}
                </span>
              </>
            )}
          </div>
          {pincodeData.isServiceable && (
            <div className="flex gap-2">
              {pincodeData.codAvailable && (
                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                  {getText("address.cod", "COD")}
                </span>
              )}
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                {getText("address.prepaid", "PREPAID")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Address Line 1 */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          {getText("address.addressLine1", "Address Line 1 (House/Flat No., Building, Street)")}
        </label>
        <input
          type="text"
          placeholder={getText("address.addressLine1Placeholder", "House no., Building name, Street")}
          value={value.addressLine1}
          onChange={(e) => handleChange("addressLine1", e.target.value)}
          onBlur={() => handleBlur("addressLine1")}
          disabled={disabled}
          className={`w-full px-4 py-2 border rounded-lg ${
            touched.addressLine1 && value.addressLine1.length < 5
              ? "border-red-300"
              : "border-gray-300"
          }`}
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          {getText("address.addressLine2", "Address Line 2 (Landmark, Area) - Optional")}
        </label>
        <input
          type="text"
          placeholder={getText("address.addressLine2Placeholder", "Near landmark, Area name")}
          value={value.addressLine2}
          onChange={(e) => handleChange("addressLine2", e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border rounded-lg border-gray-300"
        />
      </div>

      {/* City and State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            {getText("address.city", "City/District")}
          </label>
          <input
            type="text"
            placeholder={getText("address.city", "City")}
            value={value.city}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={disabled || (pincodeData?.city ? true : false)}
            className={`w-full px-4 py-2 border rounded-lg ${
              pincodeData?.city ? "bg-gray-50" : ""
            } border-gray-300`}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            {getText("address.state", "State")}
          </label>
          <input
            type="text"
            placeholder={getText("address.state", "State")}
            value={value.state}
            onChange={(e) => handleChange("state", e.target.value)}
            disabled={disabled || (pincodeData?.state ? true : false)}
            className={`w-full px-4 py-2 border rounded-lg ${
              pincodeData?.state ? "bg-gray-50" : ""
            } border-gray-300`}
          />
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && Object.keys(touched).length > 0 && (
        <div className="text-sm text-red-600 space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
