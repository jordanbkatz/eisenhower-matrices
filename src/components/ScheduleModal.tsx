import { useState } from "react";
import type { MatrixDoc, MatrixSchedule } from "@/lib/eisenhower-storage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Calendar, Clock, RefreshCw, Save, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  title?: string;
  schedule?: MatrixSchedule;
  isOpen: boolean;
  onClose: () => void;
  onSaveSchedule: (schedule: MatrixSchedule) => void;
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ScheduleModal({
  title = "Schedule & Auto-Reset",
  schedule: initialSchedule,
  isOpen,
  onClose,
  onSaveSchedule,
}: Props) {
  const [scheduleType, setScheduleType] = useState<
    "none" | "daily" | "weekly" | "monthly" | "custom"
  >(
    !initialSchedule?.type || initialSchedule.type === "one-time"
      ? "none"
      : (initialSchedule.type as any),
  );

  const [customMethod, setCustomMethod] = useState<"daysOfWeek" | "daysOfMonth" | "intervalDays">(
    initialSchedule?.customMethod ||
      (initialSchedule?.intervalDays ? "intervalDays" : initialSchedule?.customDays?.length ? "daysOfMonth" : "daysOfWeek"),
  );
  const [customDaysOfWeek, setCustomDaysOfWeek] = useState<number[]>(
    initialSchedule?.customDaysOfWeek || [1, 3, 5],
  );
  const [customDaysOfMonth, setCustomDaysOfMonth] = useState<number[]>(
    initialSchedule?.customDays || [1, 15],
  );
  const [intervalDays, setIntervalDays] = useState<number>(
    initialSchedule?.intervalDays || 1,
  );

  if (!isOpen) return null;

  const toggleDayOfWeek = (dayIdx: number) => {
    setCustomDaysOfWeek((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx],
    );
  };

  const toggleDayOfMonth = (dayNum: number) => {
    setCustomDaysOfMonth((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum],
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedule: MatrixSchedule = {
      type: scheduleType,
      activeAt: Date.now(),
      lastResetAt: Date.now(),
      customMethod: scheduleType === "custom" ? customMethod : undefined,
      customDaysOfWeek: scheduleType === "custom" && customMethod === "daysOfWeek" ? customDaysOfWeek : undefined,
      customDays: scheduleType === "custom" && customMethod === "daysOfMonth" ? customDaysOfMonth : undefined,
      intervalDays: scheduleType === "custom" && customMethod === "intervalDays" ? intervalDays : undefined,
    };
    onSaveSchedule(newSchedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">
              Configure active schedule and custom auto-reset intervals
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Schedule / Reset Frequency</Label>
            <Select
              value={scheduleType}
              onValueChange={(v: any) => setScheduleType(v)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  Manual reset
                </SelectItem>
                <SelectItem value="daily" className="text-xs">
                  Daily Reset (Every 24 hours)
                </SelectItem>
                <SelectItem value="weekly" className="text-xs">
                  Weekly Reset (Every 7 days)
                </SelectItem>
                <SelectItem value="monthly" className="text-xs">
                  Monthly Reset (Every 30 days)
                </SelectItem>
                <SelectItem value="custom" className="text-xs">
                  Custom Calendar Reset (Selected interval)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Calendar Picker Controls */}
          {scheduleType === "custom" && (
            <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Custom Reset Method</Label>
                <Select
                  value={customMethod}
                  onValueChange={(v: any) => setCustomMethod(v)}
                >
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daysOfWeek" className="text-xs">
                      Days of Week (Pick specific weekdays)
                    </SelectItem>
                    <SelectItem value="daysOfMonth" className="text-xs">
                      Days of Month (Pick specific dates)
                    </SelectItem>
                    <SelectItem value="intervalDays" className="text-xs">
                      Interval in Days (Every X days)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {customMethod === "daysOfWeek" && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs font-semibold text-foreground">
                    Days of Week
                  </Label>
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS_OF_WEEK.map((dayName, idx) => {
                      const isSel = customDaysOfWeek.includes(idx);
                      return (
                        <button
                          type="button"
                          key={dayName}
                          onClick={() => toggleDayOfWeek(idx)}
                          className={`py-1 rounded text-[10px] font-bold transition border ${
                            isSel
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:bg-accent"
                          }`}
                        >
                          {dayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {customMethod === "daysOfMonth" && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs font-semibold text-foreground">
                    Days of Month (1 - 31)
                  </Label>
                  <div className="grid grid-cols-7 gap-1 max-h-36 overflow-y-auto pr-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((num) => {
                      const isSel = customDaysOfMonth.includes(num);
                      return (
                        <button
                          type="button"
                          key={num}
                          onClick={() => toggleDayOfMonth(num)}
                          className={`py-1 rounded text-[10px] font-mono font-semibold transition border ${
                            isSel
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-card text-muted-foreground border-border hover:bg-accent"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {customMethod === "intervalDays" && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">Every X Days</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">Reset every {intervalDays} day(s)</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-8 px-3 rounded-md bg-background border border-input text-xs font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {scheduleType !== "none" && (
            <div className="p-3 rounded-xl bg-secondary/30 border border-border text-xs space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Automatic Completion Reset</span>
              </div>
              <p>
                Completed items under this schedule will automatically revert to active items based on your custom interval.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
