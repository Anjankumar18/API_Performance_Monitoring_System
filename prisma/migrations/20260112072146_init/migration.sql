-- CreateTable
CREATE TABLE "ApiMetric" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "isError" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiMetric_path_idx" ON "ApiMetric"("path");

-- CreateIndex
CREATE INDEX "ApiMetric_statusCode_idx" ON "ApiMetric"("statusCode");

-- CreateIndex
CREATE INDEX "ApiMetric_createdAt_idx" ON "ApiMetric"("createdAt");
