/**
 * =============================================================================
 * SOUNDSTUDIO — ЛОГИКА ПРИЛОЖЕНИЯ УЧЕТА ПРОЕКТОВ ЗВУКОРЕЖИССЕРА
 * =============================================================================
 *
 * SQL-ЗАПРОС ДЛЯ СОЗДАНИЯ ТАБЛИЦ В SUPABASE:
 * (Скопируйте код ниже и выполните его в Supabase -> SQL Editor -> Run)
 *
 * -----------------------------------------------------------------------------
 * -- 1. Таблица колонок канбан-доски
 * CREATE TABLE IF NOT EXISTS kanban_columns (
 *     id TEXT PRIMARY KEY,
 *     title TEXT NOT NULL,
 *     sort_order INTEGER NOT NULL DEFAULT 0,
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 *
 * -- 2. Таблица услуг прайс-листа
 * CREATE TABLE IF NOT EXISTS services (
 *     id TEXT PRIMARY KEY,
 *     name TEXT NOT NULL,
 *     price NUMERIC NOT NULL DEFAULT 0,
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 *
 * -- 3. Таблица проектов / заказов
 * CREATE TABLE IF NOT EXISTS projects (
 *     id TEXT PRIMARY KEY,
 *     track_title TEXT NOT NULL,
 *     client_name TEXT NOT NULL,
 *     client_link TEXT,
 *     selected_services JSONB NOT NULL DEFAULT '[]'::jsonb,
 *     total_price NUMERIC NOT NULL DEFAULT 0,
 *     deposit NUMERIC NOT NULL DEFAULT 0,
 *     remaining_balance NUMERIC NOT NULL DEFAULT 0,
 *     deadline_date DATE,
 *     column_id TEXT NOT NULL,
 *     notes TEXT,
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 *
 * -- 4. Политики публичного доступа (Row Level Security)
 * ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE services ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Allow public read-write for kanban_columns" ON kanban_columns FOR ALL USING (true) WITH CHECK (true);
 * CREATE POLICY "Allow public read-write for services" ON services FOR ALL USING (true) WITH CHECK (true);
 * CREATE POLICY "Allow public read-write for projects" ON projects FOR ALL USING (true) WITH CHECK (true);
 *
 * -- 5. Начальные колонки канбан-доски
 * INSERT INTO kanban_columns (id, title, sort_order) VALUES
 * ('col-1', 'Заявка', 1),
 * ('col-2', 'Ожидание исходников/Аванс', 2),
 * ('col-3', 'Сведение V1', 3),
 * ('col-4', 'Правки', 4),
 * ('col-5', 'Мастеринг', 5),
 * ('col-6', 'Готово / Оплачено', 6)
 * ON CONFLICT (id) DO NOTHING;
 *
 * -- 6. Начальный прайс-лист студии
 * INSERT INTO services (id, name, price) VALUES
 * ('srv-1', 'Сведение (мультитрек)', 7000),
 * ('srv-2', 'Мастеринг (стерео)', 2500),
 * ('srv-3', 'Тюнинг вокала (ручной)', 2000),
 * ('srv-4', 'Коррекция тайминга вокала', 1500),
 * ('srv-5', 'Саунд-дизайн / FX', 3000),
 * ('srv-6', 'Продюсирование аранжировки', 10000)
 * ON CONFLICT (id) DO NOTHING;
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// 1. НАЧАЛЬНЫЕ СТАНДАРТНЫЕ ДАННЫЕ (Используются при первом запуске)
// =============================================================================

// 6 стандартных колонок в стиле YouGile для звукорежиссера
const DEFAULT_COLUMNS = [
    { id: 'col-1', title: 'Заявка', sort_order: 1 },
    { id: 'col-2', title: 'Ожидание исходников/Аванс', sort_order: 2 },
    { id: 'col-3', title: 'Сведение V1', sort_order: 3 },
    { id: 'col-4', title: 'Правки', sort_order: 4 },
    { id: 'col-5', title: 'Мастеринг', sort_order: 5 },
    { id: 'col-6', title: 'Готово / Оплачено', sort_order: 6 }
];

// Стандартный прайс-лист услуг студии звукозаписи
const DEFAULT_SERVICES = [
    { id: 'srv-1', name: 'Сведение (мультитрек)', price: 7000 },
    { id: 'srv-2', name: 'Мастеринг (стерео)', price: 2500 },
    { id: 'srv-3', name: 'Тюнинг вокала (ручной)', price: 2000 },
    { id: 'srv-4', name: 'Коррекция тайминга вокала', price: 1500 },
    { id: 'srv-5', name: 'Саунд-дизайн / FX', price: 3000 },
    { id: 'srv-6', name: 'Продюсирование аранжировки', price: 10000 },
    { id: 'srv-7', name: 'Правки (дополнительный круг)', price: 1000 }
];

// Демонстрационные проекты для быстрого ознакомления с реалистичными датами добавления
const INITIAL_DEMO_PROJECTS = [
    {
        id: 'proj-1',
        track_title: 'Neon Nights (Single)',
        client_name: 'Алексей Мельников',
        client_link: '@melnikov_music',
        selected_services: ['srv-1', 'srv-3', 'srv-2'],
        total_price: 11500,
        deposit: 5000,
        remaining_balance: 6500,
        deadline_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // через 3 дня
        column_id: 'col-3',
        notes: 'Референс: The Weeknd - Blinding Lights. Вокал сделать теплым, на бридже добавить реверб-хвост.',
        created_at: '2026-09-02T10:15:00.000Z'
    },
    {
        id: 'proj-2',
        track_title: 'Дорога домой (Acoustic EP)',
        client_name: 'Группа "Северный Ветер"',
        client_link: 'https://vk.com/severny_veter',
        selected_services: [
            { id: 'srv-1', quantity: 1 },
            { id: 'srv-2', quantity: 1 },
            { id: 'srv-7', quantity: 3 }
        ],
        total_price: 12500,
        deposit: 12500,
        remaining_balance: 0,
        deadline_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // вчера (просрочен)
        column_id: 'col-4',
        notes: 'Клиент заказал 3 круга правок: сделать акустическую гитару чуть шире по панораме и тише бэк-вокал.',
        created_at: '2026-09-01T14:40:00.000Z'
    },
    {
        id: 'proj-3',
        track_title: 'Cyberpunk 2099 (OST)',
        client_name: 'Илья Synthwave',
        client_link: '@ilyasynth',
        selected_services: ['srv-1', 'srv-5', 'srv-2'],
        total_price: 12500,
        deposit: 6000,
        remaining_balance: 6500,
        deadline_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // через неделю
        column_id: 'col-2',
        notes: 'Ждем финальную партию бас-синтезатора в 24bit 48kHz.',
        created_at: '2026-08-18T16:20:00.000Z'
    },
    {
        id: 'proj-4',
        track_title: 'Летний закат (Pop-Trap)',
        client_name: 'Lana Ray',
        client_link: '@lanaray_singer',
        selected_services: ['srv-1', 'srv-3', 'srv-4', 'srv-2'],
        total_price: 13000,
        deposit: 13000,
        remaining_balance: 0,
        deadline_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        column_id: 'col-6',
        notes: 'Работа принята и полностью оплачена. Финальный WAV и MP3 выгружены на Яндекс.Диск.',
        created_at: '2026-08-05T11:30:00.000Z'
    },
    {
        id: 'proj-5',
        track_title: 'Neon Horizon (Synthwave EP)',
        client_name: 'DJ Pulse',
        client_link: '@djpulse_music',
        selected_services: [
            { id: 'srv-1', quantity: 1 },
            { id: 'srv-5', quantity: 2 },
            { id: 'srv-2', quantity: 1 }
        ],
        total_price: 15500,
        deposit: 8000,
        remaining_balance: 7500,
        deadline_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        column_id: 'col-3',
        notes: 'Аналоговый синтезатор и компрессия на барабанах в стиле 80-х.',
        created_at: '2026-09-03T09:10:00.000Z'
    },
    {
        id: 'proj-6',
        track_title: 'Не молчи (Indie Rock)',
        client_name: 'Группа The Echoes',
        client_link: 'https://vk.com/the_echoes_band',
        selected_services: [
            { id: 'srv-1', quantity: 1 },
            { id: 'srv-3', quantity: 1 },
            { id: 'srv-7', quantity: 2 }
        ],
        total_price: 11000,
        deposit: 11000,
        remaining_balance: 0,
        deadline_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        column_id: 'col-3',
        notes: 'Сведение живых барабанов и гитарного овердрайва.',
        created_at: '2026-07-22T15:00:00.000Z'
    }
];

// =============================================================================
// 2. ГЛОБАЛЬНОЕ СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// =============================================================================
const appState = {
    supabaseClient: null,
    isSupabaseConnected: false,
    columns: [],
    services: [],
    projects: [],
    searchQuery: '',
    draggedProjectId: null,
    activeEditingProjectId: null,
    currentView: 'projects', // 'projects' (Канбан-доска) | 'statistics' (Полноценная вкладка статистики)
    statsMonthFilter: 'all',  // Фильтр по месяцу ('all' или 'YYYY-MM')
    statsStatusFilter: 'all'  // Фильтр по статусу ('all', 'active', 'completed')
};

// =============================================================================
// 3. ИНИЦИАЛИЗАЦИЯ И ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ
// =============================================================================

/**
 * Главная точка входа при загрузке страницы
 */
document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    await initDatabaseConnection();
    await loadInitialData();
    renderAll();
});

/**
 * Проверка ключей в config.js и инициализация Supabase
 */
async function initDatabaseConnection() {
    const isConfigured = typeof SUPABASE_URL === 'string' &&
                         typeof SUPABASE_ANON_KEY === 'string' &&
                         SUPABASE_URL.trim() !== '' &&
                         SUPABASE_ANON_KEY.trim() !== '' &&
                         !SUPABASE_URL.includes('ВСТАВЬТЕ_СЮДА') &&
                         !SUPABASE_ANON_KEY.includes('ВСТАВЬТЕ_СЮДА');

    if (isConfigured && window.supabase) {
        try {
            appState.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            // Пробный запрос для проверки соединения
            const { error } = await appState.supabaseClient.from('kanban_columns').select('count', { count: 'exact', head: true });
            
            if (error) {
                console.warn('Supabase ответил с ошибкой (возможно, еще не созданы таблицы):', error);
                setDbStatus('error', 'Supabase: таблицы не найдены (выполните SQL)');
                appState.isSupabaseConnected = false;
            } else {
                setDbStatus('connected', 'Supabase подключен (Облако)');
                appState.isSupabaseConnected = true;
                showToast('Успешное подключение к базе данных Supabase', 'success');
            }
        } catch (err) {
            console.error('Ошибка инициализации Supabase:', err);
            setDbStatus('local-mode', 'Демо-режим (Local Storage)');
            appState.isSupabaseConnected = false;
        }
    } else {
        // Ключи не введены — работаем в надежном локальном режиме
        setDbStatus('local-mode', 'Локальный режим (Local Storage)');
        appState.isSupabaseConnected = false;
    }
}

/**
 * Обновление визуального индикатора статуса базы данных
 */
