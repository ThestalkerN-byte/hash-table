# Tabla Hash Estática - Implementación en TypeScript

##  Descripción
Origen con intereses facultativos para la carrera Análista de sistemas. 

Esta implementación proporciona una **tabla hash estática** con múltiples estrategias de resolución de colisiones. La tabla tiene un tamaño fijo y no se redimensiona dinámicamente, lo que la hace ideal para aplicaciones con restricciones de memoria o donde se requiere un comportamiento predecible.

##  Características Principales

- ✅ **Tamaño fijo**: No rehashing dinámico - comportamiento predecible
- ✅ **Múltiples estrategias de colisiones**: 4 estrategias diferentes implementadas
- ✅ **Buckets con capacidad múltiple**: Cada bucket puede almacenar varios elementos
- ✅ **Área de overflow separada**: Opcional para manejar desbordamientos
- ✅ **Borrado lógico**: Mantiene integridad de cadenas de búsqueda
- ✅ **TypeScript**: Tipado completo y seguro
- ✅ **Documentación extensa**: Comentarios detallados en español

##  Estrategias de Resolución de Colisiones

### 1. LINEAR_PROBING (Saturación Progresiva Lineal)
- **Descripción**: Busca secuencialmente en buckets adyacentes hasta encontrar un espacio libre
- **Ventajas**: Simple de implementar, buena localidad de caché
- **Desventajas**: Puede generar agrupamiento primario
- **Uso**: Ideal para tablas con baja densidad de ocupación

### 2. CHAINED_LINEAR (Saturación Progresiva Encadenada)
- **Descripción**: Mantiene cadenas de elementos en buckets cercanos mediante enlaces
- **Ventajas**: Evita agrupamiento, distribución más uniforme
- **Desventajas**: Mayor complejidad de implementación
- **Uso**: Bueno para tablas con alta densidad de ocupación

### 3. DOUBLE_HASHING (Doble Dispersión)
- **Descripción**: Usa una segunda función hash para calcular el desplazamiento
- **Ventajas**: Distribución muy uniforme, evita agrupamiento
- **Desventajas**: 
  - Requiere función hash secundaria
  - **Mayor overhead**: Cada operación (inserción, búsqueda, eliminación) debe calcular dos funciones hash en lugar de una, lo que incrementa el tiempo de procesamiento. Además, la lógica de doble hashing es más compleja que las estrategias lineales, requiriendo más instrucciones de CPU por operación.
- **Uso**: Excelente para tablas con alta densidad y rendimiento crítico

### 4. SEPARATE_OVERFLOW (Área de Desbordes Separada)
- **Descripción**: Mantiene un área separada para elementos que no caben en buckets base
- **Ventajas**: Mantiene rendimiento en buckets base, fácil de implementar
- **Desventajas**: Puede degradar rendimiento si overflow se llena
- **Uso**: Ideal cuando se quiere mantener rendimiento predecible en operaciones principales

## 📦 Instalación y Uso

### Requisitos
- Node.js 16+ 
- TypeScript 4.5+

### Instalación
```bash
npm install
```

### Uso Básico

```typescript
import { StaticHashTable, CollisionStrategy } from './src/MyHashTable';

// Función hash simple para strings
function simpleHash(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  return Math.abs(hash);
}

// Crear tabla hash con LINEAR_PROBING
const tabla = new StaticHashTable<string, number>({
  numBuckets: 10,           // 10 buckets base
  bucketCapacity: 3,        // 3 elementos por bucket
  primaryHash: simpleHash,  // Función hash principal
  strategy: CollisionStrategy.LINEAR_PROBING
});

// Insertar elementos
tabla.insertar("clave1", 100);
tabla.insertar("clave2", 200);
tabla.insertar("clave3", 300);

// Buscar elementos
const valor = tabla.buscar("clave1"); // 100

// Eliminar elementos
tabla.eliminar("clave2");
```

##  Configuración Avanzada

### Ejemplo con Double Hashing

