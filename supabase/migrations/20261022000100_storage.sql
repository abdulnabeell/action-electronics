-- Public bucket for product images. Anyone can read an image by URL; only the server (service role) uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
-- No insert/update/delete policies are created on storage.objects, so the anon and authenticated roles
-- cannot write; the service role bypasses RLS.
