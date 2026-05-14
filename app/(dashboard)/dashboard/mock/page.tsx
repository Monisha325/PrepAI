import { MockInterviewClient } from "@/components/mock/MockInterviewClient";

export default function MockInterviewPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mock Interview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          5 AI-generated questions, 3 minutes each, scored instantly after every answer.
        </p>
      </div>
      <MockInterviewClient />
    </div>
  );
}
