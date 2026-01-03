export interface Location {
    lat: number;
    lng: number;
    label: string;
    imageUrl?: string;
}

export const KNOWN_LOCATIONS: Record<string, Location> = {
    "madrid": { lat: 40.4168, lng: -3.7038, label: "Madrid, España" },
    "alcaladehenares": { lat: 40.4818, lng: -3.3643, label: "Alcalá de Henares, Madrid" },
    "zaragoza": { lat: 41.6488, lng: -0.8891, label: "Zaragoza, España" },
    "legames": { lat: 40.3281, lng: -3.7635, label: "Leganés, España" },
    "leganes": { lat: 40.3281, lng: -3.7635, label: "Leganés, España" },
    "sevilla": { lat: 37.3891, lng: -5.9845, label: "Sevilla, España" },
    "valencia": { lat: 39.4699, lng: -0.3763, label: "Valencia, España" },
    "barcelona": { lat: 41.3851, lng: 2.1734, label: "Barcelona, España" },
    "bilbao": { lat: 43.2630, lng: -2.9350, label: "Bilbao, España" },
    "sansebastian": { lat: 43.3183, lng: -1.9812, label: "San Sebastián, España" },
    "vitoria": { lat: 42.8467, lng: -2.6716, label: "Vitoria-Gasteiz, España" },
    "pamplona": { lat: 42.8125, lng: -1.6458, label: "Pamplona, España" },
    "granada": { lat: 37.1773, lng: -3.5986, label: "Granada, España" },
    "huelva": { lat: 37.2614, lng: -6.9447, label: "Huelva, España" },
    "tenerife": { lat: 28.4636, lng: -16.2518, label: "Santa Cruz de Tenerife, España" },
    "laspalmas": { lat: 28.1235, lng: -15.4363, label: "Las Palmas de Gran Canaria, España" },
    "badajoz": { lat: 38.8794, lng: -6.9707, label: "Badajoz, España" },
    "levante": { lat: 39.4699, lng: -0.3763, label: "Valencia (Levante), España" },
    "villarreal": { lat: 39.9366, lng: -0.1009, label: "Villarreal, España" },
    "murcia": { lat: 37.9922, lng: -1.1307, label: "Murcia, España" },
    "logrono": { lat: 42.4627, lng: -2.4450, label: "Logroño, España" },
    "eibar": { lat: 43.1842, lng: -2.4735, label: "Eibar, España" },
    "lacoruna": { lat: 43.3623, lng: -8.4115, label: "A Coruña, España" },
    "abegondo": { lat: 43.2263, lng: -8.2882, label: "Abegondo, España" },

    "glasgow": { lat: 55.8642, lng: -4.2518, label: "Glasgow, Escocia" },
    "dunfermline": { lat: 56.0719, lng: -3.4522, label: "Dunfermline, Escocia" },
    "caledonia": { lat: 42.9234, lng: -85.8369, label: "Caledonia, MI, USA" },
    "mexico": { lat: 19.4326, lng: -99.1332, label: "Ciudad de México, México" },
    "cordoba": { lat: 37.8882, lng: -4.7794, label: "Córdoba, España" },
    "lalcudia": { lat: 39.1963, lng: -0.5074, label: "L'Alcúdia, España" },
    "saovicente": { lat: -23.9631, lng: -46.3919, label: "São Vicente, Brasil" },
    "brasil": { lat: -14.2350, lng: -51.9253, label: "Brasil" },
    "bagnolssurceze": { lat: 44.1627, lng: 4.6196, label: "Bagnols-sur-Cèze, Francia" },
    "francia": { lat: 46.2276, lng: 2.2137, label: "Francia" },
    "mera": { lat: 43.3833, lng: -8.3333, label: "Mera, España" },
    "paris": { lat: 48.8566, lng: 2.3522, label: "París, Francia" },
    "solares": { lat: 43.3872, lng: -3.7397, label: "Solares, Cantabria" },
    "hobro": { lat: 56.6368, lng: 9.7912, label: "Hobro, Dinamarca" },
    "dinamarca": { lat: 56.2639, lng: 9.5018, label: "Dinamarca" },
    "candelaria": { lat: 3.4074, lng: -76.3477, label: "Candelaria, Valle del Cauca, Colombia" },
    "colombia": { lat: 4.5709, lng: -74.2973, label: "Colombia" },
    "randers": { lat: 56.4608, lng: 10.0364, label: "Randers, Dinamarca" },
    "gentofte": { lat: 55.7500, lng: 12.5500, label: "Gentofte, Dinamarca" },
    "brisbane": { lat: -27.4698, lng: 153.0251, label: "Brisbane, Australia" },
    "aixendios": { lat: 43.5297, lng: 5.4474, label: "Aix-en-Provence, Francia" },
    "marseille": { lat: 43.2965, lng: 5.3698, label: "Marsella, Francia" },
    "wangenimallgau": { lat: 47.6865, lng: 9.8354, label: "Wangen im Allgäu, Alemania" },
    "alemania": { lat: 51.1657, lng: 10.4515, label: "Alemania" },
    "uppsala": { lat: 59.8586, lng: 17.6389, label: "Uppsala, Suecia" },
    "suecia": { lat: 60.1282, lng: 18.6435, label: "Suecia" },
    "albacete": { lat: 38.9943, lng: -1.8585, label: "Albacete, España" },
    "puebladelcalzada": { lat: 38.9135, lng: -6.6267, label: "Puebla de la Calzada, España" },
    "riograndedonorte": { lat: -5.7945, lng: -36.5724, label: "Rio Grande do Norte, Brasil" },

    "monterrey": { lat: 25.6866, lng: -100.3161, label: "Monterrey, México" },
    "alhamademurcia": { lat: 37.8502, lng: -1.4253, label: "Alhama de Murcia, España" },
    "caceres": { lat: 39.4753, lng: -6.3724, label: "Cáceres, España" },
    "innsbruck": { lat: 47.2692, lng: 11.4041, label: "Innsbruck, Austria" },
    "graz": { lat: 47.0707, lng: 15.4395, label: "Graz, Austria" },
    "kharkiv": { lat: 49.9935, lng: 36.2304, label: "Járkov, Ucrania" },
    "roma": { lat: 41.9028, lng: 12.4964, label: "Roma, Italia" },
    "wolfsburgo": { lat: 52.4227, lng: 10.7873, label: "Wolfsburgo, Alemania" },
    "londres": { lat: 51.5074, lng: -0.1278, label: "Londres, Inglaterra" },
    "manchester": { lat: 53.4808, lng: -2.2426, label: "Manchester, Inglaterra" },
    "portugal": { lat: 38.7223, lng: -9.1393, label: "Lisboa, Portugal" },

    "austria": { lat: 48.2082, lng: 16.3738, label: "Viena, Austria" },
    "vienna": { lat: 48.2082, lng: 16.3738, label: "Viena, Austria" },
    "viena": { lat: 48.2082, lng: 16.3738, label: "Viena, Austria" },
    "ucrania": { lat: 50.4501, lng: 30.5234, label: "Kiev, Ucrania" },
    "kiev": { lat: 50.4501, lng: 30.5234, label: "Kiev, Ucrania" },
    "islandia": { lat: 64.1466, lng: -21.9426, label: "Reikiavik, Islandia" },
    "kopavogur": { lat: 64.1107, lng: -21.9056, label: "Kópavogur, Islandia" },
    "ciudaddemexico": { lat: 19.4326, lng: -99.1332, label: "Ciudad de México, México" },



    "lisboa": { lat: 38.7223, lng: -9.1393, label: "Lisboa, Portugal", imageUrl: "/assets/estadios/estadio_aurelio_pereira.png" },
    "london": { lat: 51.5074, lng: -0.1278, label: "Londres, Inglaterra", imageUrl: "/assets/estadios/stamford_bridge.png" },
    "stamfordbridge": { lat: 51.4817, lng: -0.1910, label: "Stamford Bridge, Londres", imageUrl: "/assets/estadios/stamford_bridge.png" },
    "kingsmeadow": { lat: 51.4057, lng: -0.2818, label: "Kingsmeadow, Londres", imageUrl: "/assets/estadios/kingmeadow.png" },
    "parcdesprinces": { lat: 48.8414, lng: 2.2530, label: "Parc des Princes, París", imageUrl: "/assets/estadios/parque_de_los_principes.png" },
    "stadesty": { lat: 48.8351, lng: 2.3488, label: "Stade Charléty, París", imageUrl: "/assets/estadios/estadio_charlety.png" },
    "slask": { lat: 51.1105, lng: 17.0312, label: "Wrocław, Polonia" },
    "oslo": { lat: 59.9139, lng: 10.7522, label: "Oslo, Noruega", imageUrl: "/assets/estadios/intility_arena.png" },
    "valerenga": { lat: 59.9139, lng: 10.7522, label: "Intility Arena, Oslo", imageUrl: "/assets/estadios/intility_arena.png" },
    "twente": { lat: 52.2215, lng: 6.8937, label: "Enschede, Países Bajos", imageUrl: "/assets/estadios/grolsch_veste.png" },
    "enschede": { lat: 52.2215, lng: 6.8937, label: "Enschede, Países Bajos", imageUrl: "/assets/estadios/grolsch_veste.png" },
    "häcken": { lat: 57.7210, lng: 11.9395, label: "Gotemburgo, Suecia", imageUrl: "/assets/estadios/bravida_arena.png" },
    "gotemburgo": { lat: 57.7089, lng: 11.9746, label: "Gotemburgo, Suecia", imageUrl: "/assets/estadios/bravida_arena.png" },
    "kahrkiv": { lat: 49.9935, lng: 36.2304, label: "Járkov, Ucrania", imageUrl: "/assets/estadios/metalist_stadium.png" },
    "breidablik": { lat: 64.1107, lng: -21.9056, label: "Kópavogur, Islandia", imageUrl: "/assets/estadios/kopavogsvollur.png" },
    "lerkendal": { lat: 63.4111, lng: 10.4045, label: "Lerkendal Stadion, Trondheim", imageUrl: "/assets/estadios/lerkendal_stadion.png" },
    "manchestercity": { lat: 53.4831, lng: -2.2004, label: "Joie Stadium, Manchester", imageUrl: "/assets/estadios/manchester_city_joie_stadium.png" },
    "emirates": { lat: 51.5549, lng: -0.1084, label: "Emirates Stadium, Londres", imageUrl: "/assets/estadios/emirates_stadium.png" },
    "meadowpark": { lat: 51.6578, lng: -0.2692, label: "Meadow Park, Borehamwood", imageUrl: "/assets/estadios/meadow_park.png" },
    "newdouglaspark": { lat: 55.7811, lng: -4.0533, label: "New Douglas Park, Hamilton", imageUrl: "/assets/estadios/new_douglas_park.png" },
    "skprosek": { lat: 50.1227, lng: 14.5029, label: "SK Prosek Praha", imageUrl: "/assets/estadios/sk_prosek_praha_stadium.png" },
    "brentanobad": { lat: 50.1264, lng: 8.6256, label: "Stadion am Brentanobad", imageUrl: "/assets/estadios/stadion_am_brentanobad.png" },
    "altenforsterei": { lat: 52.4572, lng: 13.5678, label: "Stadion An der Alten Försterei", imageUrl: "/assets/estadios/stadion_an_der_alten_forsterei.png" },

    "alfredodistefano": {
        lat: 40.4761,
        lng: -3.6197,
        label: "Estadio Alfredo Di Stéfano",
        imageUrl: "/assets/estadios/estadio_alfredo_di_stefano.png"
    },
    "ciudaddelvalencia": { lat: 39.4950, lng: -0.3644, label: "Estadi Ciutat de València", imageUrl: "/assets/estadios/ciutat_de_valencia.png" },
    "johancruyff": { lat: 41.3809, lng: 2.0625, label: "Estadi Johan Cruyff", imageUrl: "/assets/estadios/estadio_johan_cruyff.png" },
    "campnou": { lat: 41.3809, lng: 2.1228, label: "Spotify Camp Nou", imageUrl: "/assets/estadios/spotify_camp_nou.png" },
    "mestalla": { lat: 39.4746, lng: -0.3582, label: "Mestalla" },
    "realearena": { lat: 43.3013, lng: -1.9737, label: "Reale Arena" },
    "zubieta": { lat: 43.2662, lng: -2.0238, label: "Instalaciones de Zubieta", imageUrl: "/assets/estadios/ciudad_deportiva_de_zubieta.png" },
    "lezama": { lat: 43.2721, lng: -2.8398, label: "Instalaciones de Lezama", imageUrl: "/assets/estadios/ciudad_deportiva_de_lezama.png" },
    "sanmames": { lat: 43.2642, lng: -2.9493, label: "San Mamés", imageUrl: "/assets/estadios/san_mames.png" },
    "wandametropolitano": { lat: 40.4362, lng: -3.5995, label: "Cívitas Metropolitano" },
    "alcaladehenares_estadio": { lat: 40.4908, lng: -3.3712, label: "Centro Deportivo Wanda Alcalá", imageUrl: "/assets/estadios/ciudad_deportiva_alcala_de_henares.png" },
    "matanapiñeiro": { lat: 40.5404, lng: -3.6334, label: "CD Municipal Matapiñonera", imageUrl: "/assets/estadios/estadio_nuevo_matapinonera.png" },
    "fernandotorres": { lat: 40.2925, lng: -3.7997, label: "Estadio Fernando Torres", imageUrl: "/assets/estadios/estadio_fernando_torres.png" },
    "antoniopuchades": { lat: 39.5463, lng: -0.4631, label: "Estadio Antonio Puchades", imageUrl: "/assets/estadios/estadio_antonio_puchades.png" },
    "danijarque": { lat: 41.3415, lng: 2.0722, label: "Ciutat Esportiva Dani Jarque", imageUrl: "/assets/estadios/ciudad_deportiva_dani_jarque.png" },
    "jesusnavas": { lat: 37.3541, lng: -5.9556, label: "Estadio Jesús Navas", imageUrl: "/assets/estadios/estadio_jesus_navas.png" },
    "loscarmenes": { lat: 37.1534, lng: -3.5959, label: "Nuevo Los Cármenes", imageUrl: "/assets/estadios/estadio_nuevo_los_carmenes.png" },
    "nuevocolombino": { lat: 37.2476, lng: -6.9538, label: "Nuevo Colombino", imageUrl: "/assets/estadios/estadio_nuevo_colombino.png" },
    "lorden": { lat: 37.2646, lng: -6.9326, label: "Estadio del Club Deportivo Lamiya" },
    "adeje": { lat: 28.1147, lng: -16.7458, label: "Campo Municipal de Adeje", imageUrl: "/assets/estadios/campo_de_futbol_de_adeje.png" },
    "helidoro": { lat: 28.4633, lng: -16.2574, label: "Heliodoro Rodríguez López", imageUrl: "/assets/estadios/estadio_heliodoro_rodriguez.png" },
    "palmer": { lat: 28.0691, lng: -16.7208, label: "Campo Municipal La Palmera", imageUrl: "/assets/estadios/campo_de_futbol_la_palmera.png" },
    "buñol": { lat: 39.4674, lng: -0.7963, label: "Ciudad Deportiva de Buñol", imageUrl: "/assets/estadios/ciudad_deportiva_de_bunol.png" },
    "betis": { lat: 37.3364, lng: -5.9869, label: "Ciudad Deportiva Luis del Sol", imageUrl: "/assets/estadios/ciudad_deportiva_luis_del_sol.png" },
    "villanovense": { lat: 38.9481, lng: -5.8647, label: "Estadio Municipal Villanovense" },
    "badalona": { lat: 41.4503, lng: 2.2474, label: "Estadi Municipal de Badalona", imageUrl: "/assets/estadios/estadi_municipal_badalona.png" },
    "lesplanes": { lat: 41.3734, lng: 2.0622, label: "Campo de Fútbol Les Planes", imageUrl: "/assets/estadios/campo_de_futbol_les_planes.png" },
    "antiguocanodromo": { lat: 40.3803, lng: -3.7380, label: "Centro Deportivo Antiguo Canódromo", imageUrl: "/assets/estadios/centro_deportivo_antiguo_canodromo.png" },
    "granadacf": { lat: 37.2185, lng: -3.6149, label: "Ciudad Deportiva del Granada CF", imageUrl: "/assets/estadios/ciudad_deportiva_del_granada_cf.png" },
    "andresiniesta": { lat: 38.9806, lng: -1.8677, label: "Ciudad Deportiva Andrés Iniesta", imageUrl: "/assets/estadios/ciudad_deportiva_andres_iniesta.png" },
    "abegondo_stadium": { lat: 43.2263, lng: -8.2882, label: "Ciudad Deportiva de Abegondo", imageUrl: "/assets/estadios/ciudad_deportiva_de_abegondo.png" },
    "lasrozas": { lat: 40.5284, lng: -3.8967, label: "Ciudad Deportiva de Las Rozas", imageUrl: "/assets/estadios/ciudad_deportiva_de_las_rozas.png" },
    "joseluiscompanon": { lat: 42.8223, lng: -2.6715, label: "Ciudad Deportiva José Luis Compañón", imageUrl: "/assets/estadios/ciudad_deportiva_jose_luis_companon.png" },
    "rayovallecano": { lat: 40.3733, lng: -3.6121, label: "Ciudad Deportiva Rayo Vallecano", imageUrl: "/assets/estadios/ciudad_deportiva_rayo_vallecano.png" },
    "guadalentin": { lat: 37.7663, lng: -1.4883, label: "Complejo Deportivo Guadalentín", imageUrl: "/assets/estadios/complejo_deportivo_guadalentin.png" },
    "donawitz": { lat: 47.3804, lng: 15.0933, label: "Donawitz Stadium", imageUrl: "/assets/estadios/donawitz_stadium.png" },
    "santodomingo": { lat: 40.3444, lng: -3.8347, label: "Estadio de Santo Domingo", imageUrl: "/assets/estadios/estadio_de_santo_domingo.png" },
    "riazor": { lat: 43.3687, lng: -8.4175, label: "Estadio de Riazor", imageUrl: "/assets/estadios/estadio_de_riazor_abanca.png" },
    "toledosanchez": { lat: 37.2562, lng: -6.9463, label: "Estadio Antonio Toledo Sánchez", imageUrl: "/assets/estadios/estadio_antonio_toledo_sanchez.png" },
    "loroborici": { lat: 42.0673, lng: 19.5033, label: "Estadio Loro Boriçi", imageUrl: "/assets/estadios/estadio_loro_borici.png" },
    "butarque": { lat: 40.3404, lng: -3.7606, label: "Estadio Municipal de Butarque", imageUrl: "/assets/estadios/estadio_municipal_de_butarque.png" },
    "ipurua": { lat: 43.1819, lng: -2.4756, label: "Estadio Municipal de Ipurua", imageUrl: "/assets/estadios/estadio_municipal_de_ipurua.png" },
    "lasgaunas": { lat: 42.4542, lng: -2.4497, label: "Estadio Municipal Las Gaunas", imageUrl: "/assets/estadios/estadio_municipal_las_gaunas.png" },
    "loscuartos": { lat: 28.3908, lng: -16.5516, label: "Estadio Municipal Los Cuartos", imageUrl: "/assets/estadios/estadio_municipal_los_cuartos.png" },
    "montjuic": { lat: 41.3648, lng: 2.1556, label: "Estadi Olímpic Lluís Companys", imageUrl: "/assets/estadios/estadio_olimpico_de_montjuic.png" },
    "romanofouto": { lat: 38.9137, lng: -6.3406, label: "Estadio Romano José Fouto", imageUrl: "/assets/estadios/estadio_romano_jose_fouto.png" },
    "universitario": { lat: 25.7258, lng: -100.3129, label: "Estadio Universitario", imageUrl: "/assets/estadios/estadio_universitario.png" },
    "bayerncampus": { lat: 48.2192, lng: 11.5796, label: "FC Bayern Campus", imageUrl: "/assets/estadios/fc_bayern_campus.png" },
    "elvivero": { lat: 38.8924, lng: -6.9922, label: "IDM El Vivero", imageUrl: "/assets/estadios/idm_el_vivero.png" },
    "tajonar": { lat: 42.7768, lng: -1.6366, label: "Instalaciones de Tajonar", imageUrl: "/assets/estadios/instalaciones_de_tajonar.png" },
    "unbe": { lat: 43.1873, lng: -2.4828, label: "Instalaciones de Uribe", imageUrl: "/assets/estadios/instalaciones_de_unbe.png" },
    "miniestadi": { lat: 39.9531, lng: -0.1044, label: "Mini Estadi (Villarreal) - C.D. José Manuel Llaneza", imageUrl: "/assets/estadios/mini_estadi.png" },
    "camporealmadrid": { lat: 40.4761, lng: -3.6197, label: "Campo 11 Ciudad Real Madrid", imageUrl: "/assets/estadios/campo_11_ciudad_real_madrid.png" },
    "puentecastro": { lat: 42.5847, lng: -5.5458, label: "Campo de Fútbol de Puente Castro", imageUrl: "/assets/estadios/campo_de_futbol_de_puente_castro.png" },
    "campuspsg": { lat: 48.9189, lng: 2.0628, label: "Campus PSG", imageUrl: "/assets/estadios/campus_psg.png" },

    "australia": { lat: -25.2744, lng: 133.7751, label: "Australia" },
    "costarica": { lat: 9.7489, lng: -83.7534, label: "Costa Rica" },
    "vllaznia": { lat: 42.0683, lng: 19.5126, label: "Shkodër, Albania" },
    "shkoder": { lat: 42.0683, lng: 19.5126, label: "Shkodër, Albania" },
    "chelsea": { lat: 51.4816, lng: -0.1910, label: "Londres, Inglaterra" },
    "slaviapraga": { lat: 50.0678, lng: 14.4711, label: "Praga, República Checa" },
    "praga": { lat: 50.0755, lng: 14.4378, label: "Praga, República Checa" },
    "rosenborg": { lat: 63.4305, lng: 10.3951, label: "Trondheim, Noruega" },
    "trondheim": { lat: 63.4305, lng: 10.3951, label: "Trondheim, Noruega" },
    "mancity": { lat: 53.4831, lng: -2.2004, label: "Manchester, Inglaterra" },

    "arsenal": { lat: 51.5549, lng: -0.1084, label: "Londres, Inglaterra" },
    "celtic": { lat: 55.8497, lng: -4.2055, label: "Glasgow, Escocia" },
    "spartapraga": { lat: 50.0993, lng: 14.4172, label: "Praga, República Checa" },
    "frankfurt": { lat: 50.1109, lng: 8.6821, label: "Frankfurt, Alemania" },
    "ingolstadt": { lat: 48.7665, lng: 11.4258, label: "Ingolstadt, Alemania" },
    "granadilla": { lat: 28.0772, lng: -16.7328, label: "Granadilla de Abona, España" },

    "alhama": { lat: 37.8498, lng: -1.4253, label: "Alhama de Murcia, España" },

    "madridcff": { lat: 40.5404, lng: -3.6334, label: "San Sebastián de los Reyes, España" },
    "atletico": { lat: 40.4362, lng: -3.5995, label: "Alcalá de Henares / Madrid" },
    "cdtacon": { lat: 40.4761, lng: -3.6197, label: "Madrid, España" },
    "fcbetis": { lat: 37.3364, lng: -5.9869, label: "Sevilla, España" },
    "sportinghuelva": { lat: 37.2614, lng: -6.9447, label: "Huelva, España" },
    "azteca": { lat: 19.3029, lng: -99.1505, label: "Estadio Azteca, México", imageUrl: "/assets/estadios/estadio_azteca.png" },
    "estadioazteca": { lat: 19.3029, lng: -99.1505, label: "Estadio Azteca, México", imageUrl: "/assets/estadios/estadio_azteca.png" },
    "fuenlabrada": { lat: 40.2853, lng: -3.7950, label: "Fuenlabrada, España" },
    "santjoandespi": { lat: 41.3653, lng: 2.0560, label: "Sant Joan Despí, España" },
    "berlin": { lat: 52.5200, lng: 13.4050, label: "Berlín, Alemania" },
    "munich": { lat: 48.1351, lng: 11.5820, label: "Múnich, Alemania" },
    "campo7": { lat: 40.4761, lng: -3.6197, label: "Campo 7 Ciudad Real Madrid" },
    "campo7ciudadrealmadrid": { lat: 40.4761, lng: -3.6197, label: "Campo 7 Ciudad Real Madrid" },
    "estadiouniversitario": { lat: 25.7247, lng: -100.3113, label: "Estadio Universitario, Monterrey", imageUrl: "/assets/estadios/estadio_universitario.png" },
    "universitario": { lat: 25.7247, lng: -100.3113, label: "Estadio Universitario, Monterrey", imageUrl: "/assets/estadios/estadio_universitario.png" },

    "estadiomunicipaldeipurua": { lat: 43.1819, lng: -2.4756, label: "Estadio Municipal de Ipurua" },
    "sopelana": { lat: 43.3808, lng: -2.9806, label: "Sopelana, Vizcaya" },
    "pozuelo": { lat: 40.4478, lng: -3.8128, label: "Pozuelo de Alarcón, Madrid" },
    "alcorcon": { lat: 40.3458, lng: -3.8249, label: "Alcorcón, Madrid" },
    "urnieta": { lat: 43.2458, lng: -1.9906, label: "Urnieta, Guipúzcoa" },
    "rivasvaciamadrid": { lat: 40.3524, lng: -3.5375, label: "Rivas-Vaciamadrid, Madrid" },
    "lospalaciosyvillafranca": { lat: 37.1623, lng: -5.9242, label: "Los Palacios y Villafranca, Sevilla" },

    "uberlandia": { lat: -18.9186, lng: -48.2772, label: "Uberlândia, Brasil" },
    "xambre": { lat: -23.7380, lng: -53.4752, label: "Xambrê, Brasil" },
    "oschatz": { lat: 51.3000, lng: 13.1167, label: "Oschatz, Alemania" },
    "lyon": { lat: 45.7640, lng: 4.8357, label: "Lyon, Francia" },
    "kristianstad": { lat: 56.0294, lng: 14.1567, label: "Kristianstad, Suecia" },
    "ornskoldsvik": { lat: 63.2905, lng: 18.7130, label: "Örnsköldsvik, Suecia" },
    "aielodemalferit": { lat: 38.8778, lng: -0.5906, label: "Aielo de Malferit, Valencia" },
    "pontevedra": { lat: 42.4299, lng: -8.6446, label: "Pontevedra, España" },
    "terrassa": { lat: 41.5693, lng: 2.0089, label: "Terrassa, Barcelona" },
    "itaugua": { lat: -25.3850, lng: -57.3400, label: "Itauguá, Paraguay" },
    "huescar": { lat: 37.8105, lng: -2.5401, label: "Huéscar, Granada" },
    "massy": { lat: 48.7297, lng: 2.2741, label: "Massy, Francia" },
    "orebro": { lat: 59.2753, lng: 15.2134, label: "Örebro, Suecia" },
    "villanuevadelosinfantes": { lat: 38.7347, lng: -3.0163, label: "Villanueva de los Infantes, Ciudad Real" },
    "saintecolombe": { lat: 45.5266, lng: 4.8697, label: "Sainte-Colombe, Francia" },
    "aviles": { lat: 43.5547, lng: -5.9248, label: "Avilés, Asturias" },
    "paudosferros": { lat: -6.1118, lng: -38.2045, label: "Pau dos Ferros, Brasil" },
    "governadorvaladares": { lat: -18.8512, lng: -41.9470, label: "Governador Valadares, Brasil" },
    "oviedo": { lat: 43.3619, lng: -5.8494, label: "Oviedo, España" },
    "yunqueradehenares": { lat: 40.7389, lng: -3.1672, label: "Yunquera de Henares, Guadalajara" },
    "yecla": { lat: 38.6117, lng: -1.1147, label: "Yecla, Murcia" },
    "orange": { lat: 44.1381, lng: 4.8075, label: "Orange, Francia" },
    "amberg": { lat: 49.4447, lng: 11.8596, label: "Amberg, Alemania" },
    "celle": { lat: 52.6074, lng: 10.0817, label: "Celle, Alemania" },
    "lomma": { lat: 55.6728, lng: 13.0675, label: "Lomma, Suecia" },
    "ikast": { lat: 56.1364, lng: 9.1558, label: "Ikast, Dinamarca" },
    "stockholm": { lat: 59.3293, lng: 18.0686, label: "Estocolmo, Suecia" },
    "guadalajara": { lat: 40.6324, lng: -3.1633, label: "Guadalajara, España" },
    "vleuten": { lat: 52.1070, lng: 5.0133, label: "Vleuten, Países Bajos" },
    "toledo": { lat: 39.8628, lng: -4.0273, label: "Toledo, España" },
    "sanpablodelosmontes": { lat: 39.5447, lng: -4.3314, label: "San Pablo de los Montes, Toledo" },
    "jarandilladelavera": { lat: 40.1264, lng: -5.6606, label: "Jarandilla de la Vera, Cáceres" },
    "huarte": { lat: 42.8290, lng: -1.5976, label: "Huarte, Navarra" },

};

