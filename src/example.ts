import { StaticHashTable, CollisionStrategy } from './MyHashTable';

/**
 * Ejemplos de uso de la Tabla Hash Estática
 * 
 * Este archivo demuestra cómo usar la implementación StaticHashTable
 * con diferentes estrategias de resolución de colisiones.
 */

// Función hash simple para strings
function simpleHash(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  return Math.abs(hash);
}

// Función hash secundaria para double hashing
function secondaryHash(key: string): number {
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Ejemplo básico con LINEAR_PROBING
 */
function ejemploLinearProbing() {
  console.log('=== Ejemplo: LINEAR_PROBING ===\n');

  // Crear tabla hash con saturación progresiva lineal
  const tabla = new StaticHashTable<string, number>({
    numBuckets: 5,           // 5 buckets base
    bucketCapacity: 2,       // 2 elementos por bucket
    primaryHash: simpleHash, // Función hash principal
    strategy: CollisionStrategy.LINEAR_PROBING
  });

  console.log('Insertando elementos...');
  
  // Insertar elementos (algunos causarán colisiones)
  const elementos: [string, number][] = [
    ['manzana', 5],
    ['banana', 3],
    ['naranja', 8],
    ['uva', 2],
    ['pera', 7],
    ['kiwi', 1],
    ['mango', 9]
  ];

  elementos.forEach(([key, value]) => {
    const insertado = tabla.insertar(key, value);
    console.log(`  ${key}: ${value} - ${insertado ? '✓' : '✗ (sin espacio)'}`);
  });

  console.log('\nBuscando elementos...');
  elementos.forEach(([key, _value]) => {
    const valor = tabla.buscar(key);
    console.log(`  ${key}: ${valor !== null ? valor : 'no encontrado'}`);
  });

  console.log('\nEliminando elementos...');
  const eliminado = tabla.eliminar('banana');
  console.log(`  banana eliminado: ${eliminado ? '✓' : '✗'}`);

  console.log('\nEstado final de la tabla:');
  console.log(JSON.stringify(tabla.dump(), null, 2));
}

/**
 * Ejemplo con DOUBLE_HASHING
 */
function ejemploDoubleHashing() {
  console.log('\n=== Ejemplo: DOUBLE_HASHING ===\n');

  // Crear tabla hash con doble dispersión
  const tabla = new StaticHashTable<string, number>({
    numBuckets: 7,           // 7 buckets base
    bucketCapacity: 1,       // 1 elemento por bucket (para ver colisiones)
    primaryHash: simpleHash, // Función hash principal
    secondaryHash: secondaryHash, // Función hash secundaria
    strategy: CollisionStrategy.DOUBLE_HASHING
  });

  console.log('Insertando elementos con double hashing...');
  
  const elementos: [string, number][] = [
    ['clave1', 100],
    ['clave2', 200],
    ['clave3', 300],
    ['clave4', 400],
    ['clave5', 500]
  ];

  elementos.forEach(([key, value]) => {
    const insertado = tabla.insertar(key, value);
    console.log(`  ${key}: ${value} - ${insertado ? '✓' : '✗'}`);
  });

  console.log('\nBuscando elementos...');
  elementos.forEach(([key, _value]) => {
    const valor = tabla.buscar(key);
    console.log(`  ${key}: ${valor !== null ? valor : 'no encontrado'}`);
  });

  console.log('\nEstado de la tabla con double hashing:');
  console.log(JSON.stringify(tabla.dump(), null, 2));
}

/**
 * Ejemplo con SEPARATE_OVERFLOW
 */
function ejemploSeparateOverflow() {
  console.log('\n=== Ejemplo: SEPARATE_OVERFLOW ===\n');

  // Crear tabla hash con área de overflow separada
  const tabla = new StaticHashTable<string, number>({
    numBuckets: 3,           // Solo 3 buckets base
    bucketCapacity: 2,       // 2 elementos por bucket
    primaryHash: simpleHash, // Función hash principal
    strategy: CollisionStrategy.SEPARATE_OVERFLOW,
    overflowSize: 5          // Área de overflow de 5 elementos
  });

  console.log('Insertando elementos (algunos irán a overflow)...');
  
  const elementos: [string, number][] = [
    ['fruta1', 10],
    ['fruta2', 20],
    ['fruta3', 30],
    ['fruta4', 40],
    ['fruta5', 50],
    ['fruta6', 60],
    ['fruta7', 70],
    ['fruta8', 80]
  ];

  elementos.forEach(([key, value]) => {
    const insertado = tabla.insertar(key, value);
    console.log(`  ${key}: ${value} - ${insertado ? '✓' : '✗'}`);
  });

  console.log('\nBuscando elementos...');
  elementos.forEach(([key, _value]) => {
    const valor = tabla.buscar(key);
    console.log(`  ${key}: ${valor !== null ? valor : 'no encontrado'}`);
  });

  console.log('\nEliminando algunos elementos...');
  tabla.eliminar('fruta2');
  tabla.eliminar('fruta5');
  console.log('  fruta2 y fruta5 eliminados');

  console.log('\nEstado final con overflow separado:');
  console.log(JSON.stringify(tabla.dump(), null, 2));
}

/**
 * Ejemplo con CHAINED_LINEAR
 */
function ejemploChainedLinear() {
  console.log('\n=== Ejemplo: CHAINED_LINEAR ===\n');

  // Crear tabla hash con saturación progresiva encadenada
  const tabla = new StaticHashTable<string, number>({
    numBuckets: 4,           // 4 buckets base
    bucketCapacity: 2,       // 2 elementos por bucket
    primaryHash: simpleHash, // Función hash principal
    strategy: CollisionStrategy.CHAINED_LINEAR
  });

  console.log('Insertando elementos con chained linear...');
  
  const elementos: [string, number][] = [
    ['item1', 1000],
    ['item2', 2000],
    ['item3', 3000],
    ['item4', 4000],
    ['item5', 5000],
    ['item6', 6000]
  ];

  elementos.forEach(([key, value]) => {
    const insertado = tabla.insertar(key, value);
    console.log(`  ${key}: ${value} - ${insertado ? '✓' : '✗'}`);
  });

  console.log('\nBuscando elementos...');
  elementos.forEach(([key, _value]) => {
    const valor = tabla.buscar(key);
    console.log(`  ${key}: ${valor !== null ? valor : 'no encontrado'}`);
  });

  console.log('\nEstado de la tabla con chained linear:');
  console.log(JSON.stringify(tabla.dump(), null, 2));
}

/**
 * Ejemplo de comparación de rendimiento entre estrategias
 */
function ejemploComparacionRendimiento() {
  console.log('\n=== Ejemplo: Comparación de Rendimiento ===\n');

  const elementos: [string, number][] = Array.from({ length: 50 }, (_, i) => [`clave${i}`, i * 10] as [string, number]);

  // Función para medir tiempo de inserción
  function medirInsercion(tabla: StaticHashTable<string, number>, elementos: [string, number][]) {
    const inicio = performance.now();
    let exitosos = 0;
    
    elementos.forEach(([key, value]) => {
      if (tabla.insertar(key, value)) exitosos++;
    });
    
    const fin = performance.now();
    return { tiempo: fin - inicio, exitosos };
  }

  // Función para medir tiempo de búsqueda
  function medirBusqueda(tabla: StaticHashTable<string, number>, elementos: [string, number][]) {
    const inicio = performance.now();
    let encontrados = 0;
    
    elementos.forEach(([key, _value]) => {
      if (tabla.buscar(key) !== null) encontrados++;
    });
    
    const fin = performance.now();
    return { tiempo: fin - inicio, encontrados };
  }

  // Probar cada estrategia
  const estrategias = [
    { nombre: 'LINEAR_PROBING', strategy: CollisionStrategy.LINEAR_PROBING },
    { nombre: 'DOUBLE_HASHING', strategy: CollisionStrategy.DOUBLE_HASHING, secondaryHash },
    { nombre: 'SEPARATE_OVERFLOW', strategy: CollisionStrategy.SEPARATE_OVERFLOW },
    { nombre: 'CHAINED_LINEAR', strategy: CollisionStrategy.CHAINED_LINEAR }
  ];

  estrategias.forEach(({ nombre, strategy, secondaryHash: secHash }) => {
    console.log(`\n--- ${nombre} ---`);
    
    const tabla = new StaticHashTable<string, number>({
      numBuckets: 20,
      bucketCapacity: 3,
      primaryHash: simpleHash,
      secondaryHash: secHash,
      strategy
    });

    const insercion = medirInsercion(tabla, elementos);
    const busqueda = medirBusqueda(tabla, elementos);

    console.log(`  Inserción: ${insercion.exitosos}/${elementos.length} elementos en ${insercion.tiempo.toFixed(2)}ms`);
    console.log(`  Búsqueda: ${busqueda.encontrados}/${elementos.length} elementos en ${busqueda.tiempo.toFixed(2)}ms`);
  });
}

/**
 * Ejemplo de uso con tipos personalizados
 */
function ejemploTiposPersonalizados() {
  console.log('\n=== Ejemplo: Tipos Personalizados ===\n');

  // Definir tipos personalizados
  interface Persona {
    nombre: string;
    edad: number;
    email: string;
  }

  interface Producto {
    id: string;
    nombre: string;
    precio: number;
  }

  // Función hash para objetos Persona
  function hashPersona(persona: Persona): number {
    return simpleHash(persona.nombre + persona.email);
  }

  // Función de comparación para objetos Persona
  function equalsPersona(a: Persona, b: Persona): boolean {
    return a.nombre === b.nombre && a.email === b.email;
  }

  // Crear tabla hash para Personas
  const tablaPersonas = new StaticHashTable<Persona, Producto[]>({
    numBuckets: 5,
    bucketCapacity: 2,
    primaryHash: hashPersona,
    equalsFn: equalsPersona,
    strategy: CollisionStrategy.LINEAR_PROBING
  });

  // Crear datos de ejemplo
  const persona1: Persona = { nombre: 'Juan Pérez', edad: 25, email: 'juan@email.com' };
  const persona2: Persona = { nombre: 'María García', edad: 30, email: 'maria@email.com' };
  
  const productos1: Producto[] = [
    { id: 'P1', nombre: 'Laptop', precio: 1200 },
    { id: 'P2', nombre: 'Mouse', precio: 25 }
  ];
  
  const productos2: Producto[] = [
    { id: 'P3', nombre: 'Teclado', precio: 80 }
  ];

  // Insertar datos
  tablaPersonas.insertar(persona1, productos1);
  tablaPersonas.insertar(persona2, productos2);

  console.log('Buscando productos de Juan Pérez:');
  const productosJuan = tablaPersonas.buscar(persona1);
  if (productosJuan) {
    productosJuan.forEach(producto => {
      console.log(`  - ${producto.nombre}: $${producto.precio}`);
    });
  }

  console.log('\nBuscando productos de María García:');
  const productosMaria = tablaPersonas.buscar(persona2);
  if (productosMaria) {
    productosMaria.forEach(producto => {
      console.log(`  - ${producto.nombre}: $${producto.precio}`);
    });
  }
}

// Ejecutar todos los ejemplos
if (typeof window === 'undefined') {
  // Solo ejecutar en Node.js
  ejemploLinearProbing();
  ejemploDoubleHashing();
  ejemploSeparateOverflow();
  ejemploChainedLinear();
  ejemploComparacionRendimiento();
  ejemploTiposPersonalizados();
}

export { 
  ejemploLinearProbing, 
  ejemploDoubleHashing, 
  ejemploSeparateOverflow, 
  ejemploChainedLinear,
  ejemploComparacionRendimiento,
  ejemploTiposPersonalizados
}; 