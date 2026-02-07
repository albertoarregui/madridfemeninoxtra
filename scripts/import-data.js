import { createClient } from '@libsql/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function importFromCSV(csvPath, tableName) {
    try {
        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        console.log(`📊 Encontrados ${records.length} registros en ${csvPath}`);

        const columns = Object.keys(records[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.join(', ');

        const insertSQL = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;

        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);

            const transaction = await db.transaction('write');

            for (const record of batch) {
                const values = columns.map(col => record[col]);
                await transaction.execute({
                    sql: insertSQL,
                    args: values,
                });
            }

            await transaction.commit();
            inserted += batch.length;
            console.log(`✓ Insertados ${inserted}/${records.length} registros...`);
        }

        console.log(`✅ Importación completada: ${inserted} registros insertados en '${tableName}'`);
    } catch (error) {
        console.error('❌ Error durante la importación:', error);
        throw error;
    }
}

const [csvPath, tableName] = process.argv.slice(2);

if (!csvPath || !tableName) {
    console.log('Uso: node scripts/import-data.js <archivo.csv> <nombre-tabla>');
    console.log('Ejemplo: node scripts/import-data.js data/partidos.csv partidos');
    process.exit(1);
}

importFromCSV(csvPath, tableName);
