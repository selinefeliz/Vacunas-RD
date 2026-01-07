# Sistema de Gestión de Vacunación

Este proyecto es un sistema integral para la gestión de campañas de vacunación. Permite administrar citas, inventario de vacunas, centros de vacunación, pacientes y personal médico. La aplicación cuenta con un portal web para pacientes y un panel de administración para el personal autorizado.

## Creadores

*   ISMAEL MOQUETE EDUARDO - 1115719
*   KATRIEL CASTILLO - 1121299
*   YOBANNY VELEZ - 1117551

---

## Stack Tecnológico

El sistema está construido con una arquitectura moderna de tres capas:

*   **Frontend**: Desarrollado con **Next.js (React)** y **TypeScript**. La interfaz de usuario es moderna y responsiva, utilizando **Tailwind CSS** y la librería de componentes **Shadcn/UI**.
*   **Backend**: Una API RESTful robusta construida con **Node.js** y el framework **Express.js**. Se encarga de toda la lógica de negocio y la comunicación con la base de datos.
*   **Base de Datos**: Utiliza **Microsoft SQL Server** para el almacenamiento persistente de datos. La lógica de negocio compleja se maneja a través de procedimientos almacenados (`Stored Procedures`) para optimizar el rendimiento y la seguridad.

---

## Funcionalidades Principales

El sistema ofrece una amplia gama de funcionalidades para diferentes roles de usuario:

### Gestión de Autenticación y Usuarios
*   Registro e inicio de sesión de usuarios.
*   Gestión de roles y permisos (Administrador, Personal Médico, Paciente).
*   Protección de rutas y endpoints basada en roles.

### Gestión de Citas
*   Solicitud de citas de vacunación por parte de los pacientes.
*   Consulta y cancelación de citas.
*   Asignación y gestión de citas por parte del personal médico.
*   Visualización de la disponibilidad de horarios en los centros de vacunación.

### Administración de Vacunas e Inventario
*   Catálogo de vacunas disponibles.
*   Gestión de lotes de vacunas, incluyendo fabricante y fecha de caducidad.
*   Control de inventario de vacunas por centro de vacunación.

### Administración de Centros de Vacunación
*   Gestión de centros de vacunación y sus ubicaciones.
*   Asignación de personal médico a los centros.

### Módulo Médico
*   Registro de pacientes (incluyendo información de menores).
*   Administración del historial de vacunación de los pacientes.
*   Panel para que el personal médico atienda las citas programadas.

### Dashboard
*   Visualización de estadísticas y métricas clave sobre la campaña de vacunación.

---

## Estructura del Proyecto

El repositorio está organizado en los siguientes directorios principales:

*   `frontend/`: Contiene todo el código fuente de la aplicación web de Next.js.
    *   `app/`: Las páginas y rutas de la aplicación.
    *   `components/`: Componentes reutilizables de React.
    *   `lib/`: Funciones de utilidad y configuración.
    *   `styles/`: Hojas de estilo globales.
*   `api/`: Contiene el código fuente del servidor de backend (Node.js/Express).
    *   `routes/`: Define los endpoints de la API.
    *   `middleware/`: Middlewares para la gestión de peticiones (ej. autenticación).
    *   `config/`: Archivos de configuración.
*   `database/`: Contiene los scripts SQL para la base de datos.
    *   `schema.sql`: Script para la creación de la estructura de la base de datos (tablas, relaciones).
    *   `programmability/`: Todos los procedimientos almacenados del sistema.

---

## Guía de Instalación y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en un entorno de desarrollo local.

### Prerrequisitos
*   **Node.js** (versión 20.x o superior)
*   **npm** o un gestor de paquetes compatible.
*   **Microsoft SQL Server** (una instancia local o en la nube).

### 1. Configuración de la Base de Datos
1.  Se configura sola al ejecutar en backend ya que esta en azure. PARA LOS CAMBIOS EN LA BD VE A AZURE O CONECTATE A LA CONEXION EN SQL SERVER CON LA BD Y EJECUTA LOS NUEEVOS SCRIPT
### 2. Configuración del Backend (API)
1.  Navega al directorio `backend/`: `cd backend`
2.  Instala las dependencias: `npm install`
5.  Inicia el servidor: `npm start`
    *   Por defecto, la API se ejecutará en `http://localhost:3000`.

### 3. Configuración del Frontend
1.  En otra terminal, navega al directorio `frontend/`: `cd frontend`
2. En la carpeta hay un archivo .bat llamado `instalar`, ejecutalo para que descarge las dependencias
4.  Instala las dependencias: `npm install` 
5.  Inicia la aplicación de desarrollo: `npm run dev` o selecciona el documenrto llamado Iniciar
    *   La aplicación web estará disponible en `http://localhost:3003`.

---

## Scripts Disponibles

### Frontend (`/frontend`)
*   `npm run dev`: Inicia el servidor de desarrollo.
*   `npm run build`: Compila la aplicación para producción.
*   `npm run start`: Inicia un servidor de producción.

### Backend (`/api`)
*   `npm start`: Inicia el servidor de la API.
