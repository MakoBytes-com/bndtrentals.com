import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = {
  title: "Calibration recalls",
  robots: { index: false, follow: false },
};

export default function CalibrationPlaceholderPage() {
  return (
    <AdminPlaceholder
      eyebrow="Calibration"
      title="Calibration recall scheduler"
      description="Track each customer's calibrated equipment, schedule recall reminders, and email customers when a unit comes due. Phase 4 wires the email cron via Vercel Cron once the bndtrentals.com Resend domain is verified."
      phase="Phase 3-C + Phase 4-B"
      features={[
        "Add a customer + their equipment + last-calibrated date + due date",
        "View all recalls due in the next 30 / 60 / 90 days",
        "Mark a recall reminded / completed / cancelled",
        "Automatic email reminders at 30 / 14 / 7 / 1 days before due (Phase 4)",
        "Bulk import from CSV for migrating an existing recall list",
      ]}
    />
  );
}
