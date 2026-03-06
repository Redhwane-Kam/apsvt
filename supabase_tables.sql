-- =====================================================
-- APSVT — Création des tables Supabase
-- À exécuter dans : Supabase > SQL Editor > New query
-- =====================================================

-- 1. Paramètres généraux de l'association
CREATE TABLE parametres (
  id           SERIAL PRIMARY KEY,
  cle          TEXT UNIQUE NOT NULL,
  valeur       TEXT NOT NULL,
  updated_at   TIMESTAMP DEFAULT NOW()
);

INSERT INTO parametres (cle, valeur) VALUES
  ('admin_pwd_hash', ''),
  ('admin_created',  'false'),
  ('annee_courante', '2025'),
  ('solde_initial',  '1250'),
  ('montant_cotisation', '40');

-- 2. Membres
CREATE TABLE membres (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom                 TEXT NOT NULL,
  prenom              TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  pwd_hash            TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'membre',
  etablissement       TEXT,
  statut_cotisation   TEXT NOT NULL DEFAULT 'en retard',
  annee_cotisation    TEXT DEFAULT '2025',
  actif               BOOLEAN DEFAULT true,
  date_creation       DATE DEFAULT CURRENT_DATE
);

-- 3. Transactions financières
CREATE TABLE transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE NOT NULL,
  libelle     TEXT NOT NULL,
  categorie   TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('recette', 'depense')),
  montant     NUMERIC(12,3) NOT NULL,
  note        TEXT,
  saisi_par   TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 4. Dons
CREATE TABLE dons (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date           DATE NOT NULL,
  donateur       TEXT NOT NULL,
  type_donateur  TEXT NOT NULL DEFAULT 'شخص طبيعي',
  montant        NUMERIC(12,3) NOT NULL,
  objet          TEXT,
  statut         TEXT NOT NULL DEFAULT 'تعهد',
  recu_fiscal    BOOLEAN DEFAULT false,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- 5. Annonces publiques
CREATE TABLE annonces (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre            TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'evenement',
  date_evenement   DATE NOT NULL,
  lieu             TEXT,
  description      TEXT,
  image_emoji      TEXT DEFAULT '📅',
  statut           TEXT NOT NULL DEFAULT 'brouillon',
  date_publication DATE DEFAULT CURRENT_DATE,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SÉCURITÉ : Row Level Security (RLS)
-- =====================================================

ALTER TABLE parametres   ENABLE ROW LEVEL SECURITY;
ALTER TABLE membres      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces     ENABLE ROW LEVEL SECURITY;

-- Accès public en lecture (annonces publiées uniquement)
CREATE POLICY "annonces_public_read" ON annonces
  FOR SELECT USING (statut = 'publié');

-- Accès total via clé anon pour l'application (gestion côté app)
CREATE POLICY "all_access_parametres"   ON parametres   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access_membres"      ON membres      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access_transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access_dons"         ON dons         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access_annonces"     ON annonces     FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- DONNÉES DE DÉMONSTRATION (optionnel)
-- =====================================================

INSERT INTO transactions (date, libelle, categorie, type, montant) VALUES
  ('2025-01-05', 'الاشتراكات – جانفي',    'اشتراك',  'recette', 480),
  ('2025-01-18', 'شراء معدات تربوية',      'معدات',   'depense', 220),
  ('2025-02-03', 'منحة أكاديمية',          'منحة',    'recette', 800),
  ('2025-02-14', 'مصاريف تنقل – ملتقى',   'تنقلات',  'depense', 135),
  ('2025-03-01', 'تبرع – م. دوبون',        'تبرع',    'recette', 200),
  ('2025-03-10', 'إيجار قاعة ندوة',        'إيجار',   'depense', 300),
  ('2025-04-08', 'تأمين سنوي',             'تأمين',   'depense', 180),
  ('2025-05-02', 'الاشتراكات – ماي',       'اشتراك',  'recette', 400);

INSERT INTO dons (date, donateur, type_donateur, montant, objet, statut, recu_fiscal) VALUES
  ('2025-03-01', 'م. دوبون',       'شخص طبيعي', 200, 'تبرع حر',        'مُستلم', true),
  ('2025-04-15', 'معهد باستور',    'مؤسسة',     500, 'شراكة مؤسسية',  'مُستلم', false);

INSERT INTO annonces (titre, type, date_evenement, lieu, description, image_emoji, statut) VALUES
  ('رحلة جيولوجية – المرتفعات الوسطى', 'excursion', '2025-06-14', 'كليرمون-فيران',
   'يوم استكشافي للتكوينات البركانية. مفتوح لجميع الأساتذة وفصولهم.', '🌋', 'publié'),
  ('ملتقى : التنوع البيولوجي وتغير المناخ', 'evenement', '2025-08-22', 'قاعة المعهد الأعلى للتكوين',
   'مداخلة حول تأثير الاحترار المناخي على الأنظمة البيئية المحلية.', '🌍', 'publié'),
  ('ورشة : استخدام المجهر الرقمي', 'formation', '2025-09-03', 'إعدادية – قاعة العلوم',
   'تكوين تطبيقي على المجاهر الرقمية الحديثة. الأماكن محدودة بـ 20 مشاركاً.', '🔬', 'publié');
