-- FR-119: Junction table linking brands to content packs
CREATE TABLE IF NOT EXISTS brand_content_packs (
    brand_slug TEXT NOT NULL REFERENCES brand_configs(slug) ON DELETE CASCADE,
    pack_id    TEXT NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT,
    PRIMARY KEY (brand_slug, pack_id)
);

-- Seed partner #1: Space Service International
INSERT INTO brand_configs (slug, config, is_active, created_at, updated_at, updated_by)
VALUES ('space-service-intl',
        '{"slug":"space-service-intl","brandName":"Space Service International","brandNameShort":"SSI","tagline":"Abenteuer Weltraum erleben","universeTitle":"Das SSI Weltraum-Universum","contactEmail":"info@space-service-intl.com","copyrightHolder":"Space Service International","logoUrl":"/icons/app-icon.png","appIconUrl":"/icons/app-icon.png","pageTitle":"Space Service International - Abenteuer Weltraum","metaDescription":"Entdecke die Raumfahrtgeschichte mit Space Service International — Kosmonautentraining, Gagarin und die Zukunft im All.","theme":{"primaryColor":"#1e3a5f","accentColor":"#4fc3f7"},"legal":{"companyName":"Space Service International","companyAddress":"Rochlitzer Str. 62, 09648 Mittweida","companyCountry":"Deutschland","contactEmail":"info@space-service-intl.com","contactPhone":"+49 3727 90811","legalRepresentative":"Tasillo Roemisch","registerEntry":"","vatId":"","contentResponsible":"Tasillo Roemisch"},"aiCoachBrandName":"SSI Explorer","sponsorLabel":"Powered by Space Service International"}',
        TRUE, NOW(), NOW(), 'system-seed')
ON CONFLICT (slug) DO NOTHING;

-- Link pack 003 to SSI brand
INSERT INTO brand_content_packs (brand_slug, pack_id, is_active, updated_by)
VALUES ('space-service-intl', '003', TRUE, 'system-seed')
ON CONFLICT (brand_slug, pack_id) DO NOTHING;
