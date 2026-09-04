-- =============================================================================
-- СХЕМА БАЗЫ ДАННЫХ SUPABASE / POSTGRESQL
-- CRM ДЛЯ МУЗЫКАЛЬНОЙ СТУДИИ ЗВУКОЗАПИСИ (SOUNDSTUDIO CRM)
-- =============================================================================
-- Инструкция:
-- 1. Создайте проект в https://supabase.com
-- 2. В левом меню откройте "SQL Editor" -> "+ New query"
-- 3. Вставьте содержимое этого файла и нажмите кнопку "Run" (Ctrl+Enter)
-- 4. Перейдите в "Database" -> "Replication" и включите галочки для таблиц,
--    чтобы работала мгновенная синхронизация (Realtime).
-- =============================================================================

-- 1. Таблица колонок канбан-доски (этапы производства треков)
CREATE TABLE IF NOT EXISTS kanban_columns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Таблица услуг прайс-листа студии
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Таблица проектов / треков студии
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    track_title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_link TEXT,
    selected_services JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_price NUMERIC NOT NULL DEFAULT 0,
    deposit NUMERIC NOT NULL DEFAULT 0,
    remaining_balance NUMERIC NOT NULL DEFAULT 0,
    deadline_date DATE,
    column_id TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 4. ПОЛИТИКИ БЕЗОПАСНОСТИ (ROW LEVEL SECURITY)
-- =============================================================================
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Разрешаем чтение и запись с публичным анонимным ключом (anon key)
CREATE POLICY "Allow public read-write for kanban_columns" ON kanban_columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 5. НАЧАЛЬНЫЕ ДАННЫЕ: КОЛОНКИ КАНБАН-ДОСКИ
-- =============================================================================
INSERT INTO kanban_columns (id, title, sort_order) VALUES
('col-1', 'Заявка', 1),
('col-2', 'Ожидание исходников/Аванс', 2),
('col-3', 'Сведение V1', 3),
('col-4', 'Правки', 4),
('col-5', 'Мастеринг', 5),
('col-6', 'Готово / Оплачено', 6)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. НАЧАЛЬНЫЕ ДАННЫЕ: ПРАЙС-ЛИСТ СТУДИИ
-- =============================================================================
INSERT INTO services (id, name, price) VALUES
('srv-1', 'Сведение (мультитрек)', 7000),
('srv-2', 'Мастеринг (стерео)', 2500),
('srv-3', 'Тюнинг вокала (ручной)', 2000),
('srv-4', 'Коррекция тайминга вокала', 1500),
('srv-5', 'Саунд-дизайн / FX', 3000),
('srv-6', 'Продюсирование аранжировки', 10000),
('srv-7', 'Правки (дополнительный круг)', 1000)
ON CONFLICT (id) DO NOTHING;
