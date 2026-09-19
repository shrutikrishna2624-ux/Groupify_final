-- Create project_invitations table
CREATE TABLE IF NOT EXISTS public.project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    role TEXT DEFAULT 'Member',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- Enable Row Level Security
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_invitations

-- Allow anyone to read invitations for projects they are a member of
DROP POLICY IF EXISTS "Users can view invitations for their projects" ON public.project_invitations;
CREATE POLICY "Users can view invitations for their projects"
    ON public.project_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = project_invitations.project_id
            AND project_members.user_id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE email ILIKE project_invitations.invitee_email
        )
    );

-- Allow project owners/admins to create invitations
DROP POLICY IF EXISTS "Project members can create invitations" ON public.project_invitations;
CREATE POLICY "Project members can create invitations"
    ON public.project_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = project_invitations.project_id
            AND project_members.user_id = auth.uid()
            AND project_members.role IN ('Owner', 'Product Lead', 'Admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_invitations.project_id
            AND projects.created_by = auth.uid()
        )
    );

-- Allow users to update their own invitations (for accepting/declining)
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.project_invitations;
CREATE POLICY "Users can update their own invitations"
    ON public.project_invitations FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE email ILIKE project_invitations.invitee_email
        )
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON public.project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_invitee_email ON public.project_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_status ON public.project_invitations(status);
