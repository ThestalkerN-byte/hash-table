/**
 * Implementación de una Tabla Hash Estática con múltiples estrategias de resolución de colisiones
 *
 * Esta clase proporciona una implementación completa de una tabla hash estática que soporta
 * diferentes estrategias para manejar colisiones. La tabla tiene un tamaño fijo y no se
 * redimensiona dinámicamente, lo que la hace ideal para aplicaciones con restricciones
 * de memoria o donde se requiere un comportamiento predecible.
 *
 * Características principales:
 * - Tamaño fijo de buckets (no rehashing dinámico)
 * - Múltiples estrategias de resolución de colisiones
 * - Soporte para buckets con capacidad múltiple
 * - Área de overflow separada opcional
 * - Borrado lógico para mantener integridad de datos
 */

// Tipo de función de hash: recibe una clave y devuelve un número (entero >=0)
// Esta función debe ser determinística y distribuir uniformemente las claves
type HashFn<K> = (key: K) => number

/**
 * Estrategias de resolución de colisiones disponibles
 *
 * - LINEAR_PROBING: Saturación progresiva lineal - busca secuencialmente en buckets adyacentes
 * - CHAINED_LINEAR: Saturación progresiva encadenada - mantiene cadenas de elementos en buckets cercanos
 * - DOUBLE_HASHING: Doble dispersión - usa una segunda función hash para el desplazamiento
 * - SEPARATE_OVERFLOW: Área de desbordes separada - almacena elementos que no caben en buckets base
 */
export enum CollisionStrategy {
  LINEAR_PROBING = 'LINEAR_PROBING', // saturación progresiva
  CHAINED_LINEAR = 'CHAINED_LINEAR', // saturación progresiva encadenada (cadena explícita)
  DOUBLE_HASHING = 'DOUBLE_HASHING', // doble dispersión
  SEPARATE_OVERFLOW = 'SEPARATE_OVERFLOW' // área de desbordes separada
}

/**
 * Entrada almacenada en un bucket o en overflow
 *
 * Representa un par clave-valor almacenado en la tabla hash.
 * Incluye metadatos adicionales según la estrategia de colisiones utilizada.
 */
interface Entry<K, V> {
  key: K // Clave del elemento
  value: V // Valor asociado a la clave
  next?: number // Para CHAINED_LINEAR: índice del siguiente en la cadena, -1 si no tiene
  deleted?: boolean // Marca de borrado lógico (para probing - evita romper cadenas de búsqueda)
}

/**
 * Opciones para construir la tabla estática
 *
 * Define todos los parámetros necesarios para configurar la tabla hash
 * según los requisitos específicos de la aplicación.
 */
interface HashStaticOptions<K> {
  numBuckets: number // Cantidad fija de buckets base (tamaño de la tabla)
  bucketCapacity: number // Cuántos registros caben en cada bucket antes de overflow
  primaryHash: HashFn<K> // Función principal de hash (obligatoria)
  secondaryHash?: HashFn<K> // Función secundaria (necesaria para doble hashing)
  strategy?: CollisionStrategy // Estrategia de colisiones (por defecto: LINEAR_PROBING)
  overflowSize?: number // Tamaño del área separada de overflow
  equalsFn?: (a: K, b: K) => boolean // Comparación de claves (por defecto: ===)
}

/**
 * Tabla Hash Estática con múltiples estrategias de resolución de colisiones
 *
 * Esta implementación proporciona una tabla hash de tamaño fijo que no se redimensiona
 * dinámicamente. Es ideal para aplicaciones donde se requiere un comportamiento
 * predecible y controlado del uso de memoria.
 *
 * @template K - Tipo de la clave
 * @template V - Tipo del valor
 */
export class StaticHashTable<K, V> {
  private buckets: Array<Array<Entry<K, V>>> // Buckets base - cada bucket puede contener múltiples elementos
  private overflow: Array<Entry<K, V> | null> // Área de overflow separada para elementos que no caben en buckets base
  private strategy: CollisionStrategy // Estrategia de resolución de colisiones activa
  private primaryHash: HashFn<K> // Función hash principal
  private secondaryHash?: HashFn<K> // Función hash secundaria (para double hashing)
  private bucketCapacity: number // Capacidad máxima de cada bucket
  private numBuckets: number // Número total de buckets base
  private overflowSize: number // Tamaño del área de overflow
  private equalsFn: (a: K, b: K) => boolean // Función de comparación de claves

