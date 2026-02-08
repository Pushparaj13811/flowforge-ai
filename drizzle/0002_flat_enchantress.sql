ALTER TABLE "conversations" ADD COLUMN "tambo_thread_id" varchar(255);--> statement-breakpoint
CREATE INDEX "conversations_tambo_thread_id_idx" ON "conversations" USING btree ("tambo_thread_id");