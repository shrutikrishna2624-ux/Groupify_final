CREATE TABLE IF NOT EXISTS public.project_mentor_codes (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_mentor_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_mentor_codes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_groupify_mentor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND lower(coalesce(role, '')) IN ('mentor', 'faculty/mentor')
    );
$$;

REVOKE ALL ON FUNCTION public.is_groupify_mentor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_groupify_mentor() TO authenticated, anon;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mentors cannot create projects" ON public.projects;
CREATE POLICY "Mentors cannot create projects"
    ON public.projects AS RESTRICTIVE FOR INSERT
    WITH CHECK (NOT public.is_groupify_mentor());
DROP POLICY IF EXISTS "Mentors cannot edit projects" ON public.projects;
CREATE POLICY "Mentors cannot edit projects"
    ON public.projects AS RESTRICTIVE FOR UPDATE
    USING (NOT public.is_groupify_mentor())
    WITH CHECK (NOT public.is_groupify_mentor());
DROP POLICY IF EXISTS "Mentors cannot delete projects" ON public.projects;
CREATE POLICY "Mentors cannot delete projects"
    ON public.projects AS RESTRICTIVE FOR DELETE
    USING (NOT public.is_groupify_mentor());

DROP POLICY IF EXISTS "Mentors cannot create project memberships" ON public.project_members;
CREATE POLICY "Mentors cannot create project memberships"
    ON public.project_members AS RESTRICTIVE FOR INSERT
    WITH CHECK (NOT public.is_groupify_mentor());
DROP POLICY IF EXISTS "Mentors cannot edit project memberships" ON public.project_members;
CREATE POLICY "Mentors cannot edit project memberships"
    ON public.project_members AS RESTRICTIVE FOR UPDATE
    USING (NOT public.is_groupify_mentor())
    WITH CHECK (NOT public.is_groupify_mentor());
DROP POLICY IF EXISTS "Mentors cannot delete project memberships" ON public.project_members;
CREATE POLICY "Mentors cannot delete project memberships"
    ON public.project_members AS RESTRICTIVE FOR DELETE
    USING (NOT public.is_groupify_mentor());

DROP POLICY IF EXISTS "Mentors cannot create tasks" ON public.tasks;
CREATE POLICY "Mentors cannot create tasks"
    ON public.tasks AS RESTRICTIVE FOR INSERT
    WITH CHECK (NOT public.is_groupify_mentor());
DROP POLICY IF EXISTS "Mentors cannot edit tasks" ON public.tasks;
CREATE POLICY "Mentors cannot edit tasks"
    ON public.tasks AS RESTRICTIVE FOR UPDATE
    USING (NOT public.is_groupify_mentor())
    WITH CHECK (NOT public.is_groupify_mentor());
DROP POLICY IF EXISTS "Mentors cannot delete tasks" ON public.tasks;
CREATE POLICY "Mentors cannot delete tasks"
    ON public.tasks AS RESTRICTIVE FOR DELETE
    USING (NOT public.is_groupify_mentor());

DO $$
BEGIN
    IF to_regclass('public.project_messages') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Mentors cannot send project messages" ON public.project_messages';
        EXECUTE 'CREATE POLICY "Mentors cannot send project messages" ON public.project_messages AS RESTRICTIVE FOR INSERT WITH CHECK (NOT public.is_groupify_mentor())';
    END IF;
    IF to_regclass('public.project_files') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Mentors cannot upload project files" ON public.project_files';
        EXECUTE 'CREATE POLICY "Mentors cannot upload project files" ON public.project_files AS RESTRICTIVE FOR INSERT WITH CHECK (NOT public.is_groupify_mentor())';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_project_mentor_code(p_project_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_role TEXT;
    v_code TEXT;
    v_existing_code TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF lower(coalesce(v_role, '')) IN ('mentor', 'faculty/mentor') THEN
        RAISE EXCEPTION 'Mentors cannot create project share codes';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_project_id AND created_by = v_user_id
    ) AND NOT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = p_project_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'You do not have access to this project';
    END IF;

    SELECT code INTO v_existing_code
    FROM public.project_mentor_codes
    WHERE project_id = p_project_id;
    IF v_existing_code IS NOT NULL THEN
        RETURN v_existing_code;
    END IF;

    LOOP
        v_code := upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12));
        INSERT INTO public.project_mentor_codes (project_id, code, created_by)
        VALUES (p_project_id, v_code, v_user_id)
        ON CONFLICT DO NOTHING;

        IF FOUND THEN
            RETURN v_code;
        END IF;

        SELECT code INTO v_existing_code
        FROM public.project_mentor_codes
        WHERE project_id = p_project_id;
        IF v_existing_code IS NOT NULL THEN
            RETURN v_existing_code;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_project_as_mentor(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_role TEXT;
    v_project_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF lower(coalesce(v_role, '')) NOT IN ('mentor', 'faculty/mentor') THEN
        RAISE EXCEPTION 'Only mentor accounts can use project codes';
    END IF;

    SELECT project_id INTO v_project_id
    FROM public.project_mentor_codes
    WHERE code = upper(trim(p_code));
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Invalid project code';
    END IF;

    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (v_project_id, v_user_id, 'Mentor')
    ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'Mentor';

    RETURN v_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_project_mentor_code(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_project_as_mentor(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_project_mentor_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_project_as_mentor(TEXT) TO authenticated;
