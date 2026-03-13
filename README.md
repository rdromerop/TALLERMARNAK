# Taller Marnak - Dashboard Administrativo

Un dashboard moderno y eficiente diseñado para la gestión de talleres de motocicletas. Construido con Next.js, Tailwind CSS y Supabase.

## 🚀 Características

- **Resumen General:** Visualización en tiempo real de ventas, ganancias y gastos.
- **Gestión de Ventas:** Registro de ventas con descarga automática de inventario.
- **Inventario:** Control completo de repuestos y productos con alertas de stock bajo.
- **Gastos:** Seguimiento detallado de egresos por categorías.
- **Ordenes de Reparación:** Gestión de mecánicos y servicios realizados.
- **Diseño Premium:** Interfaz oscura/clara optimizada para la productividad.

## 🛠️ Tecnologías

- **Framework:** [Next.js 15+](https://nextjs.org/)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Gráficos:** [Recharts](https://recharts.org/)

## 🏁 Configuración Local

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/marnak-dashboard.git
    cd marnak-dashboard
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Variables de entorno:**
    Crea un archivo `.env.local` con tus credenciales de Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
    ```

4.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
