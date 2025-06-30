import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface AdminSignupRequest {
  email: string
  password: string
  full_name: string
  organization?: string
  job_title?: string
  admin_level?: number
  department?: string
}

interface RoleUpdateRequest {
  user_id: string
  role: string
  admin_level?: number
  permissions?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Public endpoints (no auth required)
    if (path === '/auth-admin/signup' && method === 'POST') {
      const signupData = await req.json()
      return await createAdminUser(supabaseClient, signupData)
    }

    // Protected endpoints (require authentication)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    // Get user role
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('User not found')
    }

    if (!userData.is_active) {
      throw new Error('User account is inactive')
    }

    // Route handling for authenticated endpoints
    if (path === '/auth-admin/profile' && method === 'GET') {
      return await getUserProfile(supabaseClient, user.id)
    }

    if (path === '/auth-admin/profile' && method === 'PUT') {
      const profileData = await req.json()
      return await updateUserProfile(supabaseClient, user.id, profileData)
    }

    if (path === '/auth-admin/users' && method === 'GET') {
      return await listUsers(supabaseClient, user.id, userData.role)
    }

    if (path === '/auth-admin/users/role' && method === 'PUT') {
      const roleData = await req.json()
      return await updateUserRole(supabaseClient, user.id, userData.role, roleData)
    }

    if (path === '/auth-admin/permissions' && method === 'GET') {
      return await getUserPermissions(supabaseClient, user.id, userData.role)
    }

    if (path === '/auth-admin/audit-logs' && method === 'GET') {
      return await getAuditLogs(supabaseClient, user.id, userData.role)
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auth Admin Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createAdminUser(supabaseClient: any, signupData: AdminSignupRequest) {
  // Validate input
  if (!signupData.email || !signupData.password || !signupData.full_name) {
    throw new Error('Missing required fields: email, password, full_name')
  }

  // Check if this is the first user (becomes super admin)
  const { count: userCount } = await supabaseClient
    .from('users')
    .select('*', { count: 'exact', head: true })

  const isFirstUser = userCount === 0
  const defaultRole = isFirstUser ? 'super_admin' : 'user'

  // Create auth user
  const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
    email: signupData.email,
    password: signupData.password,
    email_confirm: true,
    user_metadata: {
      full_name: signupData.full_name,
      organization: signupData.organization,
      job_title: signupData.job_title
    }
  })

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`)
  }

  // Create user profile
  const { error: profileError } = await supabaseClient
    .from('users')
    .insert({
      id: authData.user.id,
      email: signupData.email,
      full_name: signupData.full_name,
      role: defaultRole,
      organization: signupData.organization,
      job_title: signupData.job_title,
      is_verified: true,
      email_verified_at: new Date().toISOString()
    })

  if (profileError) {
    // Cleanup auth user if profile creation fails
    await supabaseClient.auth.admin.deleteUser(authData.user.id)
    throw new Error(`Failed to create user profile: ${profileError.message}`)
  }

  // Create admin user record if admin role
  if (['admin', 'super_admin'].includes(defaultRole)) {
    const { error: adminError } = await supabaseClient
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        admin_level: signupData.admin_level || (isFirstUser ? 10 : 5),
        department: signupData.department,
        permissions: isFirstUser ? ['*'] : ['read_own_data', 'manage_jobs'],
        access_level: isFirstUser ? 'full' : 'standard',
        two_factor_enabled: false
      })

    if (adminError) {
      console.error('Failed to create admin record:', adminError)
      // Don't fail the entire signup for this
    }
  }

  // Log the signup
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'user_signup',
      resource_type: 'user',
      resource_id: authData.user.id,
      user_id: authData.user.id,
      user_email: signupData.email,
      user_role: defaultRole,
      metadata: {
        is_first_user: isFirstUser,
        organization: signupData.organization
      }
    })

  return new Response(
    JSON.stringify({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: signupData.email,
        role: defaultRole,
        is_first_user: isFirstUser
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getUserProfile(supabaseClient: any, userId: string) {
  const { data: profile, error } = await supabaseClient
    .from('users')
    .select(`
      *,
      admin_profile:admin_users(*)
    `)
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ profile }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateUserProfile(supabaseClient: any, userId: string, profileData: any) {
  const allowedFields = [
    'full_name', 'avatar_url', 'organization', 'job_title', 
    'phone', 'timezone', 'language', 'preferences', 'notification_settings'
  ]

  const updateData = Object.keys(profileData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = profileData[key]
      return obj
    }, {} as any)

  const { error } = await supabaseClient
    .from('users')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  // Log the profile update
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'update_profile',
      resource_type: 'user',
      resource_id: userId,
      user_id: userId,
      old_values: {},
      new_values: updateData
    })

  return new Response(
    JSON.stringify({ message: 'Profile updated successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function listUsers(supabaseClient: any, requesterId: string, requesterRole: string) {
  // Only admins can list users
  if (!['admin', 'super_admin', 'analyst'].includes(requesterRole)) {
    throw new Error('Insufficient permissions to list users')
  }

  const { data: users, error } = await supabaseClient
    .from('users')
    .select(`
      id, email, full_name, role, organization, job_title,
      is_active, is_verified, last_login_at, created_at,
      admin_profile:admin_users(admin_level, department, access_level)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ users }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateUserRole(supabaseClient: any, requesterId: string, requesterRole: string, roleData: RoleUpdateRequest) {
  // Only super admins can change roles
  if (requesterRole !== 'super_admin') {
    throw new Error('Only super administrators can update user roles')
  }

  if (!roleData.user_id || !roleData.role) {
    throw new Error('Missing required fields: user_id, role')
  }

  // Prevent self-demotion
  if (roleData.user_id === requesterId && roleData.role !== 'super_admin') {
    throw new Error('Cannot demote yourself from super admin')
  }

  // Get current user data
  const { data: currentUser, error: currentError } = await supabaseClient
    .from('users')
    .select('role, email')
    .eq('id', roleData.user_id)
    .single()

  if (currentError || !currentUser) {
    throw new Error('User not found')
  }

  // Update user role
  const { error: updateError } = await supabaseClient
    .from('users')
    .update({ role: roleData.role })
    .eq('id', roleData.user_id)

  if (updateError) {
    throw new Error(`Failed to update user role: ${updateError.message}`)
  }

  // Update or create admin record if needed
  if (['admin', 'super_admin'].includes(roleData.role)) {
    const { error: adminError } = await supabaseClient
      .from('admin_users')
      .upsert({
        user_id: roleData.user_id,
        admin_level: roleData.admin_level || 5,
        permissions: roleData.permissions || ['read_own_data', 'manage_jobs'],
        access_level: roleData.role === 'super_admin' ? 'full' : 'standard'
      })

    if (adminError) {
      console.error('Failed to update admin record:', adminError)
    }
  } else {
    // Remove admin record if demoting from admin
    await supabaseClient
      .from('admin_users')
      .delete()
      .eq('user_id', roleData.user_id)
  }

  // Log the role change
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'update_user_role',
      resource_type: 'user',
      resource_id: roleData.user_id,
      user_id: requesterId,
      old_values: { role: currentUser.role },
      new_values: { role: roleData.role },
      metadata: {
        target_user_email: currentUser.email,
        admin_level: roleData.admin_level
      }
    })

  return new Response(
    JSON.stringify({ message: 'User role updated successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getUserPermissions(supabaseClient: any, userId: string, userRole: string) {
  // Get user permissions
  const { data: permissions, error } = await supabaseClient
    .from('user_permissions')
    .select(`
      *,
      granted_by_admin:granted_by(user_id, admin_level)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch permissions: ${error.message}`)
  }

  // Get role-based permissions
  const { data: rolePermissions, error: roleError } = await supabaseClient
    .from('user_roles')
    .select('permissions')
    .eq('name', userRole)
    .single()

  if (roleError) {
    console.error('Failed to fetch role permissions:', roleError)
  }

  return new Response(
    JSON.stringify({
      user_permissions: permissions,
      role_permissions: rolePermissions?.permissions || [],
      effective_permissions: [
        ...(rolePermissions?.permissions || []),
        ...permissions.map(p => p.permission)
      ]
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAuditLogs(supabaseClient: any, userId: string, userRole: string) {
  // Only admins can view audit logs
  if (!['admin', 'super_admin'].includes(userRole)) {
    throw new Error('Insufficient permissions to view audit logs')
  }

  let query = supabaseClient
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Regular admins can only see their own actions
  if (userRole === 'admin') {
    query = query.eq('user_id', userId)
  }

  const { data: logs, error } = await query

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ audit_logs: logs }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}