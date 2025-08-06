'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdvancedHashTableVisualizer.module.css';
import { StaticHashTable, CollisionStrategy } from '../MyHashTable';

// Interfaces para la nueva implementación
interface AdvancedHashTableVisualizerProps {
  initialCapacity?: number;
}

interface BucketItem {
  key: string;
  value: string;
  deleted?: boolean;
  next?: number | null;
}

interface Bucket {
  index: number;
  items: BucketItem[];
  overflowItems?: BucketItem[];
}

interface Stats {
  size: number;
  capacity: number;
  loadFactor: number;
  method: CollisionStrategy;
  buckets: Array<{ entries: number; overflowEntries: number }>;
}

interface DebugInfo {
  strategy: CollisionStrategy;
  numBuckets: number;
  bucketCapacity: number;
  buckets: Array<{
    key: string;
    value: string;
    next: number | null;
    deleted: boolean;
  }>[];
  overflow: Array<{
    key: string;
    value: string;
    deleted: boolean;
  } | null>;
}

interface HashInfo {
  primaryHash: number;
  secondaryHash?: number;
  bucketIndex: number;
  probeSequence: number[];
  probingMethod: string;
  probingFormula: string;
  probingExplanation: string;
}

type OperationType = 'insert' | 'search' | 'delete' | 'hash-analysis' | 'force-collision' | 'debug-info' | 'configuration';

