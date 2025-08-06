// Tipo de función de hash: recibe una clave y devuelve un número (entero >=0)
type HashFn<K> = (key: K) => number

// Estrategias de resolución de colisiones disponibles
export enum CollisionStrategy {
  LINEAR_PROBING = 'LINEAR_PROBING', // saturación progresiva
  CHAINED_LINEAR = 'CHAINED_LINEAR', // saturación progresiva encadenada (cadena explícita)
  DOUBLE_HASHING = 'DOUBLE_HASHING', // doble dispersión
  SEPARATE_OVERFLOW = 'SEPARATE_OVERFLOW' // área de desbordes separada
}

// Entrada almacenada en un bucket o en overflow
interface Entry<K, V> {
  key: K
  value: V
  // Para CHAINED_LINEAR: índice del siguiente en la cadena, -1 si no tiene
  next?: number
  // Marca de borrado lógico (para probing)
  deleted?: boolean
}

// Opciones para construir la tabla estática
interface HashStaticOptions<K, V> {
  numBuckets: number // cantidad fija de buckets base
  bucketCapacity: number // cuántos registros caben en cada bucket antes de overflow
  primaryHash: HashFn<K> // función principal de hash
  secondaryHash?: HashFn<K> // función secundaria (necesaria para doble hashing)
  strategy?: CollisionStrategy // estrategia de colisiones
  overflowSize?: number // tamaño del área separada de overflow
  equalsFn?: (a: K, b: K) => boolean // comparación de claves (por defecto ===)
}

export class StaticHashTable<K, V> {
  private buckets: Array<Array<Entry<K, V>>> // buckets base
  private overflow: Array<Entry<K, V> | null> // área de overflow separada
  private strategy: CollisionStrategy
  private primaryHash: HashFn<K>
  private secondaryHash?: HashFn<K>
  private bucketCapacity: number
  private numBuckets: number
  private overflowSize: number
  private equalsFn: (a: K, b: K) => boolean

  constructor (opts: HashStaticOptions<K, V>) {
    this.numBuckets = opts.numBuckets
    this.bucketCapacity = opts.bucketCapacity
    this.primaryHash = opts.primaryHash
    this.secondaryHash = opts.secondaryHash
    this.strategy = opts.strategy ?? CollisionStrategy.LINEAR_PROBING
    this.equalsFn = opts.equalsFn ?? ((a, b) => a === b)
    // inicializo buckets vacíos
    this.buckets = new Array(this.numBuckets)
    for (let i = 0; i < this.numBuckets; i++) {
      this.buckets[i] = []
    }
    // overflow separado
    this.overflowSize =
      opts.overflowSize ?? Math.max(4, Math.floor(this.numBuckets / 2))
    this.overflow = new Array(this.overflowSize).fill(null)
  }

  // Módulo seguro para índices (maneja negativos)
  private mod (n: number, m: number) {
    return ((n % m) + m) % m
  }

  // Cálculo de índice de probing según estrategia
  private probeIndex (key: K, attempt: number): number {
    const h1 = this.mod(this.primaryHash(key), this.numBuckets)
    if (this.strategy === CollisionStrategy.DOUBLE_HASHING) {
      if (!this.secondaryHash) {
        throw new Error('Se requiere secondaryHash para double hashing.')
      }
      // Segunda función produce desplazamiento; evitar 0
      let h2 = this.mod(this.secondaryHash(key), this.numBuckets)
      if (h2 === 0) h2 = 1
      return this.mod(h1 + attempt * h2, this.numBuckets)
    }
    // Linear probing / saturación progresiva: desplazamiento lineal
    return this.mod(h1 + attempt, this.numBuckets)
  }

  /**
   * Inserta o actualiza una clave/valor.
   * Retorna true si se pudo insertar o actualizar, false si falló por falta de espacio.
   */
  insertar (key: K, value: V): boolean {
    const baseIdx = this.mod(this.primaryHash(key), this.numBuckets)

    switch (this.strategy) {
      case CollisionStrategy.LINEAR_PROBING:
      case CollisionStrategy.DOUBLE_HASHING: {
        // Probing explícito sobre buckets (no rehash dinámico)
        for (let i = 0; i < this.numBuckets; i++) {
          const idx = this.probeIndex(key, i)
          const bucket = this.buckets[idx]

          // Si ya existe la clave no borrada, actualizo
          for (const e of bucket) {
            if (!e.deleted && this.equalsFn(e.key, key)) {
              e.value = value
              return true
            }
          }

          // Si hay espacio en el bucket base, inserto
          if (bucket.length < this.bucketCapacity) {
            bucket.push({ key, value })
            return true
          }
          // si no, sigo probing
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

          // Si la clave ya está en la cadena, actualizo
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
          //   const foundNext = false
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

        for (const e of bucket) {
          if (!e.deleted && this.equalsFn(e.key, key)) {
            e.value = value
            return true
          }
        }

        if (bucket.length < this.bucketCapacity) {
          bucket.push({ key, value })
          return true
        }

        // Si el bucket está lleno, uso área de overflow separada
        for (let i = 0; i < this.overflowSize; i++) {
          const ov = this.overflow[i]
          if (ov === null || (ov.deleted && this.equalsFn(ov.key, key))) {
            this.overflow[i] = { key, value }
            return true
          }
          // si clave ya existe pero marcada borrada, la reuso
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
   * Busca una clave. Retorna el valor o null si no existe.
   */
  buscar (key: K): V | null {
    const baseIdx = this.mod(this.primaryHash(key), this.numBuckets)

    switch (this.strategy) {
      case CollisionStrategy.LINEAR_PROBING:
      case CollisionStrategy.DOUBLE_HASHING: {
        // Recorro probing hasta encontrar o agotar
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
        // Busco en bucket base
        const bucket = this.buckets[baseIdx]
        for (const e of bucket) {
          if (!e.deleted && this.equalsFn(e.key, key)) return e.value
        }
        // Luego en overflow separado
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
   * Elimina (marca borrado) una clave. Retorna true si se eliminó, false si no existía.
   */
  eliminar (key: K): boolean {
    const baseIdx = this.mod(this.primaryHash(key), this.numBuckets)

    switch (this.strategy) {
      case CollisionStrategy.LINEAR_PROBING:
      case CollisionStrategy.DOUBLE_HASHING: {
        for (let i = 0; i < this.numBuckets; i++) {
          const idx = this.probeIndex(key, i)
          const bucket = this.buckets[idx]
          for (const e of bucket) {
            if (!e.deleted && this.equalsFn(e.key, key)) {
              e.deleted = true // borrado lógico
              return true
            }
          }
        }
        return false
      }

      case CollisionStrategy.CHAINED_LINEAR: {
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
        // En bucket base
        const bucket = this.buckets[baseIdx]
        for (const e of bucket) {
          if (!e.deleted && this.equalsFn(e.key, key)) {
            e.deleted = true
            return true
          }
        }
        // En overflow
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
   * Volcado para depuración: muestra contenido de buckets y overflow,
   * incluyendo claves borradas y estados.
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
