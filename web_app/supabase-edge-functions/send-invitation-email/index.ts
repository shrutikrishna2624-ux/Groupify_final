import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitationId } = await req.json()

    if (!invitationId) {
      return new Response(
        JSON.stringify({ error: 'invitationId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .select('*, projects(*), profiles!project_invitations_inviter_id_fkey(*)')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const inviterName = invitation.profiles?.name || invitation.profiles?.email || 'Someone'
    const projectName = invitation.projects?.name || 'A project'
    const inviteeEmail = invitation.invitee_email
    const role = invitation.role
    const expiresAt = new Date(invitation.expires_at).toLocaleDateString()

    const acceptUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/?invitation=${invitationId}`

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Groupify</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Collaborate on projects</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #333; margin-top: 0;">You've been invited to join ${projectName}</h2>
          <p style="color: #666; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join <strong>${projectName}</strong> on Groupify as a <strong>${role}</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            This invitation expires on ${expiresAt}.<br>
            If you don't have a Groupify account, you'll be able to create one after clicking the link above.
          </p>
        </div>
      </div>
    `

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured. Email sending skipped.')
      return new Response(
        JSON.stringify({ 
          warning: 'Email provider not configured. Invitation created but email not sent.',
          invitation: invitation 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Groupify <onboarding@resend.dev>',
        to: [inviteeEmail],
        subject: `You're invited to join ${projectName} on Groupify`,
        html: emailContent,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorText, status: resendResponse.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const resendData = await resendResponse.json()

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in send-invitation-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
