const sql=require('mssql');
(async()=>{
  try{
    const conn='Server=ISMA_LEGION\\SQLEXPRESS,1433;Database=Vaccine;User Id=vaccine_api;Password=VaccineAPI2024!;Encrypt=false;TrustServerCertificate=true;Connection Timeout=30;';
    const pool=await sql.connect(conn);
    const tables=['Lote','Vacuna','Fabricante'];
    for(const tbl of tables){
      const res=await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='"+tbl+"'");
      console.log('Table '+tbl+':',res.recordset.map(r=>r.COLUMN_NAME));
    }
    await pool.close();
  }catch(e){console.error(e); process.exit(1);}
})();
