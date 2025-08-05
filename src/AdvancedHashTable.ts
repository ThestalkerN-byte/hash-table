/**
 * Clase HashTable Avanzada con múltiples métodos de resolución de colisiones
 * Implementa: Encadenamiento, Saturación Progresiva, Saturación Progresiva Encadenada,
 * Área de Desborde por Separado, Hash Asistido por Tabla, Hash Extensible
 */

export enum CollisionResolutionMethod {
  CHAINING = 'encadenamiento',
  LINEAR_PROBING = 'saturacion_progresiva',
  CHAINED_LINEAR_PROBING = 'saturacion_progresiva_encadenada',
  SEPARATE_OVERFLOW = 'area_desborde_separado',
  TABLE_ASSISTED_HASH = 'hash_asistido_tabla',
  EXTENDIBLE_HASH = 'hash_extensible'
}

interface HashEntry<K, V> {
  key: K;
  value: V;
  isDeleted?: boolean;
  originalIndex?: number; // Para tracking en métodos de probing
  probeCount?: number; // Para contar intentos de sondeo
  hashValue?: number; // Para mostrar el valor hash
  secondaryHash?: number; // Para hash asistido por tabla
}

interface Bucket<K, V> {
  entries: HashEntry<K, V>[];
  overflowChain?: Bucket<K, V>;
}

interface DirectoryEntry {
  bucketIndex: number;
  depth: number;
}

export class AdvancedHashTable<K, V> {
  private buckets: Array<Bucket<K, V>>;
  private overflowArea: Array<HashEntry<K, V>>;
  private size: number;
  private capacity: number;
  private method: CollisionResolutionMethod;
  private loadFactor: number;
  private maxLoadFactor: number;
  private directory: DirectoryEntry[]; // Para hash extensible
  private globalDepth: number; // Para hash extensible

  constructor(
    capacity: number = 16,
    method: CollisionResolutionMethod = CollisionResolutionMethod.CHAINING,
    maxLoadFactor: number = 0.75
  ) {
    this.capacity = capacity;
    this.size = 0;
    this.method = method;
    this.maxLoadFactor = maxLoadFactor;
    this.loadFactor = 0;
    this.overflowArea = [];
    this.directory = [];
    this.globalDepth = 0;

    this.initializeBuckets();
  }

  private initializeBuckets(): void {
    this.buckets = new Array(this.capacity).fill(null).map(() => ({
      entries: [],
      overflowChain: undefined
    }));

    if (this.method === CollisionResolutionMethod.EXTENDIBLE_HASH) {
      this.initializeExtendibleHash();
    }
  }

  private initializeExtendibleHash(): void {
    this.globalDepth = Math.ceil(Math.log2(this.capacity));
    this.directory = new Array(Math.pow(2, this.globalDepth)).fill(null).map((_, i) => ({
      bucketIndex: i % this.capacity,
      depth: this.globalDepth
    }));
  }

  /**
   * Función hash principal
   */
  private hash(key: K): number {
    const keyString = String(key);
    let hash = 0;
    
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convierte a entero de 32 bits
    }
    
