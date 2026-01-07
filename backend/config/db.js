const sql = require("mssql");
require("dotenv").config();

// Configuración de conexión basada en variables de entorno
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "micolmado-server.database.windows.net",
  database: process.env.DB_DATABASE || "SistemaVacunacionDB",
  options: {
    encrypt: true, // DEBE SER TRUE PARA AZURE
    trustServerCertificate: false, // FALSE PARA PRODUCCIÓN/AZURE
    enableArithAbort: true
  },
  port: parseInt(process.env.DB_PORT) || 1433
};

// Configurar autenticación según las variables de entorno
if (process.env.DB_OPTIONS_INTEGRATED_SECURITY === "true") {
  // Windows Authentication - usar authentication en lugar de trustedConnection
  config.authentication = {
    type: "ntlm",
    options: {
      domain: "",
      userName: "",
      password: ""
    }
  };
  console.log("[DB CONFIG] 🔐 Usando Windows Authentication (NTLM)");
} else if (process.env.DB_USER && process.env.DB_PASSWORD) {
  // SQL Server Authentication
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
  config.authentication = {
    type: "default"
  };
  console.log("[DB CONFIG] 🔐 Usando SQL Server Authentication");
  console.log(`[DB CONFIG] 👤 Usuario: ${process.env.DB_USER}`);
} else {
  console.warn("[DB CONFIG] ⚠️ No se especificó método de autenticación. Usando Windows Authentication por defecto.");
  config.authentication = {
    type: "ntlm",
    options: {
      domain: "",
      userName: "",
      password: ""
    }
  };
}

console.log(`[DB CONFIG] 🖥️  Servidor: ${config.server}`);
console.log(`[DB CONFIG] �️  Base de datos: ${config.database}`);
console.log(`[DB CONFIG] 🔒 Encrypt: ${config.options.encrypt}`);
console.log(`[DB CONFIG] � TrustServerCertificate: ${config.options.trustServerCertificate}`);

let pool;

const connectDB = async () => {
  try {
    console.log("[DB INFO] 🔄 Intentando conectar a SQL Server...");

    pool = await sql.connect(config);

    console.log("[DB SUCCESS] ✅ ¡Conectado exitosamente a SQL Server!");

    // Probar una consulta simple para verificar
    const testResult = await pool.request().query("SELECT @@VERSION as version, DB_NAME() as dbname");
    console.log(`[DB INFO] 📊 Base de datos activa: ${testResult.recordset[0].dbname}`);
    console.log(`[DB INFO] 📊 Versión: ${testResult.recordset[0].version.substring(0, 80)}...`);


    return pool;
  } catch (err) {
    console.error("[DB ERROR] ❌ Error de conexión a la base de datos:");
    console.error(`[DB ERROR] 💥 Mensaje: ${err.message}`);
    console.error(`[DB ERROR] 🔍 Servidor intentado: ${config.server}`);
    console.error(`[DB ERROR] 🔍 Base de datos: ${config.database}`);

    if (err.message.includes("ENOTFOUND") || err.message.includes("getaddrinfo")) {
      console.error("\n[DB HELP] 💡 SOLUCIÓN:");
      console.error("   1. Verifica que SQL Server esté ejecutándose");
      console.error("   2. Verifica el nombre del servidor en el archivo .env");
      console.error("   3. Si usas SQL Server Express, el servidor debería ser: localhost\\SQLEXPRESS");
      console.error("   4. Si usas la instancia por defecto, el servidor debería ser: localhost");
      console.error(`   5. Tu computadora se llama: ${require('os').hostname()}`);
    } else if (err.message.includes("Login failed")) {
      console.error("\n[DB HELP] � SOLUCIÓN:");
      console.error("   1. Verifica el usuario y contraseña en el archivo .env");
      console.error("   2. O activa Windows Authentication con: DB_OPTIONS_INTEGRATED_SECURITY=true");
    }

    throw err;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error("❌ Base de datos no conectada. Llama a connectDB() primero.");
  }
  return pool;
};

const closeDB = async () => {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      console.log("[DB INFO] 🔒 Conexión cerrada correctamente");
    } catch (err) {
      console.error("[DB ERROR] Error cerrando conexión:", err.message);
    }
  }
};

// Crear poolPromise para compatibilidad con código existente
const poolPromise = connectDB();

module.exports = {
  sql,
  connectDB,
  getPool,
  closeDB,
  poolPromise,
};
