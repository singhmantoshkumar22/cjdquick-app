"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RefreshCw,
  Filter,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Phone,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch feedback data
async function fetchFeedback(params: URLSearchParams) {
  const res = await fetch(`/api/feedback?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case "POSITIVE":
      return <ThumbsUp className="h-4 w-4 text-green-500" />;
    case "NEGATIVE":
      return <ThumbsDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-yellow-500" />;
  }
}

function getSentimentBadge(sentiment: string) {
  const styles: Record<string, string> = {
    POSITIVE: "bg-green-100 text-green-700",
    NEGATIVE: "bg-red-100 text-red-700",
    NEUTRAL: "bg-yellow-100 text-yellow-700",
  };
  return styles[sentiment] || "bg-gray-100 text-gray-700";
}

function getNpsLabel(score: number) {
  if (score >= 9) return { label: "Promoter", color: "text-green-600" };
  if (score >= 7) return { label: "Passive", color: "text-yellow-600" };
  return { label: "Detractor", color: "text-red-600" };
}

export default function CustomerFeedbackPage() {
  const [period, setPeriod] = useState("30");
  const [sentimentFilter, setSentimentFilter] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState(false);
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  params.set("period", period);
  params.set("page", page.toString());
  if (sentimentFilter) params.set("sentiment", sentimentFilter);
  if (followUpFilter) params.set("requiresFollowUp", "true");

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["customer-feedback", period, sentimentFilter, followUpFilter, page],
    queryFn: () => fetchFeedback(params),
    refetchInterval: 60000,
  });

  const feedback = data?.data?.feedback || [];
  const stats = data?.data?.stats || {};
  const pagination = data?.data?.pagination || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-amber-600" />
            Customer Feedback & NPS
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor delivery ratings, NPS scores, and customer sentiment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Feedback */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalFeedback || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-1">
                {stats.averageRating || "0.0"}
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* NPS Score */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">NPS Score</p>
              <p className={`text-2xl font-bold mt-1 ${
                stats.npsScore >= 50 ? "text-green-600" :
                stats.npsScore >= 0 ? "text-yellow-600" : "text-red-600"
              }`}>
                {stats.npsScore || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.npsBreakdown?.promoters || 0}P / {stats.npsBreakdown?.passives || 0}N / {stats.npsBreakdown?.detractors || 0}D
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              stats.npsScore >= 50 ? "bg-green-100" :
              stats.npsScore >= 0 ? "bg-yellow-100" : "bg-red-100"
            }`}>
              {stats.npsScore >= 50 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : stats.npsScore >= 0 ? (
                <Minus className="h-6 w-6 text-yellow-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Positive */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Positive</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.sentiment?.POSITIVE || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Negative */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Negative</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.sentiment?.NEGATIVE || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <ThumbsDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* NPS Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* NPS Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">NPS Distribution</h3>
          <div className="space-y-4">
            {/* Promoters */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-green-600 font-medium">Promoters (9-10)</span>
                <span className="font-bold">{stats.npsBreakdown?.promoters || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${stats.totalFeedback ? ((stats.npsBreakdown?.promoters || 0) / stats.totalFeedback) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {/* Passives */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-yellow-600 font-medium">Passives (7-8)</span>
                <span className="font-bold">{stats.npsBreakdown?.passives || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{
                    width: `${stats.totalFeedback ? ((stats.npsBreakdown?.passives || 0) / stats.totalFeedback) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {/* Detractors */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-red-600 font-medium">Detractors (0-6)</span>
                <span className="font-bold">{stats.npsBreakdown?.detractors || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${stats.totalFeedback ? ((stats.npsBreakdown?.detractors || 0) / stats.totalFeedback) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Star Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="grid grid-cols-5 gap-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = feedback.filter((f: any) => f.overallRating === star).length;
              const percentage = feedback.length ? (count / feedback.length) * 100 : 0;
              return (
                <div key={star} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span className="text-lg font-bold text-gray-900">{star}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="h-24 bg-gray-100 rounded relative mb-2">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-yellow-400 rounded transition-all"
                      style={{ height: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filter:</span>
        </div>
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2"
        >
          <option value="">All Sentiment</option>
          <option value="POSITIVE">Positive</option>
          <option value="NEUTRAL">Neutral</option>
          <option value="NEGATIVE">Negative</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={followUpFilter}
            onChange={(e) => setFollowUpFilter(e.target.checked)}
            className="rounded"
          />
          Needs Follow-up
        </label>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Recent Feedback</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : feedback.length > 0 ? (
          <div className="divide-y">
            {feedback.map((item: any) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Rating Stars */}
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= item.overallRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      {/* Sentiment Badge */}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${getSentimentBadge(item.sentiment)}`}>
                        {getSentimentIcon(item.sentiment)}
                        {item.sentiment}
                      </span>
                      {/* NPS */}
                      {item.npsScore !== null && (
                        <span className={`text-xs font-medium ${getNpsLabel(item.npsScore).color}`}>
                          NPS: {item.npsScore} ({getNpsLabel(item.npsScore).label})
                        </span>
                      )}
                      {/* Follow-up Needed */}
                      {item.requiresFollowUp && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Follow-up
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="font-mono text-blue-600">{item.awbNumber}</span>
                      <span>{item.customerName || "Anonymous"}</span>
                      <span>{formatDate(item.submittedAt)}</span>
                    </div>

                    {item.feedbackText && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 mt-2">
                        "{item.feedbackText}"
                      </p>
                    )}

                    {item.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.categories.map((cat: string) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {cat.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.requiresFollowUp && item.customerPhone && (
                      <Button variant="outline" size="sm" className="gap-1">
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No feedback found</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* NPS Info */}
      <div className="mt-6 bg-amber-50 rounded-xl p-5">
        <h3 className="font-semibold text-amber-900 mb-4">About NPS (Net Promoter Score)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-green-700 mb-2">Promoters (9-10)</h4>
            <p className="text-sm text-gray-500">
              Loyal enthusiasts who will keep buying and refer others
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-yellow-700 mb-2">Passives (7-8)</h4>
            <p className="text-sm text-gray-500">
              Satisfied but unenthusiastic customers who can be swayed by competition
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-red-700 mb-2">Detractors (0-6)</h4>
            <p className="text-sm text-gray-500">
              Unhappy customers who can damage your brand through negative word-of-mouth
            </p>
          </div>
        </div>
        <p className="text-sm text-amber-800 mt-4">
          <strong>NPS = % Promoters - % Detractors</strong> (Range: -100 to +100, Good: 50+, Excellent: 70+)
        </p>
      </div>
    </div>
  );
}
