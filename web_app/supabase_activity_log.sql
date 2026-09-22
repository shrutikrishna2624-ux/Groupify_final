-- Activity log table for tracking team member activities
-- Run this script in your Supabase SQL Editor to enable activity tracking

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('task_completed', 'task_created', 'task_updated', 'project_created', 'project_updated', 'file_uploaded', 'meeting_scheduled', 'member_added', 'status_changed')),
    subject TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add subject_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activity_log' 
        AND column_name = 'subject_id'
    ) THEN
        ALTER TABLE public.activity_log ADD COLUMN subject_id TEXT;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created 
    ON public.activity_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_project_created 
    ON public.activity_log(project_id, created_at DESC) 
    WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_created 
    ON public.activity_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Project members can read activities for their projects
DROP POLICY IF EXISTS "Project members can read project activities" ON public.activity_log;
CREATE POLICY "Project members can read project activities"
    ON public.activity_log FOR SELECT
    USING (
        project_id IS NULL 
        OR EXISTS (
            SELECT 1
            FROM public.project_members
            WHERE project_members.project_id = activity_log.project_id
              AND project_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.projects
            WHERE projects.id = activity_log.project_id
              AND projects.created_by = auth.uid()
        )
    );

-- Policy: Users can read their own activities
DROP POLICY IF EXISTS "Users can read their own activities" ON public.activity_log;
CREATE POLICY "Users can read their own activities"
    ON public.activity_log FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Project members can insert activities for their projects
DROP POLICY IF EXISTS "Project members can insert activities" ON public.activity_log;
CREATE POLICY "Project members can insert activities"
    ON public.activity_log FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND (
            project_id IS NULL
            OR EXISTS (
                SELECT 1
                FROM public.project_members
                WHERE project_members.project_id = activity_log.project_id
                  AND project_members.user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1
                FROM public.projects
                WHERE projects.id = activity_log.project_id
                  AND projects.created_by = auth.uid()
            )
        )
    );

-- Enable real-time for activity log
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'activity_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created 
    ON public.activity_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_project_created 
    ON public.activity_log(project_id, created_at DESC) 
    WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_created 
    ON public.activity_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Project members can read activities for their projects
DROP POLICY IF EXISTS "Project members can read project activities" ON public.activity_log;
CREATE POLICY "Project members can read project activities"
    ON public.activity_log FOR SELECT
    USING (
        project_id IS NULL 
        OR EXISTS (
            SELECT 1
            FROM public.project_members
            WHERE project_members.project_id = activity_log.project_id
              AND project_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.projects
            WHERE projects.id = activity_log.project_id
              AND projects.created_by = auth.uid()
        )
    );

-- Policy: Users can read their own activities
DROP POLICY IF EXISTS "Users can read their own activities" ON public.activity_log;
CREATE POLICY "Users can read their own activities"
    ON public.activity_log FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Project members can insert activities for their projects
DROP POLICY IF EXISTS "Project members can insert activities" ON public.activity_log;
CREATE POLICY "Project members can insert activities"
    ON public.activity_log FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND (
            project_id IS NULL
            OR EXISTS (
                SELECT 1
                FROM public.project_members
                WHERE project_members.project_id = activity_log.project_id
                  AND project_members.user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1
                FROM public.projects
                WHERE projects.id = activity_log.project_id
                  AND projects.created_by = auth.uid()
            )
        )
    );

-- Enable real-time for activity log
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'activity_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
    END IF;
END $$;
