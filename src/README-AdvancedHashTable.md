# Hash Table Avanzada - Implementación Completa

Esta es una implementación avanzada de una hash table en TypeScript que incluye **6 métodos diferentes de resolución de colisiones**, cada uno con sus propias características, ventajas y desventajas.

## 🎯 Métodos de Resolución de Colisiones Implementados

### 1. **Encadenamiento (Chaining)**
- **Descripción**: Las colisiones se resuelven creando una lista enlazada de elementos en cada bucket
- **Ventajas**: 
  - Simple de implementar
  - Eficiente para cargas altas
  - No hay límite en el número de elementos por bucket
- **Desventajas**: 
  - Uso de memoria adicional para punteros
  - Acceso más lento en casos de muchas colisiones
- **Complejidad**: O(1) promedio, O(n) en el peor caso

### 2. **Saturación Progresiva (Linear Probing)**
- **Descripción**: Cuando hay una colisión, se busca la siguiente posición disponible en la tabla
- **Ventajas**: 
  - Uso eficiente de memoria
  - Acceso directo a elementos
- **Desventajas**: 
  - Puede generar agrupación primaria
  - Rendimiento degrada con factor de carga alto
- **Complejidad**: O(1) promedio, O(n) en el peor caso

### 3. **Saturación Progresiva Encadenada (Chained Linear Probing)**
- **Descripción**: Combina saturación progresiva con encadenamiento para buckets llenos
- **Ventajas**: 
  - Balance entre memoria y rendimiento
  - Reduce la agrupación primaria
- **Desventajas**: 
  - Complejidad adicional
  - Implementación más compleja
- **Complejidad**: O(1) promedio

### 4. **Área de Desborde por Separado (Separate Overflow)**
- **Descripción**: Los elementos que no caben en los buckets principales se almacenan en un área de desborde separada
- **Ventajas**: 
  - Organización clara
  - Fácil de entender
- **Desventajas**: 
  - Acceso adicional a memoria
  - Puede fragmentar la memoria
- **Complejidad**: O(1) promedio

### 5. **Hash Asistido por Tabla (Table Assisted Hash)**
- **Descripción**: Utiliza una función hash secundaria para calcular el incremento en caso de colisión
- **Ventajas**: 
  - Reduce la agrupación
  - Mejor distribución de elementos
- **Desventajas**: 
  - Más cálculos por operación
  - Implementación más compleja
- **Complejidad**: O(1) promedio

### 6. **Hash Extensible (Extendible Hash)**
- **Descripción**: Utiliza un directorio que apunta a buckets, permitiendo división dinámica
- **Ventajas**: 
  - Adaptación automática al tamaño
  - División dinámica de buckets
- **Desventajas**: 
  - Complejidad de implementación
  - Overhead de directorio
- **Complejidad**: O(1) promedio

## 🚀 Características de la Implementación

### Funcionalidades Principales
- ✅ **6 métodos de resolución de colisiones**
- ✅ **Cambio dinámico de método** en tiempo de ejecución
- ✅ **Redimensionamiento automático** cuando el factor de carga supera 0.75
- ✅ **Estadísticas en tiempo real** (tamaño, capacidad, factor de carga)
- ✅ **Operaciones completas**: insertar, buscar, eliminar, limpiar
- ✅ **Visualización interactiva** de la estructura de la tabla

### Características Técnicas
- **Genérica**: Soporta cualquier tipo de clave y valor
- **TypeScript**: Tipado completo para mayor seguridad
- **React**: Componente visualizador interactivo
- **Responsive**: Diseño adaptativo para diferentes dispositivos
- **Animaciones**: Efectos visuales suaves y atractivos

## 📊 Comparación de Métodos

| Método | Memoria | Rendimiento | Simplicidad | Agrupación |
|--------|---------|-------------|-------------|------------|
| Encadenamiento | Media | Alta | Alta | Baja |
| Saturación Progresiva | Baja | Media | Alta | Alta |
| Saturación Encadenada | Media | Alta | Media | Media |
| Área de Desborde | Media | Media | Alta | Baja |
| Hash Asistido | Baja | Alta | Media | Baja |
| Hash Extensible | Alta | Alta | Baja | Baja |

## 🎮 Uso del Visualizador

### Interfaz Principal
1. **Selector de Método**: Cambia entre los 6 métodos de resolución
2. **Panel de Operaciones**: Insertar, buscar, eliminar elementos
3. **Estadísticas**: Información en tiempo real de la tabla
4. **Visualización**: Estructura visual de buckets y elementos
5. **Información**: Descripción detallada de cada método

### Operaciones Disponibles
- **Insertar**: Agrega un nuevo elemento a la tabla
- **Buscar**: Encuentra un elemento por su clave
- **Eliminar**: Remueve un elemento de la tabla
- **Limpiar**: Vacía completamente la tabla

