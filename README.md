# <p align="center">📦 Vacunas RD: Sistema Nacional de Inmunización</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge&logo=vercel" alt="Status">
  <img src="https://img.shields.io/badge/Infrastructure-Azure--SQL-blue?style=for-the-badge&logo=microsoftazure" alt="Infrastructure">
  <img src="https://img.shields.io/badge/Architecture-Clean--DevOps-orange?style=for-the-badge&logo=github-actions" alt="DevOps">
</p>

---

### <p align="center">🚀 Una solución integral para la gestión de salud pública impulsada por una metodología DevOps de vanguardia.</p>

Este proyecto transforma la gestión de campañas de inmunización en un proceso digital eficiente, seguro y altamente escalable. No es solo una aplicación; es un ecosistema diseñado para administrar el ciclo completo de vacunación: desde el inventario en el centro hasta el carné digital en el bolsillo del ciudadano.

---

## 🛠️ Stack Tecnológico de Alto Rendimiento

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind--CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white) ![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?style=flat-square&logo=puppeteer&logoColor=white) |
| **Database** | ![Azure SQL](https://img.shields.io/badge/Azure--SQL-008AD7?style=flat-square&logo=microsoft-azure&logoColor=white) ![MS SQL Server](https://img.shields.io/badge/SQL--Server-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white) |
| **DevOps** | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white) ![CI/CD](https://img.shields.io/badge/CI/CD-Loop-success?style=flat-square&logo=github-actions&logoColor=white) |

---

## ♾️ Metodología DevOps Aplicada

Este proyecto fue concebido bajo el paradigma de **Integración Continua y Entrega Continua (CI/CD)**. Aplicamos los principios de DevOps para garantizar que cada cambio en el código pase por un proceso estricto de calidad antes de llegar al ciudadano.

### Ciclo de Vida del Proyecto
```mermaid
graph LR
    A[Plan] --> B(Code)
    B --> C(Build)
    C --> D(Test)
    D --> E(Release)
    E --> F(Deploy)
    F --> G(Operate)
    G --> H(Monitor)
    H --> A
    style B fill:#3b82f6,stroke:#1e40af,color:#fff
    style F fill:#10b981,stroke:#065f46,color:#fff
    style D fill:#f59e0b,stroke:#b45309,color:#fff
```

### Características DevOps Implementadas:
*   **Infrastructure as Code (IaC)**: Definición de servicios en la nube (Azure/Vercel) integrada en el repositorio.
*   **Cloud Hybrid Connectivity**: Backend en Vercel conectado de forma segura a una instancia persistente de Azure SQL.
*   **Automation**: Generación automática de certificados oficiales PDF utilizando Puppeteer Cloud-Optimized.
*   **Version Control**: Gestión de ramas para control de cambios dinámicos.

---

## ✨ Funcionalidades Estrella

### 🏛️ Para Instituciones (Admin/Médicos)
*   **Control de Lotes**: Gestión inteligente de inventario con alertas de caducidad.
*   **Agenda Digital**: Sistema de citas con validación de horarios en tiempo real.
*   **Certificación Oficial**: Generación de carnes con marca de agua y sellos digitales de seguridad.

### 👤 Para Ciudadanos (Pacientes)
*   **Perfil de Vacunación**: Acceso inmediato al historial completo de dosis aplicadas.
*   **Validación de Cédula**: Integración con algoritmos de validación de identidad dominicana.
*   **Responsive Web**: Diseñado para funcionar perfectamente desde un smartphone en el centro de vacunación.

---

## 🏛️ Arquitectura del Sistema

```mermaid
sequenceDiagram
    participant Ciudadano
    participant Frontend (Next.js)
    participant Backend (Node.js)
    participant AzureSQL (DB)

    Ciudadano->>Frontend: Solicita Historial
    Frontend->>Backend: API Request + JWT
    Backend->>AzureSQL: EXEC usp_GetPatientHistory
    AzureSQL-->>Backend: Data Set (Dosis/Lotes)
    Backend->>Backend: Generates Official PDF (Puppeteer)
    Backend-->>Frontend: Stream PDF Blob
    Frontend-->>Ciudadano: Descarga Carné Digital
```

---

## 🚀 Guía de Instalación Rápida

### Entorno Local
1.  **Clonar y Dependencias**:
    ```bash
    git clone https://github.com/selinefeliz/Vacunas-RD.git
    npm install # En carpetas frontend y backend
    ```
2.  **Configurar Variables (.env)**:
    Asegúrate de configurar `DB_SERVER`, `DB_USER` y `DATABASE` para apuntar a tu instancia de Azure SQL.

3.  **Encender Motores**:
    ```bash
    # En Backend
    npm start
    # En Frontend
    npm run dev
    ```

---

## 👥 Equipo de Desarrollo
*   **Giselle Ventura** 
*   **Seline Feliz** 
*   **Ismael Moquete Eduardo** 
*   **Katriel Castillo** 
*   **Yobanny Velez**
*   **Emmanuel Cuello**
*  **Natasha Torres**
*  **Armani D'Oleo**  

---

<p align="center">
  Hecho con ❤️ para la salud de la República Dominicana.
</p>
