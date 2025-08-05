'use client';

import React, { useState, useEffect } from 'react';
import { AdvancedHashTable, CollisionResolutionMethod } from '../AdvancedHashTable';
import styles from './AdvancedHashTableVisualizer.module.css';

interface HashEntry {
  key: string;
  value: string;
  isDeleted?: boolean;
  originalIndex?: number;
  probeCount?: number;
  hashValue?: number;
  secondaryHash?: number;
}

interface AdvancedHashTableVisualizerProps {
  initialCapacity?: number;
}

interface BucketItem {
  key: string;
  value: string;
  isDeleted?: boolean;
}

interface Bucket {
  index: number;
  items: BucketItem[];
  overflowItems?: BucketItem[];
  overflowChain?: Bucket;
}

interface Stats {
  size: number;
  capacity: number;
  loadFactor: number;
  method: CollisionResolutionMethod;
  buckets: Array<{ entries: number; overflowEntries: number }>;
}

interface DebugInfo {
  method: CollisionResolutionMethod;
  buckets: Array<{
    index: number;
    entries: HashEntry[];
    overflowChain?: unknown;
    probeInfo?: { totalProbes: number; maxProbes: number };
  }>;
  overflowArea: HashEntry[];
  directory?: unknown[];
  globalDepth?: number;
  hashTable: HashEntry[];
}

interface HashInfo {
  primaryHash: number;
  secondaryHash?: number;
  bucketIndex: number;
  probeSequence: number[];
}

