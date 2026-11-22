import { FeedbackForm } from "@/components/FeedbackForm";
import { Card, PageTitle } from "@/components/ui";

export const metadata = { title: "Feedback" };

/** Linked from table QR codes: one screen, one job. */
export default function FeedbackPage() {
  return (
    <div>
      <PageTitle eyebrow="Understand the room" title="Tell the team how it is going" blurb="Takes thirty seconds. Gemini reads the mood so staff can fix things while you are still here." />
      <Card className="max-w-xl">
        <FeedbackForm />
      </Card>
    </div>
  );
}
