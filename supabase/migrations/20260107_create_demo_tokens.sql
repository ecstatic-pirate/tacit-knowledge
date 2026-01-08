-- Create public access tokens for demo expert self-assessment forms
-- These can be accessed at /assess/[token] without login

INSERT INTO public.campaign_access_tokens (campaign_id, token, token_type, email, name, expires_at) VALUES
('c1111111-1111-1111-1111-111111111111', 'marcus-weber-demo', 'expert', 'marcus.weber@getabstract.com', 'Dr. Marcus Weber', '2027-12-31 23:59:59+00'),
('c2222222-2222-2222-2222-222222222222', 'anna-keller-demo', 'expert', 'anna.keller@getabstract.com', 'Anna Keller', '2027-12-31 23:59:59+00'),
('c3333333-3333-3333-3333-333333333333', 'lucas-brunner-demo', 'expert', 'lucas.brunner@getabstract.com', 'Lucas Brunner', '2027-12-31 23:59:59+00'),
('c4444444-4444-4444-4444-444444444444', 'sophie-roth-demo', 'expert', 'sophie.roth@getabstract.com', 'Sophie Roth', '2027-12-31 23:59:59+00'),
('c5555555-5555-5555-5555-555555555555', 'thomas-meier-demo', 'expert', 'thomas.meier@getabstract.com', 'Thomas Meier', '2027-12-31 23:59:59+00'),
('c6666666-6666-6666-6666-666666666666', 'elena-fischer-demo', 'expert', 'elena.fischer@getabstract.com', 'Elena Fischer', '2027-12-31 23:59:59+00'),
('c7777777-7777-7777-7777-777777777777', 'markus-hoffmann-demo', 'expert', 'markus.hoffmann@getabstract.com', 'Markus Hoffmann', '2027-12-31 23:59:59+00')
ON CONFLICT (token) DO NOTHING;
