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

// Sabores y aromas para catación, basados en la rueda de sabores de la SCA, con frutas y dulces colombianos.
export const DESCRIPTORES_GRUPOS = [
  { grupo: 'Frutos rojos y bayas', items: ['Frutos rojos', 'Fresa', 'Frambuesa', 'Mora', 'Arándano', 'Cereza', 'Grosella', 'Agraz'] },
  { grupo: 'Frutas', items: ['Manzana roja', 'Manzana verde', 'Pera', 'Durazno', 'Albaricoque', 'Ciruela', 'Uva', 'Uva verde', 'Granada', 'Melón', 'Sandía', 'Banano', 'Coco', 'Higo', 'Dátil', 'Kiwi'] },
  { grupo: 'Frutas tropicales', items: ['Piña', 'Mango', 'Maracuyá', 'Papaya', 'Guayaba', 'Lulo', 'Tomate de árbol', 'Uchuva', 'Gulupa', 'Curuba', 'Feijoa', 'Guanábana', 'Lichi', 'Tamarindo', 'Frutas tropicales'] },
  { grupo: 'Cítricos', items: ['Cítrico', 'Naranja', 'Mandarina', 'Limón', 'Lima', 'Toronja', 'Bergamota', 'Cáscara de naranja'] },
  { grupo: 'Frutas secas y maduras', items: ['Pasas', 'Ciruela pasa', 'Uva pasa', 'Fruta madura', 'Mermelada', 'Fruta confitada', 'Dátil seco'] },
  { grupo: 'Fermentado y vinoso', items: ['Vino', 'Vino tinto', 'Vino blanco', 'Vinoso', 'Licor', 'Ron', 'Whisky', 'Brandy', 'Amareto', 'Sidra', 'Kombucha', 'Fermentado', 'Champaña'] },
  { grupo: 'Dulces', items: ['Panela', 'Caramelo', 'Miel', 'Melaza', 'Azúcar morena', 'Azúcar de caña', 'Jarabe de arce', 'Vainilla', 'Arequipe', 'Dulce de leche', 'Toffee', 'Bocadillo', 'Malvavisco', 'Galleta'] },
  { grupo: 'Chocolate y cacao', items: ['Chocolate', 'Chocolate negro', 'Chocolate con leche', 'Cacao', 'Cacao nibs', 'Brownie'] },
  { grupo: 'Nueces y granos', items: ['Nuez', 'Avellana', 'Almendra', 'Maní', 'Macadamia', 'Nuez de nogal', 'Cereal', 'Malta', 'Pan tostado', 'Granola'] },
  { grupo: 'Florales', items: ['Floral', 'Jazmín', 'Rosa', 'Azahar', 'Flor de café', 'Manzanilla', 'Lavanda', 'Hibisco', 'Violeta', 'Madreselva', 'Té negro', 'Té verde', 'Té de limoncillo'] },
  { grupo: 'Especias', items: ['Canela', 'Clavo', 'Nuez moscada', 'Pimienta', 'Anís', 'Cardamomo', 'Jengibre', 'Especiado'] },
  { grupo: 'Lácteos y textura', items: ['Mantequilla', 'Crema', 'Yogur', 'Cremoso', 'Sedoso', 'Jugoso'] },
  { grupo: 'Tostado y otros', items: ['Tostado', 'Tabaco', 'Ahumado', 'Madera', 'Cedro', 'Terroso', 'Herbal', 'Hierbabuena', 'Menta', 'Pasto', 'Vegetal', 'Verde', 'Astringente', 'Amargo', 'Quemado'] },
];

export const DESCRIPTORES = DESCRIPTORES_GRUPOS.flatMap((g) => g.items);
