"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HelpCircle, Target, ArrowRight, Download, Lightbulb, Globe, Sparkles, Plus } from "lucide-react";

const steps = [
  {
    icon: Target,
    color: "from-emerald-500 to-green-600",
    title: "Step 1: Set Your Goals",
    subtitle: "Daily & monthly targets",
    description:
      "Start by entering your Daily Goal and Month Goal at the top. These are your revenue targets. Then fill in dollar amounts for each revenue stream across the 3-day columns: Today, Tomorrow, and Next Day. Base your goals on appointments, upgrades, events, and scheduled activities.",
    tip: "Goals we set are goals we GET. Be specific. If you have 3 intro appointments today at $150, that's $450 in Enrollments.",
  },
  {
    icon: ArrowRight,
    color: "from-green-500 to-teal-600",
    title: "Step 2: Roll Forward Daily",
    subtitle: "Your goals follow you",
    description:
      "Each day when you open the app, your goals automatically roll forward. Yesterday's 'Tomorrow' becomes today's 'Today'. Yesterday's 'Next Day' becomes 'Tomorrow'. A fresh 'Next Day' column appears for new planning. You can also manually roll forward with the button.",
    tip: "The rolling system means you're always planning 3 days ahead. Your team stays focused on what's coming, not just what's in front of them.",
  },
  {
    icon: Plus,
    color: "from-teal-500 to-cyan-600",
    title: "Step 3: Customize Streams",
    subtitle: "Match your business",
    description:
      "Add or remove revenue streams to match your specific business. Click '+ Add Revenue Stream' to create new income categories. Remove any stream with the X button. The same goes for Program Categories in the tracking section below.",
    tip: "Every business has different income streams. Dance studios might add 'Recital Fees' or 'Costumes'. Yoga studios might add 'Workshops' or 'Teacher Training'.",
  },
  {
    icon: Download,
    color: "from-cyan-500 to-blue-600",
    title: "Step 4: Export & Review",
    subtitle: "Track your results",
    description:
      "Click Export to download your goal sheet as a text file. Great for team meetings, accountability, and tracking what you projected vs. what you achieved. Review your 3-day totals to make sure your daily targets add up to your monthly goal.",
    tip: "Quick math: If your monthly goal is $30,000 and you're open 25 days, your daily goal needs to be $1,200. Does your 3-day web add up?",
  },
];

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Help</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              Daily Web / Financials Guide
            </DialogTitle>
            <DialogDescription>
              Set rolling 3-day revenue goals across all your income streams. Goals we set are goals we get.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-4 py-4">
            <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border border-emerald-200 dark:border-emerald-800 p-5 space-y-3">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                The Power of the Daily Web
              </h3>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                The Daily Web is how high-performing businesses focus on building multiple streams of
                income every single day. Your team sets revenue goals for today, tomorrow, and the next
                day based on real appointments, real upgrades, and real opportunities. When you write
                it down and commit to it, you make it happen.
              </p>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0`}
                  >
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 p-3">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">{step.tip}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <Button onClick={() => setOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