function setDbStatus(statusType, labelText) {
    const dotElement = document.getElementById('dbStatusDot');
    const textElement = document.getElementById('dbStatusText');
    const modalDot = document.getElementById('modalStatusDot');
    const modalHeading = document.getElementById('modalStatusHeading');
    const modalDesc = document.getElementById('modalStatusDesc');

    // Сброс классов
    dotElement.className = 'status-dot';
    modalDot.className = 'status-dot-lg';

    if (statusType === 'connected') {
        dotElement.classList.add('connected');
        modalDot.classList.add('connected');
        textElement.textContent = labelText;
        modalHeading.textContent = 'Облачная база данных Supabase активна';
        modalDesc.textContent = 'Все изменения синхронизируются с вашим проектом в Supabase в реальном времени.';
    } else if (statusType === 'error') {
        dotElement.classList.add('error');
        modalDot.classList.add('error');
        textElement.textContent = labelText;
        modalHeading.textContent = 'Требуется создание таблиц в Supabase';
        modalDesc.textContent = 'Ключи указаны, но таблицы еще не созданы. Скопируйте SQL-скрипт ниже и запустите его в Supabase SQL Editor.';
    } else {
        dotElement.classList.add('local-mode');
        modalDot.classList.add('local-mode');
        textElement.textContent = labelText;
        modalHeading.textContent = 'Локальный режим (Local Storage)';
        modalDesc.textContent = 'Ключи Supabase не настроены в config.js. Все данные сохраняются в вашем браузере. Вы можете указать ключи в любой момент.';
    }
}

/**
 * Загрузка данных из Supabase или из LocalStorage
 */
async function loadInitialData() {
    if (appState.isSupabaseConnected && appState.supabaseClient) {
        try {
            // 1. Загрузка колонок
            const { data: columnsData, error: colErr } = await appState.supabaseClient
                .from('kanban_columns')
                .select('*')
                .order('sort_order', { ascending: true });
            
            // 2. Загрузка услуг
            const { data: servicesData, error: srvErr } = await appState.supabaseClient
                .from('services')
                .select('*')
                .order('price', { ascending: false });

            // 3. Загрузка проектов
            const { data: projectsData, error: prjErr } = await appState.supabaseClient
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (!colErr && columnsData && columnsData.length > 0) {
                appState.columns = columnsData;
            } else {
                appState.columns = [...DEFAULT_COLUMNS];
            }

            if (!srvErr && servicesData && servicesData.length > 0) {
                appState.services = servicesData;
            } else {
                appState.services = [...DEFAULT_SERVICES];
            }

            if (!prjErr && projectsData) {
                appState.projects = projectsData.map(p => ({
                    ...p,
                    selected_services: normalizeSelectedServices(p.selected_services)
                }));
            } else {
                appState.projects = [];
            }
            return;
        } catch (err) {
            console.error('Ошибка загрузки из Supabase, переключаемся на LocalStorage:', err);
        }
    }

    // Загрузка из LocalStorage
    const localColumns = localStorage.getItem('soundstudio_columns');
    const localServices = localStorage.getItem('soundstudio_services');
    const localProjects = localStorage.getItem('soundstudio_projects');

    appState.columns = localColumns ? JSON.parse(localColumns) : [...DEFAULT_COLUMNS];
    appState.services = localServices ? JSON.parse(localServices) : [...DEFAULT_SERVICES];
    appState.projects = localProjects ? JSON.parse(localProjects) : [...INITIAL_DEMO_PROJECTS];

    // Гарантируем наличие услуги правок в списке услуг, если ее еще нет
    if (!appState.services.some(s => s.id === 'srv-7' || s.name.toLowerCase().includes('правк'))) {
        appState.services.push({ id: 'srv-7', name: 'Правки (дополнительный круг)', price: 1000 });
    }

    // Нормализуем структуру услуг и дату создания у всех проектов
    appState.projects = appState.projects.map(p => {
        const demoMatch = INITIAL_DEMO_PROJECTS.find(d => d.id === p.id);
        const createdAt = p.created_at || (demoMatch ? demoMatch.created_at : new Date().toISOString());
        return {
            ...p,
            created_at: createdAt,
            selected_services: normalizeSelectedServices(p.selected_services)
        };
    });

    // Сохраняем начальные демо-данные, если хранилище было пустым
    saveDataLocally();
}

/**
 * Сохранение данных в LocalStorage
 */
function saveDataLocally() {
    localStorage.setItem('soundstudio_columns', JSON.stringify(appState.columns));
    localStorage.setItem('soundstudio_services', JSON.stringify(appState.services));
    localStorage.setItem('soundstudio_projects', JSON.stringify(appState.projects));
}

// =============================================================================
// 4. ОПЕРАЦИИ С БАЗОЙ ДАННЫХ (ПРОЕКТЫ, КОЛОНКИ, УСЛУГИ)
// =============================================================================

/**
 * Нормализация списка выбранных услуг проекта (поддержка формата ['srv-1'] и формата [{id: 'srv-1', quantity: 3}])
 */
function normalizeSelectedServices(servicesList) {
    if (!servicesList || !Array.isArray(servicesList)) return [];
    return servicesList.map(item => {
        if (typeof item === 'string') {
            return { id: item, quantity: 1 };
        }
        if (item && typeof item === 'object' && item.id) {
            return {
                id: String(item.id),
                quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
            };
        }
        return null;
    }).filter(Boolean);
}

/**
 * Добавление или обновление проекта
 */
async function saveProject(projectData) {
    const isEdit = Boolean(projectData.id);
    const projectId = isEdit ? projectData.id : 'proj-' + Date.now();

    const newProject = {
        id: projectId,
        track_title: projectData.track_title,
        client_name: projectData.client_name,
        client_link: projectData.client_link || '',
        selected_services: normalizeSelectedServices(projectData.selected_services),
        total_price: Number(projectData.total_price) || 0,
        deposit: Number(projectData.deposit) || 0,
        remaining_balance: Number(projectData.remaining_balance) || 0,
        deadline_date: projectData.deadline_date || null,
        column_id: projectData.column_id,
        notes: projectData.notes || '',
        created_at: projectData.created_at || (isEdit ? (appState.projects.find(p => p.id === projectId)?.created_at || new Date().toISOString()) : new Date().toISOString())
    };

    if (isEdit) {
        const index = appState.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            appState.projects[index] = newProject;
        }
    } else {
        // Новая задача отправляется ВНИЗ (в конец списка задач)
        appState.projects.push(newProject);
    }

    saveDataLocally();
    renderAll();

    // Для новой задачи плавно прокручиваем список треков в колонке вниз
    if (!isEdit && newProject.column_id) {
        setTimeout(() => {
            const colEl = document.getElementById(`col-container-${newProject.column_id}`);
            if (colEl) {
                const container = colEl.querySelector('.column-cards-container');
                if (container) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }
            }
        }, 60);
    }

    // Синхронизация с Supabase
    if (appState.isSupabaseConnected && appState.supabaseClient) {
        try {
            const { error } = await appState.supabaseClient
                .from('projects')
                .upsert(newProject);
            if (error) throw error;
        } catch (err) {
            console.error('Ошибка сохранения проекта в Supabase:', err);
            showToast('Сохранено локально (ошибка связи с облаком)', 'warning');
        }
    }

    showToast(isEdit ? 'Проект успешно обновлен' : 'Новый проект создан', 'success');
}

/**
 * Кастомное диалоговое окно подтверждения (без window.confirm, корректно работает в iframe)
 */
function showConfirmDialog({ title, message, confirmText = 'Удалить', danger = true }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        if (!modal) {
            resolve(true);
            return;
        }

        const titleEl = document.getElementById('confirmModalTitle');
        const msgEl = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalActionBtn');
        const cancelBtn = document.getElementById('confirmModalCancelBtn');
        const closeBtn = document.getElementById('closeConfirmModalBtn');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;

        if (confirmBtn) {
            confirmBtn.textContent = confirmText;
            confirmBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
        }

        const cleanup = () => {
            modal.classList.add('hidden');
            if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
            if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
            if (closeBtn) closeBtn.removeEventListener('click', onCancel);
        };

        const onConfirm = () => {
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        if (confirmBtn) confirmBtn.addEventListener('click', onConfirm);
        if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
        if (closeBtn) closeBtn.addEventListener('click', onCancel);

        modal.classList.remove('hidden');
    });
}

/**
 * Удаление проекта
 */
async function deleteProject(projectId) {
    const projectToDelete = appState.projects.find(p => p.id === projectId);
    const trackName = projectToDelete ? projectToDelete.track_title : 'Проект';

    const confirmed = await showConfirmDialog({
        title: 'Удалить проект?',
        message: `Вы действительно хотите удалить проект «${trackName}»? Это действие нельзя будет отменить.`,
        confirmText: 'Да, удалить',
        danger: true
    });

    if (!confirmed) {
        return false;
    }

    appState.projects = appState.projects.filter(p => p.id !== projectId);
    if (appState.activeEditingProjectId === projectId) {
        closeProjectModal();
    }
    saveDataLocally();
    renderAll();

    if (appState.isSupabaseConnected && appState.supabaseClient) {
        try {
            await appState.supabaseClient
                .from('projects')
                .delete()
                .eq('id', projectId);
        } catch (err) {
            console.error('Ошибка удаления проекта в Supabase:', err);
        }
    }

    showToast(`Проект «${trackName}» удален`, 'info');
    return true;
}

/**
 * Быстрое перемещение проекта в другую колонку (из карточки или Drag & Drop)
 */
async function moveProjectToColumn(projectId, newColumnId) {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project || project.column_id === newColumnId) return;

    project.column_id = newColumnId;
    saveDataLocally();
    renderAll();

    // Если проект сейчас открыт в правой панели редактирования, синхронизируем селект колонки
    if (appState.activeEditingProjectId === projectId) {
        populateColumnSelect(newColumnId);
    }

    if (appState.isSupabaseConnected && appState.supabaseClient) {
        try {
            await appState.supabaseClient
                .from('projects')
                .update({ column_id: newColumnId })
                .eq('id', projectId);
        } catch (err) {
            console.error('Ошибка перемещения проекта в Supabase:', err);
        }
    }
}

/**
 * Добавление новой колонки
 */
async function saveColumn(title, columnId = null) {
    if (!title || !title.trim()) return;

    const cleanTitle = title.trim();

    if (columnId) {
        // Редактирование существующей
        const column = appState.columns.find(c => c.id === columnId);
        if (column) {
            column.title = cleanTitle;
        }
    } else {
        // Создание новой
        const newColId = 'col-' + Date.now();
        const newSortOrder = appState.columns.length + 1;
        const newColumn = {
            id: newColId,
            title: cleanTitle,
            sort_order: newSortOrder
        };
        appState.columns.push(newColumn);
    }

    saveDataLocally();
    renderAll();

    if (appState.isSupabaseConnected && appState.supabaseClient) {
        try {
            if (columnId) {
                await appState.supabaseClient
                    .from('kanban_columns')
                    .update({ title: cleanTitle })
                    .eq('id', columnId);
            } else {
                await appState.supabaseClient
                    .from('kanban_columns')
                    .insert({ id: 'col-' + Date.now(), title: cleanTitle, sort_order: appState.columns.length });
            }
        } catch (err) {
            console.error('Ошибка сохранения колонки в Supabase:', err);
        }
    }

    showToast('Колонка сохранена', 'success');
}

