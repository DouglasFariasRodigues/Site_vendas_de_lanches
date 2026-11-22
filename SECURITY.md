# Security

This public repository is a demonstration and contains no production credentials or real customer data.

- Never put a Supabase `service_role` or `sb_secret_` key in browser code.
- Set admin credentials and the service-role key only in Netlify environment variables.
- The browser may use only a publishable/anon key with Row Level Security enabled.
- Keep `.env`, `.netlify`, local config files, and credentials out of Git commits.
- If a real credential is exposed, rotate it immediately in its provider; deleting the commit alone is not enough.

To report a security issue, contact the repository owner privately rather than posting credentials in a public issue.
