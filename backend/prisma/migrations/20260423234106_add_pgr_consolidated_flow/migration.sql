-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN "employeeRole" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "cep" TEXT;
ALTER TABLE "Company" ADD COLUMN "cnaeDescricao" TEXT;
ALTER TABLE "Company" ADD COLUMN "endereco" TEXT;
ALTER TABLE "Company" ADD COLUMN "estado" TEXT;
ALTER TABLE "Company" ADD COLUMN "horarioTrabalho" TEXT;
ALTER TABLE "Company" ADD COLUMN "municipio" TEXT;
ALTER TABLE "Company" ADD COLUMN "telefone" TEXT;
ALTER TABLE "Company" ADD COLUMN "totalFuncionarios" INTEGER;

-- CreateTable
CREATE TABLE "PgrReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "reportData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "vigenciaInicio" TEXT,
    "vigenciaFim" TEXT,
    "periodoColeta" TEXT,
    "totalRespondentes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PgrReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EngineerSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engineerName" TEXT NOT NULL DEFAULT 'Denis Antônio',
    "engineerCrea" TEXT NOT NULL DEFAULT '',
    "engineerContact" TEXT NOT NULL DEFAULT '',
    "companyElaboradora" TEXT NOT NULL DEFAULT ''
);
