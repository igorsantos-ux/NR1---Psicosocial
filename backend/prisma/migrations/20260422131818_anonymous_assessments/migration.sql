-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gheId" TEXT NOT NULL,
    "employeeName" TEXT,
    "answers" JSONB NOT NULL,
    "aiRawResult" TEXT,
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "riskMatrix" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "engineerComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assessment_gheId_fkey" FOREIGN KEY ("gheId") REFERENCES "GHE" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assessment" ("aiProcessed", "aiRawResult", "answers", "createdAt", "employeeName", "engineerComment", "gheId", "id", "riskMatrix", "status") SELECT "aiProcessed", "aiRawResult", "answers", "createdAt", "employeeName", "engineerComment", "gheId", "id", "riskMatrix", "status" FROM "Assessment";
DROP TABLE "Assessment";
ALTER TABLE "new_Assessment" RENAME TO "Assessment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
