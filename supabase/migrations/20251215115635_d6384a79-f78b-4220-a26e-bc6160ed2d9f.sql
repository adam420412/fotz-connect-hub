-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee', 'client');

-- Create profiles table with extended data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create invitations table for client invites
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  invited_by UUID REFERENCES auth.users(id),
  company_name TEXT,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check if user is team member (not client)
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager', 'employee')
  )
$$;

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
  user_role app_role;
BEGIN
  -- Check if user was invited
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND used_at IS NULL 
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invitation_record.id IS NOT NULL THEN
    user_role := invitation_record.role;
    
    -- Mark invitation as used
    UPDATE public.invitations SET used_at = now() WHERE id = invitation_record.id;
    
    -- Create profile with company info from invitation
    INSERT INTO public.profiles (id, email, full_name, company_name)
    VALUES (
      NEW.id, 
      NEW.email, 
      NEW.raw_user_meta_data ->> 'full_name',
      invitation_record.company_name
    );
  ELSE
    -- Default role for uninvited signups (should be blocked in production)
    user_role := 'client';
    
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  END IF;

  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- Trigger on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Team members can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_team_member(auth.uid()));

-- RLS Policies for invitations
CREATE POLICY "Team members can manage invitations"
  ON public.invitations FOR ALL
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Anyone can view invitation by token"
  ON public.invitations FOR SELECT
  USING (true);

-- Update scheduled_posts RLS to support client filtering
DROP POLICY IF EXISTS "Anyone can view scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Anyone can insert scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Anyone can update scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Anyone can delete scheduled posts" ON public.scheduled_posts;

CREATE POLICY "Team can view all posts"
  ON public.scheduled_posts FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Clients can view their own posts"
  ON public.scheduled_posts FOR SELECT
  USING (
    client_name = (SELECT company_name FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Team can manage all posts"
  ON public.scheduled_posts FOR ALL
  USING (public.is_team_member(auth.uid()));

-- Create client_requests table for task/feedback requests from clients
CREATE TABLE public.client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('task', 'feedback', 'comment', 'other')),
  related_file_id UUID REFERENCES public.project_files(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_client_requests_updated_at
  BEFORE UPDATE ON public.client_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for client_requests
CREATE POLICY "Clients can view their own requests"
  ON public.client_requests FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create requests"
  ON public.client_requests FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Team can view all requests"
  ON public.client_requests FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Team can manage all requests"
  ON public.client_requests FOR ALL
  USING (public.is_team_member(auth.uid()));