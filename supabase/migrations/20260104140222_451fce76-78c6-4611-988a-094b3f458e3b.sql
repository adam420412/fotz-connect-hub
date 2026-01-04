-- Create leads table for CRM
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view all leads
CREATE POLICY "Team can view all leads"
ON public.leads
FOR SELECT
USING (is_team_member(auth.uid()));

-- Policy: Team members can manage leads
CREATE POLICY "Team can manage leads"
ON public.leads
FOR ALL
USING (is_team_member(auth.uid()));

-- Policy: Public can insert leads (from webhook)
CREATE POLICY "Public can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Create deals table for sales pipeline
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PLN',
  stage TEXT NOT NULL DEFAULT 'qualification',
  probability INTEGER DEFAULT 10,
  expected_close_date DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view all deals
CREATE POLICY "Team can view all deals"
ON public.deals
FOR SELECT
USING (is_team_member(auth.uid()));

-- Policy: Team members can manage deals
CREATE POLICY "Team can manage deals"
ON public.deals
FOR ALL
USING (is_team_member(auth.uid()));

-- Create contact_history table
CREATE TABLE public.contact_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL DEFAULT 'note',
  subject TEXT,
  content TEXT NOT NULL,
  contact_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view all contact history
CREATE POLICY "Team can view contact history"
ON public.contact_history
FOR SELECT
USING (is_team_member(auth.uid()));

-- Policy: Team members can manage contact history
CREATE POLICY "Team can manage contact history"
ON public.contact_history
FOR ALL
USING (is_team_member(auth.uid()));

-- Create bookings table for syncing with fotz.pl
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'konsultacja',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT DEFAULT 'website',
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert bookings (from webhook)
CREATE POLICY "Public can insert bookings"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Policy: Team members can view all bookings
CREATE POLICY "Team can view bookings"
ON public.bookings
FOR SELECT
USING (is_team_member(auth.uid()));

-- Policy: Team members can manage bookings
CREATE POLICY "Team can manage bookings"
ON public.bookings
FOR ALL
USING (is_team_member(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_leads_status ON public.leads (status);
CREATE INDEX idx_leads_email ON public.leads (email);
CREATE INDEX idx_deals_stage ON public.deals (stage);
CREATE INDEX idx_deals_lead_id ON public.deals (lead_id);
CREATE INDEX idx_contact_history_lead_id ON public.contact_history (lead_id);
CREATE INDEX idx_bookings_date ON public.bookings (booking_date);
CREATE INDEX idx_bookings_status ON public.bookings (status);