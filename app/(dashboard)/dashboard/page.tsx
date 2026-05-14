import { currentUser } from "@clerk/nextjs/server";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
  const user = await currentUser();
  const name = user?.firstName ?? user?.username ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {greeting}, {name}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Here&apos;s an overview of your interview prep progress.
        </p>
      </div>

      <DashboardOverview />
    </div>
  );
}
