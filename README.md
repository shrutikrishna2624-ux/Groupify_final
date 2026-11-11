# Groupify

Groupify is a collaborative project management and student group study platform designed for tracking tasks, projects, team activity, and AI priorities.

## Features
- **Project Workspace**: Manage team projects, deadlines, and task breakdown.
- **Task Management**: Prioritize tasks and track real-time progress.
- **Team Activity**: Live pulse on member updates and file contributions.
- **AI Priorities**: Smart insights on next steps and upcoming risk areas.

## Mentor project monitoring
- Run `web_app/supabase_project_mentors.sql` in the Supabase SQL Editor after the existing project tables are set up.
- Run `web_app/supabase_project_meetings.sql` in the Supabase SQL Editor so meetings scheduled by mentors or team members are shared with all members of that project.
- Sign up or sign in as a **Mentor** to open the mentor dashboard.
- Students can open a project, copy its mentor access code from the Overview, and share it with their mentor.
- Mentors enter that code to view the project's tasks and progress. Progress is calculated from completed tasks.

## Authentication email setup
- Groupify never emails passwords or login credentials. Supabase sends email confirmation and password-reset links only when those features are enabled.
- Supabase's default email service is for testing only: it only sends to addresses on the project organization team and is limited (currently 2 emails per hour). Configure a custom SMTP provider under Supabase **Authentication → SMTP Settings** to deliver confirmation and reset emails to other addresses.
- If signup confirmation or password reset shows **email rate exceeded**, stop retrying until the project's limit clears, then configure custom SMTP and review **Authentication → Rate Limits**. The limit is enforced by Supabase and cannot be bypassed in the web app.
- Set the Supabase **Site URL** and add the deployed app URL under **Authentication → URL Configuration → Redirect URLs** so confirmation and reset links return to Groupify.
- A reset request sends an email; it does not sign in immediately. Open the reset link, enter and confirm the new password, and Groupify will then sign in with that password.
- To require email confirmation for new accounts, enable **Authentication → Providers → Email → Confirm email**. Groupify waits for the email confirmation before sign-in. Email delivery depends on the project's SMTP and rate-limit configuration.

## Account deletion
- From `web_app`, authenticate the Supabase CLI with `npx supabase login`, then deploy with `npx supabase functions deploy delete-account --project-ref <your-project-ref>`. The function source is in `web_app/supabase/functions/delete-account/index.ts`.
- Keep Edge Function JWT verification enabled. The function verifies the signed-in user and uses the server-side `SUPABASE_SERVICE_ROLE_KEY`; never put that key in the web app. Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available in the function's server-side secrets.
- In Settings, a user can permanently delete their account after typing `DELETE`. Owned projects transfer to a teammate when possible; projects without another member are deleted.
