"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  CheckCircle,
  Package,
  ChevronRight,
  Star,
  Sun,
  Sunset,
  Moon,
  MapPin,
  Phone,
  MessageSquare,
} from "lucide-react";
import { Button } from "@cjdquick/ui";
import { I18nProvider, useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Fetch available slots
async function fetchSlots(awb: string) {
  const res = await fetch(`/api/delivery-slots?awb=${awb}`);
  if (!res.ok) throw new Error("Failed to fetch slots");
  return res.json();
}

// Fetch shipment details
async function fetchShipment(awb: string) {
  const res = await fetch(`/api/public/track?awb=${awb}`);
  if (!res.ok) throw new Error("Shipment not found");
  return res.json();
}

// Book a slot
async function bookSlot(data: any) {
  const res = await fetch("/api/delivery-slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

function getSlotIcon(startTime: string) {
  const hour = parseInt(startTime.split(":")[0]);
  if (hour < 12) return <Sun className="h-5 w-5 text-yellow-500" />;
  if (hour < 16) return <Sunset className="h-5 w-5 text-orange-500" />;
  return <Moon className="h-5 w-5 text-purple-500" />;
}

function ScheduleContent() {
  const { t, language } = useI18n();
  const searchParams = useSearchParams();
  const awb = searchParams.get("awb") || "";

  const [step, setStep] = useState<"date" | "slot" | "confirm" | "success">("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [instructions, setInstructions] = useState("");
  const [phone, setPhone] = useState("");

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ["delivery-slots", awb],
    queryFn: () => fetchSlots(awb),
    enabled: !!awb,
  });

  const { data: shipmentData, isLoading: loadingShipment } = useQuery({
    queryKey: ["schedule-shipment", awb],
    queryFn: () => fetchShipment(awb),
    enabled: !!awb,
  });

  const mutation = useMutation({
    mutationFn: bookSlot,
    onSuccess: (data) => {
      if (data.success) {
        setStep("success");
      }
    },
  });

  const slots = slotsData?.data?.slots || [];
  const shipment = shipmentData?.data;

  const selectedDateSlots = slots.find((d: any) => d.date === selectedDate);

  // Get localized slot name
  const getSlotName = (name: string) => {
    const key = name.toLowerCase() as "morning" | "afternoon" | "evening";
    const translationKey = `schedule.${key}` as const;
    return t(translationKey as any) || name;
  };

  const handleConfirm = () => {
    mutation.mutate({
      awbNumber: awb,
      slotConfigId: selectedSlot?.id,
      slotDate: selectedDate,
      slotStartTime: selectedSlot?.startTime,
      slotEndTime: selectedSlot?.endTime,
      slotName: selectedSlot?.name,
      customerPhone: phone || shipment?.consigneePhone,
      specialInstructions: instructions,
    });
  };

  if (!awb) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">{t("schedule.title")}</h1>
          <p className="text-gray-500 mt-2">{t("schedule.accessFromTracking")}</p>
        </div>
      </div>
    );
  }

  if (loadingSlots || loadingShipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Success State
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("schedule.successTitle")}</h1>
          <p className="text-gray-600 mb-4">
            {t("schedule.successMessage")}
          </p>
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <p className="text-lg font-bold text-gray-900">
              {selectedDateSlots?.dayName}, {selectedDateSlots?.dayNumber} {selectedDateSlots?.month}
            </p>
            <p className="text-cyan-600 font-medium">
              {selectedSlot?.displayTime}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {t("schedule.successNote")}
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = `/track?awb=${awb}`}
          >
            {t("schedule.backToTracking")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{t("schedule.title")}</h1>
                <p className="text-sm text-gray-500">AWB: {awb}</p>
              </div>
            </div>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === "date" ? "bg-cyan-600 text-white" : "bg-cyan-100 text-cyan-600"
          }`}>
            1
          </div>
          <div className="w-8 h-0.5 bg-gray-200" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === "slot" ? "bg-cyan-600 text-white" :
            ["confirm", "success"].includes(step) ? "bg-cyan-100 text-cyan-600" : "bg-gray-200 text-gray-400"
          }`}>
            2
          </div>
          <div className="w-8 h-0.5 bg-gray-200" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === "confirm" ? "bg-cyan-600 text-white" :
            ["success"].includes(step) ? "bg-cyan-100 text-cyan-600" : "bg-gray-200 text-gray-400"
          }`}>
            3
          </div>
        </div>
        <div className="flex justify-center gap-8 mt-2 text-xs text-gray-500">
          <span>{t("schedule.deliveryDate")}</span>
          <span>{t("schedule.timeSlot")}</span>
          <span>{t("common.confirm")}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Shipment Info */}
        {shipment && (
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{t("schedule.deliveryTo")}{shipment.consigneeName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {shipment.consigneeCity}, {shipment.consigneePincode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Date */}
        {step === "date" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{t("schedule.selectDate")}</h2>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {slots.map((day: any) => (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex-shrink-0 p-4 rounded-xl text-center transition-all ${
                    selectedDate === day.date
                      ? "bg-cyan-600 text-white shadow-lg"
                      : "bg-white border hover:border-cyan-300"
                  }`}
                >
                  <p className="text-xs uppercase">{day.dayName}</p>
                  <p className="text-2xl font-bold mt-1">{day.dayNumber}</p>
                  <p className="text-xs mt-1">{day.month}</p>
                </button>
              ))}
            </div>

            {selectedDate && (
              <Button
                className="w-full mt-4"
                onClick={() => setStep("slot")}
              >
                {t("common.continue")}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Step 2: Select Time Slot */}
        {step === "slot" && selectedDateSlots && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t("schedule.selectSlot")}</h2>
              <button
                onClick={() => setStep("date")}
                className="text-sm text-cyan-600"
              >
                {t("schedule.changeDate")}
              </button>
            </div>

            <p className="text-gray-500 text-sm">
              {selectedDateSlots.dayName}, {selectedDateSlots.dayNumber} {selectedDateSlots.month}
            </p>

            <div className="space-y-3">
              {selectedDateSlots.slots.map((slot: any) => (
                <button
                  key={slot.id}
                  onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                  disabled={!slot.isAvailable}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${
                    !slot.isAvailable
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : selectedSlot?.id === slot.id
                        ? "bg-cyan-600 text-white shadow-lg"
                        : "bg-white border hover:border-cyan-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getSlotIcon(slot.startTime)}
                    <div>
                      <p className="font-medium">{getSlotName(slot.name)}</p>
                      <p className={`text-sm ${
                        selectedSlot?.id === slot.id ? "text-cyan-100" : "text-gray-500"
                      }`}>
                        {slot.displayTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {slot.isPremium && (
                      <div className={`flex items-center gap-1 text-xs ${
                        selectedSlot?.id === slot.id ? "text-yellow-300" : "text-yellow-600"
                      }`}>
                        <Star className="h-3 w-3 fill-current" />
                        {t("schedule.premiumSlot")}
                      </div>
                    )}
                    {slot.premiumCharge > 0 && (
                      <p className={`text-sm font-medium ${
                        selectedSlot?.id === slot.id ? "text-white" : "text-gray-900"
                      }`}>
                        +₹{slot.premiumCharge}
                      </p>
                    )}
                    {!slot.isAvailable && (
                      <p className="text-xs text-red-500">
                        {slot.isPastCutoff ? t("schedule.cutoffPassed") : t("schedule.fullyBooked")}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedSlot && (
              <Button
                className="w-full mt-4"
                onClick={() => setStep("confirm")}
              >
                {t("common.continue")}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedDateSlots && selectedSlot && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{t("schedule.confirmSlot")}</h2>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">{t("schedule.deliveryDate")}</p>
                  <p className="font-semibold text-gray-900">
                    {selectedDateSlots.dayName}, {selectedDateSlots.dayNumber} {selectedDateSlots.month}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t("schedule.timeSlot")}</p>
                  <p className="font-semibold text-cyan-600">
                    {selectedSlot.displayTime}
                  </p>
                </div>
              </div>

              {selectedSlot.premiumCharge > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm">{t("schedule.premiumSlot")}</span>
                  </div>
                  <p className="font-semibold">+₹{selectedSlot.premiumCharge}</p>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <label className="font-medium text-gray-900">{t("schedule.contactNumber")}</label>
              </div>
              <input
                type="tel"
                placeholder={shipment?.consigneePhone || "Your phone number"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-400 mt-1">{t("schedule.phoneNotify")}</p>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <label className="font-medium text-gray-900">{t("schedule.specialInstructions")}</label>
              </div>
              <textarea
                placeholder={t("schedule.instructionsPlaceholder")}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("slot")}
              >
                {t("common.back")}
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? t("schedule.confirming") : t("schedule.confirmButton")}
              </Button>
            </div>

            {mutation.data && !mutation.data.success && (
              <p className="text-red-500 text-sm text-center">
                {mutation.data.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400">
        {t("common.poweredBy")}
      </div>
    </div>
  );
}

export default function ScheduleDeliveryPage() {
  return (
    <I18nProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-600 border-t-transparent rounded-full" />
        </div>
      }>
        <ScheduleContent />
      </Suspense>
    </I18nProvider>
  );
}
