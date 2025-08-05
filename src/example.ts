import { HashTable } from './HashTable';

// Ejemplo de uso de la HashTable
function ejemploHashTable() {
  console.log('=== Ejemplo de HashTable ===\n');

  // Crear una nueva hash table
  const hashTable = new HashTable<string, number>();

  // Insertar elementos
  console.log('Insertando elementos...');
  hashTable.set('manzana', 5);
  hashTable.set('banana', 3);
  hashTable.set('naranja', 8);
  hashTable.set('uva', 2);

  // Mostrar el tamaño
  console.log(`Tamaño de la hash table: ${hashTable.getSize()}`);

  // Obtener valores
  console.log('\nObteniendo valores:');
  console.log(`manzana: ${hashTable.get('manzana')}`);
  console.log(`banana: ${hashTable.get('banana')}`);
  console.log(`pera: ${hashTable.get('pera')}`); // No existe

  // Verificar existencia
  console.log('\nVerificando existencia:');
  console.log(`¿Existe 'manzana'? ${hashTable.has('manzana')}`);
  console.log(`¿Existe 'pera'? ${hashTable.has('pera')}`);

  // Actualizar valor
  console.log('\nActualizando valor...');
  hashTable.set('manzana', 10);
  console.log(`manzana después de actualizar: ${hashTable.get('manzana')}`);

  // Mostrar todas las claves y valores
  console.log('\nTodas las claves:', hashTable.keys());
  console.log('Todos los valores:', hashTable.values());

  // Mostrar todas las entradas
  console.log('\nTodas las entradas:');
  hashTable.entries().forEach(({ key, value }) => {
    console.log(`  ${key}: ${value}`);
  });

  // Eliminar elemento
  console.log('\nEliminando elemento...');
  const eliminado = hashTable.delete('banana');
  console.log(`¿Se eliminó 'banana'? ${eliminado}`);
  console.log(`Tamaño después de eliminar: ${hashTable.getSize()}`);

  // Mostrar representación en string
  console.log('\nRepresentación en string:');
  console.log(hashTable.toString());

  // Limpiar hash table
  console.log('\nLimpiando hash table...');
  hashTable.clear();
  console.log(`¿Está vacía? ${hashTable.isEmpty()}`);
  console.log(`Tamaño: ${hashTable.getSize()}`);
}

// Ejemplo con diferentes tipos de datos
function ejemploConDiferentesTipos() {
  console.log('\n=== Ejemplo con diferentes tipos ===\n');

  // Hash table con números como claves
  const numerosHash = new HashTable<number, string>();
  numerosHash.set(1, 'uno');
  numerosHash.set(2, 'dos');
  numerosHash.set(3, 'tres');

  console.log('Hash table con números como claves:');
  console.log(`1: ${numerosHash.get(1)}`);
  console.log(`2: ${numerosHash.get(2)}`);

  // Hash table con objetos como valores
  interface Persona {
    nombre: string;
    edad: number;
  }

  const personasHash = new HashTable<string, Persona>();
  personasHash.set('juan', { nombre: 'Juan Pérez', edad: 25 });
  personasHash.set('maria', { nombre: 'María García', edad: 30 });

  console.log('\nHash table con objetos como valores:');
  console.log('juan:', personasHash.get('juan'));
  console.log('maria:', personasHash.get('maria'));
}

// Ejecutar ejemplos
if (typeof window === 'undefined') {
  // Solo ejecutar en Node.js
  ejemploHashTable();
  ejemploConDiferentesTipos();
}

export { ejemploHashTable, ejemploConDiferentesTipos }; 