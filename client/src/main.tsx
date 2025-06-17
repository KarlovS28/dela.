// Точка входа в React приложение системы управления сотрудниками DELA
// Отвечает за инициализацию и монтирование главного компонента в DOM

// Импорт React 18 API для создания корневого элемента
import { createRoot } from "react-dom/client";
// Импорт главного компонента приложения
import App from "./App";
// Импорт основных стилей Tailwind CSS
import "./index.css";
// Импорт кастомных стилей приложения
import "./styles/custom.css";

// Создание корневого элемента React и рендеринг приложения в DOM элемент с id="root"
createRoot(document.getElementById("root")!).render(<App />);
