const { sql, connectDB } = require('./config/db');

async function debugSearch() {
    try {
        const pool = await connectDB();
        const request = pool.request();
        // Search for any child - using '%'
        request.input('searchTerm', sql.NVarChar(100), '%');

        const query = `
            SELECT DISTINCT TOP 5
                n.id_Nino, 
                n.Nombres, 
                t.id_Usuario AS id_Tutor_Usuario,
                t.Nombres AS NombreTutor
            FROM dbo.Nino n
            LEFT JOIN dbo.TutorNino tn ON n.id_Nino = tn.id_Nino
            LEFT JOIN dbo.Tutor t ON tn.id_Tutor = t.id_Tutor
    `;

        const result = await request.query(query);
        console.log("Search Results Sample:", result.recordset);
    } catch (err) {
        console.error("Error:", err);
    }
}

debugSearch();