export default function AdvancedHashTableVisualizer({ initialCapacity = 8 }: AdvancedHashTableVisualizerProps) {
  const [hashTable, setHashTable] = useState<AdvancedHashTable<string, string>>(
    new AdvancedHashTable(initialCapacity, CollisionResolutionMethod.CHAINING)
  );
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchResult, setSearchResult] = useState<string | undefined>(undefined);
  const [deleteKey, setDeleteKey] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [selectedMethod, setSelectedMethod] = useState<CollisionResolutionMethod>(CollisionResolutionMethod.CHAINING);
  const [stats, setStats] = useState<Stats | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [hashInfo, setHashInfo] = useState<HashInfo | null>(null);
  const [hashKey, setHashKey] = useState('');
  const [forceCollisionKey1, setForceCollisionKey1] = useState('');
  const [forceCollisionKey2, setForceCollisionKey2] = useState('');
  const [showHashInfo, setShowHashInfo] = useState(false);

  // Actualizar estadísticas cuando cambie la tabla
  useEffect(() => {
    setStats(hashTable.getStats());
    const debug = hashTable.getDebugInfo();
    setDebugInfo(debug);
  }, [hashTable]);

  // Debug temporal para hash extensible
  useEffect(() => {
    if (selectedMethod === CollisionResolutionMethod.EXTENDIBLE_HASH && debugInfo) {
      console.log('Hash Extensible Debug:', {
        method: debugInfo.method,
        directory: debugInfo.directory,
        globalDepth: debugInfo.globalDepth,
        buckets: debugInfo.buckets
      });
    }
  }, [selectedMethod, debugInfo]);

  // Función para generar buckets visuales
  const generateBuckets = (): Bucket[] => {
    const buckets: Bucket[] = [];
    const entries = hashTable.entries();
    const stats = hashTable.getStats();
    
    // Crear buckets vacíos
    for (let i = 0; i < initialCapacity; i++) {
      buckets.push({ 
        index: i, 
        items: [],
        overflowItems: []
      });
    }
    
    // Distribuir elementos en buckets según el método
    entries.forEach(({ key, value }) => {
      const bucketIndex = getBucketIndexForVisualization(key);
      if (bucketIndex < buckets.length) {
        buckets[bucketIndex].items.push({ key, value });
      }
    });
    
    return buckets;
  };

  // Función para obtener el índice del bucket para visualización
  const getBucketIndexForVisualization = (key: string): number => {
    const keyString = String(key);
    let hash = 0;
    
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash) % initialCapacity;
  };

  // Función para insertar elemento
  const handleInsert = () => {
    if (!keyInput.trim() || !valueInput.trim()) {
      showMessage('Por favor ingresa tanto la clave como el valor', 'error');
      return;
    }

    try {
      hashTable.set(keyInput, valueInput);
      setKeyInput('');
      setValueInput('');
      showMessage(`Elemento "${keyInput}" insertado exitosamente`, 'success');
    } catch (error) {
      showMessage('Error al insertar elemento: ' + (error as Error).message, 'error');
    }
  };

  // Función para buscar elemento
  const handleSearch = () => {
    if (!searchKey.trim()) {
      showMessage('Por favor ingresa una clave para buscar', 'error');
      return;
    }

    const result = hashTable.get(searchKey);
    setSearchResult(result);
    
    if (result !== undefined) {
      showMessage(`Elemento encontrado: "${searchKey}" = "${result}"`, 'success');
    } else {
      showMessage(`Elemento "${searchKey}" no encontrado`, 'error');
    }
  };

  // Función para eliminar elemento
  const handleDelete = () => {
    if (!deleteKey.trim()) {
      showMessage('Por favor ingresa una clave para eliminar', 'error');
      return;
    }

    const deleted = hashTable.delete(deleteKey);
    setDeleteKey('');
    
    if (deleted) {
      showMessage(`Elemento "${deleteKey}" eliminado exitosamente`, 'success');
    } else {
      showMessage(`Elemento "${deleteKey}" no encontrado`, 'error');
    }
  };

  // Función para limpiar tabla
  const handleClear = () => {
    hashTable.clear();
    setSearchResult(undefined);
    showMessage('Tabla hash limpiada', 'info');
  };

  // Función para cambiar método de resolución
  const handleMethodChange = (method: CollisionResolutionMethod) => {
    setSelectedMethod(method);
    hashTable.setMethod(method);
    showMessage(`Método cambiado a: ${getMethodDisplayName(method)}`, 'info');
  };

  // Función para mostrar mensajes
  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  // Función para obtener nombre del método
  const getMethodDisplayName = (method: CollisionResolutionMethod): string => {
    const names = {
      [CollisionResolutionMethod.CHAINING]: 'Encadenamiento',
      [CollisionResolutionMethod.LINEAR_PROBING]: 'Saturación Progresiva',
      [CollisionResolutionMethod.CHAINED_LINEAR_PROBING]: 'Saturación Progresiva Encadenada',
      [CollisionResolutionMethod.SEPARATE_OVERFLOW]: 'Área de Desborde por Separado',
      [CollisionResolutionMethod.TABLE_ASSISTED_HASH]: 'Hash Asistido por Tabla',
      [CollisionResolutionMethod.EXTENDIBLE_HASH]: 'Hash Extensible'
    };
    return names[method];
  };

  // Función para obtener información de hash
  const handleGetHashInfo = () => {
    if (!hashKey.trim()) {
      showMessage('Por favor ingresa una clave para analizar', 'error');
      return;
    }

    try {
      const info = hashTable.getHashInfo(hashKey);
      setHashInfo(info);
      setShowHashInfo(true);
      showMessage(`Información de hash obtenida para "${hashKey}"`, 'success');
    } catch (error) {
      showMessage('Error al obtener información de hash: ' + (error as Error).message, 'error');
    }
  };

  // Función para forzar colisión
  const handleForceCollision = () => {
    if (!forceCollisionKey1.trim() || !forceCollisionKey2.trim()) {
      showMessage('Por favor ingresa dos claves para verificar colisión', 'error');
      return;
    }

    try {
      const hasCollision = hashTable.forceCollision(forceCollisionKey1, forceCollisionKey2);
      if (hasCollision) {
        showMessage(`¡Colisión detectada! Las claves "${forceCollisionKey1}" y "${forceCollisionKey2}" van al mismo bucket`, 'info');
      } else {
        showMessage(`No hay colisión entre "${forceCollisionKey1}" y "${forceCollisionKey2}"`, 'info');
      }
    } catch (error) {
      showMessage('Error al verificar colisión: ' + (error as Error).message, 'error');
    }
  };

  // Función para mostrar información de debug
  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  const buckets = generateBuckets();

  return (
    <div className={styles.advancedHashTableVisualizer}>
      <h1>🔬 Visualizador Avanzado de Hash Table</h1>
      
      {/* Mensaje de estado */}
      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      {/* Panel de control */}
      <div className={styles.controlPanel}>
        
        {/* Selector de método */}
        <div className={styles.methodSelector}>
          <h3>🎯 Método de Resolución de Colisiones</h3>
          <div className={styles.methodButtons}>
            {Object.values(CollisionResolutionMethod).map((method) => (
              <button
                key={method}
                className={`${styles.methodButton} ${selectedMethod === method ? styles.active : ''}`}
                onClick={() => handleMethodChange(method)}
              >
                {getMethodDisplayName(method)}
              </button>
            ))}
          </div>
        </div>

        {/* Panel de operaciones */}
        <div className={styles.operationsPanel}>
          <div className={styles.operationSection}>
            <h3>📝 Insertar Elemento</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
              />
              <input
                type="text"
                placeholder="Valor"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
              />
              <button onClick={handleInsert} className={styles.insertButton}>
                Insertar
              </button>
            </div>
          </div>

          <div className={styles.operationSection}>
            <h3>🔍 Buscar Elemento</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave a buscar"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className={styles.searchButton}>
                Buscar
              </button>
            </div>
            {searchResult !== undefined && (
              <div className={styles.searchResult}>
                Resultado: {searchResult !== undefined ? searchResult : 'No encontrado'}
              </div>
            )}
          </div>

          <div className={styles.operationSection}>
            <h3>🗑️ Eliminar Elemento</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave a eliminar"
                value={deleteKey}
                onChange={(e) => setDeleteKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDelete()}
              />
              <button onClick={handleDelete} className={styles.deleteButton}>
                Eliminar
              </button>
            </div>
          </div>

          {/* Nuevas secciones de debug */}
          <div className={styles.operationSection}>
            <h3>🔬 Análisis de Hash</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave para analizar hash"
                value={hashKey}
                onChange={(e) => setHashKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGetHashInfo()}
              />
              <button onClick={handleGetHashInfo} className={styles.debugButton}>
                Analizar Hash
              </button>
            </div>
          </div>

          <div className={styles.operationSection}>
            <h3>💥 Forzar Colisión</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Clave 1"
                value={forceCollisionKey1}
                onChange={(e) => setForceCollisionKey1(e.target.value)}
              />
              <input
                type="text"
                placeholder="Clave 2"
                value={forceCollisionKey2}
                onChange={(e) => setForceCollisionKey2(e.target.value)}
              />
              <button onClick={handleForceCollision} className={styles.debugButton}>
                Verificar Colisión
              </button>
            </div>
          </div>

          <div className={styles.operationSection}>
            <h3>🔍 Información de Debug</h3>
            <div className={styles.inputGroup}>
              <button 
                onClick={toggleDebugInfo} 
                className={`${styles.debugButton} ${showDebugInfo ? styles.active : ''}`}
              >
                {showDebugInfo ? 'Ocultar Debug' : 'Mostrar Debug'}
              </button>
            </div>
          </div>

          <div className={styles.operationSection}>
            <h3>🧹 Utilidades</h3>
            <div className={styles.utilityButtons}>
              <button onClick={handleClear} className={styles.clearButton}>
                Limpiar Tabla
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className={styles.stats}>
          <h3>📊 Estadísticas</h3>
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

      {/* Visualización de la tabla */}
      <div className={styles.tableVisualization}>
        <h3>📋 Estructura de la Tabla Hash</h3>
        
        {/* Visualización especial para Hash Extensible */}
        {selectedMethod === CollisionResolutionMethod.EXTENDIBLE_HASH && (
          <div className={styles.extendibleVisualization}>
            <div className={styles.directorySection}>
              <h4>📁 Directorio</h4>
              <div className={styles.directoryVisual}>
                {debugInfo?.directory ? (
                  debugInfo.directory.map((entry, index) => (
                    <div key={index} className={styles.directoryItem}>
                      <span className={styles.directoryIndex}>Dir[{index}]</span>
                      <span className={styles.directoryArrow}>→</span>
                      <span className={styles.directoryBucket}>Bucket {(entry as any).bucketIndex}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.directoryItem}>
                    <span className={styles.directoryIndex}>Directorio no disponible</span>
                  </div>
                )}
              </div>
              {debugInfo?.globalDepth && (
                <div className={styles.globalDepthInfo}>
                  <span>Profundidad Global: {debugInfo.globalDepth}</span>
                </div>
              )}
            </div>
            
            <div className={styles.bucketsContainer}>
              {buckets.map((bucket) => (
                <div key={bucket.index} className={`${styles.bucket} ${styles.extendibleBucket}`}>
                  <div className={styles.bucketHeader}>
                    <span>Bucket {bucket.index}</span>
                    <span className={styles.bucketSize}>
                      ({bucket.items.length} elementos)
                    </span>
                  </div>
                  <div className={styles.bucketContent}>
                    {bucket.items.length === 0 ? (
                      <div className={styles.emptyBucket}>Vacío</div>
                    ) : (
                      bucket.items.map((item, index) => (
                        <div key={index} className={styles.bucketItem}>
                          <span className={styles.itemKey}>{item.key}</span>
                          <span className={styles.itemValue}>{item.value}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visualización estándar para otros métodos */}
        {selectedMethod !== CollisionResolutionMethod.EXTENDIBLE_HASH && (
          <div className={styles.bucketsContainer}>
            {buckets.map((bucket) => (
              <div key={bucket.index} className={styles.bucket}>
                <div className={styles.bucketHeader}>
                  Bucket {bucket.index}
                  <span className={styles.bucketSize}>
                    ({bucket.items.length} elementos)
                  </span>
                </div>
                <div className={styles.bucketContent}>
                  {bucket.items.length === 0 ? (
                    <div className={styles.emptyBucket}>Vacío</div>
                  ) : (
                    bucket.items.map((item, index) => (
                      <div key={index} className={styles.bucketItem}>
                        <span className={styles.itemKey}>{item.key}</span>
                        <span className={styles.itemValue}>{item.value}</span>
                      </div>
                    ))
                  )}
                </div>
                {bucket.overflowChain && bucket.overflowChain.items.length > 0 && (
                  <div className={styles.overflowChain}>
                    <div className={styles.overflowHeader}>Desborde:</div>
                    {bucket.overflowChain.items.map((item, index) => (
                      <div key={index} className={styles.overflowItem}>
                        <span className={styles.itemKey}>{item.key}</span>
                        <span className={styles.itemValue}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Área de Desborde por Separado */}
      {selectedMethod === CollisionResolutionMethod.SEPARATE_OVERFLOW && debugInfo && debugInfo.overflowArea.length > 0 && (
        <div className={styles.separateOverflowArea}>
          <h3>🚨 Área de Desborde por Separado</h3>
          <div className={styles.overflowAreaContainer}>
            <div className={styles.overflowAreaHeader}>
              <span>Elementos en Área de Desborde: {debugInfo.overflowArea.length}</span>
            </div>
            <div className={styles.overflowAreaGrid}>
              {debugInfo.overflowArea.map((entry, index) => (
                <div key={index} className={styles.overflowAreaItem}>
                  <div className={styles.overflowItemHeader}>
                    <span className={styles.overflowItemIndex}>#{index + 1}</span>
                  </div>
                  <div className={styles.overflowItemContent}>
                    <span className={styles.itemKey}>{entry.key}</span>
                    <span className={styles.itemValue}>{entry.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visualización especial para Hash Asistido por Tabla */}
      {selectedMethod === CollisionResolutionMethod.TABLE_ASSISTED_HASH && debugInfo && (
        <div className={styles.tableAssistedVisualization}>
          <h3>🔧 Hash Asistido por Tabla</h3>
          <div className={styles.hashTableInfo}>
            <div className={styles.hashFunctionsSection}>
              <h4>📊 Funciones Hash</h4>
              <div className={styles.hashFunctionsGrid}>
                <div className={styles.hashFunctionCard}>
                  <h5>Hash Primario</h5>
                  <p>h₁(k) = hash(k) % capacity</p>
                  <p>Se usa para la distribución inicial</p>
                </div>
                <div className={styles.hashFunctionCard}>
                  <h5>Hash Secundario</h5>
                  <p>h₂(k) = hash2(k) % (capacity - 1) + 1</p>
                  <p>Se usa para calcular incrementos</p>
                </div>
              </div>
            </div>
            
            <div className={styles.probeSequenceSection}>
              <h4>🔍 Secuencia de Sondeo</h4>
              <div className={styles.probeSequenceInfo}>
                <p>Cuando hay colisión, se usa: (h₁(k) + i × h₂(k)) % capacity</p>
                <div className={styles.probeSequenceExample}>
                  <span>Ejemplo: Si h₁("clave") = 3 y h₂("clave") = 2</span>
                  <div className={styles.probeSteps}>
                    <span>Paso 0: (3 + 0 × 2) % 8 = 3</span>
                    <span>Paso 1: (3 + 1 × 2) % 8 = 5</span>
                    <span>Paso 2: (3 + 2 × 2) % 8 = 7</span>
                    <span>Paso 3: (3 + 3 × 2) % 8 = 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información del método */}
      <div className={styles.methodInfo}>
        <h3>ℹ️ Información del Método</h3>
        <div className={styles.methodDescription}>
          {selectedMethod === CollisionResolutionMethod.CHAINING && (
            <p>
              <strong>Encadenamiento:</strong> Las colisiones se resuelven creando una lista enlazada 
              de elementos en cada bucket. Ventajas: simple, eficiente para cargas altas. 
              Desventajas: uso de memoria adicional.
            </p>
          )}
          {selectedMethod === CollisionResolutionMethod.LINEAR_PROBING && (
            <p>
              <strong>Saturación Progresiva:</strong> Cuando hay una colisión, se busca la siguiente 
              posición disponible en la tabla. Ventajas: uso eficiente de memoria. 
              Desventajas: puede generar agrupación primaria.
            </p>
          )}
          {selectedMethod === CollisionResolutionMethod.CHAINED_LINEAR_PROBING && (
            <p>
              <strong>Saturación Progresiva Encadenada:</strong> Combina saturación progresiva con 
              encadenamiento para buckets llenos. Ventajas: balance entre memoria y rendimiento. 
              Desventajas: complejidad adicional.
            </p>
          )}
          {selectedMethod === CollisionResolutionMethod.SEPARATE_OVERFLOW && (
            <p>
              <strong>Área de Desborde por Separado:</strong> Los elementos que no caben en los 
              buckets principales se almacenan en un área de desborde separada. Ventajas: 
              organización clara. Desventajas: acceso adicional a memoria.
            </p>
          )}
          {selectedMethod === CollisionResolutionMethod.TABLE_ASSISTED_HASH && (
            <p>
              <strong>Hash Asistido por Tabla:</strong> Utiliza una función hash secundaria para 
              calcular el incremento en caso de colisión. Ventajas: reduce la agrupación. 
              Desventajas: más cálculos por operación.
            </p>
          )}
          {selectedMethod === CollisionResolutionMethod.EXTENDIBLE_HASH && (
            <p>
              <strong>Hash Extensible:</strong> Utiliza un directorio que apunta a buckets, 
              permitiendo división dinámica. Ventajas: adaptación automática al tamaño. 
              Desventajas: complejidad de implementación.
            </p>
          )}
        </div>
      </div>

      {/* Información de Hash */}
      {showHashInfo && hashInfo && (
        <div className={styles.hashInfo}>
          <h3>🔬 Información de Hash</h3>
          <div className={styles.hashInfoGrid}>
            <div className={styles.hashInfoItem}>
              <span className={styles.hashLabel}>Hash Primario:</span>
              <span className={styles.hashValue}>{hashInfo.primaryHash}</span>
            </div>
            {hashInfo.secondaryHash && (
              <div className={styles.hashInfoItem}>
                <span className={styles.hashLabel}>Hash Secundario:</span>
                <span className={styles.hashValue}>{hashInfo.secondaryHash}</span>
              </div>
            )}
            <div className={styles.hashInfoItem}>
              <span className={styles.hashLabel}>Índice del Bucket:</span>
              <span className={styles.hashValue}>{hashInfo.bucketIndex}</span>
            </div>
            <div className={styles.hashInfoItem}>
              <span className={styles.hashLabel}>Secuencia de Sondeo:</span>
              <div className={styles.probeSequence}>
                {hashInfo.probeSequence.slice(0, 10).map((index, i) => (
                  <span key={i} className={styles.probeIndex}>{index}</span>
                ))}
                {hashInfo.probeSequence.length > 10 && (
                  <span className={styles.probeMore}>...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de Debug */}
      {showDebugInfo && debugInfo && (
        <div className={styles.debugInfo}>
          <h3>🔍 Información de Debug</h3>
          
          {/* Información específica del método */}
          {debugInfo.method === CollisionResolutionMethod.TABLE_ASSISTED_HASH && (
            <div className={styles.methodSpecificInfo}>
              <h4>📊 Hash Asistido por Tabla</h4>
              <div className={styles.hashTableInfo}>
                <p>Este método utiliza dos funciones hash para reducir la agrupación:</p>
                <ul>
                  <li>Hash primario: para la distribución inicial</li>
                  <li>Hash secundario: para calcular el incremento en colisiones</li>
                </ul>
              </div>
            </div>
          )}

          {debugInfo.method === CollisionResolutionMethod.EXTENDIBLE_HASH && (
            <div className={styles.methodSpecificInfo}>
              <h4>📊 Hash Extensible</h4>
              <div className={styles.extendibleInfo}>
                <p>Profundidad Global: {debugInfo.globalDepth}</p>
                <div className={styles.directoryInfo}>
                  <h5>Directorio:</h5>
                  <div className={styles.directoryGrid}>
                                         {debugInfo.directory?.map((entry, index) => (
                       <div key={index} className={styles.directoryEntry}>
                         <span>Dir[{index}]: Bucket {(entry as any).bucketIndex}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información de buckets con detalles */}
          <div className={styles.bucketsDebug}>
            <h4>📋 Detalles de Buckets</h4>
            <div className={styles.bucketsDebugGrid}>
              {debugInfo.buckets.map((bucket) => (
                <div key={bucket.index} className={styles.bucketDebug}>
                  <div className={styles.bucketDebugHeader}>
                    Bucket {bucket.index}
                    <span className={styles.bucketDebugSize}>
                      ({bucket.entries.length} elementos)
                    </span>
                  </div>
                  <div className={styles.bucketDebugContent}>
                    {bucket.entries.map((entry, index) => (
                      <div key={index} className={styles.debugEntry}>
                        <span className={styles.debugKey}>{entry.key}</span>
                        <span className={styles.debugValue}>{entry.value}</span>
                        {entry.probeCount && (
                          <span className={styles.probeCount}>
                            Sondeos: {entry.probeCount}
                          </span>
                        )}
                        {entry.hashValue && (
                          <span className={styles.hashValue}>
                            Hash: {entry.hashValue}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {bucket.probeInfo && (
                    <div className={styles.probeInfo}>
                      <span>Total sondeos: {bucket.probeInfo.totalProbes}</span>
                      <span>Máx sondeos: {bucket.probeInfo.maxProbes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Área de desborde */}
          {debugInfo.overflowArea.length > 0 && (
            <div className={styles.overflowAreaDebug}>
              <h4>🚨 Área de Desborde</h4>
              <div className={styles.overflowAreaContent}>
                {debugInfo.overflowArea.map((entry, index) => (
                  <div key={index} className={styles.overflowEntry}>
                    <span className={styles.debugKey}>{entry.key}</span>
                    <span className={styles.debugValue}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 