export default function AdvancedHashTableVisualizer({ initialCapacity = 8 }: AdvancedHashTableVisualizerProps) {
  // Función hash simple para la implementación
  const simpleHash = (key: string): number => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convierte a entero de 32 bits
    }
    return Math.abs(hash);
  };

  // Función hash secundaria para doble hash
  const secondaryHash = (key: string): number => {
    let hash = 5381;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) + hash) + key.charCodeAt(i);
    }
    return Math.abs(hash);
  };

  // Inicializar tabla hash
  const [hashTable, setHashTable] = useState<StaticHashTable<string, string>>(
    () => new StaticHashTable<string, string>({
      numBuckets: initialCapacity,
      bucketCapacity: 4,
      primaryHash: simpleHash,
      secondaryHash: secondaryHash,
      strategy: CollisionStrategy.LINEAR_PROBING
    })
  );

  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchResult, setSearchResult] = useState<string | undefined>(undefined);
  const [deleteKey, setDeleteKey] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [selectedMethod, setSelectedMethod] = useState<CollisionStrategy>(CollisionStrategy.LINEAR_PROBING);
  const [stats, setStats] = useState<Stats | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [hashInfo, setHashInfo] = useState<HashInfo | null>(null);
  const [hashKey, setHashKey] = useState('');
  const [forceCollisionKey1, setForceCollisionKey1] = useState('');
  const [forceCollisionKey2, setForceCollisionKey2] = useState('');
  const [showHashInfo, setShowHashInfo] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<OperationType>('insert');
  const [bucketCount, setBucketCount] = useState(initialCapacity);
  const [bucketCapacity, setBucketCapacity] = useState(4);

  // Actualizar estadísticas cuando cambie la tabla
  useEffect(() => {
    console.log(`[UI] Hash table changed, updating stats.`);
    const dump = hashTable.dump() as DebugInfo;
    const totalEntries = dump.buckets.reduce((sum: number, bucket: Array<{ deleted?: boolean }>) =>
      sum + bucket.filter((entry: { deleted?: boolean }) => !entry.deleted).length, 0);

    setStats({
      size: totalEntries,
      capacity: dump.numBuckets,
      loadFactor: totalEntries / (dump.numBuckets * dump.bucketCapacity),
      method: dump.strategy,
      buckets: dump.buckets.map((bucket: Array<{ deleted?: boolean }>) => ({
        entries: bucket.filter((entry: { deleted?: boolean }) => !entry.deleted).length,
        overflowEntries: 0 // Los overflow están en el área separada
      }))
    });

    setDebugInfo(dump);
  }, [hashTable]);

  // Función para generar buckets visuales
  const generateBuckets = (): Bucket[] => {
    const dump = hashTable.dump() as DebugInfo;
    const buckets: Bucket[] = [];

    // Crear buckets vacíos usando la capacidad real de la tabla hash
    for (let i = 0; i < dump.numBuckets; i++) {
      buckets.push({
        index: i,
        items: [],
        overflowItems: []
      });
    }

    // Distribuir elementos en buckets según el dump
    dump.buckets.forEach((bucketEntries: Array<{ key: string, value: string, deleted: boolean, next: number | null }>, index: number) => {
      if (index < buckets.length) {
        // Agregar elementos principales del bucket (no borrados)
        bucketEntries.filter((entry: { deleted: boolean }) => !entry.deleted).forEach((entry: { key: string, value: string, deleted: boolean, next: number | null }) => {
          buckets[index].items.push({
            key: entry.key,
            value: entry.value,
            deleted: entry.deleted,
            next: entry.next
          });
        });
      }
    });

    // Agregar elementos del área de overflow separada
    const overflowItems = dump.overflow
      .filter((entry: { key: string, value: string, deleted: boolean } | null) => entry && !entry.deleted)
      .map((entry: { key: string, value: string, deleted: boolean } | null) => ({
        key: entry!.key,
        value: entry!.value,
        deleted: entry!.deleted
      }));

    // Para simplificar, agregamos los overflow items al primer bucket
    // En una implementación más compleja, podrías mapear overflow items a buckets específicos
    if (overflowItems.length > 0 && buckets.length > 0) {
      buckets[0].overflowItems = overflowItems;
    }

    console.log(`[GENERATE_BUCKETS] Generando buckets para visualización:`);
    console.log(`[GENERATE_BUCKETS] - Total buckets: ${buckets.length}`);
    console.log(`[GENERATE_BUCKETS] - Elementos en buckets principales: ${buckets.reduce((sum, b) => sum + b.items.length, 0)}`);
    console.log(`[GENERATE_BUCKETS] - Elementos en overflow: ${overflowItems.length}`);

    return buckets;
  };

  // Función para obtener el índice del bucket para visualización
  const _getBucketIndexForVisualization = (key: string): number => {
    const keyString = String(key);
    const hash = simpleHash(keyString);
    return hash % (hashTable.dump() as DebugInfo).numBuckets;
  };

  const handleInsert = () => {
    if (!keyInput.trim() || !valueInput.trim()) {
      showMessage('Por favor ingresa tanto la clave como el valor', 'error');
      return;
    }

    const success = hashTable.insertar(keyInput.trim(), valueInput.trim());
    if (success) {
      showMessage(`Elemento insertado: ${keyInput} -> ${valueInput}`, 'success');
      setKeyInput('');
      setValueInput('');
    } else {
      showMessage('No se pudo insertar el elemento (tabla llena)', 'error');
    }
  };

  const handleSearch = () => {
    if (!searchKey.trim()) {
      showMessage('Por favor ingresa una clave para buscar', 'error');
      return;
    }

    const result = hashTable.buscar(searchKey.trim());
    if (result !== null) {
      setSearchResult(result);
      showMessage(`Elemento encontrado: ${searchKey} -> ${result}`, 'success');
    } else {
      setSearchResult(undefined);
      showMessage(`Elemento no encontrado: ${searchKey}`, 'error');
    }
  };

  const handleDelete = () => {
    if (!deleteKey.trim()) {
      showMessage('Por favor ingresa una clave para eliminar', 'error');
      return;
    }

    const success = hashTable.eliminar(deleteKey.trim());
    if (success) {
      showMessage(`Elemento eliminado: ${deleteKey}`, 'success');
      setDeleteKey('');
    } else {
      showMessage(`Elemento no encontrado: ${deleteKey}`, 'error');
    }
  };

  const handleClear = () => {
    // Crear una nueva tabla hash vacía
    const newHashTable = new StaticHashTable<string, string>({
      numBuckets: bucketCount,
      bucketCapacity: bucketCapacity,
      primaryHash: simpleHash,
      secondaryHash: secondaryHash,
      strategy: selectedMethod
    });
    setHashTable(newHashTable);
    showMessage('Tabla hash limpiada', 'info');
  };

  const _handleMethodChange = (method: CollisionStrategy) => {
    console.log(`[METHOD] Cambiando método de ${selectedMethod} a ${method}`);
    console.log(`[METHOD] Creando nueva tabla hash con numBuckets: ${bucketCount}, bucketCapacity: ${bucketCapacity}`);

    const newHashTable = new StaticHashTable<string, string>({
      numBuckets: bucketCount,
      bucketCapacity: bucketCapacity,
      primaryHash: simpleHash,
      secondaryHash: secondaryHash,
      strategy: method
    });
    setHashTable(newHashTable);
    setSelectedMethod(method);
    showMessage(`Método cambiado a: ${getMethodDisplayName(method)}`, 'info');
  };

  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const getMethodDisplayName = (method: CollisionStrategy): string => {
    switch (method) {
      case CollisionStrategy.LINEAR_PROBING:
        return 'Saturación Progresiva';
      case CollisionStrategy.CHAINED_LINEAR:
        return 'Saturación Progresiva Encadenada';
      case CollisionStrategy.DOUBLE_HASHING:
        return 'Doble Dispersión';
      case CollisionStrategy.SEPARATE_OVERFLOW:
        return 'Área de Desborde Separada';
      default:
        return 'Desconocido';
    }
  };

  const handleGetHashInfo = () => {
    if (!hashKey.trim()) {
      showMessage('Por favor ingresa una clave para analizar', 'error');
      return;
    }

    const primaryHash = simpleHash(hashKey.trim());
    const secondaryHashValue = secondaryHash(hashKey.trim());
    const dump = hashTable.dump() as DebugInfo;
    const bucketIndex = primaryHash % dump.numBuckets;

    // Generar secuencia de probing
    const probeSequence = [];
    for (let i = 0; i < dump.numBuckets; i++) {
      if (selectedMethod === CollisionStrategy.DOUBLE_HASHING) {
        const h2 = secondaryHashValue % dump.numBuckets;
        const adjustedH2 = h2 === 0 ? 1 : h2;
        probeSequence.push((primaryHash + i * adjustedH2) % dump.numBuckets);
      } else {
        probeSequence.push((primaryHash + i) % dump.numBuckets);
      }
    }

    // Determinar información del método de probing
    let probingMethod = '';
    let probingFormula = '';
    let probingExplanation = '';

    switch (selectedMethod) {
      case CollisionStrategy.LINEAR_PROBING:
        probingMethod = 'Sondeo Lineal (Linear Probing)';
        probingFormula = 'h(k, i) = (h₁(k) + i) mod m';
        probingExplanation = 'Examina posiciones consecutivas: h(k), h(k)+1, h(k)+2, ... hasta encontrar una posición libre.';
        break;

      case CollisionStrategy.DOUBLE_HASHING:
        probingMethod = 'Doble Hash (Double Hashing)';
        probingFormula = 'h(k, i) = (h₁(k) + i × h₂(k)) mod m';
        probingExplanation = 'Usa dos funciones hash para generar una secuencia más distribuida y evitar clusters.';
        break;

      case CollisionStrategy.CHAINED_LINEAR:
        probingMethod = 'Sondeo Lineal Encadenado (Chained Linear Probing)';
        probingFormula = 'h(k, i) = (h₁(k) + i) mod m (con enlaces)';
        probingExplanation = 'Combina sondeo lineal con encadenamiento para manejar colisiones múltiples en buckets.';
        break;

      case CollisionStrategy.SEPARATE_OVERFLOW:
        probingMethod = 'Área de Desborde Separada (Separate Overflow)';
        probingFormula = 'h(k) = h₁(k) mod m (overflow separado)';
        probingExplanation = 'Usa un área de desborde separada para elementos que no caben en los buckets principales.';
        break;

      default:
        probingMethod = 'Método no especificado';
        probingFormula = 'N/A';
        probingExplanation = 'Método de resolución de colisiones no implementado.';
    }

    setHashInfo({
      primaryHash,
      secondaryHash: selectedMethod === CollisionStrategy.DOUBLE_HASHING ? secondaryHashValue : undefined,
      bucketIndex,
      probeSequence,
      probingMethod,
      probingFormula,
      probingExplanation
    });
    setShowHashInfo(true);
  };

  const handleForceCollision = () => {
    if (!forceCollisionKey1.trim() || !forceCollisionKey2.trim()) {
      showMessage('Por favor ingresa ambas claves', 'error');
      return;
    }

    // Función hash modificada que siempre devuelve el mismo índice para forzar colisiones
    const forcedHash = (_key: string): number => {
      // Siempre devuelve el índice 0 para forzar que todas las claves vayan al mismo bucket
      return 0;
    };

    // Usar la función hash forzada para ambas claves
    const hash1 = forcedHash(forceCollisionKey1.trim());
    const hash2 = forcedHash(forceCollisionKey2.trim());
    const currentDump = hashTable.dump() as DebugInfo;
    const bucket1 = hash1 % currentDump.numBuckets;
    const bucket2 = hash2 % currentDump.numBuckets;

    console.log(`[FORCE_COLLISION] Clave 1: "${forceCollisionKey1}" -> Hash: ${hash1} -> Bucket: ${bucket1}`);
    console.log(`[FORCE_COLLISION] Clave 2: "${forceCollisionKey2}" -> Hash: ${hash2} -> Bucket: ${bucket2}`);
    console.log(`[FORCE_COLLISION] Método de resolución: ${getMethodDisplayName(selectedMethod)}`);

    // Crear una nueva tabla hash con la función hash forzada y actualizar la tabla principal
    const newHashTable = new StaticHashTable<string, string>({
      numBuckets: currentDump.numBuckets,
      bucketCapacity: currentDump.bucketCapacity,
      primaryHash: forcedHash,
      secondaryHash: secondaryHash,
      strategy: selectedMethod
    });

    // Insertar ambas claves en la nueva tabla
    const success1 = newHashTable.insertar(forceCollisionKey1.trim(), `valor_${forceCollisionKey1}`);
    const success2 = newHashTable.insertar(forceCollisionKey2.trim(), `valor_${forceCollisionKey2}`);

    console.log(`[FORCE_COLLISION] Inserción clave 1: ${success1 ? 'EXITOSA' : 'FALLIDA'}`);
    console.log(`[FORCE_COLLISION] Inserción clave 2: ${success2 ? 'EXITOSA' : 'FALLIDA'}`);

    // Actualizar la tabla hash principal para que se vea en la visualización
    setHashTable(newHashTable);

    // Mostrar el estado final de la tabla
    const finalDump = newHashTable.dump() as DebugInfo;
    console.log(`[FORCE_COLLISION] Estado final de la tabla:`);
    console.log(`[FORCE_COLLISION] - Buckets: ${finalDump.numBuckets}`);
    console.log(`[FORCE_COLLISION] - Capacidad por bucket: ${finalDump.bucketCapacity}`);
    console.log(`[FORCE_COLLISION] - Elementos en bucket 0: ${finalDump.buckets[0]?.length || 0}`);
    console.log(`[FORCE_COLLISION] - Elementos en overflow: ${finalDump.overflow.filter((entry: { deleted?: boolean } | null) => entry !== null).length}`);

    if (bucket1 === bucket2) {
      showMessage(`¡Colisión forzada exitosa! Ambas claves van al bucket ${bucket1}. Método de resolución: ${getMethodDisplayName(selectedMethod)}`, 'success');
    } else {
      showMessage(`Error: Las claves no están colisionando como se esperaba`, 'error');
    }
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  const handleConfigurationChange = () => {
    console.log(`\n=== CONFIGURANDO TABLA HASH ===`);
    console.log(`[CONFIG] Función handleConfigurationChange llamada`);
    console.log(`[CONFIG] Valores de configuración:`);
    console.log(`[CONFIG] - Cantidad de buckets: ${bucketCount}`);
    console.log(`[CONFIG] - Capacidad por bucket: ${bucketCapacity}`);
    console.log(`[CONFIG] - Método seleccionado: ${selectedMethod}`);

    if (bucketCount < 1 || bucketCount > 100) {
      console.log(`[CONFIG] ERROR: Cantidad de buckets inválida: ${bucketCount}`);
      showMessage('La cantidad de buckets debe ser un número entre 1 y 100', 'error');
      return;
    }

    if (bucketCapacity < 1 || bucketCapacity > 20) {
      console.log(`[CONFIG] ERROR: Capacidad por bucket inválida: ${bucketCapacity}`);
      showMessage('La capacidad de almacenamiento debe ser un número entre 1 y 20', 'error');
      return;
    }

    console.log(`[CONFIG] Creando nueva tabla hash con configuración:`);
    console.log(`[CONFIG] - numBuckets: ${bucketCount}`);
    console.log(`[CONFIG] - strategy: ${selectedMethod}`);
    console.log(`[CONFIG] - bucketCapacity: ${bucketCapacity}`);

    const newHashTable = new StaticHashTable<string, string>({
      numBuckets: bucketCount,
      bucketCapacity: bucketCapacity,
      primaryHash: simpleHash,
      secondaryHash: secondaryHash,
      strategy: selectedMethod
    });
    setHashTable(newHashTable);

    console.log(`[CONFIG] Tabla hash creada exitosamente`);
    console.log(`[CONFIG] Verificando configuración aplicada:`);
    const configDump = newHashTable.dump() as DebugInfo;
    console.log(`[CONFIG] - Tamaño de buckets: ${configDump.numBuckets}`);
    console.log(`[CONFIG] - Método: ${configDump.strategy}`);
    console.log(`=== FIN CONFIGURACIÓN ===\n`);

    showMessage(`Tabla hash reconfigurada: ${bucketCount} buckets con capacidad de ${bucketCapacity} elementos por bucket`, 'success');
  };

  const handleResetConfiguration = () => {
    setBucketCount(initialCapacity);
    setBucketCapacity(4);
    const newHashTable = new StaticHashTable<string, string>({
      numBuckets: initialCapacity,
      bucketCapacity: 4,
      primaryHash: simpleHash,
      secondaryHash: secondaryHash,
      strategy: CollisionStrategy.LINEAR_PROBING
    });
    setHashTable(newHashTable);
    setSelectedMethod(CollisionStrategy.LINEAR_PROBING);
    showMessage('Configuración restablecida a valores por defecto', 'info');
  };

  const renderOperationContent = () => {
    switch (selectedOperation) {
      case 'insert':
        return (
          <div className={styles.operationContent}>
            <h3>Insertar Elemento</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Valor"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleInsert} className={styles.button}>
                Insertar
              </button>
              <button onClick={handleClear} className={styles.button}>
                Limpiar Tabla
              </button>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className={styles.operationContent}>
            <h3>Buscar Elemento</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave a buscar"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleSearch} className={styles.button}>
                Buscar
              </button>
            </div>
            {searchResult !== undefined && (
              <div className={styles.searchResult}>
                <strong>Resultado:</strong> {searchResult}
              </div>
            )}
          </div>
        );

      case 'delete':
        return (
          <div className={styles.operationContent}>
            <h3>Eliminar Elemento</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave a eliminar"
                value={deleteKey}
                onChange={(e) => setDeleteKey(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleDelete} className={styles.button}>
                Eliminar
              </button>
            </div>
          </div>
        );

      case 'hash-analysis':
        return (
          <div className={styles.operationContent}>
            <h3>Análisis de Hash</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave para analizar"
                value={hashKey}
                onChange={(e) => setHashKey(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleGetHashInfo} className={styles.button}>
                Analizar
              </button>
            </div>
            {showHashInfo && hashInfo && (
              <div className={styles.hashInfo}>
                <h4>Información de Hash para &quot;{hashKey}&quot;</h4>

                <div className={styles.hashInfoSection}>
                  <h5>Valores de Hash</h5>
                  <p><strong>Hash Primario:</strong> {hashInfo.primaryHash}</p>
                  {hashInfo.secondaryHash && (
                    <p><strong>Hash Secundario:</strong> {hashInfo.secondaryHash}</p>
                  )}
                  <p><strong>Índice del Bucket:</strong> {hashInfo.bucketIndex}</p>
                </div>

                <div className={styles.hashInfoSection}>
                  <h5>Método de Probing Implementado</h5>
                  <p><strong>Tipo:</strong> {hashInfo.probingMethod}</p>
                  <p><strong>Fórmula:</strong> <code>{hashInfo.probingFormula}</code></p>
                  <p><strong>Explicación:</strong> {hashInfo.probingExplanation}</p>
                </div>

                <div className={styles.hashInfoSection}>
                  <h5>Secuencia de Probing</h5>
                  <p>Orden de posiciones que se revisarán en caso de colisión:</p>
                  <div className={styles.probeSequence}>
                    {hashInfo.probeSequence.map((index, i) => (
                      <span key={i} className={styles.probeStep}>
                        {i === 0 ? index : ` → ${index}`}
                      </span>
                    ))}
                  </div>
                  <p className={styles.probeNote}>
                    <strong>Nota:</strong> Si la posición inicial está ocupada, se revisarán las siguientes posiciones en este orden.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'force-collision':
        return (
          <div className={styles.operationContent}>
            <h3>Forzar Colisión</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Primera clave"
                value={forceCollisionKey1}
                onChange={(e) => setForceCollisionKey1(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Segunda clave"
                value={forceCollisionKey2}
                onChange={(e) => setForceCollisionKey2(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleForceCollision} className={styles.button}>
                Verificar Colisión
              </button>
            </div>
          </div>
        );

      case 'debug-info':
        return (
          <div className={styles.operationContent}>
            <h3>Información de Debug</h3>
            <button onClick={toggleDebugInfo} className={styles.button}>
              {showDebugInfo ? 'Ocultar' : 'Mostrar'} Información de Debug
            </button>
            {showDebugInfo && debugInfo && (
              <div className={styles.debugInfo}>
                <h4>Información Detallada de la Tabla Hash</h4>
                <div className={styles.debugSection}>
                  <h5>Configuración</h5>
                  <p><strong>Estrategia:</strong> {getMethodDisplayName(debugInfo.strategy)}</p>
                  <p><strong>Número de Buckets:</strong> {debugInfo.numBuckets}</p>
                  <p><strong>Capacidad por Bucket:</strong> {debugInfo.bucketCapacity}</p>
                </div>

                <div className={styles.debugSection}>
                  <h5>Buckets</h5>
                  {debugInfo.buckets.map((bucket, index) => (
                    <div key={index} className={styles.bucketDebug}>
                      <strong>Bucket {index}:</strong>
                      {bucket.length === 0 ? (
                        <span className={styles.emptyBucket}>Vacío</span>
                      ) : (
                        <div className={styles.bucketEntries}>
                          {bucket.map((entry, entryIndex) => (
                            <div key={entryIndex} className={styles.entryDebug}>
                              <span className={styles.entryKey}>{entry.key}</span>
                              <span className={styles.entryValue}>→ {entry.value}</span>
                              {entry.deleted && <span className={styles.deletedMark}>[BORRADO]</span>}
                              {entry.next !== null && entry.next !== undefined && (
                                <span className={styles.nextPointer}>→ {entry.next}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.debugSection}>
                  <h5>Área de Overflow</h5>
                  {debugInfo.overflow.some(entry => entry !== null) ? (
                    <div className={styles.overflowDebug}>
                      {debugInfo.overflow.map((entry, index) => (
                        entry && (
                          <div key={index} className={styles.overflowEntry}>
                            <span className={styles.overflowIndex}>[{index}]</span>
                            <span className={styles.entryKey}>{entry.key}</span>
                            <span className={styles.entryValue}>→ {entry.value}</span>
                            {entry.deleted && <span className={styles.deletedMark}>[BORRADO]</span>}
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <span className={styles.emptyOverflow}>Vacía</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'configuration':
        return (
          <div className={styles.operationContent}>
            <h3>Configuración de la Tabla Hash</h3>
            <div className={styles.configurationSection}>
              <div className={styles.inputGroup}>
                <label>Cantidad de Buckets:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bucketCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 100) {
                      setBucketCount(value);
                    }
                  }}
                  className={styles.configurationInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Capacidad por Bucket:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={bucketCapacity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 20) {
                      setBucketCapacity(value);
                    }
                  }}
                  className={styles.configurationInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Método de Resolución de Colisiones:</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as CollisionStrategy)}
                  className={styles.configurationInput}
                >
                  <option value={CollisionStrategy.LINEAR_PROBING}>Saturación Progresiva</option>
                  <option value={CollisionStrategy.CHAINED_LINEAR}>Saturación Progresiva Encadenada</option>
                  <option value={CollisionStrategy.DOUBLE_HASHING}>Doble Dispersión</option>
                  <option value={CollisionStrategy.SEPARATE_OVERFLOW}>Área de Desborde Separada</option>
                </select>
              </div>
              <div className={styles.configurationActions}>
                <button onClick={handleConfigurationChange} className={styles.configurationButton}>
                  Configurar
                </button>
                <button onClick={handleResetConfiguration} className={styles.resetButton}>
                  Restablecer
                </button>
                <button onClick={handleClear} className={styles.clearConfigButton}>
                  Limpiar Tabla
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const buckets = generateBuckets();

  return (
    <div className={styles.container}>
      <h1>Visualizador de Tabla Hash Avanzada</h1>

      {/* Mensaje de estado */}
      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      {/* Panel de operaciones */}
      <div className={styles.operationsPanel}>
        <div className={styles.operationTabs}>
          <button
            className={`${styles.tab} ${selectedOperation === 'insert' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('insert')}
          >
            Insertar
          </button>
          <button
            className={`${styles.tab} ${selectedOperation === 'search' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('search')}
          >
            Buscar
          </button>
          <button
            className={`${styles.tab} ${selectedOperation === 'delete' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('delete')}
          >
            Eliminar
          </button>
          <button
            className={`${styles.tab} ${selectedOperation === 'hash-analysis' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('hash-analysis')}
          >
            Análisis Hash
          </button>
          <button
            className={`${styles.tab} ${selectedOperation === 'force-collision' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('force-collision')}
          >
            Forzar Colisión
          </button>
          <button
            className={`${styles.tab} ${selectedOperation === 'debug-info' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('debug-info')}
          >
            Debug Info
          </button>
          <button
            className={`${styles.tab} ${selectedOperation === 'configuration' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('configuration')}
          >
            Configuración
          </button>
        </div>

        {renderOperationContent()}
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className={styles.stats}>
          <h3>Estadísticas</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Tamaño:</span>
              <span className={styles.statValue}>{stats.size}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Capacidad:</span>
              <span className={styles.statValue}>{stats.capacity}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Factor de Carga:</span>
              <span className={styles.statValue}>{(stats.loadFactor * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Método:</span>
              <span className={styles.statValue}>{getMethodDisplayName(stats.method)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Visualización de buckets */}
      <div className={styles.bucketsContainer}>
        <h3>Visualización de Buckets</h3>
        <div className={styles.bucketsGrid}>
          {buckets.map((bucket) => (
            <div key={bucket.index} className={styles.bucket}>
              <div className={styles.bucketHeader}>
                <span className={styles.bucketIndex}>Bucket {bucket.index}</span>
                <span className={styles.bucketCount}>
                  {bucket.items.length}/{bucketCapacity}
                </span>
              </div>

              <div className={styles.bucketItems}>
                {bucket.items.length === 0 ? (
                  <div className={styles.emptyBucket}>Vacío</div>
                ) : (
                  bucket.items.map((item, index) => (
                    <div key={index} className={styles.bucketItem}>
                      <span className={styles.itemKey}>{item.key}</span>
                      <span className={styles.itemValue}>{item.value}</span>
                      {item.deleted && <span className={styles.deletedMark}>[BORRADO]</span>}
                      {item.next !== undefined && item.next !== -1 && (
                        <span className={styles.nextPointer}>→ {item.next}</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {bucket.overflowItems && bucket.overflowItems.length > 0 && (
                <div className={styles.overflowChain}>
                  <div className={styles.overflowHeader}>🚨 Desborde:</div>
                  {bucket.overflowItems.map((item, index) => (
                    <div key={index} className={styles.overflowItem}>
                      <span className={styles.itemKey}>{item.key}</span>
                      <span className={styles.itemValue}>{item.value}</span>
                      {item.deleted && <span className={styles.deletedMark}>[BORRADO]</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Referencia visual al área de desborde cuando se usa SEPARATE_OVERFLOW */}
              {selectedMethod === CollisionStrategy.SEPARATE_OVERFLOW &&
                bucket.overflowItems && bucket.overflowItems.length > 0 && (
                  <div className={styles.overflowReference}></div>
                )}
            </div>
          ))}
        </div>
      </div>
      <footer className={styles.footer}>
        <span>by thestalkerN-Germán Campodónico</span>
      </footer>
    </div>
  );
} 