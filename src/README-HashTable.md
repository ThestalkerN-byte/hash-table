# HashTable - Implementación Básica en TypeScript

Esta es una implementación básica de una hash table (tabla hash) en TypeScript que utiliza encadenamiento para manejar colisiones.

## Características

- **Genérica**: Soporta cualquier tipo de clave y valor
- **Encadenamiento**: Maneja colisiones usando listas enlazadas
- **Redimensionamiento automático**: Se redimensiona cuando el factor de carga supera 0.75
- **Operaciones básicas**: Insertar, obtener, eliminar, verificar existencia
- **Métodos de utilidad**: Obtener claves, valores, entradas, limpiar tabla

## Uso Básico

```typescript
import { HashTable } from './HashTable';

// Crear una nueva hash table
const hashTable = new HashTable<string, number>();

// Insertar elementos
hashTable.set('manzana', 5);
hashTable.set('banana', 3);

// Obtener valores
console.log(hashTable.get('manzana')); // 5
console.log(hashTable.get('pera')); // undefined

// Verificar existencia
console.log(hashTable.has('manzana')); // true
console.log(hashTable.has('pera')); // false

// Eliminar elemento
hashTable.delete('banana');

// Obtener tamaño
console.log(hashTable.getSize()); // 1
```

## Métodos Disponibles

### Constructor
```typescript
new HashTable<K, V>(capacity?: number)
```
- `capacity`: Capacidad inicial (por defecto 16)

### Métodos Principales

- `set(key: K, value: V): void` - Inserta o actualiza un par clave-valor
- `get(key: K): V | undefined` - Obtiene el valor asociado a una clave
- `has(key: K): boolean` - Verifica si una clave existe
- `delete(key: K): boolean` - Elimina un par clave-valor
- `clear(): void` - Limpia todos los elementos
- `getSize(): number` - Retorna el número de elementos
- `isEmpty(): boolean` - Verifica si la tabla está vacía

### Métodos de Utilidad

- `keys(): K[]` - Retorna todas las claves
- `values(): V[]` - Retorna todos los valores
- `entries(): Array<{key: K, value: V}>` - Retorna todos los pares clave-valor
- `toString(): string` - Retorna una representación en string

## Ejemplos de Uso

### Con Strings y Números
```typescript
const frutas = new HashTable<string, number>();
frutas.set('manzana', 5);
frutas.set('banana', 3);
frutas.set('naranja', 8);

console.log(frutas.get('manzana')); // 5
console.log(frutas.keys()); // ['manzana', 'banana', 'naranja']
```

### Con Números como Claves
```typescript
const numeros = new HashTable<number, string>();
numeros.set(1, 'uno');
numeros.set(2, 'dos');
numeros.set(3, 'tres');

console.log(numeros.get(1)); // 'uno'
```

### Con Objetos como Valores
```typescript
interface Persona {
  nombre: string;
  edad: number;
}

const personas = new HashTable<string, Persona>();
personas.set('juan', { nombre: 'Juan Pérez', edad: 25 });
personas.set('maria', { nombre: 'María García', edad: 30 });

console.log(personas.get('juan')); // { nombre: 'Juan Pérez', edad: 25 }
```

## Implementación Técnica

### Función Hash
Utiliza una función hash simple basada en el algoritmo djb2:
- Convierte la clave a string
- Calcula un hash usando operaciones de bits
- Aplica módulo para obtener el índice del bucket

### Manejo de Colisiones
- Utiliza **encadenamiento** (chaining)
- Cada bucket es un array de pares clave-valor
- Las colisiones se resuelven agregando elementos al mismo bucket

### Redimensionamiento
- Factor de carga máximo: 0.75
- Cuando se supera, la capacidad se duplica
- Todos los elementos se reinsertan en la nueva tabla

## Complejidad Temporal

- **Inserción**: O(1) promedio, O(n) en el peor caso
- **Búsqueda**: O(1) promedio, O(n) en el peor caso
- **Eliminación**: O(1) promedio, O(n) en el peor caso

## Ejecutar Ejemplos

Para ejecutar los ejemplos incluidos:

```bash
# Compilar TypeScript
npx tsc src/example.ts --outDir dist

# Ejecutar
node dist/example.js
```

O si tienes ts-node instalado:

```bash
npx ts-node src/example.ts
``` 