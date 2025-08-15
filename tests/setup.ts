/**
 * Глобальная настройка для всех тестов
 * Этот файл автоматически загружается перед запуском тестов
 */

import { TestUtils } from './helpers/test-utils';

// Настройка глобального cleanup hook
export function setupGlobalCleanup() {
  // Этот код будет выполняться только когда Mocha hooks доступны
  if (typeof global !== 'undefined' && global.after) {
    global.after(async function() {
      this.timeout(60000); // 60 секунд для полной очистки
      
      console.log('🧹 [Global Teardown] Финальная очистка тестовой среды...');
      
      try {
        // Запускаем глубокую очистку всех тестовых данных
        await TestUtils.deepCleanup();
        
        console.log('✅ [Global Teardown] Тестовая среда очищена');
      } catch (error) {
        console.warn('⚠️ [Global Teardown] Ошибка при финальной очистке:', error);
        // Не бросаем ошибку, чтобы не прерывать завершение тестов
      }
    });
  }
}

// Инициализация при импорте
(async () => {
  try {
    console.log('⚙️ [Global Setup] Проверка тестовой среды...');
    
    // Проверяем подключение к базе данных
    const database = (await import('../src/db')).default;
    const connectionTest = await database.query('SELECT 1 as test');
    
    if (!connectionTest.success) {
      throw new Error('Не удалось подключиться к тестовой базе данных');
    }
    
    console.log('✅ [Global Setup] Тестовая среда готова');
    
    // Настраиваем глобальную очистку если это возможно
    setupGlobalCleanup();
    
  } catch (error) {
    console.error('❌ [Global Setup] Ошибка инициализации:', error);
  }
})();

// Обработка необработанных исключений в тестах
process.on('unhandledRejection', (reason, promise) => {
  console.warn('⚠️ [Global] Необработанное отклонение промиса:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [Global] Необработанное исключение:', error);
});

// Настройка таймаутов по умолчанию для всех тестов
if (typeof mochaOptions !== 'undefined') {
  mochaOptions.timeout = 10000; // 10 секунд по умолчанию
}

console.log('⚙️ [Global Setup] Глобальная конфигурация тестов загружена');