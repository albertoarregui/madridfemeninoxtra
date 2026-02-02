import { fetchPlayerAwards } from './src/utils/awards';

async function testAwards() {
    console.log("Iniciando prueba de premios...");
    try {
        const awards = await fetchPlayerAwards();
        console.log(`Se encontraron ${awards.length} premios.`);

        if (awards.length > 0) {
            console.log("Ejemplo de premio:", awards[0]);
        } else {
            console.log("No hay premios registrados en la base de datos todavía.");
        }
    } catch (error) {
        console.error("Error al obtener premios:", error);
    }
}

testAwards();
