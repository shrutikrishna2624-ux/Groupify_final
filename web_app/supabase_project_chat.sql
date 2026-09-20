-- Project chat messages and realtime access
CREATE TABLE IF NOT EXISTS public.project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(trim(body)) > 0 AND char_length(body) <= 4000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_messages_project_created
    ON public.project_messages(project_id, created_at);

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can read chat messages" ON public.project_messages;
CREATE POLICY "Project members can read chat messages"
    ON public.project_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.project_members
            WHERE project_members.project_id = project_messages.project_id
              AND project_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Project members can send chat messages" ON public.project_messages;
CREATE POLICY "Project members can send chat messages"
    ON public.project_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.project_members
            WHERE project_members.project_id = project_messages.project_id
              AND project_members.user_id = auth.uid()
        )
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'project_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
    END IF;
END $$;
