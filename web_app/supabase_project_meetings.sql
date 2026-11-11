CREATE TABLE IF NOT EXISTS public.project_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    duration TEXT NOT NULL,
    platform TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_meetings FROM anon, authenticated;
GRANT SELECT, INSERT ON public.project_meetings TO authenticated;

DROP POLICY IF EXISTS "Project members can view meetings" ON public.project_meetings;
CREATE POLICY "Project members can view meetings"
    ON public.project_meetings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.project_members AS membership
            WHERE membership.project_id = project_meetings.project_id
              AND membership.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Project members can schedule meetings" ON public.project_meetings;
CREATE POLICY "Project members can schedule meetings"
    ON public.project_meetings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.project_members AS membership
            WHERE membership.project_id = project_meetings.project_id
              AND membership.user_id = auth.uid()
        )
    );
