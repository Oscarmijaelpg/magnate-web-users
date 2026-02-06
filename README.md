# Magnate Web Users

Aplicación web para usuarios de Magnate, construida con React, TypeScript, Vite y Supabase.

## 🚀 Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **Shadcn/ui** - Componentes de UI
- **Supabase** - Backend y base de datos
- **React Router** - Enrutamiento
- **React Query** - Gestión de estado del servidor
- **Recharts** - Gráficos y visualizaciones

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de la build de producción
npm run preview
```

## 🌐 Despliegue en Netlify

### Opción 1: Despliegue automático desde GitHub

1. Ve a [Netlify](https://app.netlify.com/)
2. Haz clic en "Add new site" → "Import an existing project"
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio `magnate-web-users`
5. Netlify detectará automáticamente la configuración desde `netlify.toml`
6. Configura las variables de entorno necesarias:
   - `VITE_SUPABASE_URL` - URL de tu proyecto Supabase
   - `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
   - Cualquier otra variable de entorno que uses
7. Haz clic en "Deploy site"

### Opción 2: Despliegue manual con Netlify CLI

```bash
# Instalar Netlify CLI globalmente
npm install -g netlify-cli

# Autenticarse en Netlify
netlify login

# Inicializar el proyecto
netlify init

# Desplegar
netlify deploy --prod
```

## 🔧 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

**Importante:** En Netlify, configura estas mismas variables en:
`Site settings → Environment variables`

## 📁 Estructura del Proyecto

```
src/
├── components/        # Componentes reutilizables
├── pages/            # Páginas de la aplicación
├── presentation/     # Contextos y lógica de presentación
├── domain/           # Lógica de negocio
├── infrastructure/   # Repositorios y servicios externos
├── hooks/            # Custom hooks
└── lib/              # Utilidades y configuración
```

## 🔒 Seguridad

- Las variables de entorno sensibles nunca se commitean al repositorio
- Se implementan headers de seguridad en Netlify (ver `netlify.toml`)
- Autenticación manejada por Supabase

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run build:dev` - Construye en modo desarrollo
- `npm run preview` - Vista previa de la build de producción
- `npm run lint` - Ejecuta el linter

## 🤝 Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.
