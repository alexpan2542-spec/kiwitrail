/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : PostgreSQL
 Source Server Version : 180003 (180003)
 Source Host           : localhost:5432
 Source Catalog        : postgres
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 180003 (180003)
 File Encoding         : 65001

 Date: 30/03/2026 18:15:58
*/


-- ----------------------------
-- Table structure for kiwi_nz_gazetteer
-- ----------------------------
DROP TABLE IF EXISTS "public"."kiwi_nz_gazetteer";
CREATE TABLE "public"."kiwi_nz_gazetteer" (
  "id" int4 NOT NULL DEFAULT nextval('kiwi_nz_gazetteer_id_seq'::regclass),
  "name_id" int8,
  "name" text COLLATE "pg_catalog"."default",
  "status" text COLLATE "pg_catalog"."default",
  "feat_id" int8,
  "feat_type" text COLLATE "pg_catalog"."default",
  "nzgb_ref" text COLLATE "pg_catalog"."default",
  "nzgb_sub_ref" text COLLATE "pg_catalog"."default",
  "land_district" text COLLATE "pg_catalog"."default",
  "crd_projection" text COLLATE "pg_catalog"."default",
  "crd_north" float8,
  "crd_east" float8,
  "crd_datum" text COLLATE "pg_catalog"."default",
  "crd_latitude" float8,
  "crd_longitude" float8,
  "info_ref" text COLLATE "pg_catalog"."default",
  "info_origin" text COLLATE "pg_catalog"."default",
  "info_description" text COLLATE "pg_catalog"."default",
  "info_note" text COLLATE "pg_catalog"."default",
  "feat_note" text COLLATE "pg_catalog"."default",
  "maori_name" text COLLATE "pg_catalog"."default",
  "label_hierarchy" text COLLATE "pg_catalog"."default",
  "cpa_legislation" text COLLATE "pg_catalog"."default",
  "conservancy" text COLLATE "pg_catalog"."default",
  "doc_cons_unit_no" text COLLATE "pg_catalog"."default",
  "doc_gaz_ref" text COLLATE "pg_catalog"."default",
  "doc_gaz_sub_ref" text COLLATE "pg_catalog"."default",
  "treaty_legislation" text COLLATE "pg_catalog"."default",
  "geom_type" text COLLATE "pg_catalog"."default",
  "accuracy" text COLLATE "pg_catalog"."default",
  "gebco" text COLLATE "pg_catalog"."default",
  "region" text COLLATE "pg_catalog"."default",
  "scufn" text COLLATE "pg_catalog"."default",
  "height" text COLLATE "pg_catalog"."default",
  "ant_pn_ref" text COLLATE "pg_catalog"."default",
  "ant_pgaz_ref" text COLLATE "pg_catalog"."default",
  "scar_id" text COLLATE "pg_catalog"."default",
  "scar_rec_by" text COLLATE "pg_catalog"."default",
  "accuracy_rating" int4,
  "desc_code" text COLLATE "pg_catalog"."default",
  "rev_gaz_ref" text COLLATE "pg_catalog"."default",
  "rev_gaz_sub_ref" text COLLATE "pg_catalog"."default",
  "rev_treaty_legislation" text COLLATE "pg_catalog"."default",
  "geom" geometry(POINT, 4326)
)
;
ALTER TABLE "public"."kiwi_nz_gazetteer" OWNER TO "alex";

-- ----------------------------
-- Indexes structure for table kiwi_nz_gazetteer
-- ----------------------------
CREATE INDEX "idx_kiwi_nz_gazetteer_desc_code" ON "public"."kiwi_nz_gazetteer" USING btree (
  "desc_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_kiwi_nz_gazetteer_feat_type" ON "public"."kiwi_nz_gazetteer" USING btree (
  "feat_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_kiwi_nz_gazetteer_geom" ON "public"."kiwi_nz_gazetteer" USING gist (
  "geom" "public"."gist_geometry_ops_2d"
);
CREATE INDEX "idx_kiwi_nz_gazetteer_name" ON "public"."kiwi_nz_gazetteer" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_kiwi_nz_gazetteer_region" ON "public"."kiwi_nz_gazetteer" USING btree (
  "region" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table kiwi_nz_gazetteer
-- ----------------------------
ALTER TABLE "public"."kiwi_nz_gazetteer" ADD CONSTRAINT "kiwi_nz_gazetteer_name_id_key" UNIQUE ("name_id");

-- ----------------------------
-- Primary Key structure for table kiwi_nz_gazetteer
-- ----------------------------
ALTER TABLE "public"."kiwi_nz_gazetteer" ADD CONSTRAINT "kiwi_nz_gazetteer_pkey" PRIMARY KEY ("id");
