CREATE INDEX "work_items_user_id_idx" ON "work_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "work_items_user_urgency_idx" ON "work_items" USING btree ("user_id","urgency_score");--> statement-breakpoint
CREATE INDEX "work_items_user_created_idx" ON "work_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "work_items_source_id_idx" ON "work_items" USING btree ("user_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "work_items_classification_idx" ON "work_items" USING btree ("user_id","classification");--> statement-breakpoint
CREATE INDEX "work_items_completed_idx" ON "work_items" USING btree ("user_id","is_completed");