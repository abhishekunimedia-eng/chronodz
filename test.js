const fs = require("fs");
const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://express_mail_db_user:Dy2DJeuSlK92yadcTR9Cwr3DHLuqE57W@dpg-d853aheqlp3s73f2sai0-a.oregon-postgres.render.com:5432/express_mail_db",
  ssl: {
    rejectUnauthorized: false,   // bypass certificate validation
    require: true                // force SSL
  }
});


(async () => {
  try {
    await client.connect();
    const sql = fs.readFileSync("backup.sql", "utf8");
    await client.query(sql);
    console.log("✅ Data imported successfully!");
  } catch (err) {
    console.error("Import failed:", err);
  } finally {
    await client.end();
  }
})();
