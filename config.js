// =============================================================================
// КОНФИГУРАЦИЯ ПОДКЛЮЧЕНИЯ К SUPABASE
// =============================================================================
//
// ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:
// 1. Зайдите на сайт https://supabase.com и зарегистрируйтесь (это бесплатно).
// 2. Создайте новый проект (New Project), например "SoundStudio".
// 3. Перейдите в левом меню в: Project Settings (иконка шестерёнки) -> API.
// 4. В блоке "Project URL" скопируйте URL адрес и вставьте вместо "ВСТАВЬТЕ_СЮДА_URL".
// 5. В блоке "Project API keys" скопируйте ключ "anon / public" и вставьте вместо "ВСТАВЬТЕ_СЮДА_KEY".
// 6. Перейдите в Supabase -> SQL Editor и выполните SQL-скрипт (он есть в комментариях файла app.js).
//
// ВНИМАНИЕ: Если вы ещё не создали проект в Supabase, ничего страшного!
// Приложение автоматически определит заглушки и включит локальный режим (Local Storage),
// благодаря чему вы можете полноценно тестировать функционал прямо сейчас.
// =============================================================================

const SUPABASE_URL = "https://nickrisestudio.github.io/client_board";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoc3RsanFtYWhqc2h5aXFud3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDYxMDMsImV4cCI6MjEwNDEyMjEwM30.n29JnaU9YKKrSgfdpr06WKJT1JGQrtHvfkldSroCHs4";