/**
 * Удаление колонки (только если в ней нет проектов)
 */
async function deleteColumn(columnId) {
    const projectsInCol = appState.projects.filter(p => p.id === columnId || p.column_id === columnId);
    if (projectsInCol.length > 0) {
        showToast(`Нельзя удалить колонку, в которой находятся проекты (${projectsInCol.length} шт.). Сначала переместите их в другие колонки.`, 'warning');
        return false;
    }

    const column = appState.columns.find(c => c.id === columnId);
    const columnTitle = column ? column.title : 'Колонка';

    const confirmed = await showConfirmDialog({
        title: 'Удалить колонку?',
        message: `Вы действительно хотите удалить колонку «${columnTitle}» с доски?`,
        confirmText: 'Да, удалить',
        danger: true
    });

    if (!confirmed) {
        return false;
    }

    appState.columns = appState.columns.filter(c => c.id !== columnId);
    saveDataLocally();
    renderAll();

    if (appState.isSupabaseConnected && appState.supabaseClient) {
        try {
            await appState.supabaseClient
                .from('kanban_columns')
                .delete()
                .eq('id', columnId);
        } catch (err) {
            console.error('Ошибка удаления колонки в Supabase:', err);
        }
    }

    showToast(`Колонка «${columnTitle}» удалена`, 'info');
    return true;
}

/**
 * Добавление новой услуги в прайс-лист
 */
async function addService(name, price) {
    if (!name || !name.trim()) return;

    const newService = {
        id: 'srv-' + Date.now(),
        name: name.trim(),
        price: Math.max(0, Number(price) || 0)
    };

    appState.services.push(newService);
    saveDataLocally();
    renderPriceTable();
    renderServicesCheckboxes();

    if (appState.isSupabaseConnected && appState.supabaseClient) {
        try {
            await appState.supabaseClient.from('services').insert(newService);
        } catch (err) {
            console.error('Ошибка сохранения услуги в Supabase:', err);
        }
    }

    showToast(`Услуга "${newService.name}" добавлена в прайс`, 'success');
}

/**
 * Удаление услуги из прайс-листа
 */
async function deleteService(serviceId) {
    const service = appState.services.find(s => s.id === serviceId);
    const serviceName = service ? service.name : 'услугу';

    const confirmed = await showConfirmDialog({
        title: 'Удалить услугу из прайса?',
        message: `Удалить услугу «${serviceName}»? Она перестанет отображаться при создании новых проектов.`,
        confirmText: 'Да, удалить',
        danger: true
    });

    if (!confirmed) {
        return false;
    }

    appState.services = appState.services.filter(s => s.id !== serviceId);
    saveDataLocally();
    renderPriceTable();
    renderServicesCheckboxes();

    if (appState.isSupabaseConnected && appState.supabaseClient) {
        try {
            await appState.supabaseClient.from('services').delete().eq('id', serviceId);
        } catch (err) {
            console.error('Ошибка удаления услуги в Supabase:', err);
        }
    }

    showToast(`Услуга «${serviceName}» удалена из прайса`, 'info');
    return true;
}

// =============================================================================
// 5. РЕНДЕРИНГ ИНТЕРФЕЙСА (ДОСКА, КАРТОЧКИ, СТАТИСТИКА, ПРАЙС)
// =============================================================================

/**
 * Полный рендеринг всех компонентов страницы
 */
function renderAll() {
    renderFinancialStats();
    if (appState.currentView === 'statistics') {
        renderStatisticsView();
    } else {
        renderKanbanBoard();
    }
}

/**
 * Переключение между вкладкой «Все проекты» (Канбан-доска) и полноценной вкладкой «Статистика»
 */
function switchView(viewName) {
    appState.currentView = viewName;

    const navProjectsBtn = document.getElementById('navAllProjectsBtn');
    const navStatsBtn = document.getElementById('navStatsBtn');
    const kanbanWrapper = document.getElementById('kanbanWrapper');
    const statsView = document.getElementById('statisticsView');
    const columnsNav = document.getElementById('columnsNav');

    if (viewName === 'statistics') {
        if (navProjectsBtn) navProjectsBtn.classList.remove('active');
        if (navStatsBtn) navStatsBtn.classList.add('active');
        if (kanbanWrapper) kanbanWrapper.classList.add('hidden');
        if (statsView) statsView.classList.remove('hidden');
        if (columnsNav) columnsNav.style.display = 'none';
        renderStatisticsView();
    } else {
        if (navProjectsBtn) navProjectsBtn.classList.add('active');
        if (navStatsBtn) navStatsBtn.classList.remove('active');
        if (kanbanWrapper) kanbanWrapper.classList.remove('hidden');
        if (statsView) statsView.classList.add('hidden');
        if (columnsNav) columnsNav.style.display = '';
        renderKanbanBoard();
    }
    renderFinancialStats();
}
window.switchView = switchView;

/**
 * Установка фильтра по месяцу в статистике
 */
window.setStatsMonthFilter = function(monthKey) {
    appState.statsMonthFilter = monthKey;
    renderStatisticsView();
};

/**
 * Экспорт сводного финансового отчета в CSV (для Excel)
 */
