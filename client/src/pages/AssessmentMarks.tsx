import React from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { AssessmentMarksSheet } from "@/components/AssessmentMarksSheet";

export default function AssessmentMarks() {
  return (
    <TrainerLayout title="Assessment Marks" subtitle="Continuous Assessment Marking Sheet">
      <div className="w-full h-full overflow-hidden">
        <AssessmentMarksSheet />
      </div>
    </TrainerLayout>
  );
}