### Características Visuales
- **Buckets**: Visualización clara de cada bucket
- **Elementos**: Clave y valor mostrados separadamente
- **Desborde**: Área especial para elementos de desborde
- **Estadísticas**: Métricas en tiempo real
- **Animaciones**: Efectos suaves en interacciones

## 🔧 Implementación Técnica

### Estructura de Clases
```typescript
// Clase principal
AdvancedHashTable<K, V>

// Enumeración de métodos
enum CollisionResolutionMethod {
  CHAINING = 'encadenamiento',
  LINEAR_PROBING = 'saturacion_progresiva',
  CHAINED_LINEAR_PROBING = 'saturacion_progresiva_encadenada',
  SEPARATE_OVERFLOW = 'area_desborde_separado',
  TABLE_ASSISTED_HASH = 'hash_asistido_tabla',
  EXTENDIBLE_HASH = 'hash_extensible'
}
```

### Métodos Principales
- `set(key, value)`: Inserta un elemento
- `get(key)`: Obtiene un elemento
- `delete(key)`: Elimina un elemento
- `clear()`: Limpia la tabla
- `setMethod(method)`: Cambia el método de resolución
- `getStats()`: Obtiene estadísticas

### Funciones Hash
- **Hash Principal**: Función hash estándar para distribución
- **Hash Secundario**: Para métodos que requieren doble hash
- **Hash Extensible**: Para el método de hash extensible

## 📈 Optimizaciones Implementadas

### Rendimiento
- **Redimensionamiento inteligente**: Solo cuando es necesario
- **Factor de carga optimizado**: 0.75 para balance memoria/rendimiento
- **Funciones hash eficientes**: Cálculos optimizados

### Memoria
- **Gestión dinámica**: Asignación/liberación automática
- **Estructuras eficientes**: Uso mínimo de memoria
- **Cleanup automático**: Limpieza de elementos eliminados

### Usabilidad
- **Interfaz intuitiva**: Fácil de usar
- **Feedback visual**: Mensajes claros de estado
- **Responsive design**: Funciona en cualquier dispositivo

## 🎓 Casos de Uso

### Encadenamiento
- **Ideal para**: Aplicaciones con cargas variables
- **Ejemplo**: Sistema de caché, diccionarios

### Saturación Progresiva
- **Ideal para**: Memoria limitada, acceso rápido
- **Ejemplo**: Tablas de símbolos, índices

### Hash Extensible
- **Ideal para**: Bases de datos, sistemas de archivos
- **Ejemplo**: B-trees, sistemas de archivos

### Hash Asistido por Tabla
- **Ideal para**: Aplicaciones críticas de rendimiento
- **Ejemplo**: Compiladores, motores de búsqueda

## 🔍 Análisis de Rendimiento

### Complejidad Temporal
- **Inserción**: O(1) promedio para todos los métodos
- **Búsqueda**: O(1) promedio para todos los métodos
- **Eliminación**: O(1) promedio para todos los métodos

### Complejidad Espacial
- **Encadenamiento**: O(n + m) donde n = elementos, m = buckets
- **Saturación Progresiva**: O(m) donde m = capacidad
- **Hash Extensible**: O(n + 2^d) donde d = profundidad global

### Factores de Rendimiento
- **Factor de carga**: Afecta directamente el rendimiento
- **Distribución de claves**: Impacta en la eficiencia
- **Tamaño de la tabla**: Balance entre memoria y velocidad

## 🛠️ Extensibilidad

### Agregar Nuevos Métodos
1. Implementar la lógica en `AdvancedHashTable`
2. Agregar el método al enum `CollisionResolutionMethod`
3. Actualizar el visualizador para soportar el nuevo método
4. Agregar documentación y casos de prueba

### Personalización
- **Factor de carga**: Configurable por instancia
- **Capacidad inicial**: Ajustable según necesidades
- **Funciones hash**: Personalizables para casos específicos

## 📚 Referencias

### Algoritmos Implementados
- **Encadenamiento**: Estructura de datos estándar
- **Saturación Progresiva**: Algoritmo clásico de hash
- **Hash Extensible**: Algoritmo avanzado para bases de datos
- **Doble Hash**: Técnica para reducir agrupación

### Bibliografía
- "Introduction to Algorithms" - Cormen, Leiserson, Rivest, Stein
- "The Art of Computer Programming" - Donald Knuth
- "Data Structures and Algorithms" - Aho, Hopcroft, Ullman

## 🎯 Conclusión

Esta implementación proporciona una herramienta educativa y práctica para entender los diferentes métodos de resolución de colisiones en hash tables. Cada método tiene sus propias características que lo hacen ideal para diferentes escenarios de uso.

El visualizador interactivo permite experimentar con cada método y ver cómo se comportan en tiempo real, facilitando el aprendizaje y la comprensión de estos conceptos fundamentales en estructuras de datos. 