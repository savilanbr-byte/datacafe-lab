// Listas de apoyo. Los campos que las usan también aceptan texto libre,
// así que no hace falta que estén completas. Pendiente: lista oficial completa de municipios (DANE/DIVIPOLA).

export const MUNICIPIOS = {
  'Antioquia': ['Andes', 'Betania', 'Ciudad Bolívar', 'Concordia', 'Fredonia', 'Jardín', 'Salgar', 'Támesis', 'Urrao', 'Venecia'],
  'Boyacá': ['Moniquirá', 'Miraflores', 'Pauna', 'San José de Pare', 'Zetaquira'],
  'Caldas': ['Aguadas', 'Anserma', 'Chinchiná', 'Manizales', 'Neira', 'Palestina', 'Riosucio', 'Salamina', 'Supía', 'Villamaría'],
  'Caquetá': ['Belén de los Andaquíes', 'Florencia', 'San Vicente del Caguán'],
  'Casanare': ['Aguazul', 'Támara', 'Yopal'],
  'Cauca': ['Cajibío', 'El Tambo', 'Inzá', 'La Sierra', 'Morales', 'Piendamó', 'Popayán', 'Timbío', 'Totoró'],
  'Cesar': ['Agustín Codazzi', 'Pueblo Bello', 'Valledupar'],
  'Cundinamarca': ['Fusagasugá', 'La Mesa', 'Silvania', 'Viotá', 'Yacopí'],
  'Huila': ['Acevedo', 'Garzón', 'Gigante', 'La Argentina', 'La Plata', 'Palestina', 'Pitalito', 'San Agustín', 'Suaza', 'Timaná'],
  'La Guajira': ['Dibulla', 'San Juan del Cesar', 'Urumita'],
  'Magdalena': ['Ciénaga', 'Santa Marta', 'Zona Bananera'],
  'Meta': ['Cubarral', 'Granada', 'Lejanías', 'Mesetas'],
  'Nariño': ['Buesaco', 'Consacá', 'El Tablón de Gómez', 'La Unión', 'Pasto', 'Sandoná', 'San Lorenzo'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Salazar', 'Toledo'],
  'Putumayo': ['Mocoa', 'Villagarzón'],
  'Quindío': ['Armenia', 'Buenavista', 'Calarcá', 'Córdoba', 'Filandia', 'Génova', 'Pijao', 'Salento'],
  'Risaralda': ['Apía', 'Balboa', 'Belén de Umbría', 'Guática', 'Pereira', 'Quinchía', 'Santa Rosa de Cabal', 'Santuario'],
  'Santander': ['Barichara', 'El Socorro', 'Rionegro', 'San Gil', 'San Vicente de Chucurí'],
  'Tolima': ['Ataco', 'Chaparral', 'Fresno', 'Ibagué', 'Líbano', 'Planadas', 'Rioblanco', 'Rovira'],
  'Valle del Cauca': ['Caicedonia', 'El Cairo', 'Sevilla', 'Trujillo', 'Tuluá'],
};

export const DEPARTAMENTOS = Object.keys(MUNICIPIOS);

export const VARIEDADES = ['Castillo', 'Caturra', 'Colombia', 'Cenicafé 1', 'Típica', 'Borbón', 'Pink Bourbon', 'Geisha', 'Tabi', 'Maragogipe', 'Sidra', 'Wush Wush'];

export const PROCESOS = ['Lavado', 'Honey', 'Natural'];

export const DESCRIPTORES = [
  'Manzana roja', 'Caramelo', 'Panela', 'Chocolate', 'Cacao', 'Pasas', 'Frutos rojos', 'Fresa', 'Cítrico', 'Mandarina',
  'Durazno', 'Floral', 'Jazmín', 'Miel', 'Nuez', 'Vainilla', 'Amareto', 'Vino',
];
