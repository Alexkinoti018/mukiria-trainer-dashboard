import React, { useState } from "react";
import TraineeLayout from "@/components/TraineeLayout";
import IntelligentDropzone from "@/components/IntelligentDropzone";
import { useTrainees } from "@/contexts/TraineeContext";

export default function TraineeAssignments() {
  const { uploads, recordUpload } = useTrainees();
  const currentTraineeId = "tr_1"; // Mock authenticated trainee
  const [selectedUploadType, setSelectedUploadType] = useState<string>("Assignment");

  // Filter uploads for this trainee
  const myUploads = uploads.filter(up => up.traineeId === currentTraineeId);

  const handleUploadSuccess = (data: any) => {
    // Assuming data contains filename or we just mock it if not
    recordUpload({
      traineeId: currentTraineeId,
      student_name: "Alex Kinoti",
      filename: "Newly_Uploaded_Document.pdf",
      uploadType: selectedUploadType,
    });
  };

  return (
    <TraineeLayout title="Assignments & Evidence" subtitle="Submit your practical evidence and assignments here.">
      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">Submit Evidence</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Upload Type:</label>
            <select 
              value={selectedUploadType}
              onChange={(e) => setSelectedUploadType(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="Assignment">Assignment</option>
              <option value="Practical 1">Practical 1</option>
              <option value="Practical 2">Practical 2</option>
              <option value="Practical 3">Practical 3</option>
              <option value="Exam 1">Exam 1</option>
              <option value="Exam 2">Exam 2</option>
              <option value="Exam 3">Exam 3</option>
              <option value="CAT">CAT (Continuous Assessment Test)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <IntelligentDropzone 
            context="trainee_assignment"
            role="trainee"
            onSuccess={handleUploadSuccess}
            label={`Drag & Drop your ${selectedUploadType} (PDF/Word)`}
          />
        </div>
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
          <div className="space-y-4">
            {myUploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              myUploads.map(upload => (
                <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                  <div>
                    <p className="font-semibold text-sm">[{upload.uploadType}] {upload.filename}</p>
                    <p className="text-xs text-muted-foreground">Submitted: {new Date(upload.submitted_at).toLocaleString()}</p>
                  </div>
                  {upload.status === 'graded' ? (
                     <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Score: {upload.grade}%</span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Pending Grade</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </TraineeLayout>
  );
}