```typescript
// Función hash secundaria
function secondaryHash(key: string): number {
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
  }
  return Math.abs(hash);
}

const tablaDouble = new StaticHashTable<string, number>({
  numBuckets: 20,
  bucketCapacity: 2,
  primaryHash: simpleHash,
  secondaryHash: secondaryHash,  // Requerido para double hashing
  strategy: CollisionStrategy.DOUBLE_HASHING
});
```

### Ejemplo con Overflow Separado

```typescript
const tablaOverflow = new StaticHashTable<string, number>({
  numBuckets: 5,
  bucketCapacity: 2,
  primaryHash: simpleHash,
  strategy: CollisionStrategy.SEPARATE_OVERFLOW,
  overflowSize: 10  // Área de overflow de 10 elementos
});
```

##  API Completa

### Constructor
```typescript
new StaticHashTable<K, V>(options: HashStaticOptions<K, V>)
```

#### Opciones de Configuración
- `numBuckets`: Número de buckets base (obligatorio)
- `bucketCapacity`: Capacidad de cada bucket (obligatorio)
- `primaryHash`: Función hash principal (obligatorio)
- `secondaryHash`: Función hash secundaria (opcional, requerida para double hashing)
- `strategy`: Estrategia de colisiones (opcional, por defecto: LINEAR_PROBING)
- `overflowSize`: Tamaño del área de overflow (opcional)
- `equalsFn`: Función de comparación de claves (opcional, por defecto: ===)

### Métodos Principales

#### `insertar(key: K, value: V): boolean`
Inserta o actualiza un par clave-valor.
- **Retorna**: `true` si se insertó/actualizó exitosamente, `false` si no hay espacio

#### `buscar(key: K): V | null`
Busca una clave en la tabla.
- **Retorna**: El valor asociado o `null` si no existe

#### `eliminar(key: K): boolean`
Elimina (marca como borrado) una clave.
- **Retorna**: `true` si se eliminó exitosamente, `false` si no existía

#### `dump(): unknown`
Genera un volcado completo del estado interno de la tabla.
- **Retorna**: Objeto con toda la información de buckets, overflow y estados

##  Visualización

El proyecto incluye componentes de visualización para mostrar el estado interno de la tabla hash:

- `HashTableVisualizer`: Visualización básica
- `AdvancedHashTableVisualizer`: Visualización avanzada con más detalles

##  Análisis de Rendimiento

### Complejidad Temporal

| Operación | Mejor Caso | Caso Promedio | Peor Caso |
|-----------|------------|---------------|-----------|
| Inserción | O(1) | O(1) | O(n) |
| Búsqueda  | O(1) | O(1) | O(n) |
| Eliminación| O(1) | O(1) | O(n) |

### Factores que Afectan el Rendimiento

1. **Factor de carga**: `elementos_totales / (numBuckets * bucketCapacity)`
2. **Calidad de la función hash**: Distribución uniforme
3. **Estrategia de colisiones**: Impacto en agrupamiento
4. **Patrón de acceso**: Secuencial vs aleatorio

##  Testing

```typescript
// Ejemplo de test básico
describe('StaticHashTable', () => {
  it('debe insertar y buscar elementos correctamente', () => {
    const tabla = new StaticHashTable<string, number>({
      numBuckets: 5,
      bucketCapacity: 2,
      primaryHash: (key) => key.length
    });

    expect(tabla.insertar("test", 123)).toBe(true);
    expect(tabla.buscar("test")).toBe(123);
  });
});
```

##  Notas de Implementación

### Borrado Lógico
La implementación usa borrado lógico para mantener la integridad de las cadenas de búsqueda. Los elementos eliminados se marcan pero no se eliminan físicamente.

### Manejo de Números Negativos
La función `mod()` maneja correctamente números negativos para evitar índices inválidos.

### Overflow Separado
El área de overflow se inicializa automáticamente con un tamaño de `max(4, numBuckets/2)` si no se especifica.

##  Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

##  Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

##  Soporte

Si tienes preguntas o problemas:

1. Revisa la documentación en el código
2. Consulta los ejemplos de uso
3. Abre un issue en GitHub

---

**Desarrollado con ❤️ en TypeScript - thestalkerN-Germán Campodónico**
