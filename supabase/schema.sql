-- ==============================================================================
-- SCHEMA SUPABASE : AGENCE IMMOBILIÈRE PRESTIGE CÔTE D'IVOIRE
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE DES BIENS IMMOBILIERS (PROPERTIES)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('sale', 'rent')),
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('villa', 'appartement', 'penthouse', 'terrain', 'bureau', 'immeuble')),
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'under_offer', 'under_contract', 'sold', 'rented')),
    price NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'FCFA',
    city VARCHAR(100) NOT NULL DEFAULT 'Abidjan',
    district VARCHAR(150) NOT NULL,
    address TEXT,
    surface NUMERIC(10, 2),
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    has_pool BOOLEAN DEFAULT FALSE,
    has_generator BOOLEAN DEFAULT FALSE,
    has_security BOOLEAN DEFAULT TRUE,
    has_parking BOOLEAN DEFAULT TRUE,
    legal_status VARCHAR(50) DEFAULT 'ACD' CHECK (legal_status IN ('ACD', 'TF', 'CMP', 'Approbation', 'En cours')),
    featured BOOLEAN DEFAULT FALSE,
    images JSONB DEFAULT '[]'::jsonb,
    owner_name VARCHAR(150),
    owner_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_properties_operation ON public.properties(operation);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_district ON public.properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- 3. TABLE DES CONTACTS & PROSPECTS (CONTACTS / LEADS)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    type VARCHAR(30) DEFAULT 'buyer' CHECK (type IN ('buyer', 'tenant', 'owner', 'investor')),
    lead_score VARCHAR(20) DEFAULT 'warm' CHECK (lead_score IN ('hot', 'warm', 'cold')),
    budget_min NUMERIC(15, 2),
    budget_max NUMERIC(15, 2),
    preferred_districts JSONB DEFAULT '[]'::jsonb,
    preferred_types JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    last_interaction TEXT,
    source VARCHAR(50) DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'website', 'call', 'referral')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON public.contacts(lead_score);

-- 4. TABLE DES VISITES (VISITS)
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    feedback TEXT,
    agent_name VARCHAR(100) DEFAULT 'Conseiller Immo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(status);

-- 5. TABLE DES TRANSACTIONS & PIPELINE (DEALS)
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    stage VARCHAR(50) DEFAULT 'new_lead' CHECK (stage IN ('new_lead', 'qualified', 'visit_scheduled', 'offer_made', 'under_contract', 'closed_won', 'closed_lost')),
    deal_value NUMERIC(15, 2) NOT NULL,
    commission_expected NUMERIC(15, 2),
    expected_closing_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);

-- 6. TABLE DES CONVERSATIONS WHATSAPP (AGENT IA LOGS)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(50) UNIQUE NOT NULL,
    contact_name VARCHAR(150),
    last_intent VARCHAR(100),
    last_user_message TEXT,
    last_bot_response TEXT,
    extracted_budget NUMERIC(15, 2),
    extracted_district VARCHAR(150),
    conversation_history JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON public.whatsapp_conversations(phone);

-- 7. POLICIES RLS (Row Level Security)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les biens disponibles
CREATE POLICY "Public Read Available Properties" 
ON public.properties FOR SELECT USING (true);

-- Accès complet authentifié pour CRM
CREATE POLICY "Full Access Authenticated Users Properties" 
ON public.properties FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full Access Authenticated Users Contacts" 
ON public.contacts FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full Access Authenticated Users Visits" 
ON public.visits FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full Access Authenticated Users Deals" 
ON public.deals FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full Access Authenticated Users WhatsApp" 
ON public.whatsapp_conversations FOR ALL USING (auth.role() = 'authenticated');
