
const awardImages = [
    '../assets/jugadora_del_mes/linda_caicedo_enero_2026.webp',
    '../assets/jugadora_del_mes/misa_rodriguez_enero_2026.webp'
];

function getAwardImage(playerName: string, monthName: string, year: number | string) {
    const normalizedPlayer = playerName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");

    const normalizedMonth = monthName.toLowerCase();
    const yearStr = year.toString();

    console.log(`Debug Params: player="${normalizedPlayer}", month="${normalizedMonth}", year="${yearStr}"`);

    const matchingPath = awardImages.find((path) => {
        const pathLower = path.toLowerCase();
        const matches = (
            pathLower.includes(normalizedPlayer) &&
            pathLower.includes(normalizedMonth) &&
            pathLower.includes(yearStr)
        );
        console.log(`  Checking path: ${pathLower} -> ${matches}`);
        return matches;
    });

    return matchingPath || null;
}

console.log('Testing Misa Rodríguez, ENERO, 2026:');
const result = getAwardImage('Misa Rodríguez', 'ENERO', 2026);
console.log('Result:', result);
