import { JobTracker } from "@/components/dashboard/JobTracker";

export default function JobsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track applications, interviews, and offers in one place.
        </p>
      </div>
      <JobTracker />
    </div>
  );
}
