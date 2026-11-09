import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/** Placeholder for candidate destinations that don't have a design yet. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-heading-lg">{title}</h1>

      <Card padding="lg">
        <CardTitle>Coming soon</CardTitle>
        <CardDescription>
          This section is being designed and will land in a later sprint.
        </CardDescription>
      </Card>
    </div>
  );
}
