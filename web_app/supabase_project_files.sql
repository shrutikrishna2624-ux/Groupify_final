-- Private project file storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size BIGINT NOT NULL DEFAULT 0,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can read their uploaded project files" ON public.project_files;
DROP POLICY IF EXISTS "Project members can read project file metadata" ON public.project_files;
CREATE POLICY "Project members can read project file metadata"
    ON public.project_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = project_files.project_id
              AND project_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_files.project_id
              AND projects.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Project members can register uploaded project files" ON public.project_files;
CREATE POLICY "Project members can register uploaded project files"
    ON public.project_files FOR INSERT
    WITH CHECK (
                uploaded_by = auth.uid()
                AND (
                        EXISTS (
                                SELECT 1 FROM public.project_members
                                WHERE project_members.project_id = project_files.project_id
                                    AND project_members.user_id = auth.uid()
                        )
                        OR EXISTS (
                                SELECT 1 FROM public.projects
                                WHERE projects.id = project_files.project_id
                                    AND projects.created_by = auth.uid()
                        )
                )
    );

DROP POLICY IF EXISTS "Project members can upload project files" ON storage.objects;
CREATE POLICY "Project members can upload project files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'project-files'
                AND (
                        EXISTS (
                                SELECT 1
                                FROM public.project_members
                                WHERE project_members.project_id::text = (storage.foldername(name))[1]
                                    AND project_members.user_id = auth.uid()
                        )
                        OR EXISTS (
                                SELECT 1
                                FROM public.projects
                                WHERE projects.id::text = (storage.foldername(name))[1]
                                    AND projects.created_by = auth.uid()
                        )
                )
    );

DROP POLICY IF EXISTS "Project members can read project files" ON storage.objects;
CREATE POLICY "Project members can read project files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'project-files'
                AND (
                        EXISTS (
                                SELECT 1
                                FROM public.project_members
                                WHERE project_members.project_id::text = (storage.foldername(name))[1]
                                    AND project_members.user_id = auth.uid()
                        )
                        OR EXISTS (
                                SELECT 1
                                FROM public.projects
                                WHERE projects.id::text = (storage.foldername(name))[1]
                                    AND projects.created_by = auth.uid()
                        )
                )
    );