    return Math.abs(hash);
  }

  /**
   * Función hash secundaria para doble hash
   */
  private hash2(key: K): number {
    const keyString = String(key);
    let hash = 5381;
    
    for (let i = 0; i < keyString.length; i++) {
      hash = ((hash << 5) + hash) + keyString.charCodeAt(i);
    }
    
    return Math.abs(hash) % (this.capacity - 1) + 1;
  }

  /**
   * Obtiene el índice del bucket según el método de resolución
   */
  private getBucketIndex(key: K, attempt: number = 0): number {
    const primaryHash = this.hash(key);
    
    switch (this.method) {
      case CollisionResolutionMethod.CHAINING:
      case CollisionResolutionMethod.CHAINED_LINEAR_PROBING:
        return primaryHash % this.capacity;
      
      case CollisionResolutionMethod.LINEAR_PROBING:
        return (primaryHash + attempt) % this.capacity;
      
      case CollisionResolutionMethod.SEPARATE_OVERFLOW:
        return primaryHash % this.capacity;
      
      case CollisionResolutionMethod.TABLE_ASSISTED_HASH:
        const secondaryHash = this.hash2(key);
        return (primaryHash + attempt * secondaryHash) % this.capacity;
      
      case CollisionResolutionMethod.EXTENDIBLE_HASH:
        return this.getExtendibleHashIndex(key);
      
      default:
        return primaryHash % this.capacity;
    }
  }

  /**
   * Obtiene el índice para hash extensible
   */
  private getExtendibleHashIndex(key: K): number {
    const hash = this.hash(key);
    const mask = (1 << this.globalDepth) - 1;
    const directoryIndex = hash & mask;
    return this.directory[directoryIndex]?.bucketIndex || 0;
  }

  /**
   * Inserta un elemento en la tabla
   */
  set(key: K, value: V): void {
    if (this.method === CollisionResolutionMethod.EXTENDIBLE_HASH) {
      this.setExtendible(key, value);
      return;
    }

    const entry: HashEntry<K, V> = { key, value };
    let attempt = 0;
    let bucketIndex = this.getBucketIndex(key, attempt);

    switch (this.method) {
      case CollisionResolutionMethod.CHAINING:
        this.setWithChaining(bucketIndex, entry);
        break;
      
      case CollisionResolutionMethod.LINEAR_PROBING:
        this.setWithLinearProbing(key, entry);
        break;
      
      case CollisionResolutionMethod.CHAINED_LINEAR_PROBING:
        this.setWithChainedLinearProbing(bucketIndex, entry);
        break;
      
      case CollisionResolutionMethod.SEPARATE_OVERFLOW:
        this.setWithSeparateOverflow(bucketIndex, entry);
        break;
      
      case CollisionResolutionMethod.TABLE_ASSISTED_HASH:
        this.setWithTableAssistedHash(key, entry);
        break;
    }

    this.size++;
    this.updateLoadFactor();
    this.resizeIfNeeded();
  }

  /**
   * Inserción con encadenamiento
   */
  private setWithChaining(bucketIndex: number, entry: HashEntry<K, V>): void {
    const bucket = this.buckets[bucketIndex];
    
    // Buscar si la clave ya existe
    const existingIndex = bucket.entries.findIndex(e => e.key === entry.key);
    if (existingIndex !== -1) {
      bucket.entries[existingIndex] = entry;
      return;
    }
    
    bucket.entries.push(entry);
  }

  /**
   * Inserción con saturación progresiva
   */
  private setWithLinearProbing(key: K, entry: HashEntry<K, V>): void {
    let attempt = 0;
    const maxAttempts = this.capacity;

    while (attempt < maxAttempts) {
      const bucketIndex = this.getBucketIndex(key, attempt);
      const bucket = this.buckets[bucketIndex];

      // Si el bucket está vacío o tiene una entrada marcada como eliminada
      if (bucket.entries.length === 0 || bucket.entries[0].isDeleted) {
        bucket.entries = [entry];
        return;
      }

      // Si la clave ya existe, actualizar
      if (bucket.entries[0].key === key) {
        bucket.entries[0] = entry;
        return;
      }

      attempt++;
    }

    throw new Error('Tabla hash llena');
  }

  /**
   * Inserción con saturación progresiva encadenada
   */
  private setWithChainedLinearProbing(bucketIndex: number, entry: HashEntry<K, V>): void {
    const bucket = this.buckets[bucketIndex];
    
    // Si el bucket está vacío
    if (bucket.entries.length === 0) {
      bucket.entries.push(entry);
      return;
    }

    // Si la clave ya existe en este bucket
    const existingIndex = bucket.entries.findIndex(e => e.key === entry.key);
    if (existingIndex !== -1) {
      bucket.entries[existingIndex] = entry;
      return;
    }

    // Si el bucket está lleno, usar encadenamiento
    if (bucket.entries.length >= 4) { // Asumiendo 4 entradas por bucket
      if (!bucket.overflowChain) {
        bucket.overflowChain = { entries: [] };
      }
      bucket.overflowChain.entries.push(entry);
    } else {
      bucket.entries.push(entry);
    }
  }

  /**
   * Inserción con área de desborde por separado
   */
  private setWithSeparateOverflow(bucketIndex: number, entry: HashEntry<K, V>): void {
    const bucket = this.buckets[bucketIndex];
    
    // Si el bucket está vacío
    if (bucket.entries.length === 0) {
      bucket.entries.push(entry);
      return;
    }

    // Si la clave ya existe en este bucket
    const existingIndex = bucket.entries.findIndex(e => e.key === entry.key);
    if (existingIndex !== -1) {
      bucket.entries[existingIndex] = entry;
      return;
    }

    // Si el bucket está lleno, usar área de desborde
    if (bucket.entries.length >= 4) {
      this.overflowArea.push(entry);
      // Crear enlace al área de desborde
      if (!bucket.overflowChain) {
        bucket.overflowChain = { entries: [] };
      }
      bucket.overflowChain.entries.push(entry);
    } else {
      bucket.entries.push(entry);
    }
  }

  /**
   * Inserción con hash asistido por tabla
   */
  private setWithTableAssistedHash(key: K, entry: HashEntry<K, V>): void {
    let attempt = 0;
    const maxAttempts = this.capacity;

    while (attempt < maxAttempts) {
      const bucketIndex = this.getBucketIndex(key, attempt);
      const bucket = this.buckets[bucketIndex];

      if (bucket.entries.length === 0 || bucket.entries[0].isDeleted) {
        bucket.entries = [entry];
        return;
      }

      if (bucket.entries[0].key === key) {
        bucket.entries[0] = entry;
        return;
      }

      attempt++;
    }

    throw new Error('Tabla hash llena');
  }

  /**
   * Inserción para hash extensible
   */
  private setExtendible(key: K, value: V): void {
    const entry: HashEntry<K, V> = { key, value };
    const bucketIndex = this.getExtendibleHashIndex(key);
    const bucket = this.buckets[bucketIndex];

    // Si el bucket está vacío
    if (bucket.entries.length === 0) {
      bucket.entries.push(entry);
      this.size++;
      return;
    }

    // Si la clave ya existe
    const existingIndex = bucket.entries.findIndex(e => e.key === key);
    if (existingIndex !== -1) {
      bucket.entries[existingIndex] = entry;
      return;
    }

    // Si el bucket está lleno, dividir
    if (bucket.entries.length >= 4) {
      this.splitBucket(bucketIndex);
      this.setExtendible(key, value); // Reintentar inserción
    } else {
      bucket.entries.push(entry);
      this.size++;
    }
  }

  /**
   * Divide un bucket en hash extensible
   */
  private splitBucket(bucketIndex: number): void {
    const bucket = this.buckets[bucketIndex];
    const newBucketIndex = this.buckets.length;
    
    // Crear nuevo bucket
    this.buckets.push({ entries: [] });
    
    // Redistribuir entradas
    const entriesToRedistribute = [...bucket.entries];
    bucket.entries = [];
    
    for (const entry of entriesToRedistribute) {
      const newIndex = this.getExtendibleHashIndex(entry.key);
      if (newIndex === bucketIndex) {
        bucket.entries.push(entry);
      } else {
        this.buckets[newBucketIndex].entries.push(entry);
      }
    }
    
    // Actualizar directorio
    this.updateDirectory(bucketIndex, newBucketIndex);
  }

  /**
   * Actualiza el directorio después de dividir un bucket
   */
  private updateDirectory(oldBucketIndex: number, newBucketIndex: number): void {
    // Implementación simplificada
    for (let i = 0; i < this.directory.length; i++) {
      if (this.directory[i].bucketIndex === oldBucketIndex) {
        // Distribuir entre los dos buckets
        if (i % 2 === 0) {
          this.directory[i].bucketIndex = oldBucketIndex;
        } else {
          this.directory[i].bucketIndex = newBucketIndex;
        }
      }
    }
  }

  /**
   * Obtiene un valor de la tabla
   */
  get(key: K): V | undefined {
    if (this.method === CollisionResolutionMethod.EXTENDIBLE_HASH) {
      return this.getExtendible(key);
    }

    let attempt = 0;
    const maxAttempts = this.capacity;

    while (attempt < maxAttempts) {
      const bucketIndex = this.getBucketIndex(key, attempt);
      const bucket = this.buckets[bucketIndex];

      if (bucket.entries.length === 0) {
        return undefined;
      }

      // Buscar en el bucket principal
      const entry = bucket.entries.find(e => e.key === key && !e.isDeleted);
      if (entry) {
        return entry.value;
      }

      // Buscar en cadena de desborde si existe
      if (bucket.overflowChain) {
        const overflowEntry = bucket.overflowChain.entries.find(e => e.key === key);
        if (overflowEntry) {
          return overflowEntry.value;
        }
      }

      // Para métodos que no usan encadenamiento, continuar con el siguiente intento
      if (this.method === CollisionResolutionMethod.CHAINING) {
        break;
      }

      attempt++;
    }

    return undefined;
  }

  /**
   * Obtiene un valor para hash extensible
   */
  private getExtendible(key: K): V | undefined {
    const bucketIndex = this.getExtendibleHashIndex(key);
    const bucket = this.buckets[bucketIndex];
    
    const entry = bucket.entries.find(e => e.key === key);
    return entry?.value;
  }

  /**
   * Verifica si una clave existe
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Elimina un elemento
   */
  delete(key: K): boolean {
    if (this.method === CollisionResolutionMethod.EXTENDIBLE_HASH) {
      return this.deleteExtendible(key);
    }

    let attempt = 0;
    const maxAttempts = this.capacity;

    while (attempt < maxAttempts) {
      const bucketIndex = this.getBucketIndex(key, attempt);
      const bucket = this.buckets[bucketIndex];

      if (bucket.entries.length === 0) {
        return false;
      }

      // Buscar en el bucket principal
      const entryIndex = bucket.entries.findIndex(e => e.key === key);
      if (entryIndex !== -1) {
        if (this.method === CollisionResolutionMethod.LINEAR_PROBING ||
            this.method === CollisionResolutionMethod.TABLE_ASSISTED_HASH) {
          bucket.entries[entryIndex].isDeleted = true;
        } else {
          bucket.entries.splice(entryIndex, 1);
        }
        this.size--;
        return true;
      }

      // Buscar en cadena de desborde
      if (bucket.overflowChain) {
        const overflowIndex = bucket.overflowChain.entries.findIndex(e => e.key === key);
        if (overflowIndex !== -1) {
          bucket.overflowChain.entries.splice(overflowIndex, 1);
          this.size--;
          return true;
        }
      }

      if (this.method === CollisionResolutionMethod.CHAINING) {
        break;
      }

      attempt++;
    }

    return false;
  }

  /**
   * Elimina un elemento en hash extensible
   */
  private deleteExtendible(key: K): boolean {
    const bucketIndex = this.getExtendibleHashIndex(key);
    const bucket = this.buckets[bucketIndex];
    
    const entryIndex = bucket.entries.findIndex(e => e.key === key);
    if (entryIndex !== -1) {
      bucket.entries.splice(entryIndex, 1);
      this.size--;
      return true;
    }
    
    return false;
  }

  /**
   * Limpia la tabla
   */
  clear(): void {
    this.buckets = new Array(this.capacity).fill(null).map(() => ({
      entries: [],
      overflowChain: undefined
    }));
    this.overflowArea = [];
    this.size = 0;
    this.loadFactor = 0;
  }

  /**
   * Obtiene todas las claves
   */
  keys(): K[] {
    const keys: K[] = [];
    
    for (const bucket of this.buckets) {
      for (const entry of bucket.entries) {
        if (!entry.isDeleted) {
          keys.push(entry.key);
        }
      }
      if (bucket.overflowChain) {
        for (const entry of bucket.overflowChain.entries) {
          keys.push(entry.key);
        }
      }
    }
    
    return keys;
  }

  /**
   * Obtiene todos los valores
   */
  values(): V[] {
    const values: V[] = [];
    
    for (const bucket of this.buckets) {
      for (const entry of bucket.entries) {
        if (!entry.isDeleted) {
          values.push(entry.value);
        }
      }
      if (bucket.overflowChain) {
        for (const entry of bucket.overflowChain.entries) {
          values.push(entry.value);
        }
      }
    }
    
    return values;
  }

  /**
   * Obtiene todas las entradas
   */
  entries(): Array<{ key: K; value: V }> {
    const entries: Array<{ key: K; value: V }> = [];
    
    for (const bucket of this.buckets) {
      for (const entry of bucket.entries) {
        if (!entry.isDeleted) {
          entries.push({ key: entry.key, value: entry.value });
        }
      }
      if (bucket.overflowChain) {
        for (const entry of bucket.overflowChain.entries) {
          entries.push({ key: entry.key, value: entry.value });
        }
      }
    }
    
    return entries;
  }

  /**
   * Obtiene el tamaño de la tabla
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Verifica si la tabla está vacía
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Obtiene el método de resolución de colisiones
   */
  getMethod(): CollisionResolutionMethod {
    return this.method;
  }

  /**
   * Cambia el método de resolución de colisiones
   */
  setMethod(method: CollisionResolutionMethod): void {
    if (this.method !== method) {
      this.method = method;
      this.initializeBuckets();
      this.rehash();
    }
  }

  /**
   * Obtiene estadísticas de la tabla
   */
  getStats(): {
    size: number;
    capacity: number;
    loadFactor: number;
    method: CollisionResolutionMethod;
    buckets: Array<{ entries: number; overflowEntries: number }>;
  } {
    const bucketStats = this.buckets.map(bucket => ({
      entries: bucket.entries.filter(e => !e.isDeleted).length,
      overflowEntries: bucket.overflowChain ? bucket.overflowChain.entries.length : 0
    }));

    return {
      size: this.size,
      capacity: this.capacity,
      loadFactor: this.loadFactor,
      method: this.method,
      buckets: bucketStats
    };
  }

  /**
   * Obtiene información detallada para debug y visualización
   */
  getDebugInfo(): {
    method: CollisionResolutionMethod;
    buckets: Array<{
      index: number;
      entries: HashEntry<K, V>[];
      overflowChain?: Bucket<K, V>;
      probeInfo?: { totalProbes: number; maxProbes: number };
    }>;
    overflowArea: HashEntry<K, V>[];
    directory?: DirectoryEntry[];
    globalDepth?: number;
    hashTable: Array<HashEntry<K, V>>;
  } {
    const bucketDebug = this.buckets.map((bucket, index) => {
      const allEntries = [...bucket.entries];
      if (bucket.overflowChain) {
        allEntries.push(...bucket.overflowChain.entries);
      }

      const probeInfo = allEntries.length > 0 ? {
        totalProbes: allEntries.reduce((sum, entry) => sum + (entry.probeCount || 0), 0),
        maxProbes: Math.max(...allEntries.map(entry => entry.probeCount || 0))
      } : undefined;

      return {
        index,
        entries: bucket.entries,
        overflowChain: bucket.overflowChain,
        probeInfo
      };
    });

    return {
      method: this.method,
      buckets: bucketDebug,
      overflowArea: this.overflowArea,
      directory: this.method === CollisionResolutionMethod.EXTENDIBLE_HASH ? this.directory : undefined,
      globalDepth: this.method === CollisionResolutionMethod.EXTENDIBLE_HASH ? this.globalDepth : undefined,
      hashTable: this.entries()
    };
  }

  /**
   * Fuerza una colisión para demostración
   */
  forceCollision(key1: K, key2: K): boolean {
    const hash1 = this.hash(key1);
    const hash2 = this.hash(key2);
    const bucket1 = hash1 % this.capacity;
    const bucket2 = hash2 % this.capacity;
    
    return bucket1 === bucket2;
  }

  /**
   * Obtiene información de hash para una clave específica
   */
  getHashInfo(key: K): {
    primaryHash: number;
    secondaryHash?: number;
    bucketIndex: number;
    probeSequence: number[];
  } {
    const primaryHash = this.hash(key);
    const secondaryHash = this.method === CollisionResolutionMethod.TABLE_ASSISTED_HASH ? this.hash2(key) : undefined;
    
    const probeSequence = [];
    for (let i = 0; i < this.capacity; i++) {
      const index = this.getBucketIndex(key, i);
      probeSequence.push(index);
    }

    return {
      primaryHash,
      secondaryHash,
      bucketIndex: this.getBucketIndex(key),
      probeSequence
    };
  }

  /**
   * Actualiza el factor de carga
   */
  private updateLoadFactor(): void {
    this.loadFactor = this.size / this.capacity;
  }

  /**
   * Redimensiona la tabla si es necesario
   */
  private resizeIfNeeded(): void {
    if (this.loadFactor > this.maxLoadFactor) {
      this.resize(this.capacity * 2);
    }
  }

  /**
   * Redimensiona la tabla
   */
  private resize(newCapacity: number): void {
    const oldEntries = this.entries();
    this.capacity = newCapacity;
    this.size = 0;
    this.initializeBuckets();
    
    for (const { key, value } of oldEntries) {
      this.set(key, value);
    }
  }

  /**
   * Rehash de la tabla
   */
  private rehash(): void {
    const oldEntries = this.entries();
    this.clear();
    this.initializeBuckets();
    
    for (const { key, value } of oldEntries) {
      this.set(key, value);
    }
  }

  /**
   * Convierte la tabla a string
   */
  toString(): string {
    const entries = this.entries();
    return `AdvancedHashTable(${this.method}) { ${entries.map(({ key, value }) => `${key}: ${value}`).join(', ')} }`;
  }
} 