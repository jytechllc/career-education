-- E-signature tables (src/lib/schema.ts: contracts, contract_signers, contract_events).
CREATE TABLE IF NOT EXISTS contracts (
  id serial PRIMARY KEY,
  number text UNIQUE NOT NULL,
  title text NOT NULL,
  body_md text NOT NULL,
  content_hash text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  created_by text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  completed_at timestamp,
  completed_record jsonb,
  record_hash text,
  voided_at timestamp,
  voided_by text,
  void_reason text
);

CREATE TABLE IF NOT EXISTS contract_signers (
  id serial PRIMARY KEY,
  contract_id integer NOT NULL REFERENCES contracts(id),
  position integer NOT NULL,
  role_label text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  otp_hash text,
  otp_sent_at timestamp,
  otp_attempts integer NOT NULL DEFAULT 0,
  verified_at timestamp,
  viewed_at timestamp,
  signed_at timestamp,
  signed_name text,
  signature_image text,
  signature_hash text,
  signed_ip text,
  signed_user_agent text
);
CREATE INDEX IF NOT EXISTS contract_signers_contract_idx ON contract_signers(contract_id);

CREATE TABLE IF NOT EXISTS contract_events (
  id serial PRIMARY KEY,
  contract_id integer NOT NULL REFERENCES contracts(id),
  signer_id integer,
  type text NOT NULL,
  actor text,
  ip text,
  user_agent text,
  detail jsonb,
  prev_hash text,
  hash text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contract_events_contract_idx ON contract_events(contract_id, id);

-- Records are permanent: block DELETE on all three tables, and any UPDATE of
-- the audit trail or of a contract's frozen text.
CREATE OR REPLACE FUNCTION contracts_forbid() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'contract records are append-only (% on %)', TG_OP, TG_TABLE_NAME;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION contracts_freeze_text() RETURNS trigger AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title OR NEW.body_md IS DISTINCT FROM OLD.body_md
     OR NEW.content_hash IS DISTINCT FROM OLD.content_hash OR NEW.number IS DISTINCT FROM OLD.number THEN
    RAISE EXCEPTION 'contract text is frozen';
  END IF;
  IF OLD.record_hash IS NOT NULL AND NEW.record_hash IS DISTINCT FROM OLD.record_hash THEN
    RAISE EXCEPTION 'completed record is frozen';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contracts_no_delete ON contracts;
CREATE TRIGGER contracts_no_delete BEFORE DELETE ON contracts FOR EACH ROW EXECUTE FUNCTION contracts_forbid();
DROP TRIGGER IF EXISTS contracts_frozen ON contracts;
CREATE TRIGGER contracts_frozen BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION contracts_freeze_text();
DROP TRIGGER IF EXISTS contract_signers_no_delete ON contract_signers;
CREATE TRIGGER contract_signers_no_delete BEFORE DELETE ON contract_signers FOR EACH ROW EXECUTE FUNCTION contracts_forbid();
DROP TRIGGER IF EXISTS contract_events_append_only ON contract_events;
CREATE TRIGGER contract_events_append_only BEFORE UPDATE OR DELETE ON contract_events FOR EACH ROW EXECUTE FUNCTION contracts_forbid();

-- A signer row is frozen once signed.
CREATE OR REPLACE FUNCTION contract_signers_freeze() RETURNS trigger AS $$
BEGIN
  IF OLD.signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'signed signer row is frozen';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_signers_frozen ON contract_signers;
CREATE TRIGGER contract_signers_frozen BEFORE UPDATE ON contract_signers FOR EACH ROW EXECUTE FUNCTION contract_signers_freeze();

-- 2026-10-14: signers who enter their own name/email on the signing page.
ALTER TABLE contract_signers ADD COLUMN IF NOT EXISTS self_identify boolean NOT NULL DEFAULT false;
ALTER TABLE contract_signers ADD COLUMN IF NOT EXISTS signer_info jsonb;
