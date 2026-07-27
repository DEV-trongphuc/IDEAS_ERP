DELETE FROM users WHERE email IN ('turniodev@gmail.com', 'director@Ideas.test', 'manager@Ideas.test', 'dom.marketing.vn@gmail.com');

INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, is_confirmed) VALUES 
(1, 'turniodev@gmail.com', '$2y$10$zQtMP1Fny5HpK.ap0xH4e.0ZdJ6wZVP04sadZ9WvdvTmF.xS8ZGTa', 'Dev Admin', 'admin', 1, 1),
(1, 'director@Ideas.test', '$2y$10$sgfzWu9eK3kL9YCzi1JeMO9pImB3LilG5OzZd8xR2nnlXCBoUjKRu', 'Dev Director', 'director', 1, 1),
(1, 'manager@Ideas.test', '$2y$10$xRRqjkTUiVN82J20GNt4TOJTdjayB8JQ9YwNyLR48GMKm95cX6ibO', 'Dev Manager', 'manager', 1, 1),
(1, 'dom.marketing.vn@gmail.com', '$2y$10$o7QYM2mWS9O4lk5IdRfQD.bv9KzdRkLkKQkOi3xyO.c.dbx5UL..2', 'Dev Sale', 'sales', 1, 1);
