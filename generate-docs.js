
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = require("docx");
const fs = require("fs");

async function generateDocumentation() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Заголовок документа
        new Paragraph({
          children: [
            new TextRun({
              text: "СИСТЕМА УПРАВЛЕНИЯ СОТРУДНИКАМИ И ИМУЩЕСТВОМ",
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Подробное описание и инструкция по эксплуатации",
              size: 24,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        }),

        // Оглавление
        new Paragraph({
          text: "ОГЛАВЛЕНИЕ",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun("1. Описание системы"),
            new TextRun("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t3"),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun("2. Функциональные возможности"),
            new TextRun("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t4"),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun("3. Роли пользователей"),
            new TextRun("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t6"),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun("4. Инструкция по использованию"),
            new TextRun("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t8"),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun("5. Администрирование системы"),
            new TextRun("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t15"),
          ],
          spacing: { after: 600 },
        }),

        // Новая страница
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),

        // Раздел 1: Описание системы
        new Paragraph({
          text: "1. ОПИСАНИЕ СИСТЕМЫ",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Система управления сотрудниками и имуществом",
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: " - это веб-приложение для комплексного управления кадровыми ресурсами и материальными активами организации.",
              size: 22,
            }),
          ],
          spacing: { after: 300 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Основные цели системы:",
              bold: true,
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Централизованное хранение данных о сотрудниках",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Учет и контроль распределения материальных ценностей",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Автоматизация процессов приема и увольнения сотрудников",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Генерация отчетов и документов",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Контроль доступа на основе ролей пользователей",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Система разработана с использованием современных веб-технологий и обеспечивает безопасное хранение данных, удобный интерфейс и высокую производительность.",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Раздел 2: Функциональные возможности
        new Paragraph({
          text: "2. ФУНКЦИОНАЛЬНЫЕ ВОЗМОЖНОСТИ",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),

        new Paragraph({
          text: "2.1 Управление сотрудниками",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Добавление новых сотрудников с полной информацией",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Редактирование персональных данных",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Загрузка и управление фотографиями сотрудников",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Архивирование уволенных сотрудников",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Организация сотрудников по отделам",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "2.2 Управление имуществом",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Учет оборудования и мебели",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Присвоение инвентарных номеров",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Закрепление имущества за сотрудниками",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Управление складом",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Списание оборудования",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "2.3 Документооборот",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Генерация актов материальной ответственности",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Создание обходных листов при увольнении",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Экспорт данных в Excel и DOCX форматы",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Импорт данных из Excel файлов",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "2.4 Система уведомлений",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Уведомления о изменениях в системе",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• История изменений (аудит-лог)",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Отслеживание действий пользователей",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
          indent: { left: 720 },
        }),

        // Раздел 3: Роли пользователей
        new Paragraph({
          text: "3. РОЛИ ПОЛЬЗОВАТЕЛЕЙ",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "В системе реализована ролевая модель доступа с четырьмя основными ролями:",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Таблица ролей
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Роль", bold: true, size: 20 })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Описание", bold: true, size: 20 })] })],
                  width: { size: 35, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Права доступа", bold: true, size: 20 })] })],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Администратор", size: 18, bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Полный доступ ко всем функциям системы", size: 18 })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "• Управление пользователями\n• Управление ролями\n• Все функции других ролей\n• История изменений", size: 18 })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Бухгалтер", size: 18, bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Управление кадровыми данными и финансовой отчетностью", size: 18 })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "• Полный доступ к данным сотрудников\n• Архивирование сотрудников\n• Экспорт отчетов\n• Генерация документов", size: 18 })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Системный администратор", size: 18, bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Управление техническими аспектами системы", size: 18 })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "• Управление оборудованием\n• Создание сотрудников\n• Управление складом\n• Базовые операции", size: 18 })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Офис-менеджер", size: 18, bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Управление повседневными операциями офиса", size: 18 })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "• Управление оборудованием\n• Работа со складом\n• Базовое редактирование данных сотрудников", size: 18 })] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: "",
          spacing: { after: 400 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Важно:",
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: " Система поддерживает гибкую настройку разрешений, включая специальное право 'Может просматривать паспортные данные', которое контролирует доступ к конфиденциальной информации сотрудников.",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Новая страница для инструкции
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),

        // Раздел 4: Инструкция по использованию
        new Paragraph({
          text: "4. ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),

        new Paragraph({
          text: "4.1 Вход в систему",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Откройте веб-браузер и перейдите по адресу системы",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Введите свой email и пароль",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Нажмите кнопку 'Войти'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. При первом входе используйте данные администратора:",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   Email: admin@admin.com",
              size: 20,
              font: "Courier New",
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   Пароль: POik09MN!",
              size: 20,
              font: "Courier New",
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          text: "4.2 Главная страница",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "После входа вы попадете на главную страницу, которая отображает:",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Структуру отделов организации",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Карточки сотрудников с фотографиями",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "• Информацию о закрепленном за сотрудниками имуществе",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "4.3 Работа с сотрудниками",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: "4.3.1 Добавление нового сотрудника",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Нажмите кнопку 'Добавить сотрудника' в верхней части страницы",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Заполните обязательные поля:",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - ФИО сотрудника",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Должность",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Грейд (Junior/Middle/Senior/Executive)",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Пол",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Отдел",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. При необходимости заполните дополнительные поля:",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Паспортные данные",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Адрес регистрации",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Данные приказа о приеме",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Данные акта материальной ответственности",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Загрузите фотографию сотрудника (необязательно)",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "5. Нажмите 'Сохранить'",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "4.3.2 Редактирование данных сотрудника",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Кликните на карточку сотрудника на главной странице",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. В открывшемся окне нажмите 'Редактировать'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Внесите необходимые изменения",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Сохраните изменения",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "4.3.3 Управление фотографией профиля",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Пользователи могут изменять свою фотографию профиля:",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Перейдите в личный кабинет (кнопка с аватаром в верхнем правом углу)",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Нажмите на иконку камеры рядом с фотографией или кнопку 'Изменить фото'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Выберите изображение (максимум 5MB, форматы: JPG, PNG, GIF)",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Фотография загрузится автоматически",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "4.4 Работа с имуществом",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: "4.4.1 Добавление оборудования",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Откройте карточку сотрудника",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. В разделе 'Закрепленное имущество' нажмите 'Добавить оборудование'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Заполните поля:",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Наименование",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Инвентарный номер (уникальный)",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Категория (Техника/Мебель)",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Характеристики",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Стоимость",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Сохраните запись",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "4.4.2 Работа со складом",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Перейдите в раздел 'Склад' через главное меню",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Просмотрите список доступного оборудования",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Для закрепления за сотрудником нажмите 'Закрепить'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Выберите сотрудника из списка",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "4.5 Генерация документов",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Система позволяет генерировать следующие документы:",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: "4.5.1 Акт материальной ответственности",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Откройте карточку сотрудника",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Нажмите 'Акт материальной ответственности'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Документ автоматически сформируется в формате DOCX",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "4.5.2 Обходной лист",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Откройте карточку сотрудника",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Нажмите 'Обходной лист'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Документ сформируется с учетом всех отделов организации",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "4.6 Экспорт и импорт данных",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: "4.6.1 Экспорт в Excel",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Используйте кнопку 'Экспорт' в главном меню",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Выберите тип экспорта:",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Список сотрудников (полный с паспортными данными)",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Список сотрудников (публичный)",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Инвентаризация имущества",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Списанное имущество",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          text: "4.6.2 Импорт из Excel",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Скачайте шаблон через соответствующую кнопку",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Заполните данные в шаблоне",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Загрузите заполненный файл через кнопку 'Импорт'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Система автоматически проверит и импортирует данные",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
          indent: { left: 720 },
        }),

        // Новая страница для администрирования
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),

        // Раздел 5: Администрирование системы
        new Paragraph({
          text: "5. АДМИНИСТРИРОВАНИЕ СИСТЕМЫ",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),

        new Paragraph({
          text: "5.1 Управление пользователями",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Только администраторы имеют доступ к управлению пользователями:",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Перейдите в 'Личный кабинет' → 'Управление пользователями'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Просмотрите список всех пользователей системы",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Измените роль пользователя при необходимости",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Сбросьте пароль пользователя",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "5. Удалите учетную запись при необходимости",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "5.2 Обработка запросов на регистрацию",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Новые пользователи могут подать запрос на регистрацию",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Администратор получает уведомление о новом запросе",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. В разделе 'Запросы на регистрацию' администратор может:",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Одобрить запрос и создать учетную запись",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "   - Отклонить запрос",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 1080 },
        }),

        new Paragraph({
          text: "5.3 Управление ролями и разрешениями",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Перейдите в 'Управление ролями'",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Просмотрите существующие роли и их разрешения",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Настройте права доступа для каждой роли",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Особое внимание уделите разрешению 'Может просматривать паспортные данные'",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "5.4 Мониторинг системы",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. В разделе 'История изменений' отслеживайте все действия пользователей",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Просматривайте детали каждого изменения",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Анализируйте активность пользователей",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          indent: { left: 720 },
        }),

        new Paragraph({
          text: "5.5 Резервное копирование",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Регулярно экспортируйте данные о сотрудниках",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Сохраняйте резервные копии базы данных",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Документируйте процедуры восстановления",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
          indent: { left: 720 },
        }),

        // Заключение
        new Paragraph({
          text: "ЗАКЛЮЧЕНИЕ",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Система управления сотрудниками и имуществом предоставляет полный набор инструментов для эффективного управления кадровыми ресурсами и материальными активами организации. При правильном использовании система значительно упрощает административные процессы и повышает качество учета.",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Для получения дополнительной помощи или технической поддержки обращайтесь к системному администратору.",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Дата создания документа: ${new Date().toLocaleDateString('ru-RU')}`,
              size: 18,
              italics: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  
  fs.writeFileSync("Инструкция_по_использованию_системы.docx", buffer);
  console.log("Документация создана: Инструкция_по_использованию_системы.docx");
}

generateDocumentation().catch(console.error);
