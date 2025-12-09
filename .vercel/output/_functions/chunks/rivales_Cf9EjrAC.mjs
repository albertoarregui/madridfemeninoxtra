function slugify(text) {
  if (!text) return "desconocido";
  return text.toString().toLowerCase().trim().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-");
}
function getRivalShieldUrl(rival) {
  let fileName = rival.escudo_url;
  if (!fileName && rival.nombre) {
    let nameSlug = slugify(rival.nombre).replace(/-/g, "_");
    fileName = `${nameSlug}.png`;
  } else if (fileName && !fileName.includes(".")) {
    fileName += ".png";
  }
  return `/assets/escudos/${encodeURI(fileName || "placeholder.png")}`;
}
const cleanApiValue = (value) => {
  if (typeof value === "string" && value.toLowerCase().trim() === "null") {
    return null;
  }
  return value;
};
async function fetchRivalsDirectly() {
  try {
    const { createClient } = await import('@libsql/client');
    const url = undefined                                  ;
    const authToken = undefined                                ;
    if (!url || !authToken) {
      console.error("Credenciales de Turso no configuradas");
      return [];
    }
    const client = createClient({
      url,
      authToken
    });
    const query = `
            SELECT 
                id_club,
                nombre,
                ciudad,
                pais,
                slug,
                estadio
            FROM 
                clubes
            WHERE
                nombre != 'Real Madrid Femenino'
            ORDER BY 
                nombre ASC
        `;
    const result = await client.execute(query);
    return result.rows.map((rival) => {
      return {
        id_club: rival.id_club,
        nombre: cleanApiValue(rival.nombre) || "",
        ciudad: cleanApiValue(rival.ciudad) || "",
        pais: cleanApiValue(rival.pais) || "",
        slug: rival.slug || slugify(rival.nombre),
        estadio: cleanApiValue(rival.estadio) || "",
        // ✅ CORRECCIÓN: Se añade la URL del escudo
        shieldUrl: getRivalShieldUrl(rival)
      };
    });
  } catch (error) {
    console.error("Error al obtener rivales directamente de la DB:", error);
    return [];
  }
}

export { fetchRivalsDirectly as f };