  /**
   * Constructor de la tabla hash estática
   *
   * Inicializa la tabla con los parámetros especificados y prepara las estructuras
   * de datos necesarias según la estrategia de colisiones elegida.
   *
   * @param opts - Opciones de configuración para la tabla
   */
  constructor (opts: HashStaticOptions<K>) {
    this.numBuckets = opts.numBuckets
    this.bucketCapacity = opts.bucketCapacity
    this.primaryHash = opts.primaryHash
    this.secondaryHash = opts.secondaryHash
    this.strategy = opts.strategy ?? CollisionStrategy.LINEAR_PROBING
    this.equalsFn = opts.equalsFn ?? ((a, b) => a === b)

    // Inicializo buckets vacíos - cada bucket es un array que puede contener múltiples elementos
    this.buckets = new Array(this.numBuckets)
    for (let i = 0; i < this.numBuckets; i++) {
      this.buckets[i] = []
    }

    // Overflow separado - área adicional para elementos que no caben en buckets base
    this.overflowSize =
      opts.overflowSize ?? Math.max(4, Math.floor(this.numBuckets / 2))
    this.overflow = new Array(this.overflowSize).fill(null)
  }

  /**
   * Módulo seguro para índices (maneja negativos correctamente)
   *
   * Implementa el operador módulo de manera que funcione correctamente con
   * números negativos, lo cual es importante para las funciones de hash.
   *
   * @param n - Número a procesar
   * @param m - Módulo
   * @returns n mod m (siempre positivo)
   */
  private mod (n: number, m: number): number {
    return ((n % m) + m) % m
  }

  /**
   * Cálculo de índice de probing según estrategia
   *
   * Calcula el índice donde buscar/insertar un elemento basándose en la
   * estrategia de resolución de colisiones configurada.
   *
   * @param key - Clave del elemento
   * @param attempt - Número de intento (0 = posición inicial, 1 = primer desplazamiento, etc.)
   * @returns Índice calculado para el intento especificado
   */
  private probeIndex (key: K, attempt: number): number {
    const h1 = this.mod(this.primaryHash(key), this.numBuckets)

    if (this.strategy === CollisionStrategy.DOUBLE_HASHING) {
      if (!this.secondaryHash) {
        throw new Error('Se requiere secondaryHash para double hashing.')
      }
      // Segunda función produce desplazamiento; evitar 0 para evitar ciclos
      let h2 = this.mod(this.secondaryHash(key), this.numBuckets)
      if (h2 === 0) h2 = 1
      return this.mod(h1 + attempt * h2, this.numBuckets)
    }

    // Linear probing / saturación progresiva: desplazamiento lineal
    return this.mod(h1 + attempt, this.numBuckets)
  }

