CREATE INDEX "item_organizationId_status_idx" ON "item" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "item_createdAt_idx" ON "item" USING btree ("created_at");