function exportStatsToCsv() {
    if (!appState.projects || appState.projects.length === 0) {
        showToast('Нет данных для экспорта', 'warning');
        return;
    }

    let csv = '\uFEFF'; // BOM для корректного открытия кириллицы в Excel
    csv += 'ID задачи;Дата добавления;Название трека;Клиент;Контакт;Статус (Колонка);Дедлайн;Выручка (₽);Предоплата (₽);Остаток (₽);Услуги\n';

    appState.projects.forEach(p => {
        const col = appState.columns.find(c => c.id === p.column_id);
        const colTitle = col ? col.title : '';
        const normServices = normalizeSelectedServices(p.selected_services);
        const servicesStr = normServices.map(s => {
            const sObj = appState.services.find(item => item.id === s.id);
            return `${sObj ? sObj.name : s.id} (${s.quantity || 1} шт.)`;
        }).join(', ');

        const d = p.created_at ? new Date(p.created_at) : new Date();
        const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('ru-RU') : '';

        const row = [
            `"${p.id}"`,
            `"${dateStr}"`,
            `"${(p.track_title || '').replace(/"/g, '""')}"`,
            `"${(p.client_name || '').replace(/"/g, '""')}"`,
            `"${(p.client_link || '').replace(/"/g, '""')}"`,
            `"${colTitle.replace(/"/g, '""')}"`,
            `"${p.deadline_date || 'Без дедлайна'}"`,
            Number(p.total_price) || 0,
            Number(p.deposit) || 0,
            Number(p.remaining_balance) || 0,
            `"${servicesStr.replace(/"/g, '""')}"`
        ];
        csv += row.join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `soundstudio-finance-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Финансовый отчет успешно экспортирован в CSV!', 'success');
}

/**
 * Отрисовка полноценной вкладки финансовой статистики и аналитики
 */
function renderStatisticsView() {
    const statsContainer = document.getElementById('statisticsView');
    if (!statsContainer) return;

    const MONTH_NAMES_RU = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    const monthlyMap = new Map();
    let grandTotalRevenue = 0;
    let grandTotalDeposit = 0;
    let grandTotalDebt = 0;

    appState.projects.forEach(project => {
        const rawDate = project.created_at ? new Date(project.created_at) : new Date();
        const dateObj = isNaN(rawDate.getTime()) ? new Date() : rawDate;
        const year = dateObj.getFullYear();
        const monthIndex = dateObj.getMonth();
        const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        const monthLabel = `${MONTH_NAMES_RU[monthIndex]} ${year}`;

        if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
                key: monthKey,
                year,
                monthIndex,
                label: monthLabel,
                sortTimestamp: new Date(year, monthIndex, 1).getTime(),
                projects: [],
                revenue: 0,
                deposit: 0,
                debt: 0,
                servicesMap: new Map()
            });
        }

        const m = monthlyMap.get(monthKey);
        m.projects.push(project);

        const rev = Number(project.total_price) || 0;
        const dep = Number(project.deposit) || 0;
        const debt = Number(project.remaining_balance) || 0;

        m.revenue += rev;
        m.deposit += dep;
        m.debt += debt;

        grandTotalRevenue += rev;
        grandTotalDeposit += dep;
        grandTotalDebt += debt;

        const normServices = normalizeSelectedServices(project.selected_services);
        normServices.forEach(srvItem => {
            const srv = appState.services.find(s => s.id === srvItem.id);
            const srvName = srv ? srv.name : 'Услуга';
            const srvPrice = srv ? Number(srv.price) || 0 : 0;
            const qty = srvItem.quantity || 1;
            const sum = srvPrice * qty;

            if (!m.servicesMap.has(srvItem.id)) {
                m.servicesMap.set(srvItem.id, {
                    id: srvItem.id,
                    name: srvName,
                    count: 0,
                    revenue: 0
                });
            }
            const sStats = m.servicesMap.get(srvItem.id);
            sStats.count += qty;
            sStats.revenue += sum;
        });
    });

    const sortedMonths = Array.from(monthlyMap.values()).sort((a, b) => b.sortTimestamp - a.sortTimestamp);

    const currentMonthFilter = appState.statsMonthFilter || 'all';
    const currentStatusFilter = appState.statsStatusFilter || 'all';

    let filteredProjects = [...appState.projects];
    if (currentMonthFilter !== 'all') {
        filteredProjects = filteredProjects.filter(p => {
            const d = p.created_at ? new Date(p.created_at) : new Date();
            const valid = isNaN(d.getTime()) ? new Date() : d;
            const key = `${valid.getFullYear()}-${String(valid.getMonth() + 1).padStart(2, '0')}`;
            return key === currentMonthFilter;
        });
    }

    if (currentStatusFilter === 'completed') {
        filteredProjects = filteredProjects.filter(p => p.column_id === 'col-6' || (p.remaining_balance === 0 && p.total_price > 0));
    } else if (currentStatusFilter === 'active') {
        filteredProjects = filteredProjects.filter(p => p.column_id !== 'col-6');
    }

    let filterRevenue = 0;
    let filterDeposit = 0;
    let filterDebt = 0;
    filteredProjects.forEach(p => {
        filterRevenue += Number(p.total_price) || 0;
        filterDeposit += Number(p.deposit) || 0;
        filterDebt += Number(p.remaining_balance) || 0;
    });

    const filterCount = filteredProjects.length;
    const filterAverage = filterCount > 0 ? Math.round(filterRevenue / filterCount) : 0;
    const paymentRate = filterRevenue > 0 ? Math.round((filterDeposit / filterRevenue) * 100) : 0;

    const globalServicesMap = new Map();
    filteredProjects.forEach(p => {
        const normServices = normalizeSelectedServices(p.selected_services);
        normServices.forEach(srvItem => {
            const srv = appState.services.find(s => s.id === srvItem.id);
            const srvName = srv ? srv.name : 'Услуга';
            const srvPrice = srv ? Number(srv.price) || 0 : 0;
            const qty = srvItem.quantity || 1;
            const sum = srvPrice * qty;

            if (!globalServicesMap.has(srvItem.id)) {
                globalServicesMap.set(srvItem.id, {
                    id: srvItem.id,
                    name: srvName,
                    count: 0,
                    revenue: 0
                });
            }
            const sStats = globalServicesMap.get(srvItem.id);
            sStats.count += qty;
            sStats.revenue += sum;
        });
    });
    const sortedServices = Array.from(globalServicesMap.values()).sort((a, b) => b.revenue - a.revenue);

    const activeMonthObj = sortedMonths.find(m => m.key === currentMonthFilter);
    const periodName = currentMonthFilter === 'all' ? 'За весь период работы' : `За ${activeMonthObj ? activeMonthObj.label : currentMonthFilter}`;

    statsContainer.innerHTML = `
        <div class="stats-wrapper">
            <!-- Верхняя панель фильтрации статистики -->
            <div class="stats-header-bar">
                <div class="stats-title-block">
                    <h2 class="stats-main-title">
                        <span class="stats-title-icon">📊</span>
                        Финансовая статистика студии
                    </h2>
                    <p class="stats-subtitle">Помесячный расчет выручки, авансов и остатков на основе даты добавления задач</p>
                </div>

                <div class="stats-filters-group">
                    <div class="stats-filter-item">
                        <label for="statsMonthSelect" class="stats-filter-label">Месяц:</label>
                        <select id="statsMonthSelect" class="form-control stats-select">
                            <option value="all" ${currentMonthFilter === 'all' ? 'selected' : ''}>📅 Все месяцы (Суммарно)</option>
                            ${sortedMonths.map(m => `
                                <option value="${m.key}" ${currentMonthFilter === m.key ? 'selected' : ''}>
                                    ${m.label} (${m.projects.length} зак. — ${formatCurrency(m.revenue)})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="stats-filter-item">
                        <label for="statsStatusSelect" class="stats-filter-label">Статус:</label>
                        <select id="statsStatusSelect" class="form-control stats-select" style="min-width: 170px;">
                            <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>Все проекты</option>
                            <option value="active" ${currentStatusFilter === 'active' ? 'selected' : ''}>В работе</option>
                            <option value="completed" ${currentStatusFilter === 'completed' ? 'selected' : ''}>Сданные / Оплаченные</option>
                        </select>
                    </div>

                    <div class="stats-filter-actions">
                        <button type="button" class="btn btn-secondary btn-sm" id="exportStatsCsvBtn" title="Скачать таблицу проектов в формате CSV для Excel">
                            📥 Экспорт в CSV
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" id="statsNewProjectBtn">
                            ✨ Новый проект
                        </button>
                    </div>
                </div>
            </div>

            <!-- 5 Главных финансовых KPI карточек -->
            <div class="stats-kpi-grid">
                <div class="stats-kpi-card highlight-revenue">
                    <div class="stats-kpi-header">
                        <span class="stats-kpi-label">Выручка (Оборот)</span>
                        <span class="stats-kpi-icon">💰</span>
                    </div>
                    <div class="stats-kpi-value text-accent">${formatCurrency(filterRevenue)}</div>
                    <div class="stats-kpi-sub">${periodName}</div>
                </div>

                <div class="stats-kpi-card highlight-deposit">
                    <div class="stats-kpi-header">
                        <span class="stats-kpi-label">Получено предоплат</span>
                        <span class="stats-kpi-icon">✅</span>
                    </div>
                    <div class="stats-kpi-value text-success">${formatCurrency(filterDeposit)}</div>
                    <div class="stats-kpi-sub">Внесено авансов (${paymentRate}% от общей суммы)</div>
                </div>

                <div class="stats-kpi-card highlight-debt">
                    <div class="stats-kpi-header">
                        <span class="stats-kpi-label">Остаток долгов</span>
                        <span class="stats-kpi-icon">⏳</span>
                    </div>
                    <div class="stats-kpi-value ${filterDebt > 0 ? 'text-warning' : 'text-muted'}">${formatCurrency(filterDebt)}</div>
                    <div class="stats-kpi-sub">К доплате при сдаче треков</div>
                </div>

                <div class="stats-kpi-card">
                    <div class="stats-kpi-header">
                        <span class="stats-kpi-label">Количество заказов</span>
                        <span class="stats-kpi-icon">📁</span>
                    </div>
                    <div class="stats-kpi-value">${filterCount} <span class="stats-unit">треков</span></div>
                    <div class="stats-kpi-sub">Добавлено задач за период</div>
                </div>

                <div class="stats-kpi-card">
                    <div class="stats-kpi-header">
                        <span class="stats-kpi-label">Средний чек</span>
                        <span class="stats-kpi-icon">🎯</span>
                    </div>
                    <div class="stats-kpi-value">${formatCurrency(filterAverage)}</div>
                    <div class="stats-kpi-sub">Средняя стоимость одного проекта</div>
                </div>
            </div>

            <!-- Раздел: Сводная помесячная таблица -->
            <div class="stats-section-block">
                <div class="stats-section-header">
                    <div>
                        <h3 class="stats-section-title">📅 Расчет сумм по месяцам добавления</h3>
                        <p class="stats-section-desc">Суммирование выручки, авансов и долгов по дате создания каждой задачи</p>
                    </div>
                </div>

                ${sortedMonths.length === 0 ? `
                    <div class="stats-empty-state">
                        <p>Пока нет добавленных проектов для расчета статистики.</p>
                    </div>
                ` : `
                    <div class="stats-table-wrapper">
                        <table class="stats-month-table">
                            <thead>
                                <tr>
                                    <th>Месяц добавления</th>
                                    <th class="text-center">Заказов</th>
                                    <th class="text-right">Выручка (₽)</th>
                                    <th class="text-right">Оплачено (₽)</th>
                                    <th class="text-right">Остаток долга (₽)</th>
                                    <th>Статус оплат</th>
                                    <th class="text-center">Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedMonths.map(m => {
                                    const mRate = m.revenue > 0 ? Math.round((m.deposit / m.revenue) * 100) : 0;
                                    const isCurrentFilter = currentMonthFilter === m.key;
                                    return `
                                        <tr class="${isCurrentFilter ? 'row-selected' : ''}">
                                            <td>
                                                <div class="month-title-cell">
                                                    <span class="month-bullet"></span>
                                                    <strong>${m.label}</strong>
                                                </div>
                                            </td>
                                            <td class="text-center">
                                                <span class="badge-count">${m.projects.length}</span>
                                            </td>
                                            <td class="text-right font-mono font-bold text-accent">
                                                ${formatCurrency(m.revenue)}
                                            </td>
                                            <td class="text-right font-mono text-success">
                                                ${formatCurrency(m.deposit)}
                                            </td>
                                            <td class="text-right font-mono ${m.debt > 0 ? 'text-warning font-bold' : 'text-muted'}">
                                                ${formatCurrency(m.debt)}
                                            </td>
                                            <td>
                                                <div class="progress-cell">
                                                    <div class="progress-bar-bg">
                                                        <div class="progress-bar-fill" style="width: ${Math.min(100, mRate)}%;"></div>
                                                    </div>
                                                    <span class="progress-label">${mRate}%</span>
                                                </div>
                                            </td>
                                            <td class="text-center">
                                                <button type="button" class="btn btn-secondary btn-sm" onclick="setStatsMonthFilter('${m.key}')">
                                                    ${isCurrentFilter ? '✓ Выбран' : 'Фильтровать'}
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td><strong>ИТОГО ЗА ВСЕ ВРЕМЯ:</strong></td>
                                    <td class="text-center"><strong>${appState.projects.length}</strong></td>
                                    <td class="text-right font-mono text-accent"><strong>${formatCurrency(grandTotalRevenue)}</strong></td>
                                    <td class="text-right font-mono text-success"><strong>${formatCurrency(grandTotalDeposit)}</strong></td>
                                    <td class="text-right font-mono text-warning"><strong>${formatCurrency(grandTotalDebt)}</strong></td>
                                    <td>
                                        <span class="progress-label font-bold">
                                            ${grandTotalRevenue > 0 ? Math.round((grandTotalDeposit / grandTotalRevenue) * 100) : 0}% оплачено
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <button type="button" class="btn btn-secondary btn-sm" onclick="setStatsMonthFilter('all')">
                                            Все месяцы
                                        </button>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `}
            </div>

            <!-- Два столбца: Аналитика по услугам + Список проектов -->
            <div class="stats-two-col-grid">
                <!-- Аналитика по услугам -->
                <div class="stats-section-block">
                    <div class="stats-section-header">
                        <div>
                            <h3 class="stats-section-title">🎛️ Выручка по услугам прайс-листа</h3>
                            <p class="stats-section-desc">Доход студии по отдельным услугам (${periodName})</p>
                        </div>
                    </div>

                    ${sortedServices.length === 0 ? `
                        <div class="stats-empty-state">
                            <p>В выбранных проектах нет отмеченных услуг.</p>
                        </div>
                    ` : `
                        <div class="stats-services-list">
                            ${sortedServices.map(srv => {
                                const srvShare = filterRevenue > 0 ? Math.round((srv.revenue / filterRevenue) * 100) : 0;
                                return `
                                    <div class="stats-service-row">
                                        <div class="stats-service-info">
                                            <span class="stats-service-name">${escapeHtml(srv.name)}</span>
                                            <span class="stats-service-count">${srv.count} шт.</span>
                                        </div>
                                        <div class="stats-service-money">
                                            <span class="stats-service-sum">${formatCurrency(srv.revenue)}</span>
                                            <span class="stats-service-share">${srvShare}% выручки</span>
                                        </div>
                                        <div class="stats-service-bar-bg">
                                            <div class="stats-service-bar-fill" style="width: ${Math.min(100, srvShare)}%;"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- Таблица проектов за период -->
                <div class="stats-section-block">
                    <div class="stats-section-header">
                        <div>
                            <h3 class="stats-section-title">📝 Задачи за выбранный период (${filteredProjects.length})</h3>
                            <p class="stats-section-desc">Кликните «✏️» для редактирования в боковой панели</p>
                        </div>
                    </div>

                    ${filteredProjects.length === 0 ? `
                        <div class="stats-empty-state">
                            <p>Нет задач, соответствующих выбранному фильтру.</p>
                        </div>
                    ` : `
                        <div class="stats-projects-scroll">
                            <table class="stats-projects-table">
                                <thead>
                                    <tr>
                                        <th>Дата доб.</th>
                                        <th>Трек и Артист</th>
                                        <th class="text-right">Сумма</th>
                                        <th class="text-right">Остаток</th>
                                        <th>Статус</th>
                                        <th class="text-center">Открыть</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredProjects.map(p => {
                                        const col = appState.columns.find(c => c.id === p.column_id);
                                        const colTitle = col ? col.title : 'Не указан';
                                        const d = p.created_at ? new Date(p.created_at) : new Date();
                                        const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
                                        return `
                                            <tr>
                                                <td class="font-mono text-muted text-xs">${dateStr}</td>
                                                <td>
                                                    <div class="stats-project-title">${escapeHtml(p.track_title)}</div>
                                                    <div class="stats-project-client">👤 ${escapeHtml(p.client_name)}</div>
                                                </td>
                                                <td class="text-right font-mono text-accent font-bold">${formatCurrency(p.total_price)}</td>
                                                <td class="text-right font-mono ${p.remaining_balance > 0 ? 'text-warning font-bold' : 'text-muted'}">
                                                    ${formatCurrency(p.remaining_balance)}
                                                </td>
                                                <td>
                                                    <span class="stats-col-badge">${escapeHtml(colTitle)}</span>
                                                </td>
                                                <td class="text-center">
                                                    <button type="button" class="btn btn-secondary btn-sm" onclick="openEditProjectModal('${p.id}')" title="Открыть в боковой панели">
                                                        ✏️
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>

            <div class="stats-bottom-actions">
                <button type="button" class="btn btn-secondary" onclick="switchView('projects')">
                    ← Вернуться к канбан-доске проектов
                </button>
            </div>
        </div>
    `;

    const monthSelect = document.getElementById('statsMonthSelect');
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            appState.statsMonthFilter = e.target.value;
            renderStatisticsView();
        });
    }

    const statusSelect = document.getElementById('statsStatusSelect');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            appState.statsStatusFilter = e.target.value;
            renderStatisticsView();
        });
    }

    const exportBtn = document.getElementById('exportStatsCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportStatsToCsv);
    }

    const newProjBtn = document.getElementById('statsNewProjectBtn');
    if (newProjBtn) {
        newProjBtn.addEventListener('click', () => openAddProjectModal());
    }
}

/**
 * Подсчет и отображение финансовой статистики
 */
function renderFinancialStats() {
    const totalProjectsCount = appState.projects.length;

    // Суммируем заработок, предоплаты и остатки
    let totalRevenue = 0;
    let totalDeposit = 0;
    let totalDebt = 0;

    appState.projects.forEach(project => {
        totalRevenue += Number(project.total_price) || 0;
        totalDeposit += Number(project.deposit) || 0;
        totalDebt += Number(project.remaining_balance) || 0;
    });

    document.getElementById('statTotalProjects').textContent = totalProjectsCount;
    document.getElementById('statTotalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('statTotalDeposit').textContent = formatCurrency(totalDeposit);
    document.getElementById('statTotalDebt').textContent = formatCurrency(totalDebt);
}

/**
 * Отрисовка канбан-доски с колонками и карточками задач
 */
function renderKanbanBoard() {
    const boardContainer = document.getElementById('kanbanBoard');
    boardContainer.innerHTML = '';

    if (!appState.columns || appState.columns.length === 0) {
        boardContainer.innerHTML = `
            <div class="empty-column-placeholder" style="margin: 40px auto; max-width: 400px;">
                <p>Нет доступных колонок на доске.</p>
                <button type="button" class="btn btn-primary" onclick="openAddColumnModal()" style="margin-top: 12px;">+ Создать колонку</button>
            </div>
        `;
        return;
    }

    // Фильтрация проектов по поисковому запросу
    const query = appState.searchQuery.toLowerCase().trim();
    const filteredProjects = appState.projects.filter(project => {
        if (!query) return true;
        const inTrack = (project.track_title || '').toLowerCase().includes(query);
        const inClient = (project.client_name || '').toLowerCase().includes(query);
        const inNotes = (project.notes || '').toLowerCase().includes(query);
        const inServices = normalizeSelectedServices(project.selected_services).some(item => {
            const srv = appState.services.find(s => s.id === item.id);
            return srv && srv.name.toLowerCase().includes(query);
        });
        return inTrack || inClient || inNotes || inServices;
    });

    // Рендерим каждую колонку
    appState.columns.forEach(column => {
        const columnProjects = filteredProjects.filter(p => p.column_id === column.id);

        const columnElement = document.createElement('div');
        columnElement.className = 'kanban-column';
        columnElement.id = `col-container-${column.id}`;
        columnElement.dataset.columnId = column.id;

        // Обработчики Drag & Drop для колонки
        columnElement.addEventListener('dragover', handleDragOver);
        columnElement.addEventListener('dragleave', handleDragLeave);
        columnElement.addEventListener('drop', handleDrop);

        // Цвета индикаторов для колонок
        const indicatorColor = getColumnIndicatorColor(column.id);

        columnElement.innerHTML = `
            <!-- Шапка колонки -->
            <div class="column-header">
                <div class="column-header-left">
                    <span class="column-color-indicator" style="background-color: ${indicatorColor};"></span>
                    <h3 class="column-title" title="${escapeHtml(column.title)}">${escapeHtml(column.title)}</h3>
                    <span class="column-count-badge">${columnProjects.length}</span>
                </div>
                <div class="column-actions">
                    <button type="button" class="btn-icon-action" onclick="openEditColumnModal('${column.id}')" title="Переименовать колонку">✏️</button>
                    <button type="button" class="btn-icon-action danger" onclick="deleteColumn('${column.id}')" title="Удалить колонку">🗑️</button>
                </div>
            </div>

            <!-- Контейнер для карточек проектов -->
            <div class="column-cards-container" id="cards-container-${column.id}">
                ${columnProjects.length === 0 
                    ? `<div class="empty-column-placeholder">Перетащите сюда трек или добавьте новый</div>`
                    : ''}
            </div>

            <!-- Подвал колонки с кнопкой добавления -->
            <div class="column-footer">
                <button type="button" class="btn-add-card-to-column" onclick="openAddProjectModalForColumn('${column.id}')">
                    <span>+ Добавить трек</span>
                </button>
            </div>
        `;

        const cardsContainer = columnElement.querySelector(`#cards-container-${column.id}`);

        // Рендерим карточки в колонку
        columnProjects.forEach(project => {
            const cardElement = createProjectCardElement(project);
            cardsContainer.appendChild(cardElement);
        });

        // Клик по шапке колонки плавно прокручивает список треков наверх
        const colHeader = columnElement.querySelector('.column-header');
        if (colHeader) {
            colHeader.title = 'Нажмите на заголовок, чтобы прокрутить список треков наверх';
            colHeader.addEventListener('click', (e) => {
                if (e.target.closest('.column-actions') || e.target.closest('button')) return;
                if (cardsContainer) {
                    cardsContainer.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        boardContainer.appendChild(columnElement);
    });

    // Обновляем панель быстрого переключения колонок
    renderColumnsNav();
}

/**
 * Отрисовка панели быстрого переключения колонок (для мобильных телефонов и компактных экранов)
 */
function renderColumnsNav() {
    const nav = document.getElementById('kanbanColumnsNav');
    if (!nav) return;

    if (!appState.columns || appState.columns.length === 0) {
        nav.innerHTML = '';
        return;
    }

    const query = (appState.searchQuery || '').toLowerCase().trim();
    const filteredProjects = appState.projects.filter(project => {
        if (!query) return true;
        const inTrack = (project.track_title || '').toLowerCase().includes(query);
        const inClient = (project.client_name || '').toLowerCase().includes(query);
        const inNotes = (project.notes || '').toLowerCase().includes(query);
        const inServices = normalizeSelectedServices(project.selected_services).some(item => {
            const srv = appState.services.find(s => s.id === item.id);
            return srv && srv.name.toLowerCase().includes(query);
        });
        return inTrack || inClient || inNotes || inServices;
    });

    nav.innerHTML = appState.columns.map(col => {
        const count = filteredProjects.filter(p => p.column_id === col.id).length;
        const color = getColumnIndicatorColor(col.id);
        return `
            <button type="button" class="nav-column-tab" data-nav-column-id="${col.id}" onclick="scrollToColumn('${col.id}')" title="Перейти к колонке «${escapeHtml(col.title)}»">
                <span class="nav-tab-indicator" style="background-color: ${color};"></span>
                <span class="nav-tab-title">${escapeHtml(col.title)}</span>
                <span class="nav-tab-badge">${count}</span>
            </button>
        `;
    }).join('');

    updateActiveColumnNavTab();
}

/**
 * Плавный переход к выбранной колонке (на телефоне и компьютере)
 */
function scrollToColumn(columnId) {
    const colEl = document.getElementById(`col-container-${columnId}`);
    const wrapper = document.getElementById('kanbanWrapper') || document.querySelector('.kanban-wrapper');
    if (colEl && wrapper) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const colRect = colEl.getBoundingClientRect();
        const targetScrollLeft = wrapper.scrollLeft + (colRect.left - wrapperRect.left) - (wrapper.clientWidth - colRect.width) / 2;
        wrapper.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth'
        });
        updateActiveColumnNavTab(columnId);
    }
}
window.scrollToColumn = scrollToColumn;

/**
 * Синхронизация активной вкладки в панели быстрого перехода
 */
function updateActiveColumnNavTab(explicitColumnId) {
    const nav = document.getElementById('kanbanColumnsNav');
    if (!nav) return;

    let activeId = explicitColumnId;

    if (!activeId) {
        const wrapper = document.getElementById('kanbanWrapper') || document.querySelector('.kanban-wrapper');
        if (wrapper && appState.columns && appState.columns.length > 0) {
            const wrapperRect = wrapper.getBoundingClientRect();
            const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
            let closestDist = Infinity;
            let closestColId = null;

            appState.columns.forEach(col => {
                const colEl = document.getElementById(`col-container-${col.id}`);
                if (colEl) {
                    const colRect = colEl.getBoundingClientRect();
                    const colCenter = colRect.left + colRect.width / 2;
                    const dist = Math.abs(colCenter - wrapperCenter);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestColId = col.id;
                    }
                }
            });

            if (closestColId) {
                activeId = closestColId;
            }
        }
    }

    nav.querySelectorAll('.nav-column-tab').forEach(tab => {
        if (tab.dataset.navColumnId === activeId) {
            tab.classList.add('active');
            tab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        } else {
            tab.classList.remove('active');
        }
    });
}

/**
 * Создание DOM-элемента карточки задачи (проекта)
 */
function createProjectCardElement(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.id = `card-${project.id}`;
    card.draggable = true;
    card.dataset.projectId = project.id;

    // Если задача прямо сейчас открыта в правой панели редактирования, подсвечиваем её
    if (appState.activeEditingProjectId === project.id) {
        card.classList.add('is-editing');
    }

    card.title = 'Нажмите для быстрого редактирования задачи в боковой панели';

    // Навешиваем слушатели Drag & Drop с защитой от ложного клика при перетаскивании
    let isDragging = false;
    card.addEventListener('dragstart', (e) => {
        isDragging = true;
        handleDragStart.call(card, e);
    });
    card.addEventListener('dragend', (e) => {
        handleDragEnd.call(card, e);
        setTimeout(() => { isDragging = false; }, 100);
    });

    // Клик по любой части карточки открывает её редактирование в правой панели
    card.addEventListener('click', (e) => {
        if (isDragging) return;
        // Если клик пришелся на интерактивные элементы (ссылка контакта, селект переноса, кнопка удаления)
        if (e.target.closest('a, select, button, input, textarea')) {
            return;
        }
        openEditProjectModal(project.id);
    });

    // Расчет статуса дедлайна
    const deadlineInfo = getDeadlineStatus(project.deadline_date);

    // Преобразование ссылки на аккаунт клиента в кликабельный формат
    const formattedClientLink = formatClientLink(project.client_link);

    // Получение названий выбранных услуг
    const serviceTagsHtml = getSelectedServiceTagsHtml(project.selected_services);

    // Статус оплаты (Полностью оплачено / Долг)
    const remainingBalance = Number(project.remaining_balance) || 0;
    const isPaidInFull = remainingBalance <= 0;
    const balanceBadgeHtml = isPaidInFull 
        ? `<span class="card-balance-badge paid">Оплачено ✅</span>`
        : `<span class="card-balance-badge debt">Долг: ${formatCurrency(remainingBalance)}</span>`;

    // Выпадающий список колонок для быстрого перемещения
    const columnOptionsHtml = appState.columns.map(col => {
        const isSelected = col.id === project.column_id ? 'selected' : '';
        return `<option value="${col.id}" ${isSelected}>➡️ ${escapeHtml(col.title)}</option>`;
    }).join('');

    card.innerHTML = `
        <!-- Заголовок трека и клиент -->
        <div class="card-header-row">
            <div class="card-title-group">
                <div class="card-track-title">${escapeHtml(project.track_title)}</div>
                <div class="card-client-row">
                    <span class="card-client-name">👤 ${escapeHtml(project.client_name)}</span>
                    ${formattedClientLink ? `
                        <a href="${formattedClientLink.url}" target="_blank" rel="noopener noreferrer" class="card-client-link" title="Открыть профиль клиента">
                            ${formattedClientLink.label}
                        </a>
                    ` : ''}
                </div>
            </div>
            <button type="button" class="card-dropdown-menu-btn" onclick="openEditProjectModal('${project.id}')" title="Редактировать проект">✏️</button>
        </div>

        <!-- Теги услуг -->
        <div class="card-services-tags">
            ${serviceTagsHtml}
        </div>

        <!-- Дедлайн с красной подсветкой при просрочке -->
        ${deadlineInfo ? `
            <div class="card-deadline-badge ${deadlineInfo.statusClass}" title="${deadlineInfo.tooltip}">
                <span>📅</span>
                <span>${deadlineInfo.formattedDate}</span>
                <span>(${deadlineInfo.label})</span>
            </div>
        ` : ''}

        <!-- Заметки/ТЗ (если есть) -->
        ${project.notes ? `
            <div class="card-notes-preview" title="${escapeHtml(project.notes)}">
                📝 ${escapeHtml(project.notes)}
            </div>
        ` : ''}

        <!-- Финансовая строка: Сумма заказа и остаток -->
        <div class="card-finance-footer">
            <div class="card-total-price">${formatCurrency(project.total_price)}</div>
            ${balanceBadgeHtml}
        </div>

        <!-- Быстрые действия внизу карточки -->
        <div class="card-quick-actions">
            <select class="card-move-select" onchange="moveProjectToColumn('${project.id}', this.value)" title="Переместить в другую колонку">
                ${columnOptionsHtml}
            </select>
            <div class="card-buttons-group">
                <button type="button" class="btn-icon-action danger" onclick="deleteProject('${project.id}')" title="Удалить карточку">🗑️</button>
            </div>
        </div>
    `;

    return card;
}

/**
 * Формирование HTML-тегов для выбранных услуг с поддержкой количества
 */
function getSelectedServiceTagsHtml(selectedServices) {
    const normalized = normalizeSelectedServices(selectedServices);
    if (!normalized || normalized.length === 0) {
        return `<span class="service-tag" style="background:#1e2433; color:#9ca3af;">Без услуг</span>`;
    }

    return normalized.map(item => {
        const service = appState.services.find(s => s.id === item.id);
        const name = service ? service.name : item.id;
        const qtySuffix = item.quantity > 1 ? `<span class="tag-qty-badge">×${item.quantity}</span>` : '';
        const titlePrice = service ? (item.quantity > 1 ? `${formatCurrency(service.price)} × ${item.quantity} = ${formatCurrency(service.price * item.quantity)}` : formatCurrency(service.price)) : '';
        const titleAttr = `${name}${titlePrice ? ` — ${titlePrice}` : ''}`;
        return `<span class="service-tag" title="${escapeHtml(titleAttr)}">${escapeHtml(name)}${qtySuffix}</span>`;
    }).join('');
}

/**
 * Проверка статуса дедлайна с подсветкой
 */
function getDeadlineStatus(deadlineString) {
    if (!deadlineString) return null;

    const deadline = new Date(deadlineString);
    if (isNaN(deadline.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDay = new Date(deadline);
    deadlineDay.setHours(0, 0, 0, 0);

    const diffTime = deadlineDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const day = String(deadline.getDate()).padStart(2, '0');
    const month = String(deadline.getMonth() + 1).padStart(2, '0');
    const year = deadline.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;

    if (diffDays < 0) {
        // Просрочен (Красная визуальная подсветка!)
        const daysPast = Math.abs(diffDays);
        return {
            formattedDate,
            label: `Просрочен на ${daysPast} дн.`,
            statusClass: 'overdue',
            tooltip: 'Внимание: дедлайн сдачи трека просрочен!'
        };
    } else if (diffDays === 0) {
        // Сегодня
        return {
            formattedDate,
            label: 'Сегодня!',
            statusClass: 'today',
            tooltip: 'Сдача трека назначена на сегодня'
        };
    } else if (diffDays === 1) {
        return {
            formattedDate,
            label: 'Завтра',
            statusClass: 'today',
            tooltip: 'Сдача трека завтра'
        };
    } else {
        return {
            formattedDate,
            label: `осталось ${diffDays} дн.`,
            statusClass: 'normal',
            tooltip: `До дедлайна ${diffDays} дней`
        };
    }
}

/**
 * Преобразование строкового контакта клиента в кликабельную ссылку
 */
function formatClientLink(rawLink) {
    if (!rawLink || typeof rawLink !== 'string') return null;

    const link = rawLink.trim();
    if (!link) return null;

    // Telegram handle: @username
    if (link.startsWith('@')) {
        const username = link.substring(1);
        return {
            url: `https://t.me/${username}`,
            label: link
        };
    }

    // Если это уже URL
    if (link.startsWith('http://') || link.startsWith('https://')) {
        let shortLabel = link.replace(/^https?:\/\/(www\.)?/, '');
        if (shortLabel.length > 18) {
            shortLabel = shortLabel.substring(0, 16) + '…';
        }
        return {
            url: link,
            label: shortLabel
        };
    }

    // VK: vk.com/...
    if (link.includes('vk.com')) {
        return {
            url: `https://${link}`,
            label: link
        };
    }

    // Instagram: instagram.com/...
    if (link.includes('instagram.com') || link.includes('t.me')) {
        return {
            url: `https://${link}`,
            label: link
        };
    }

    // Обычный текст / телефон
    return {
        url: `https://t.me/${link}`,
        label: link
    };
}

/**
 * Цветовые акценты для колонок канбан-доски
 */
function getColumnIndicatorColor(colId) {
    const colors = {
        'col-1': '#94a3b8', // Серый (Заявка)
        'col-2': '#f59e0b', // Янтарный (Ожидание аванса)
        'col-3': '#3b82f6', // Синий (Сведение V1)
        'col-4': '#ec4899', // Розовый (Правки)
        'col-5': '#8b5cf6', // Фиолетовый (Мастеринг)
        'col-6': '#10b981'  // Зеленый (Готово)
    };
    return colors[colId] || '#06b6d4';
}

// =============================================================================
// 6. КАЛЬКУЛЯТОР УСЛУГ В РЕАЛЬНОМ ВРЕМЕНИ
// =============================================================================

/**
 * Генерация списка чекбоксов услуг в модальном окне создания/редактирования проекта
 */
function renderServicesCheckboxes(preSelected = []) {
    const container = document.getElementById('servicesCheckboxGrid');
    container.innerHTML = '';

    if (!appState.services || appState.services.length === 0) {
        container.innerHTML = `
            <div style="grid-column: span 2; padding: 10px; color: var(--text-muted); font-size: 12px;">
                Прайс-лист пуст. Добавьте услуги в окне прайса.
            </div>
        `;
        recalculateProjectCosts();
        return;
    }

    const normalizedPreSelected = normalizeSelectedServices(preSelected);

    appState.services.forEach(service => {
        const found = normalizedPreSelected.find(item => item.id === service.id);
        const isChecked = Boolean(found);
        const quantity = found ? found.quantity : 1;

        const item = document.createElement('div');
        item.className = `service-checkbox-item ${isChecked ? 'checked' : ''}`;
        item.dataset.serviceId = service.id;

        item.innerHTML = `
            <div class="service-checkbox-main">
                <label class="service-checkbox-label" title="${escapeHtml(service.name)}">
                    <input type="checkbox" name="selected_services" value="${service.id}" data-price="${service.price}" ${isChecked ? 'checked' : ''}>
                    <span>${escapeHtml(service.name)}</span>
                </label>
                <span class="service-checkbox-price">${formatCurrency(service.price * quantity)}</span>
            </div>
            <div class="service-qty-controls ${isChecked ? '' : 'hidden'}">
                <div class="service-qty-left">
                    <span class="service-qty-label">Кол-во:</span>
                    <div class="service-qty-stepper">
                        <button type="button" class="btn-qty-step btn-minus" title="Уменьшить">−</button>
                        <input type="number" class="service-qty-input" min="1" max="99" value="${quantity}" data-service-id="${service.id}">
                        <button type="button" class="btn-qty-step btn-plus" title="Увеличить">+</button>
                    </div>
                </div>
            </div>
        `;

        const checkbox = item.querySelector('input[type="checkbox"]');
        const qtyControls = item.querySelector('.service-qty-controls');
        const qtyInput = item.querySelector('.service-qty-input');
        const btnMinus = item.querySelector('.btn-minus');
        const btnPlus = item.querySelector('.btn-plus');

        // Слушатель изменения чекбокса
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                item.classList.add('checked');
                qtyControls.classList.remove('hidden');
                if (parseInt(qtyInput.value, 10) < 1) qtyInput.value = '1';
            } else {
                item.classList.remove('checked');
                qtyControls.classList.add('hidden');
            }
            recalculateProjectCosts();
        });

        // Кнопка уменьшения
        btnMinus.addEventListener('click', (e) => {
            e.stopPropagation();
            let val = parseInt(qtyInput.value, 10) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
                recalculateProjectCosts();
            }
        });

        // Кнопка увеличения
        btnPlus.addEventListener('click', (e) => {
            e.stopPropagation();
            let val = parseInt(qtyInput.value, 10) || 1;
            if (val < 99) {
                qtyInput.value = val + 1;
                recalculateProjectCosts();
            }
        });

        // Ручной ввод количества
        qtyInput.addEventListener('input', () => {
            let val = parseInt(qtyInput.value, 10);
            if (!isNaN(val) && val > 99) {
                qtyInput.value = 99;
            }
            recalculateProjectCosts();
        });

        qtyInput.addEventListener('blur', () => {
            let val = parseInt(qtyInput.value, 10);
            if (isNaN(val) || val < 1) {
                qtyInput.value = 1;
            }
            recalculateProjectCosts();
        });

        // Предотвращение случайного клика по лейблу при взаимодействии с элементами управления
        qtyControls.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        container.appendChild(item);
    });

    recalculateProjectCosts();
}

/**
 * Пересчет стоимости проекта в реальном времени с учетом количества услуг
 * Вычисляет Итоговую сумму = Сумма (цена услуги * количество)
 * Вычисляет Остаток к оплате = Итоговая сумма - Предоплата
 */
function recalculateProjectCosts() {
    const items = document.querySelectorAll('#servicesCheckboxGrid .service-checkbox-item');
    let totalPrice = 0;
    let selectedPositionsCount = 0;
    let totalUnitsCount = 0;

    items.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            const unitPrice = Number(checkbox.dataset.price) || 0;
            const qtyInput = item.querySelector('.service-qty-input');
            const quantity = Math.max(1, parseInt(qtyInput ? qtyInput.value : 1, 10) || 1);
            const lineTotal = unitPrice * quantity;

            totalPrice += lineTotal;
            selectedPositionsCount++;
            totalUnitsCount += quantity;

            const priceDisplay = item.querySelector('.service-checkbox-price');
            if (priceDisplay) {
                priceDisplay.textContent = formatCurrency(lineTotal);
            }
        }
    });

    const depositInput = document.getElementById('depositInput');
    const deposit = Math.max(0, Number(depositInput.value) || 0);

    const remainingBalance = Math.max(0, totalPrice - deposit);

    // Обновление DOM
    const countText = totalUnitsCount > selectedPositionsCount
        ? `${totalUnitsCount} шт. (${selectedPositionsCount} поз.)`
        : `${selectedPositionsCount} шт.`;
    document.getElementById('calcSelectedCount').textContent = countText;
    document.getElementById('calcTotalPriceDisplay').textContent = formatCurrency(totalPrice);
    document.getElementById('calcRemainingDisplay').textContent = formatCurrency(remainingBalance);
}

