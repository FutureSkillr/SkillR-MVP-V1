-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE auth_provider AS ENUM ('google', 'email', 'apple', 'meta');
CREATE TYPE session_type AS ENUM ('onboarding', 'vuca-journey', 'entrepreneur-journey', 'self-learning-journey', 'reflection', 'free-exploration');
CREATE TYPE interaction_modality AS ENUM ('text', 'voice', 'choice');
CREATE TYPE evidence_type AS ENUM ('auto', 'manual', 'endorsed');
CREATE TYPE artifact_type AS ENUM ('photo', 'document', 'video', 'link');
CREATE TYPE agent_execution_status AS ENUM ('success', 'error', 'timeout');
CREATE TYPE endorser_role AS ENUM ('teacher', 'mentor', 'employer', 'peer', 'parent', 'other');
CREATE TYPE endorsement_invite_status AS ENUM ('pending', 'completed', 'expired');
CREATE TYPE journey_type AS ENUM ('vuca', 'entrepreneur', 'self-learning');
CREATE TYPE vuca_dimension AS ENUM ('volatility', 'uncertainty', 'complexity', 'ambiguity');

-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
