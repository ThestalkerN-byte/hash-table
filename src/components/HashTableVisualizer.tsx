'use client';

import React, { useState, useEffect } from 'react';
import { HashTable } from '../HashTable';
import styles from './HashTableVisualizer.module.css';

interface HashTableVisualizerProps {
  initialCapacity?: number;
}

interface BucketItem {
  key: string;
  value: string;
}

interface Bucket {
  index: number;
  items: BucketItem[];
}

export default function HashTableVisualizer({ initialCapacity = 8 }: HashTableVisualizerProps) {
  const [hashTable, setHashTable] = useState<HashTable<string, string>>(new HashTable(initialCapacity));
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchResult, setSearchResult] = useState<string | undefined>(undefined);
  const [deleteKey, setDeleteKey] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Función para mostrar mensajes
  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  // Función para insertar un elemento
  const handleInsert = () => {
    if (!keyInput.trim() || !valueInput.trim()) {
      showMessage('Por favor ingresa tanto la clave como el valor', 'error');
      return;
    }

    const newHashTable = new HashTable<string, string>(hashTable.getSize() + 1);
    // Copiar elementos existentes
    hashTable.entries().forEach(({ key, value }) => {
      newHashTable.set(key, value);
    });
    // Insertar nuevo elemento
    newHashTable.set(keyInput.trim(), valueInput.trim());
    
    setHashTable(newHashTable);
    setKeyInput('');
    setValueInput('');
    showMessage(`Elemento "${keyInput}" insertado exitosamente`, 'success');
  };

  // Función para buscar un elemento
  const handleSearch = () => {
    if (!searchKey.trim()) {
      showMessage('Por favor ingresa una clave para buscar', 'error');
      return;
    }

    const result = hashTable.get(searchKey.trim());
    setSearchResult(result);
    
    if (result !== undefined) {
      showMessage(`Elemento encontrado: ${result}`, 'success');
    } else {
      showMessage(`Elemento "${searchKey}" no encontrado`, 'error');
    }
  };

  // Función para eliminar un elemento
  const handleDelete = () => {
    if (!deleteKey.trim()) {
      showMessage('Por favor ingresa una clave para eliminar', 'error');
      return;
    }

    const newHashTable = new HashTable<string, string>(hashTable.getSize());
    // Copiar elementos existentes
    hashTable.entries().forEach(({ key, value }) => {
      if (key !== deleteKey.trim()) {
        newHashTable.set(key, value);
      }
    });
    
    setHashTable(newHashTable);
    setDeleteKey('');
    showMessage(`Elemento "${deleteKey}" eliminado exitosamente`, 'success');
  };

  // Función para limpiar la tabla
  const handleClear = () => {
    setHashTable(new HashTable(initialCapacity));
    setSearchResult(undefined);
    showMessage('Hash table limpiada', 'info');
  };

  // Función para generar buckets visuales
  const generateBuckets = (): Bucket[] => {
    const buckets: Bucket[] = [];
    const entries = hashTable.entries();
    
    // Crear buckets vacíos
    for (let i = 0; i < initialCapacity; i++) {
      buckets.push({ index: i, items: [] });
    }
    
    // Distribuir elementos en buckets usando una función hash simple
    entries.forEach(({ key, value }) => {
      const keyString = String(key);
      let hash = 0;
      
      for (let i = 0; i < keyString.length; i++) {
        const char = keyString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convierte a entero de 32 bits
      }
      
      const bucketIndex = Math.abs(hash) % initialCapacity;
      buckets[bucketIndex].items.push({ key, value });
    });
    
    return buckets;
  };

  const buckets = generateBuckets();

  return (
    <div className={styles.hashTableVisualizer}>
      <h1>🔍 Visualizador de Hash Table</h1>
      
      {/* Mensaje de estado */}
      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      {/* Panel de control */}
      <div className={styles.controlPanel}>
        <div className={styles.controlSection}>
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
            <button onClick={handleInsert} className={styles.btnPrimary}>
              Insertar
            </button>
          </div>
        </div>

        <div className={styles.controlSection}>
          <h3>🔍 Buscar Elemento</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Clave a buscar"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className={styles.btnSecondary}>
              Buscar
            </button>
          </div>
          {searchResult !== undefined && (
            <div className={styles.searchResult}>
              <strong>Resultado:</strong> {searchResult}
            </div>
          )}
        </div>

        <div className={styles.controlSection}>
          <h3>🗑️ Eliminar Elemento</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Clave a eliminar"
              value={deleteKey}
              onChange={(e) => setDeleteKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDelete()}
            />
            <button onClick={handleDelete} className={styles.btnDanger}>
              Eliminar
            </button>
          </div>
        </div>

        <div className={styles.controlSection}>
          <h3>🔄 Acciones</h3>
          <div className={styles.buttonGroup}>
            <button onClick={handleClear} className={styles.btnWarning}>
              Limpiar Tabla
            </button>
            <div className={styles.stats}>
              <span>Elementos: {hashTable.getSize()}</span>
              <span>Capacidad: {initialCapacity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualización de la Hash Table */}
      <div className={styles.hashTableDisplay}>
        <h3>📊 Estructura de la Hash Table</h3>
        <div className={styles.bucketsContainer}>
          {buckets.map((bucket) => (
            <div key={bucket.index} className={styles.bucket}>
              <div className={styles.bucketHeader}>
                Bucket {bucket.index}
              </div>
              <div className={styles.bucketItems}>
                {bucket.items.length === 0 ? (
                  <div className={styles.emptyBucket}>Vacío</div>
                ) : (
                  bucket.items.map((item, index) => (
                    <div key={index} className={styles.bucketItem}>
                      <div className={styles.itemKey}>{item.key}</div>
                      <div className={styles.itemValue}>{item.value}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      <div className={styles.infoPanel}>
        <h3>ℹ️ Información</h3>
        <ul>
          <li><strong>Factor de carga:</strong> {(hashTable.getSize() / initialCapacity * 100).toFixed(1)}%</li>
          <li><strong>Elementos totales:</strong> {hashTable.getSize()}</li>
          <li><strong>Buckets vacíos:</strong> {buckets.filter(b => b.items.length === 0).length}</li>
          <li><strong>Buckets con colisiones:</strong> {buckets.filter(b => b.items.length > 1).length}</li>
        </ul>
      </div>
    </div>
  );
} 