  /**
   * Inserta o actualiza una clave/valor en la tabla
   *
   * Esta operación puede:
   * - Insertar un nuevo par clave-valor si la clave no existe
   * - Actualizar el valor si la clave ya existe
   * - Fallar si no hay espacio disponible (tabla llena)
   *
   * La implementación varía según la estrategia de colisiones:
   *
   * - LINEAR_PROBING/DOUBLE_HASHING: Busca secuencialmente en buckets adyacentes
   * - CHAINED_LINEAR: Mantiene cadenas de elementos en buckets cercanos
   * - SEPARATE_OVERFLOW: Usa área de overflow separada cuando buckets base están llenos
   *
   * @param key - Clave a insertar/actualizar
   * @param value - Valor asociado a la clave
   * @returns true si se pudo insertar o actualizar, false si falló por falta de espacio
   */
  insertar (key: K, value: V): boolean {
    const baseIdx = this.mod(this.primaryHash(key), this.numBuckets)

    switch (this.strategy) {
      case CollisionStrategy.LINEAR_PROBING:
      case CollisionStrategy.DOUBLE_HASHING: {
        // Probing explícito sobre buckets (no rehash dinámico)
        // Recorremos todos los buckets posibles hasta encontrar un lugar
        for (let i = 0; i < this.numBuckets; i++) {
          const idx = this.probeIndex(key, i)
          const bucket = this.buckets[idx]

          // Si ya existe la clave no borrada, actualizo el valor
          for (const e of bucket) {
            if (!e.deleted && this.equalsFn(e.key, key)) {
              e.value = value
              return true
            }
          }

          // Si hay espacio en el bucket base, inserto aquí
          if (bucket.length < this.bucketCapacity) {
            bucket.push({ key, value })
            return true
          }
          // Si no hay espacio, sigo con el siguiente intento de probing
        }
        // No se encontró lugar: tabla llena bajo esta estrategia
        return false
      }

      case CollisionStrategy.CHAINED_LINEAR: {
        /**
         * Saturación progresiva encadenada:
         * Cada bucket puede enlazar a otro en overflow cercano mediante `next`.
         * La implementación mantiene, por simplificación, que cada bucket base
         * tiene una "cadena" que puede extenderse buscando bucket cercano libre.
         */
        const cursor = baseIdx
        const visited = new Set<number>()

        while (!visited.has(cursor)) {
          visited.add(cursor)
          const bucket = this.buckets[cursor]

          // Si la clave ya está en la cadena, actualizo el valor
          for (const e of bucket) {
            if (!e.deleted && this.equalsFn(e.key, key)) {
              e.value = value
              return true
            }
          }

          // Si hay espacio en este bucket, inserto aquí
          if (bucket.length < this.bucketCapacity) {
            bucket.push({ key, value, next: -1 })
            return true
          }

          // Avanzo al siguiente de la cadena: en esta versión "simple" intento
          // con un probing lineal para encontrar un bucket cercano que tenga lugar,
          // y enlazo visualmente (sin mantener un mapa separado)
          for (let offset = 1; offset < this.numBuckets; offset++) {
            const candidate = this.mod(cursor + offset, this.numBuckets)
            const candidateBucket = this.buckets[candidate]
            if (candidateBucket.length < this.bucketCapacity) {
              candidateBucket.push({ key, value, next: -1 })
              return true
            }
          }
          break // no se pudo expandir
        }
        return false
      }

      case CollisionStrategy.SEPARATE_OVERFLOW: {
        // Intento colocar en bucket base primero
        const bucket = this.buckets[baseIdx]

        // Busco si la clave ya existe en el bucket base
        for (const e of bucket) {
          if (!e.deleted && this.equalsFn(e.key, key)) {
            e.value = value
            return true
          }
        }

        // Si hay espacio en el bucket base, inserto aquí
        if (bucket.length < this.bucketCapacity) {
          bucket.push({ key, value })
          return true
        }

        // Si el bucket está lleno, uso área de overflow separada
        for (let i = 0; i < this.overflowSize; i++) {
          const ov = this.overflow[i]
          if (ov === null || (ov.deleted && this.equalsFn(ov.key, key))) {
            // Espacio libre o reutilizo una entrada borrada
            this.overflow[i] = { key, value }
            return true
          }
          // Si la clave ya existe pero está marcada como borrada, la reuso
          if (ov && !ov.deleted && this.equalsFn(ov.key, key)) {
            ov.value = value
            return true
          }
        }
        // Overflow lleno
        return false
      }

      default:
        throw new Error('Estrategia de colisión no reconocida.')
    }
  }

  /**
   * Busca una clave en la tabla
   *
   * Recorre la tabla según la estrategia de colisiones para encontrar
   * el valor asociado a la clave especificada.
   *
   * La búsqueda considera:
   * - Elementos marcados como borrados (los ignora)
   * - Diferentes estrategias de resolución de colisiones
   * - Área de overflow separada (si aplica)
   *
   * @param key - Clave a buscar
   * @returns El valor asociado a la clave, o null si no existe
   */
  buscar (key: K): V | null {
    const baseIdx = this.mod(this.primaryHash(key), this.numBuckets)

    switch (this.strategy) {
      case CollisionStrategy.LINEAR_PROBING:
      case CollisionStrategy.DOUBLE_HASHING: {
        // Recorro probing hasta encontrar la clave o agotar todas las posiciones
        for (let i = 0; i < this.numBuckets; i++) {
          const idx = this.probeIndex(key, i)
          const bucket = this.buckets[idx]
          for (const e of bucket) {
            if (!e.deleted && this.equalsFn(e.key, key)) {
              return e.value
            }
          }
          // Si bucket no está lleno y no está, podría detener antes (optimización posible)
        }
        return null
      }

      case CollisionStrategy.CHAINED_LINEAR: {
        // Recorro la "cadena" a partir del bucket base (simplificación: scan cercano)
        const visited = new Set<number>()
        let cursor = baseIdx
        while (!visited.has(cursor)) {
          visited.add(cursor)
          const bucket = this.buckets[cursor]
          for (const e of bucket) {
            if (!e.deleted && this.equalsFn(e.key, key)) return e.value
          }
          // Avanzo al siguiente índice lineal (modo simplificado de cadena)
          cursor = this.mod(cursor + 1, this.numBuckets)
        }
        return null
      }

      case CollisionStrategy.SEPARATE_OVERFLOW: {
        // Busco primero en bucket base
        const bucket = this.buckets[baseIdx]
        for (const e of bucket) {
          if (!e.deleted && this.equalsFn(e.key, key)) return e.value
        }
        // Si no está en el bucket base, busco en overflow separado
        for (let i = 0; i < this.overflowSize; i++) {
          const ov = this.overflow[i]
          if (ov && !ov.deleted && this.equalsFn(ov.key, key)) return ov.value
        }
        return null
      }

      default:
        return null
    }
  }