// =============================================================================
// 7. МОДАЛЬНЫЕ ОКНА И ФОРМЫ (ОТКРЫТИЕ, ЗАКРЫТИЕ, ОТПРАВКА)
// =============================================================================

/**
 * Открытие панели добавления нового проекта
 */
function openAddProjectModal(defaultColumnId = null) {
    appState.activeEditingProjectId = null;
    document.querySelectorAll('.project-card').forEach(c => c.classList.remove('is-editing'));

    const modal = document.getElementById('projectModal');
    const titleEl = document.getElementById('projectModalTitle');
    if (titleEl) titleEl.textContent = 'Новый проект';
    const subtitleEl = document.getElementById('projectModalSubtitle');
    if (subtitleEl) subtitleEl.textContent = 'Заполните данные о клиенте, треке и отметьте услуги';

    document.getElementById('projectIdField').value = '';
    document.getElementById('trackTitleInput').value = '';
    document.getElementById('clientNameInput').value = '';
    document.getElementById('clientLinkInput').value = '';
    document.getElementById('deadlineDateInput').value = '';
    const createdAtInput = document.getElementById('createdAtInput');
    if (createdAtInput) {
        createdAtInput.value = new Date().toISOString().split('T')[0];
    }
    updateDeadlineButtonState();
    document.getElementById('depositInput').value = '0';
    document.getElementById('projectNotesInput').value = '';

    // Скрываем кнопку удаления в режиме создания
    const deleteModalBtn = document.getElementById('deleteProjectFromModalBtn');
    if (deleteModalBtn) {
        deleteModalBtn.classList.add('hidden');
        deleteModalBtn.onclick = null;
    }

    // Заполнение селекта колонок
    populateColumnSelect(defaultColumnId || (appState.columns[0] ? appState.columns[0].id : ''));

    // Рендер чекбоксов услуг
    renderServicesCheckboxes([]);

    modal.classList.remove('hidden');
    document.body.classList.add('drawer-open');
    document.getElementById('trackTitleInput').focus();
}

