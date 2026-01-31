"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpButton } from "@/components/help/help-button";
import {
  ArrowLeft,
  Globe,
  Download,
  RotateCcw,
  ArrowRight,
  Plus,
  X,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  CalendarDays,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────

interface ProgramData {
  monthly: string;
  enrolled: string;
  here: string;
  gone: string;
}

interface FinancialState {
  dailyGoal: string;
  monthGoal: string;
  streams: string[];
  programs: string[];
  today: Record<string, string>;
  tomorrow: Record<string, string>;
  nextDay: Record<string, string>;
  programData: Record<string, ProgramData>;
  baseDate: string;
  completedBy: string;
}

// ─── Constants ────────────────────────────────────────────────────

const STORAGE_KEY = "daily-web-financials";
const PORTAL_URL = "https://masters-edge-portal.vercel.app";

const DEFAULT_STREAMS = [
  "Enrollments",
  "Upgrades",
  "Post-dates",
  "Seminars",
  "Equipment",
  "Promotions / BB Test",
  "T-Shirts / Hoodies",
  "Kickboxing",
  "Online Reg.",
  "Krav Maga",
];

const DEFAULT_PROGRAMS = ["Martial Arts", "Kickboxing"];

// ─── Helpers ──────────────────────────────────────────────────────

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getDateLabel(daysOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getFullDateStr() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function extractAmount(text: string): number {
  if (!text || !text.trim()) return 0;
  // If there's a number in parentheses like (447), use that
  const parenMatch = text.match(/\((\d+(?:,?\d+)*(?:\.\d+)?)\)/);
  if (parenMatch) return parseFloat(parenMatch[1].replace(/,/g, ""));
  // Try to parse as plain number (strip $ and ,)
  const cleaned = text.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  if (!isNaN(num)) return num;
  // Last resort: grab the last number in the string
  const nums = text.match(/\d+(?:\.\d+)?/g);
  if (nums && nums.length > 0) return parseFloat(nums[nums.length - 1]);
  return 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T12:00:00");
  const d2 = new Date(dateStr2 + "T12:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function getDefaultState(): FinancialState {
  return {
    dailyGoal: "",
    monthGoal: "",
    streams: [...DEFAULT_STREAMS],
    programs: [...DEFAULT_PROGRAMS],
    today: {},
    tomorrow: {},
    nextDay: {},
    programData: {},
    baseDate: getTodayStr(),
    completedBy: "",
  };
}

// ─── Component ────────────────────────────────────────────────────

export default function DailyWebFinancials() {
  const [state, setState] = useState<FinancialState>(getDefaultState());
  const [mounted, setMounted] = useState(false);
  const [rollMessage, setRollMessage] = useState("");
  const [newStreamName, setNewStreamName] = useState("");
  const [showAddStream, setShowAddStream] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Load from storage + auto-roll
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as FinancialState;
        const today = getTodayStr();
        const elapsed = daysBetween(parsed.baseDate, today);

        if (elapsed > 0) {
          let rolled = { ...parsed };
          if (elapsed >= 3) {
            rolled = { ...rolled, today: {}, tomorrow: {}, nextDay: {} };
            setRollMessage("Fresh start! Goals cleared — it's been 3+ days.");
          } else if (elapsed === 2) {
            rolled = {
              ...rolled,
              today: rolled.nextDay,
              tomorrow: {},
              nextDay: {},
            };
            setRollMessage("Rolled forward 2 days. Next Day goals are now Today.");
          } else {
            rolled = {
              ...rolled,
              today: rolled.tomorrow,
              tomorrow: rolled.nextDay,
              nextDay: {},
            };
            setRollMessage("Rolled forward! Yesterday's Tomorrow is now Today.");
          }
          rolled.baseDate = today;
          setState(rolled);
        } else {
          setState(parsed);
        }
      } catch {
        setState(getDefaultState());
      }
    }
    setMounted(true);
  }, []);

  // Auto-save
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, mounted]);

  // Clear roll message
  useEffect(() => {
    if (rollMessage) {
      const t = setTimeout(() => setRollMessage(""), 5000);
      return () => clearTimeout(t);
    }
  }, [rollMessage]);

  // ─── Calculated values ──────────────────────────────────────────

  const totals = useMemo(() => {
    const calc = (dayData: Record<string, string>) =>
      state.streams.reduce(
        (sum, stream) => sum + extractAmount(dayData[stream] || ""),
        0
      );
    return {
      today: calc(state.today),
      tomorrow: calc(state.tomorrow),
      nextDay: calc(state.nextDay),
    };
  }, [state.streams, state.today, state.tomorrow, state.nextDay]);

  const threeDayTotal = totals.today + totals.tomorrow + totals.nextDay;

  const dailyGoalNum = extractAmount(state.dailyGoal);
  const todayPercent =
    dailyGoalNum > 0 ? Math.min(100, Math.round((totals.today / dailyGoalNum) * 100)) : 0;

  // ─── Handlers ───────────────────────────────────────────────────

  const updateCell = (
    day: "today" | "tomorrow" | "nextDay",
    stream: string,
    value: string
  ) => {
    setState((prev) => ({
      ...prev,
      [day]: { ...prev[day], [stream]: value },
    }));
  };

  const updateProgram = (program: string, field: string, value: string) => {
    setState((prev) => {
      const defaults: ProgramData = { monthly: "", enrolled: "", here: "", gone: "" };
      const existing = prev.programData[program] || defaults;
      return {
        ...prev,
        programData: {
          ...prev.programData,
          [program]: { ...existing, [field]: value },
        },
      };
    });
  };

  const addStream = () => {
    const name = newStreamName.trim();
    if (!name || state.streams.includes(name)) return;
    setState((prev) => ({ ...prev, streams: [...prev.streams, name] }));
    setNewStreamName("");
    setShowAddStream(false);
  };

  const removeStream = (stream: string) => {
    setState((prev) => ({
      ...prev,
      streams: prev.streams.filter((s) => s !== stream),
    }));
  };

  const addProgram = () => {
    const name = newProgramName.trim();
    if (!name || state.programs.includes(name)) return;
    setState((prev) => ({ ...prev, programs: [...prev.programs, name] }));
    setNewProgramName("");
    setShowAddProgram(false);
  };

  const removeProgram = (program: string) => {
    setState((prev) => ({
      ...prev,
      programs: prev.programs.filter((p) => p !== program),
    }));
  };

  const handleRollForward = () => {
    setState((prev) => {
      const nextBase = new Date(prev.baseDate + "T12:00:00");
      nextBase.setDate(nextBase.getDate() + 1);
      return {
        ...prev,
        today: prev.tomorrow,
        tomorrow: prev.nextDay,
        nextDay: {},
        baseDate: nextBase.toISOString().split("T")[0],
      };
    });
    setRollMessage("Rolled forward! Tomorrow is now Today.");
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setState({
      ...getDefaultState(),
      streams: state.streams,
      programs: state.programs,
      completedBy: state.completedBy,
    });
    setConfirmReset(false);
  };

  const handleExport = () => {
    const lines = [
      "DAILY WEB / FINANCIALS",
      `Date: ${getFullDateStr()}`,
      `Completed By: ${state.completedBy || "Not specified"}`,
      `Daily Goal: ${state.dailyGoal ? "$" + state.dailyGoal : "Not set"}`,
      `Month Goal: ${state.monthGoal ? "$" + state.monthGoal : "Not set"}`,
      "=".repeat(65),
      "",
      "REVENUE STREAMS — Rolling 3-Day Goals",
      "-".repeat(65),
      `${"Stream".padEnd(24)} ${"Today".padEnd(16)} ${"Tomorrow".padEnd(16)} Next Day`,
      "-".repeat(65),
    ];

    for (const stream of state.streams) {
      const t = state.today[stream] || "-";
      const tm = state.tomorrow[stream] || "-";
      const nd = state.nextDay[stream] || "-";
      lines.push(
        `${stream.padEnd(24)} ${t.padEnd(16)} ${tm.padEnd(16)} ${nd}`
      );
    }

    lines.push("-".repeat(65));
    lines.push(
      `${"TOTAL".padEnd(24)} ${formatCurrency(totals.today).padEnd(16)} ${formatCurrency(totals.tomorrow).padEnd(16)} ${formatCurrency(totals.nextDay)}`
    );
    lines.push(`\n3-Day Total: ${formatCurrency(threeDayTotal)}`);
    lines.push("");

    if (state.programs.length > 0) {
      lines.push("PROGRAM TRACKING");
      lines.push("-".repeat(65));
      lines.push(
        `${"Category".padEnd(20)} ${"Monthly ($)".padEnd(14)} ${"Enrolled".padEnd(12)} Here/Gone`
      );
      lines.push("-".repeat(65));
      for (const prog of state.programs) {
        const data = state.programData[prog] || {
          monthly: "",
          enrolled: "",
          here: "",
          gone: "",
        };
        lines.push(
          `${prog.padEnd(20)} ${(data.monthly || "0").padEnd(14)} ${(data.enrolled || "0").padEnd(12)} ${data.here || "0"}/${data.gone || "0"}`
        );
      }
    }

    lines.push("");
    lines.push("Daily Web/Financials by Total Success AI");
    lines.push("Part of The Master's Edge Business Program");

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-web-financials-${getTodayStr()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ─────────────────────────────────────────────────────

  if (!mounted) return null;

  const dayColumns = [
    { key: "today" as const, label: "Today", date: getDateLabel(0) },
    { key: "tomorrow" as const, label: "Tomorrow", date: getDateLabel(1) },
    { key: "nextDay" as const, label: "Next Day", date: getDateLabel(2) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a
            href={PORTAL_URL}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Portal</span>
          </a>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <HelpButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* ─── Title + Actions ────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Daily Web / Financials
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getFullDateStr()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRollForward}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                Roll Forward
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className={
                  confirmReset
                    ? "border-red-300 text-red-600 hover:bg-red-50"
                    : ""
                }
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                {confirmReset ? "Confirm Reset" : "Reset All"}
              </Button>
            </div>
          </div>

          {/* ─── Roll Message ──────────────────────────────────── */}
          {rollMessage && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <ArrowRight className="h-4 w-4 shrink-0" />
              {rollMessage}
            </div>
          )}

          {/* ─── Goals Card ────────────────────────────────────── */}
          <Card className="shadow-md border-emerald-200/50 dark:border-emerald-800/50">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Daily Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    Daily Goal
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                      $
                    </span>
                    <input
                      type="text"
                      value={state.dailyGoal}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          dailyGoal: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xl font-extrabold text-emerald-700 dark:text-emerald-400 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Month Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Month Goal
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                      $
                    </span>
                    <input
                      type="text"
                      value={state.monthGoal}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          monthGoal: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xl font-extrabold text-emerald-700 dark:text-emerald-400 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Completed By */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Completed By
                  </label>
                  <input
                    type="text"
                    value={state.completedBy}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        completedBy: e.target.value,
                      }))
                    }
                    placeholder="Enter your name"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Today vs Goal mini-bar */}
              {dailyGoalNum > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Today vs. Daily Goal
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        todayPercent >= 100
                          ? "text-emerald-500"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatCurrency(totals.today)} / {formatCurrency(dailyGoalNum)}{" "}
                      ({todayPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        todayPercent >= 100 ? "bg-emerald-500" : "bg-emerald-400"
                      }`}
                      style={{ width: `${todayPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Revenue Streams Table ─────────────────────────── */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[170px]">
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          Web
                        </span>
                      </th>
                      {dayColumns.map((d) => (
                        <th
                          key={d.key}
                          className="text-center px-2 py-3 min-w-[120px]"
                        >
                          <div className="text-xs font-bold text-gray-900 dark:text-white">
                            {d.label}
                          </div>
                          <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                            {d.date}
                          </div>
                        </th>
                      ))}
                      <th className="w-9" />
                    </tr>
                  </thead>
                  <tbody>
                    {state.streams.map((stream, i) => (
                      <tr
                        key={stream}
                        className={`border-b transition-colors ${
                          i % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50/50 dark:bg-gray-800/20"
                        } hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10`}
                      >
                        <td className="px-4 py-1.5">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {stream}
                          </span>
                        </td>
                        {dayColumns.map((d) => (
                          <td key={d.key} className="px-1.5 py-1">
                            <input
                              type="text"
                              value={state[d.key][stream] || ""}
                              onChange={(e) =>
                                updateCell(d.key, stream, e.target.value)
                              }
                              placeholder="—"
                              className="w-full text-center px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                            />
                          </td>
                        ))}
                        <td className="px-0.5">
                          <button
                            onClick={() => removeStream(stream)}
                            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title={`Remove ${stream}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* ─── Total Row ───────────────────────────── */}
                    <tr className="bg-emerald-50 dark:bg-emerald-950/20 border-t-2 border-emerald-300 dark:border-emerald-800">
                      <td className="px-4 py-3">
                        <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" />
                          Total
                        </span>
                      </td>
                      {(
                        [totals.today, totals.tomorrow, totals.nextDay] as const
                      ).map((val, idx) => (
                        <td key={idx} className="px-2 py-3 text-center">
                          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                            {formatCurrency(val)}
                          </span>
                        </td>
                      ))}
                      <td />
                    </tr>

                    {/* ─── 3-Day Total Row ─────────────────────── */}
                    <tr className="bg-emerald-100/60 dark:bg-emerald-950/30">
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          3-Day Total
                        </span>
                      </td>
                      <td colSpan={3} className="px-2 py-2.5 text-center">
                        <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                          {formatCurrency(threeDayTotal)}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Add Stream */}
              <div className="px-4 py-3 border-t">
                {showAddStream ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newStreamName}
                      onChange={(e) => setNewStreamName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addStream()}
                      placeholder="Revenue stream name..."
                      className="flex-1 max-w-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={addStream}
                      className="bg-emerald-600 hover:bg-emerald-700 h-8"
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddStream(false);
                        setNewStreamName("");
                      }}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddStream(true)}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Revenue Stream
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Program Tracking ──────────────────────────────── */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[170px]">
                        Category
                      </th>
                      <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                        Month ($)
                      </th>
                      <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[90px]">
                        Enroll
                      </th>
                      <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                        Here / Gone
                      </th>
                      <th className="w-9" />
                    </tr>
                  </thead>
                  <tbody>
                    {state.programs.map((program, i) => {
                      const data = state.programData[program] || {
                        monthly: "",
                        enrolled: "",
                        here: "",
                        gone: "",
                      };
                      return (
                        <tr
                          key={program}
                          className={`border-b ${
                            i % 2 === 0
                              ? "bg-white dark:bg-gray-900"
                              : "bg-gray-50/50 dark:bg-gray-800/20"
                          }`}
                        >
                          <td className="px-4 py-1.5">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {program}
                            </span>
                          </td>
                          <td className="px-1.5 py-1">
                            <input
                              type="text"
                              value={data.monthly}
                              onChange={(e) =>
                                updateProgram(program, "monthly", e.target.value)
                              }
                              placeholder="0"
                              className="w-full text-center px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-1.5 py-1">
                            <input
                              type="text"
                              value={data.enrolled}
                              onChange={(e) =>
                                updateProgram(
                                  program,
                                  "enrolled",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="w-full text-center px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-1.5 py-1">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="text"
                                value={data.here}
                                onChange={(e) =>
                                  updateProgram(
                                    program,
                                    "here",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-14 text-center px-1 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              />
                              <span className="text-gray-400 font-bold text-sm">
                                /
                              </span>
                              <input
                                type="text"
                                value={data.gone}
                                onChange={(e) =>
                                  updateProgram(
                                    program,
                                    "gone",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-14 text-center px-1 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              />
                            </div>
                          </td>
                          <td className="px-0.5">
                            <button
                              onClick={() => removeProgram(program)}
                              className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title={`Remove ${program}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Program */}
              <div className="px-4 py-3 border-t">
                {showAddProgram ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newProgramName}
                      onChange={(e) => setNewProgramName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addProgram()}
                      placeholder="Program category name..."
                      className="flex-1 max-w-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={addProgram}
                      className="bg-emerald-600 hover:bg-emerald-700 h-8"
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddProgram(false);
                        setNewProgramName("");
                      }}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddProgram(true)}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Program Category
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Footer ────────────────────────────────────────── */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Daily Web / Financials by{" "}
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Total Success AI
              </span>{" "}
              &mdash; Goals we set are goals we get. Auto-saves as you type.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
