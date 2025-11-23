-- CreateTable
CREATE TABLE "InspirationSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "inspirationText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspirationSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InspirationSetToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InspirationSetToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "InspirationSet_slug_key" ON "InspirationSet"("slug");

-- CreateIndex
CREATE INDEX "_InspirationSetToProduct_B_index" ON "_InspirationSetToProduct"("B");

-- AddForeignKey
ALTER TABLE "_InspirationSetToProduct" ADD CONSTRAINT "_InspirationSetToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "InspirationSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InspirationSetToProduct" ADD CONSTRAINT "_InspirationSetToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
