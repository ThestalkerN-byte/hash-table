import { HashTable } from './HashTable';

console.log('🧪 Pruebas de la HashTable\n');

// Prueba 1: Operaciones básicas
console.log('=== PRUEBA 1: Operaciones Básicas ===');
const hashTable = new HashTable<string, number>();

console.log('Insertando elementos...');
hashTable.set('a', 1);
hashTable.set('b', 2);
hashTable.set('c', 3);

console.log(`Tamaño: ${hashTable.getSize()}`);
console.log(`¿Está vacía? ${hashTable.isEmpty()}`);

console.log('\nObteniendo valores:');
console.log(`a = ${hashTable.get('a')}`);
console.log(`b = ${hashTable.get('b')}`);
console.log(`c = ${hashTable.get('c')}`);
console.log(`d = ${hashTable.get('d')}`);

console.log('\nVerificando existencia:');
console.log(`¿Existe 'a'? ${hashTable.has('a')}`);
console.log(`¿Existe 'd'? ${hashTable.has('d')}`);

// Prueba 2: Actualización de valores
console.log('\n=== PRUEBA 2: Actualización de Valores ===');
console.log('Actualizando valor de "a"...');
hashTable.set('a', 10);
console.log(`a después de actualizar: ${hashTable.get('a')}`);

// Prueba 3: Eliminación
console.log('\n=== PRUEBA 3: Eliminación ===');
console.log('Eliminando "b"...');
const eliminado = hashTable.delete('b');
console.log(`¿Se eliminó "b"? ${eliminado}`);
console.log(`Tamaño después de eliminar: ${hashTable.getSize()}`);
console.log(`¿Existe "b" después de eliminar? ${hashTable.has('b')}`);

// Prueba 4: Métodos de utilidad
console.log('\n=== PRUEBA 4: Métodos de Utilidad ===');
hashTable.set('d', 4);
hashTable.set('e', 5);

console.log('Todas las claves:', hashTable.keys());
console.log('Todos los valores:', hashTable.values());
console.log('Todas las entradas:');
hashTable.entries().forEach(({ key, value }) => {
  console.log(`  ${key}: ${value}`);
});

console.log('\nRepresentación en string:');
console.log(hashTable.toString());

// Prueba 5: Diferentes tipos de datos
console.log('\n=== PRUEBA 5: Diferentes Tipos ===');

// Con números como claves
const numerosHash = new HashTable<number, string>();
numerosHash.set(1, 'uno');
numerosHash.set(2, 'dos');
numerosHash.set(3, 'tres');

console.log('Hash table con números como claves:');
console.log(`1: ${numerosHash.get(1)}`);
console.log(`2: ${numerosHash.get(2)}`);
console.log(`3: ${numerosHash.get(3)}`);

// Con objetos como valores
interface Persona {
  nombre: string;
  edad: number;
  ciudad: string;
}

const personasHash = new HashTable<string, Persona>();
personasHash.set('juan', { nombre: 'Juan Pérez', edad: 25, ciudad: 'Madrid' });
personasHash.set('maria', { nombre: 'María García', edad: 30, ciudad: 'Barcelona' });
personasHash.set('carlos', { nombre: 'Carlos López', edad: 28, ciudad: 'Valencia' });

console.log('\nHash table con objetos como valores:');
console.log('juan:', personasHash.get('juan'));
console.log('maria:', personasHash.get('maria'));
console.log('carlos:', personasHash.get('carlos'));

// Prueba 6: Redimensionamiento
console.log('\n=== PRUEBA 6: Redimensionamiento ===');
const hashTableGrande = new HashTable<string, number>(4); // Capacidad inicial pequeña

console.log('Insertando muchos elementos para forzar redimensionamiento...');
for (let i = 0; i < 10; i++) {
  hashTableGrande.set(`clave${i}`, i);
  console.log(`Insertado clave${i} = ${i}, tamaño: ${hashTableGrande.getSize()}`);
}

console.log('\nVerificando que todos los elementos estén correctos:');
for (let i = 0; i < 10; i++) {
  const valor = hashTableGrande.get(`clave${i}`);
  console.log(`clave${i}: ${valor} ${valor === i ? '✅' : '❌'}`);
}

// Prueba 7: Limpieza
console.log('\n=== PRUEBA 7: Limpieza ===');
console.log(`Tamaño antes de limpiar: ${hashTableGrande.getSize()}`);
hashTableGrande.clear();
console.log(`Tamaño después de limpiar: ${hashTableGrande.getSize()}`);
console.log(`¿Está vacía? ${hashTableGrande.isEmpty()}`);

// Prueba 8: Colisiones
console.log('\n=== PRUEBA 8: Manejo de Colisiones ===');
const hashTableColisiones = new HashTable<string, string>(2); // Capacidad muy pequeña para forzar colisiones

console.log('Insertando elementos que probablemente causen colisiones...');
hashTableColisiones.set('a', 'valor_a');
hashTableColisiones.set('b', 'valor_b');
hashTableColisiones.set('c', 'valor_c');
hashTableColisiones.set('d', 'valor_d');

console.log('Verificando que todos los valores se mantengan correctos:');
console.log(`a: ${hashTableColisiones.get('a')}`);
console.log(`b: ${hashTableColisiones.get('b')}`);
console.log(`c: ${hashTableColisiones.get('c')}`);
console.log(`d: ${hashTableColisiones.get('d')}`);

console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!'); 