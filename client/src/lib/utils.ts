// Утилитарные функции для работы с CSS классами в приложении DELA
// Содержит функции для объединения и оптимизации Tailwind CSS классов

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Функция cn (className) - объединяет и оптимизирует CSS классы
 * Использует clsx для условного объединения классов и twMerge для разрешения конфликтов Tailwind
 * @param inputs - массив классов, объектов или условных выражений
 * @returns строка с объединенными и оптимизированными CSS классами
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}