function openAddProjectModalForColumn(columnId) {
    openAddProjectModal(columnId);
}

/**
 * Открытие боковой панели редактирования существующего проекта
 */
function openEditProjectModal(projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) return;

    appState.activeEditingProjectId = projectId;

    // Подсветка активной карточки на доске
    document.querySelectorAll('.project-card').forEach(c => {
        if (c.dataset.projectId === projectId) {
            c.classList.add('is-editing');
        } else {
            c.classList.remove('is-editing');
        }
    });

    const modal = document.getElementById('projectModal');
    const titleEl = document.getElementById('projectModalTitle');
    if (titleEl) {
        titleEl.textContent = `Редактировать: ${project.track_title || 'Проект'}`;
    }
    const subtitleEl = document.getElementById('projectModalSubtitle');
    if (subtitleEl) {
        subtitleEl.textContent = `Клиент: ${project.client_name || 'Не указан'}`;
    }

    document.getElementById('projectIdField').value = project.id;
    document.getElementById('trackTitleInput').value = project.track_title || '';
    document.getElementById('clientNameInput').value = project.client_name || '';
    document.getElementById('clientLinkInput').value = project.client_link || '';
    document.getElementById('deadlineDateInput').value = project.deadline_date || '';
    const createdAtInput = document.getElementById('createdAtInput');
    if (createdAtInput) {
        createdAtInput.value = project.created_at ? project.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
    }
    updateDeadlineButtonState();
    document.getElementById('depositInput').value = project.deposit || 0;
    document.getElementById('projectNotesInput').value = project.notes || '';

    // Настраиваем кнопку удаления внутри панели
    const deleteModalBtn = document.getElementById('deleteProjectFromModalBtn');
    if (deleteModalBtn) {
        deleteModalBtn.classList.remove('hidden');
        deleteModalBtn.onclick = async () => {
            const wasDeleted = await deleteProject(project.id);
            if (wasDeleted) {
                closeProjectModal();
            }
        };
    }

    // Заполнение селекта колонок
    populateColumnSelect(project.column_id);

    // Рендер чекбоксов с отмеченными услугами
    renderServicesCheckboxes(project.selected_services || []);

    modal.classList.remove('hidden');
    document.body.classList.add('drawer-open');
}