  /**
   * Elimina (marca como borrado) una clave de la tabla
   *
   * Implementa borrado lógico para mantener la integridad de las cadenas
   * de búsqueda. Los elementos borrados se marcan pero no se eliminan
   * físicamente para evitar romper las secuencias de probing.
   *
   * @param key - Clave a eliminar
   * @returns true si se eliminó exitosamente, false si no existía
   */
  eliminar (key: K): boolean {
    const baseIdx = this.mod(this.primaryHash(key), this.numBuckets)

    switch (this.strategy) {
      case CollisionStrategy.LINEAR_PROBING:
      case CollisionStrategy.DOUBLE_HASHING: {
        // Recorro todas las posiciones posibles según la estrategia de probing
        for (let i = 0; i < this.numBuckets; i++) {
          const idx = this.probeIndex(key, i)
          const bucket = this.buckets[idx]
          for (const e of bucket) {
            if (!e.deleted && this.equalsFn(e.key, key)) {
              e.deleted = true // Borrado lógico - mantiene la estructura
              return true
            }
          }
        }
        return false
      }

      case CollisionStrategy.CHAINED_LINEAR: {
        // Recorro la cadena buscando la clave
        const visited = new Set<number>()
        let cursor = baseIdx
        while (!visited.has(cursor)) {
          visited.add(cursor)
          const bucket = this.buckets[cursor]
          for (const e of bucket) {
            if (!e.deleted && this.equalsFn(e.key, key)) {
              e.deleted = true
              return true
            }
          }
          cursor = this.mod(cursor + 1, this.numBuckets)
        }
        return false
      }

      case CollisionStrategy.SEPARATE_OVERFLOW: {
        // Busco primero en bucket base
        const bucket = this.buckets[baseIdx]
        for (const e of bucket) {
          if (!e.deleted && this.equalsFn(e.key, key)) {
            e.deleted = true
            return true
          }
        }
        // Si no está en bucket base, busco en overflow
        for (let i = 0; i < this.overflowSize; i++) {
          const ov = this.overflow[i]
          if (ov && !ov.deleted && this.equalsFn(ov.key, key)) {
            ov.deleted = true
            return true
          }
        }
        return false
      }

      default:
        return false
    }
  }

  /**
   * Volcado para depuración: muestra contenido completo de buckets y overflow
   *
   * Genera una representación detallada del estado interno de la tabla,
   * incluyendo todas las entradas, sus estados (borradas o no), y metadatos
   * como enlaces de cadena.
   *
   * Útil para:
   * - Depuración de problemas
   * - Análisis de rendimiento
   * - Verificación de integridad de datos
   *
   * @returns Objeto con toda la información del estado interno de la tabla
   */
  dump (): unknown {
    return {
      strategy: this.strategy,
      numBuckets: this.numBuckets,
      bucketCapacity: this.bucketCapacity,
      buckets: this.buckets.map(b =>
        b.map(e => ({
          key: e.key,
          value: e.value,
          next: e.next ?? null,
          deleted: !!e.deleted
        }))
      ),
      overflow: this.overflow.map(e =>
        e ? { key: e.key, value: e.value, deleted: !!e.deleted } : null
      )
    }
  }
}
