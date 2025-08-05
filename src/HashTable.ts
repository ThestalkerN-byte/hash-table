/**
 * Clase HashTable básica implementada en TypeScript
 * Utiliza encadenamiento para manejar colisiones
 */
export class HashTable<K, V> {
  private buckets: Array<Array<{ key: K; value: V }>>;
  private size: number;
  private capacity: number;

  constructor(capacity: number = 16) {
    this.capacity = capacity;
    this.size = 0;
    this.buckets = new Array(capacity).fill(null).map(() => []);
  }

  /**
   * Función hash simple que convierte la clave en un índice
   */
  private hash(key: K): number {
    const keyString = String(key);
    let hash = 0;
    
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convierte a entero de 32 bits
    }
    
    return Math.abs(hash) % this.capacity;
  }

  /**
   * Inserta un par clave-valor en la hash table
   */
  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    // Buscar si la clave ya existe
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket[i].value = value; // Actualizar valor existente
        return;
      }
    }
    
    // Agregar nuevo par clave-valor
    bucket.push({ key, value });
    this.size++;
    
    // Redimensionar si el factor de carga es muy alto
    if (this.size / this.capacity > 0.75) {
      this.resize();
    }
  }

  /**
   * Obtiene el valor asociado a una clave
   */
  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    for (const item of bucket) {
      if (item.key === key) {
        return item.value;
      }
    }
    
    return undefined;
  }

  /**
   * Verifica si una clave existe en la hash table
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Elimina un par clave-valor de la hash table
   */
  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket.splice(i, 1);
        this.size--;
        return true;
      }
    }
    
    return false;
  }

  /**
   * Retorna el número de elementos en la hash table
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Verifica si la hash table está vacía
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Limpia todos los elementos de la hash table
   */
  clear(): void {
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
    this.size = 0;
  }

  /**
   * Retorna todas las claves de la hash table
   */
  keys(): K[] {
    const keys: K[] = [];
    for (const bucket of this.buckets) {
      for (const item of bucket) {
        keys.push(item.key);
      }
    }
    return keys;
  }

  /**
   * Retorna todos los valores de la hash table
   */
  values(): V[] {
    const values: V[] = [];
    for (const bucket of this.buckets) {
      for (const item of bucket) {
        values.push(item.value);
      }
    }
    return values;
  }

  /**
   * Retorna todos los pares clave-valor de la hash table
   */
  entries(): Array<{ key: K; value: V }> {
    const entries: Array<{ key: K; value: V }> = [];
    for (const bucket of this.buckets) {
      for (const item of bucket) {
        entries.push({ key: item.key, value: item.value });
      }
    }
    return entries;
  }

  /**
   * Redimensiona la hash table cuando el factor de carga es muy alto
   */
  private resize(): void {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
    this.size = 0;
    
    // Reinsertar todos los elementos
    for (const bucket of oldBuckets) {
      for (const item of bucket) {
        this.set(item.key, item.value);
      }
    }
  }

  /**
   * Retorna una representación en string de la hash table
   */
  toString(): string {
    const entries = this.entries();
    if (entries.length === 0) {
      return 'HashTable {}';
    }
    
    const pairs = entries.map(({ key, value }) => `${key}: ${value}`);
    return `HashTable { ${pairs.join(', ')} }`;
  }
} 