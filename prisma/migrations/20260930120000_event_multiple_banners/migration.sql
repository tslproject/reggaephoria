ALTER TABLE "Event" RENAME COLUMN "banner" TO "banners";

ALTER TABLE "Event"
ALTER COLUMN "banners" TYPE TEXT[]
USING CASE
  WHEN "banners" IS NULL OR btrim("banners") = '' THEN ARRAY[]::TEXT[]
  ELSE ARRAY["banners"]::TEXT[]
END;

ALTER TABLE "Event" ALTER COLUMN "banners" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Event" ALTER COLUMN "banners" SET NOT NULL;
