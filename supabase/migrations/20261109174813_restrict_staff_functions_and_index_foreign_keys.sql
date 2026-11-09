-- Ajustar permisos efectivos de funciones sensibles y cubrir claves foráneas.
revoke all on function public.audit_inventory_change() from public, anon, authenticated;
revoke all on function public.cancel_cart_ticket(uuid) from public, anon;
grant execute on function public.cancel_cart_ticket(uuid) to authenticated;
revoke all on function public.confirm_cart_ticket(uuid) from public, anon;
grant execute on function public.confirm_cart_ticket(uuid) to authenticated;
revoke all on function public.update_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.update_order_status(uuid, public.order_status) to authenticated;

create index if not exists cart_tickets_confirmed_by_idx on public.cart_tickets(confirmed_by);
create index if not exists cart_tickets_resolved_by_idx on public.cart_tickets(resolved_by);
create index if not exists inventory_adjustments_actor_id_idx on public.inventory_adjustments(actor_id);
create index if not exists inventory_adjustments_product_id_idx on public.inventory_adjustments(product_id);
create index if not exists product_inventory_updated_by_idx on public.product_inventory(updated_by);
create index if not exists promotion_products_product_id_idx on public.promotion_products(product_id);
create index if not exists promotions_created_by_idx on public.promotions(created_by);
create index if not exists staff_invites_invited_by_idx on public.staff_invites(invited_by);