/**
 * Заполнение выпадающего списка колонок в панели редактирования
 */
function populateColumnSelect(selectedColumnId) {
    const select = document.getElementById('columnSelectInput');
    select.innerHTML = '';

    appState.columns.forEach(col => {
        const option = document.createElement('option');
        option.value = col.id;
        option.textContent = col.title;
        if (col.id === selectedColumnId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Обработка отправки формы проекта
 */
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const projectId = document.getElementById('projectIdField').value;
    const trackTitle = document.getElementById('trackTitleInput').value.trim();
    const clientName = document.getElementById('clientNameInput').value.trim();
    const clientLink = document.getElementById('clientLinkInput').value.trim();
    const deadlineDate = document.getElementById('deadlineDateInput').value;
    const createdAtInputEl = document.getElementById('createdAtInput');
    const createdAtVal = createdAtInputEl && createdAtInputEl.value ? new Date(createdAtInputEl.value).toISOString() : null;
    const columnId = document.getElementById('columnSelectInput').value;
    const deposit = Math.max(0, Number(document.getElementById('depositInput').value) || 0);
    const notes = document.getElementById('projectNotesInput').value.trim();

    // Сбор отмеченных услуг с учетом количества
    const serviceItems = document.querySelectorAll('#servicesCheckboxGrid .service-checkbox-item');
    const selectedServices = [];
    let totalPrice = 0;

    serviceItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            const serviceId = checkbox.value;
            const unitPrice = Number(checkbox.dataset.price) || 0;
            const qtyInput = item.querySelector('.service-qty-input');
            const quantity = Math.max(1, parseInt(qtyInput ? qtyInput.value : 1, 10) || 1);

            selectedServices.push({
                id: serviceId,
                quantity: quantity
            });
            totalPrice += unitPrice * quantity;
        }
    });

    const remainingBalance = Math.max(0, totalPrice - deposit);

    if (!trackTitle || !clientName) {
        showToast('Пожалуйста, укажите название трека и имя клиента', 'warning');
        return;
    }

    const isEdit = Boolean(projectId);

    await saveProject({
        id: projectId || null,
        track_title: trackTitle,
        client_name: clientName,
        client_link: clientLink,
        selected_services: selectedServices,
        total_price: totalPrice,
        deposit: deposit,
        remaining_balance: remainingBalance,
        deadline_date: deadlineDate || null,
        column_id: columnId,
        notes: notes,
        created_at: createdAtVal || (isEdit ? (appState.projects.find(p => p.id === projectId)?.created_at || new Date().toISOString()) : new Date().toISOString())
    });

    if (isEdit) {
        // Оставляем боковую панель открытой и синхронизированной для непрерывной работы
        appState.activeEditingProjectId = projectId;
        const titleEl = document.getElementById('projectModalTitle');
        if (titleEl) titleEl.textContent = `Редактировать: ${trackTitle}`;
        const subtitleEl = document.getElementById('projectModalSubtitle');
        if (subtitleEl) subtitleEl.textContent = `Клиент: ${clientName}`;
        showToast('Изменения сохранены ✅', 'success');
        document.querySelectorAll('.project-card').forEach(c => {
            if (c.dataset.projectId === projectId) {
                c.classList.add('is-editing');
            }
        });
    } else {
        closeProjectModal();
    }
});

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('drawer-open');
    appState.activeEditingProjectId = null;
    document.querySelectorAll('.project-card').forEach(c => c.classList.remove('is-editing'));
}

// Управление прайс-листом
function openPriceModal() {
    renderPriceTable();
    document.getElementById('priceModal').classList.remove('hidden');
}

function closePriceModal() {
    document.getElementById('priceModal').classList.add('hidden');
}

/**
 * Отрисовка таблицы прайс-листа в модальном окне
 */