export function normalizeLocationName(name: string | null | undefined): string {
    if (!name) return 'desconocido';
    return name.toString().toLowerCase()
        .trim()
        .replace(/ø/g, 'o')
        .replace(/ö/g, 'o')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '');
}

export interface Coordinates {
    lat: number;
    lng: number;
    label?: string;
    imageUrl?: string;
}

export function getCoordinates(name: string, type: 'city' | 'stadium' = 'city'): Coordinates | null {
    if (!name) return null;
    let normalized = normalizeLocationName(name);

    if (KNOWN_LOCATIONS[normalized]) {
        return KNOWN_LOCATIONS[normalized];
    }

    if (normalized.includes('stefano')) return KNOWN_LOCATIONS['alfredodistefano'];
    if (normalized.includes('johan') || normalized.includes('cruyff')) return KNOWN_LOCATIONS['johancruyff'];
    if (normalized.includes('puchades')) return KNOWN_LOCATIONS['antoniopuchades'];
    if (normalized.includes('dani jarque') || normalized.includes('danijarque')) return KNOWN_LOCATIONS['danijarque'];
    if (normalized.includes('jesus navas') || normalized.includes('jesusnavas')) return KNOWN_LOCATIONS['jesusnavas'];
    if (normalized.includes('camp nou') || normalized.includes('campnou')) return KNOWN_LOCATIONS['campnou'];
    if (normalized.includes('montjuic')) return KNOWN_LOCATIONS['montjuic'];
    if (normalized.includes('stamford')) return KNOWN_LOCATIONS['stamfordbridge'];
    if (normalized.includes('lerkendal')) return KNOWN_LOCATIONS['lerkendal'];
    if (normalized.includes('bayern')) return KNOWN_LOCATIONS['bayerncampus'];
    if (normalized.includes('twente')) return KNOWN_LOCATIONS['twente'];
    if (normalized.includes('hacken') || normalized.includes('braveda')) return KNOWN_LOCATIONS['häcken'];
    if (normalized.includes('paris') || normalized.includes('princes')) return KNOWN_LOCATIONS['parcdesprinces'];
    if (normalized.includes('charlety')) return KNOWN_LOCATIONS['stadesty'];

    if (normalized.includes('ciudad real madrid') || normalized.includes('valdebebas')) return KNOWN_LOCATIONS['alfredodistefano'];

    if (normalized.includes('alcala') && normalized.includes('henares') && (normalized.includes('centro') || normalized.includes('wanda') || type === 'stadium')) {
        return KNOWN_LOCATIONS['alcaladehenares_estadio'];
    }
    if (normalized.includes('matapinonera')) return KNOWN_LOCATIONS['matanapiñeiro'];
    if (normalized.includes('fernando torres')) return KNOWN_LOCATIONS['fernandotorres'];
    if (normalized.includes('antonio puchades')) return KNOWN_LOCATIONS['antoniopuchades'];
    if (normalized.includes('dani jarque') || normalized.includes('jarque')) return KNOWN_LOCATIONS['danijarque'];
    if (normalized.includes('jesus navas')) return KNOWN_LOCATIONS['jesusnavas'];
    if (normalized.includes('nuevos los carmenes') || normalized.includes('loscarmenes')) return KNOWN_LOCATIONS['loscarmenes'];
    if (normalized.includes('colombino')) return KNOWN_LOCATIONS['nuevocolombino'];
    if (normalized.includes('lamiya')) return KNOWN_LOCATIONS['lorden'];
    if (normalized.includes('adeje')) return KNOWN_LOCATIONS['adeje'];
    if (normalized.includes('heliodoro')) return KNOWN_LOCATIONS['helidoro'];
    if (normalized.includes('palmera')) return KNOWN_LOCATIONS['palmer'];
    if (normalized.includes('bunol') || normalized.includes('buñol')) return KNOWN_LOCATIONS['buñol'];
    if (normalized.includes('luis del sol')) return KNOWN_LOCATIONS['betis'];
    if (normalized.includes('villanovense')) return KNOWN_LOCATIONS['villanovense'];
    if (normalized.includes('badalona')) return KNOWN_LOCATIONS['badalona'];
    if (normalized.includes('les planes')) return KNOWN_LOCATIONS['lesplanes'];
    if (normalized.includes('canodromo')) return KNOWN_LOCATIONS['antiguocanodromo'];
    if (normalized.includes('granada cf')) return KNOWN_LOCATIONS['granadacf'];
    if (normalized.includes('andres iniesta')) return KNOWN_LOCATIONS['andresiniesta'];
    if (normalized.includes('abegondo')) return KNOWN_LOCATIONS['abegondo_stadium'];
    if (normalized.includes('las rozas')) return KNOWN_LOCATIONS['lasrozas'];
    if (normalized.includes('jose luis companon')) return KNOWN_LOCATIONS['joseluiscompanon'];
    if (normalized.includes('rayo vallecano')) return KNOWN_LOCATIONS['rayovallecano'];
    if (normalized.includes('guadalentin')) return KNOWN_LOCATIONS['guadalentin'];
    if (normalized.includes('donawitz')) return KNOWN_LOCATIONS['donawitz'];
    if (normalized.includes('santo domingo')) return KNOWN_LOCATIONS['santodomingo'];
    if (normalized.includes('riazor')) return KNOWN_LOCATIONS['riazor'];
    if (normalized.includes('toledo sanchez')) return KNOWN_LOCATIONS['toledosanchez'];
    if (normalized.includes('loro borici')) return KNOWN_LOCATIONS['loroborici'];
    if (normalized.includes('butarque')) return KNOWN_LOCATIONS['butarque'];
    if (normalized.includes('ipurua') || normalized.includes('ipurúa')) return KNOWN_LOCATIONS['ipurua'];
    if (normalized.includes('las gaunas')) return KNOWN_LOCATIONS['lasgaunas'];
    if (normalized.includes('los cuartos')) return KNOWN_LOCATIONS['loscuartos'];
    if (normalized.includes('romano') || normalized.includes('merida')) return KNOWN_LOCATIONS['romanofouto'];
    if (normalized.includes('valencia') && normalized.includes('ciutat')) return KNOWN_LOCATIONS['ciudaddelvalencia'];
    if (normalized.includes('campo 11') || normalized.includes('campo 11 ciudad')) return KNOWN_LOCATIONS['camporealmadrid'];
    if (normalized.includes('campo 7') || normalized.includes('campo 7 ciudad')) return KNOWN_LOCATIONS['campo7'];
    if (normalized.includes('uribe') || normalized.includes('unbe')) return KNOWN_LOCATIONS['unbe'];
    if (normalized.includes('zubieta')) return KNOWN_LOCATIONS['zubieta'];
    if (normalized.includes('lezama')) return KNOWN_LOCATIONS['lezama'];
    if (normalized.includes('vivero') || normalized.includes('elvivero')) return KNOWN_LOCATIONS['elvivero'];
    if (normalized.includes('puente castro')) return KNOWN_LOCATIONS['puentecastro'];
    if (normalized.includes('joie') || normalized.includes('manchester city')) return KNOWN_LOCATIONS['manchestercity'];
    if (normalized.includes('metalist')) return KNOWN_LOCATIONS['kahrkiv'];
    if (normalized.includes('kahrkiv')) return KNOWN_LOCATIONS['kahrkiv'];
    if (normalized.includes('parque de los principes') || normalized.includes('parc des princes')) return KNOWN_LOCATIONS['parcdesprinces'];
    if (normalized.includes('kopavogsvollur')) return KNOWN_LOCATIONS['breidablik'];
    if (normalized.includes('kingmeadow') || normalized.includes('kingsmeadow')) return KNOWN_LOCATIONS['kingsmeadow'];
    if (normalized.includes('tajonar')) return KNOWN_LOCATIONS['tajonar'];
    if (normalized.includes('prosek')) return KNOWN_LOCATIONS['skprosek'];
    if (normalized.includes('intility') || normalized.includes('valerenga')) return KNOWN_LOCATIONS['valerenga'];
    if (normalized.includes('bravida') || normalized.includes('hacken')) return KNOWN_LOCATIONS['häcken'];
    if (normalized.includes('emirates')) return KNOWN_LOCATIONS['emirates'];
    if (normalized.includes('alten forsterei') || normalized.includes('alten försterei')) return KNOWN_LOCATIONS['altenforsterei'];
    if (normalized.includes('brentanobad')) return KNOWN_LOCATIONS['brentanobad'];
    if (normalized.includes('grolsch') || normalized.includes('twente')) return KNOWN_LOCATIONS['twente'];
    if (normalized.includes('aurelio pereira') || (normalized.includes('lisboa') && type === 'stadium')) return KNOWN_LOCATIONS['lisboa'];
    if (normalized.includes('tigres')) return KNOWN_LOCATIONS['universitario'];
    if (normalized.includes('america') && normalized.includes('club')) return KNOWN_LOCATIONS['azteca'];
    if (normalized.includes('america') && normalized.includes('mexico')) return KNOWN_LOCATIONS['azteca'];
    if (normalized === 'america') return KNOWN_LOCATIONS['azteca'];

    if (normalized.includes('candelaria')) return KNOWN_LOCATIONS['candelaria'];
    if (normalized.includes('london') || normalized.includes('londres')) return KNOWN_LOCATIONS['london'];
    if (normalized.includes('sainte') && normalized.includes('colombe')) return KNOWN_LOCATIONS['saintecolombe'];
    if (normalized.includes('ikast')) return KNOWN_LOCATIONS['ikast'];
    if (normalized.includes('stockholm') || normalized.includes('estocolmo')) return KNOWN_LOCATIONS['stockholm'];
    if (normalized.includes('vleuten')) return KNOWN_LOCATIONS['vleuten'];
    if (normalized.includes('guadalajara')) return KNOWN_LOCATIONS['guadalajara'];
    if (normalized.includes('toledo')) return KNOWN_LOCATIONS['toledo'];
    if (normalized.includes('jarandilla')) return KNOWN_LOCATIONS['jarandilladelavera'];
    if (normalized.includes('huarte')) return KNOWN_LOCATIONS['huarte'];
    if (normalized.includes('uberlandia')) return KNOWN_LOCATIONS['uberlandia'];
    if (normalized.includes('xambre')) return KNOWN_LOCATIONS['xambre'];
    if (normalized.includes('oschatz')) return KNOWN_LOCATIONS['oschatz'];
    if (normalized.includes('kristianstad')) return KNOWN_LOCATIONS['kristianstad'];
    if (normalized.includes('ornskoldsvik')) return KNOWN_LOCATIONS['ornskoldsvik'];
    if (normalized.includes('aielo')) return KNOWN_LOCATIONS['aielodemalferit'];
    if (normalized.includes('itaugua')) return KNOWN_LOCATIONS['itaugua'];
    if (normalized.includes('huescar')) return KNOWN_LOCATIONS['huescar'];
    if (normalized.includes('massy')) return KNOWN_LOCATIONS['massy'];
    if (normalized.includes('aviles')) return KNOWN_LOCATIONS['aviles'];
    if (normalized.includes('pau dos ferros') || normalized.includes('paudosferros')) return KNOWN_LOCATIONS['paudosferros'];
    if (normalized.includes('valadares')) return KNOWN_LOCATIONS['governadorvaladares'];
    if (normalized.includes('yunquera')) return KNOWN_LOCATIONS['yunqueradehenares'];
    if (normalized.includes('yecla')) return KNOWN_LOCATIONS['yecla'];
    if (normalized.includes('orange')) return KNOWN_LOCATIONS['orange'];
    if (normalized.includes('amberg')) return KNOWN_LOCATIONS['amberg'];
    if (normalized.includes('celle')) return KNOWN_LOCATIONS['celle'];
    if (normalized.includes('lomma')) return KNOWN_LOCATIONS['lomma'];

    if (normalized.includes('kenti')) return KNOWN_LOCATIONS['mexico'];
    if (normalized.includes('oihane')) return KNOWN_LOCATIONS['sopelana'];

    if (normalized.includes('hernandez') && normalized.includes('oihane')) return KNOWN_LOCATIONS['sopelana'];
    if (normalized.includes('san martin') && normalized.includes('ohiane')) return KNOWN_LOCATIONS['pamplona'];

    if (normalized.includes('andrea') && normalized.includes('alonso')) return KNOWN_LOCATIONS['alcorcon'];
    if (normalized.includes('amaya') && normalized.includes('garcia')) return KNOWN_LOCATIONS['pozuelo'];
    if (normalized.includes('irune') && normalized.includes('dorado')) return KNOWN_LOCATIONS['pozuelo'];
    if (normalized.includes('antonia') && normalized.includes('silva')) return KNOWN_LOCATIONS['paudosferros'];
    if (normalized.includes('lotte')) return KNOWN_LOCATIONS['vleuten'];

    if (normalized.includes('nahikari')) return KNOWN_LOCATIONS['urnieta'];
    if (normalized.includes('misa')) return KNOWN_LOCATIONS['laspalmas'];
    if (normalized.includes('sara') && normalized.includes('lopez')) return KNOWN_LOCATIONS['laspalmas'];
    if (normalized.includes('carla') && normalized.includes('camacho')) return KNOWN_LOCATIONS['rivasvaciamadrid'];
    if (normalized.includes('paula') && normalized.includes('partido')) return KNOWN_LOCATIONS['madrid'];
    if (normalized.includes('maria') && normalized.includes('valle')) return KNOWN_LOCATIONS['lospalaciosyvillafranca'];

    if (normalized === 'valenciacf' || normalized === 'valencia fem' || (normalized.includes('valencia') && type === 'stadium')) {
        return KNOWN_LOCATIONS['antoniopuchades'];
    }

    const stripped = normalized
        .replace('estadi', '')
        .replace('estadio', '')
        .replace('municipal', '')
        .replace('campo', '')
        .replace('ciudaddeportiva', '')
        .replace('clubdeportivo', '')
        .replace('complejodeportivo', '');

    if (KNOWN_LOCATIONS[stripped]) return KNOWN_LOCATIONS[stripped];

    console.warn(`[MAPS] Ubicación desconocida: ${name} (normalized: ${normalized})`);
    return null;
}

export function getCompetitionLogo(name: string): string | null {
    const normalized = normalizeLocationName(name);
    if (normalized.includes('liga')) return '/assets/competiciones/liga_f.png';
    if (normalized.includes('uwcl') || normalized.includes('champions')) return '/assets/competiciones/uwcl.png';
    if (normalized.includes('copa')) return '/assets/competiciones/copa_de_la_reina.png';
    if (normalized.includes('supercopa')) return '/assets/competiciones/supercopa_de_espana.png';
    return null;
}
