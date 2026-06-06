ALTER TABLE "CvAdaptationRequest" ADD COLUMN "targetRoleId" TEXT;

ALTER TABLE "CvAdaptationRequest"
  ADD CONSTRAINT "CvAdaptationRequest_targetRoleId_fkey"
  FOREIGN KEY ("targetRoleId") REFERENCES "CvTargetRole"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