function renderPriceTable() {
    const tableBody = document.getElementById('priceTableBody');
    tableBody.innerHTML = '';

    if (!appState.services || appState.services.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center" style="color: var(--text-muted); padding: 20px;">
                    Прайс-лист пуст. Добавьте услуги выше.
                </td>
            </tr>
        `;
        return;
    }

    appState.services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(service.name)}</strong></td>
            <td class="text-right price-value-cell">${formatCurrency(service.price)}</td>
            <td class="text-center">
                <button type="button" class="btn-icon-action danger" onclick="deleteService('${service.id}')" title="Удалить услугу">🗑️</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Форма добавления услуги в прайс
document.getElementById('addServiceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newServiceNameInput');
    const priceInput = document.getElementById('newServicePriceInput');

    const name = nameInput.value.trim();
    const price = Number(priceInput.value);

    if (!name) return;

    addService(name, price);

    nameInput.value = '';
    priceInput.value = '';
    nameInput.focus();
});

// Сброс прайса к стандартным услугам
document.getElementById('resetServicesDefaultsBtn').addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
        title: 'Сбросить прайс-лист?',
        message: 'Восстановить стандартный набор услуг студии? Все добавленные вручную услуги будут заменены стандартными.',
        confirmText: 'Да, сбросить',
        danger: false
    });
    if (!confirmed) return;

    appState.services = [...DEFAULT_SERVICES];
    saveDataLocally();
    renderPriceTable();
    renderServicesCheckboxes();
    showToast('Прайс-лист сброшен к стандартным значениям', 'info');
});

// Модальное окно колонки
function openAddColumnModal() {
    document.getElementById('columnModalTitle').textContent = 'Новая колонка';
    document.getElementById('columnIdField').value = '';
    document.getElementById('columnTitleInput').value = '';
    document.getElementById('columnModal').classList.remove('hidden');
    document.getElementById('columnTitleInput').focus();
}

function openEditColumnModal(columnId) {
    const column = appState.columns.find(c => c.id === columnId);
    if (!column) return;

    document.getElementById('columnModalTitle').textContent = 'Переименовать колонку';
    document.getElementById('columnIdField').value = column.id;
    document.getElementById('columnTitleInput').value = column.title;
    document.getElementById('columnModal').classList.remove('hidden');
    document.getElementById('columnTitleInput').focus();
}

function closeColumnModal() {
    document.getElementById('columnModal').classList.add('hidden');
}

document.getElementById('columnForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const colId = document.getElementById('columnIdField').value;
    const title = document.getElementById('columnTitleInput').value.trim();

    if (!title) return;

    saveColumn(title, colId || null);
    closeColumnModal();
});

// Окно Supabase
function openSupabaseModal() {
    document.getElementById('supabaseModal').classList.remove('hidden');
}

function closeSupabaseModal() {
    document.getElementById('supabaseModal').classList.add('hidden');
}

// =============================================================================
// 8. DRAG AND DROP (ПЕРЕМЕЩЕНИЕ КАРТОЧЕК МЕЖДУ КОЛОНКАМИ)
// =============================================================================

function handleDragStart(e) {
    appState.draggedProjectId = this.dataset.projectId;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.projectId);
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
    appState.draggedProjectId = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const projectId = e.dataTransfer.getData('text/plain') || appState.draggedProjectId;
    const targetColumnId = this.dataset.columnId;

    if (projectId && targetColumnId) {
        moveProjectToColumn(projectId, targetColumnId);
    }
}

/**
 * Обновление видимости и состояния кнопки удаления дедлайна
 */
function updateDeadlineButtonState() {
    const deadlineInput = document.getElementById('deadlineDateInput');
    const clearBtn = document.getElementById('clearDeadlineBtn');
    const hint = document.getElementById('deadlineHint');
    if (!deadlineInput || !clearBtn) return;

    if (deadlineInput.value) {
        clearBtn.style.display = 'inline-flex';
        clearBtn.classList.add('has-deadline');
        if (hint) {
            const parts = deadlineInput.value.split('-');
            const formatted = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : deadlineInput.value;
            hint.textContent = `Дедлайн: ${formatted} (нажмите «Удалить дедлайн», чтобы снять)`;
        }
    } else {
        clearBtn.style.display = 'none';
        clearBtn.classList.remove('has-deadline');
        if (hint) {
            hint.textContent = 'Дедлайн не установлен (бессрочно)';
        }
    }
}
window.updateDeadlineButtonState = updateDeadlineButtonState;

// =============================================================================
// 9. СЛУШАТЕЛИ СОБЫТИЙ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================================================

function initEventListeners() {
    // Вкладки переключения представлений в шапке (Все проекты / Статистика)
    const navProjectsBtn = document.getElementById('navAllProjectsBtn');
    if (navProjectsBtn) {
        navProjectsBtn.addEventListener('click', () => switchView('projects'));
    }

    const navStatsBtn = document.getElementById('navStatsBtn');
    if (navStatsBtn) {
        navStatsBtn.addEventListener('click', () => switchView('statistics'));
    }

    // Кнопка нового проекта в шапке
    document.getElementById('openAddProjectModalBtn').addEventListener('click', () => openAddProjectModal());
    document.getElementById('closeProjectModalBtn').addEventListener('click', closeProjectModal);
    document.getElementById('cancelProjectModalBtn').addEventListener('click', closeProjectModal);

    // Управление дедлайном в боковой панели (кнопка удаления дедлайна)
    const clearDeadlineBtn = document.getElementById('clearDeadlineBtn');
    const deadlineDateInput = document.getElementById('deadlineDateInput');
    if (clearDeadlineBtn && deadlineDateInput) {
        clearDeadlineBtn.addEventListener('click', () => {
            deadlineDateInput.value = '';
            updateDeadlineButtonState();
            showToast('Дедлайн задачи удален', 'info');
        });
        deadlineDateInput.addEventListener('change', updateDeadlineButtonState);
        deadlineDateInput.addEventListener('input', updateDeadlineButtonState);
    }

    // Модальное окно прайса
    const openPriceBtn = document.getElementById('openPriceModalBtn');
    if (openPriceBtn) {
        openPriceBtn.addEventListener('click', openPriceModal);
    }
    document.getElementById('closePriceModalBtn').addEventListener('click', closePriceModal);
    document.getElementById('closePriceModalFooterBtn').addEventListener('click', closePriceModal);

    // Кнопка быстрой ссылки на добавление услуги из формы проекта (+ Новая услуга)
    const quickAddBtn = document.getElementById('quickAddServiceBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            openPriceModal();
            setTimeout(() => {
                const input = document.getElementById('newServiceNameInput');
                if (input) input.focus();
            }, 60);
        });
    }

    // Модальное окно колонки
    document.getElementById('openAddColumnModalBtn').addEventListener('click', openAddColumnModal);
    document.getElementById('closeColumnModalBtn').addEventListener('click', closeColumnModal);
    document.getElementById('cancelColumnModalBtn').addEventListener('click', closeColumnModal);

    // Модальное окно статуса Supabase
    document.getElementById('dbStatusBtn').addEventListener('click', openSupabaseModal);
    document.getElementById('closeSupabaseModalBtn').addEventListener('click', closeSupabaseModal);
    document.getElementById('closeSupabaseModalFooterBtn').addEventListener('click', closeSupabaseModal);

    // Копирование SQL-скрипта в буфер обмена
    document.getElementById('copySqlBtn').addEventListener('click', () => {
        const sqlText = document.getElementById('sqlCodeBlock').textContent;
        navigator.clipboard.writeText(sqlText).then(() => {
            showToast('SQL-скрипт скопирован в буфер обмена!', 'success');
        }).catch(() => {
            showToast('Не удалось скопировать текст', 'warning');
        });
    });

    // Слушатель изменения суммы предоплаты для живого калькулятора
    document.getElementById('depositInput').addEventListener('input', recalculateProjectCosts);

    // Поиск по проектам
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value;
        if (appState.searchQuery.trim() !== '') {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        renderKanbanBoard();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        appState.searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderKanbanBoard();
        searchInput.focus();
    });

    // Закрытие классических модалок по клику на оверлей
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
    });

    // Закрытие боковой панели / модалки по клику на бэкдроп или контейнер вне карточки
    const projectModal = document.getElementById('projectModal');
    if (projectModal) {
        projectModal.addEventListener('click', (e) => {
            if (e.target === projectModal || e.target.id === 'projectDrawerBackdrop') {
                closeProjectModal();
            }
        });
    }

    // Закрытие по Escape (закрывает боковую панель или открытые модалки)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const projectModal = document.getElementById('projectModal');
            if (projectModal && !projectModal.classList.contains('hidden')) {
                closeProjectModal();
                return;
            }
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        }
    });

    // Переключение отображения панели финансовой статистики
    const toggleFinanceBtn = document.getElementById('toggleFinanceBtn');
    const financeBar = document.getElementById('financeBar');
    if (toggleFinanceBtn && financeBar) {
        // Восстанавливаем сохраненное состояние из LocalStorage
        const isStatsCollapsed = localStorage.getItem('soundstudio_stats_collapsed') === 'true';
        if (isStatsCollapsed) {
            financeBar.classList.add('collapsed');
            toggleFinanceBtn.classList.remove('active');
        } else {
            toggleFinanceBtn.classList.add('active');
        }

        toggleFinanceBtn.addEventListener('click', () => {
            const isNowCollapsed = financeBar.classList.toggle('collapsed');
            toggleFinanceBtn.classList.toggle('active', !isNowCollapsed);
            localStorage.setItem('soundstudio_stats_collapsed', isNowCollapsed ? 'true' : 'false');
            showToast(isNowCollapsed ? 'Статистика скрыта' : 'Статистика открыта', 'info');
        });
    }

    // Слушатель скролла канбан-доски для обновления активной вкладки колонок
    const kanbanWrapper = document.getElementById('kanbanWrapper') || document.querySelector('.kanban-wrapper');
    if (kanbanWrapper) {
        let scrollTimeout = null;
        kanbanWrapper.addEventListener('scroll', () => {
            if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
            scrollTimeout = requestAnimationFrame(() => {
                updateActiveColumnNavTab();
            });
        }, { passive: true });

        // Прокрутка мыши на десктопе:
        // - При наведении на саму колонку (заголовок, пустое место, футер) или фон доски -> листается влево-вправо
        // - И ТОЛЬКО при наведении на конкретные треки (.project-card) -> листается вверх-вниз
        kanbanWrapper.addEventListener('wheel', (e) => {
            // Если открыто модальное окно, не перехватываем скролл
            const activeModal = document.querySelector('.modal-overlay:not(.hidden)');
            if (activeModal) return;

            // 1. Shift + колесико мыши = всегда горизонтальный скролл всей доски
            if (e.shiftKey) {
                if (e.deltaY !== 0 || e.deltaX !== 0) {
                    e.preventDefault();
                    kanbanWrapper.scrollLeft += (e.deltaY || e.deltaX);
                }
                return;
            }

            // 2. Если уже используется нативный горизонтальный скролл (тачпад или наклоняемое колесико)
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                return;
            }

            // 3. Проверяем, находится ли курсор НАД КОНКРЕТНЫМ ТРЕКОМ:
            const projectCard = e.target.closest('.project-card');
            if (projectCard) {
                // Курсор над конкретным треком: прокручиваем список треков ВВЕРХ И ВНИЗ
                const cardsContainer = projectCard.closest('.column-cards-container');
                if (cardsContainer) {
                    const canScroll = cardsContainer.scrollHeight > cardsContainer.clientHeight;
                    if (canScroll) {
                        e.preventDefault();
                        cardsContainer.scrollTop += e.deltaY;
                        return;
                    }
                }
                // Если треков мало и скроллить некуда, пока курсор над треком,
                // предотвращаем сдвиг доски вбок:
                e.preventDefault();
                return;
            }

            // 4. Курсор над САМОЙ КОЛОНКОЙ (заявка, пресведение, сведение, мастеринг и т.д.)
            //    или на свободном фоне канбан-доски:
            //    СТРАНИЦА ЛИСТАЕТСЯ ВЛЕВО-ВПРАВО!
            if (e.deltaY !== 0) {
                e.preventDefault();
                kanbanWrapper.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }
}

/**
 * Форматирование денежной суммы в читаемый вид: "7 500 ₽"
 */
function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('ru-RU').format(num) + ' ₽';
}

/**
 * Безопасное экранирование HTML
 */
function escapeHtml(string) {
    if (!string) return '';
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
}

/**
 * Всплывающие уведомления (Toast)
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
    };

    toast.innerHTML = `
        <span>${icons[type] || '🔔'}</span>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Экспорт функций в глобальную область window для надёжной работы onclick-обработчиков
window.deleteProject = deleteProject;
window.deleteService = deleteService;
window.deleteColumn = deleteColumn;
window.openEditProjectModal = openEditProjectModal;
window.openAddProjectModal = openAddProjectModal;
window.openAddProjectModalForColumn = openAddProjectModalForColumn;
window.moveProjectToColumn = moveProjectToColumn;
window.openEditColumnModal = openEditColumnModal;
window.showConfirmDialog = showConfirmDialog;
window.closeProjectModal = closeProjectModal;
window.closePriceModal = closePriceModal;
window.closeColumnModal = closeColumnModal;
window.closeSupabaseModal = closeSupabaseModal;
