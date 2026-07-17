CREATE INDEX "item_userId_idx" ON "item" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "item_image_itemId_idx" ON "item_image" USING btree ("item_id");