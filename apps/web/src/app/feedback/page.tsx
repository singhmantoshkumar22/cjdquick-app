"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Star,
  Send,
  CheckCircle,
  Package,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";
import { Button } from "@cjdquick/ui";
import { I18nProvider, useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Fetch shipment for feedback
async function fetchShipment(awb: string) {
  const res = await fetch(`/api/public/track?awb=${awb}`);
  if (!res.ok) throw new Error("Shipment not found");
  return res.json();
}

// Submit feedback
async function submitFeedback(data: any) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

function FeedbackContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const awb = searchParams.get("awb") || "";

  const [step, setStep] = useState<"rating" | "details" | "success">("rating");
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [deliverySpeedRating, setDeliverySpeedRating] = useState(0);
  const [packagingRating, setPackagingRating] = useState(0);
  const [courierRating, setCourierRating] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState("");

  // Quick feedback categories with translations
  const POSITIVE_CATEGORIES = [
    { id: "FAST_DELIVERY", label: t("feedback.categories.fastDelivery"), emoji: "🚀" },
    { id: "GOOD_PACKAGING", label: t("feedback.categories.goodPackaging"), emoji: "📦" },
    { id: "FRIENDLY_COURIER", label: t("feedback.categories.friendlyCourier"), emoji: "😊" },
    { id: "EASY_TRACKING", label: t("feedback.categories.easyTracking"), emoji: "📍" },
    { id: "ON_TIME", label: t("feedback.categories.onTimeDelivery"), emoji: "⏰" },
  ];

  const NEGATIVE_CATEGORIES = [
    { id: "LATE_DELIVERY", label: t("feedback.categories.lateDelivery"), emoji: "🐌" },
    { id: "DAMAGED_PACKAGE", label: t("feedback.categories.damagedItem"), emoji: "📦" },
    { id: "RUDE_COURIER", label: t("feedback.categories.rudeCourier"), emoji: "😠" },
    { id: "POOR_COMMUNICATION", label: t("feedback.categories.noNotification"), emoji: "📵" },
    { id: "WRONG_ADDRESS", label: t("feedback.categories.wrongAddress"), emoji: "🗺️" },
  ];

  const { data: shipmentData, isLoading: loadingShipment } = useQuery({
    queryKey: ["feedback-shipment", awb],
    queryFn: () => fetchShipment(awb),
    enabled: !!awb,
  });

  const mutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: (data) => {
      if (data.success) {
        setStep("success");
      }
    },
  });

  const shipment = shipmentData?.data;

  const handleSubmit = () => {
    mutation.mutate({
      awbNumber: awb,
      overallRating,
      deliverySpeedRating,
      packagingRating,
      courierBehaviorRating: courierRating,
      npsScore,
      categories: selectedCategories,
      feedbackText,
      source: "TRACKING_PAGE",
    });
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (!awb) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">{t("tracking.shipmentNotFound")}</h1>
          <p className="text-gray-500 mt-2">{t("schedule.accessFromTracking")}</p>
        </div>
      </div>
    );
  }

  if (loadingShipment) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("feedback.thankYou")}</h1>
          <p className="text-gray-600 mb-6">
            {t("feedback.feedbackHelps")}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = `/track?awb=${awb}`}
            >
              {t("schedule.backToTracking")}
            </Button>
          </div>
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
                <Package className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{t("feedback.title")}</h1>
                <p className="text-sm text-gray-500">AWB: {awb}</p>
              </div>
            </div>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Shipment Info */}
        {shipment && (
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t("tracking.deliveredTo")}</p>
                <p className="font-medium text-gray-900">{shipment.consigneeName}</p>
                <p className="text-sm text-gray-500">{shipment.consigneeCity}</p>
              </div>
              {shipment.deliveredAt && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t("tracking.deliveredOn")}</p>
                  <p className="text-sm font-medium text-green-600">
                    {new Date(shipment.deliveredAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "rating" && (
          <>
            {/* Overall Rating */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {t("feedback.rateDelivery")}
              </h2>
              <p className="text-gray-500 text-sm mb-6">{t("feedback.overallRating")}</p>

              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-12 w-12 ${
                        star <= (hoveredRating || overallRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {overallRating > 0 && (
                <p className="text-sm font-medium text-gray-600">
                  {overallRating <= 2 && "😔"}
                  {overallRating === 3 && "🙂"}
                  {overallRating >= 4 && "😊"}
                </p>
              )}
            </div>

            {/* Quick Categories */}
            {overallRating > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  {overallRating >= 4 ? t("feedback.whatWentWell") : t("feedback.whatToImprove")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(overallRating >= 4 ? POSITIVE_CATEGORIES : NEGATIVE_CATEGORIES).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategories.includes(cat.id)
                          ? "bg-cyan-100 text-cyan-700 border-2 border-cyan-500"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {overallRating > 0 && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep("details")}
              >
                {t("common.continue")}
              </Button>
            )}
          </>
        )}

        {step === "details" && (
          <>
            {/* Detailed Ratings */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">{t("feedback.overallRating")}</h3>

              <div className="space-y-4">
                {/* Delivery Speed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{t("feedback.deliverySpeed")}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setDeliverySpeedRating(s)}>
                        <Star
                          className={`h-5 w-5 ${
                            s <= deliverySpeedRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Packaging */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{t("feedback.packaging")}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setPackagingRating(s)}>
                        <Star
                          className={`h-5 w-5 ${
                            s <= packagingRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Courier Behavior */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{t("feedback.courierBehavior")}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setCourierRating(s)}>
                        <Star
                          className={`h-5 w-5 ${
                            s <= courierRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* NPS Score */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">
                {t("feedback.npsQuestion")}
              </h3>
              <p className="text-xs text-gray-500 mb-4">0 = {t("feedback.notLikely")}, 10 = {t("feedback.veryLikely")}</p>

              <div className="flex justify-between gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => setNpsScore(score)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      npsScore === score
                        ? score <= 6
                          ? "bg-red-500 text-white"
                          : score <= 8
                            ? "bg-yellow-500 text-white"
                            : "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{t("feedback.notLikely")}</span>
                <span>{t("feedback.veryLikely")}</span>
              </div>
            </div>

            {/* Additional Comments */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">{t("feedback.tellUsMore")}</h3>
              </div>
              <textarea
                placeholder={t("feedback.feedbackPlaceholder")}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("rating")}
              >
                {t("common.back")}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  t("feedback.submitting")
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("feedback.submitFeedback")}
                  </>
                )}
              </Button>
            </div>

            {mutation.data && !mutation.data.success && (
              <p className="text-red-500 text-sm text-center mt-4">
                {mutation.data.error}
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400">
        {t("common.poweredBy")}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <I18nProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-600 border-t-transparent rounded-full" />
        </div>
      }>
        <FeedbackContent />
      </Suspense>
    </I18nProvider>
  );
}
