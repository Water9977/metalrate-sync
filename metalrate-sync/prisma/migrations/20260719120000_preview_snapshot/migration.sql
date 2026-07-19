-- CreateTable
CREATE TABLE "PreviewSnapshot" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "rowsJson" TEXT NOT NULL,
    "ratesJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreviewSnapshot_shop_key" ON "PreviewSnapshot"("shop");
