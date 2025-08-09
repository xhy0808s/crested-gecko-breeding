// IndexedDB 로컬 캐시 시스템
// 오프라인 지원 및 빠른 로컬 데이터 접근

class IndexedDBCache {
  constructor() {
    this.db = null
    this.dbName = 'ReptileManagerDB'
    this.dbVersion = 1
    this.isInitialized = false
  }

  // IndexedDB 초기화
  async init() {
    if (this.isInitialized && this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('❌ IndexedDB 초기화 실패:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log('✅ IndexedDB 초기화 성공')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('🔄 IndexedDB 업그레이드 중...')

        // reptiles 스토어 생성
        if (!db.objectStoreNames.contains('reptiles')) {
          const reptilesStore = db.createObjectStore('reptiles', { keyPath: 'id' })
          reptilesStore.createIndex('owner_id', 'owner_id', { unique: false })
          reptilesStore.createIndex('updated_at', 'updated_at', { unique: false })
          reptilesStore.createIndex('deleted', 'deleted', { unique: false })
          reptilesStore.createIndex('name', 'name', { unique: false })
        }

        // babies 스토어 생성
        if (!db.objectStoreNames.contains('babies')) {
          const babiesStore = db.createObjectStore('babies', { keyPath: 'id' })
          babiesStore.createIndex('owner_id', 'owner_id', { unique: false })
          babiesStore.createIndex('updated_at', 'updated_at', { unique: false })
          babiesStore.createIndex('deleted', 'deleted', { unique: false })
        }

        // pending_changes 스토어 (오프라인 변경사항 큐)
        if (!db.objectStoreNames.contains('pending_changes')) {
          const pendingStore = db.createObjectStore('pending_changes', { keyPath: 'id', autoIncrement: true })
          pendingStore.createIndex('table_name', 'table_name', { unique: false })
          pendingStore.createIndex('action', 'action', { unique: false })
          pendingStore.createIndex('created_at', 'created_at', { unique: false })
        }

        // sync_status 스토어 (동기화 상태 관리)
        if (!db.objectStoreNames.contains('sync_status')) {
          const syncStore = db.createObjectStore('sync_status', { keyPath: 'key' })
        }
      }
    })
  }

  // 트랜잭션 헬퍼
  getTransaction(storeNames, mode = 'readonly') {
    if (!this.db) throw new Error('IndexedDB가 초기화되지 않았습니다')
    return this.db.transaction(storeNames, mode)
  }

  // CRUD 작업 - CREATE/UPDATE
  async upsertReptile(reptile) {
    await this.init()
    
    const transaction = this.getTransaction(['reptiles'], 'readwrite')
    const store = transaction.objectStore('reptiles')
    
    // updated_at 자동 설정
    reptile.updated_at = new Date().toISOString()
    
    return new Promise((resolve, reject) => {
      const request = store.put(reptile)
      request.onsuccess = () => resolve(reptile)
      request.onerror = () => reject(request.error)
    })
  }

  async upsertBaby(baby) {
    await this.init()
    
    const transaction = this.getTransaction(['babies'], 'readwrite')
    const store = transaction.objectStore('babies')
    
    baby.updated_at = new Date().toISOString()
    
    return new Promise((resolve, reject) => {
      const request = store.put(baby)
      request.onsuccess = () => resolve(baby)
      request.onerror = () => reject(request.error)
    })
  }

  // CRUD 작업 - READ
  async getReptile(id) {
    await this.init()
    
    const transaction = this.getTransaction(['reptiles'])
    const store = transaction.objectStore('reptiles')
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllReptiles(ownerId = null, includeDeleted = false) {
    await this.init()
    
    const transaction = this.getTransaction(['reptiles'])
    const store = transaction.objectStore('reptiles')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        let results = request.result
        
        // 소유자 필터링
        if (ownerId) {
          results = results.filter(item => item.owner_id === ownerId)
        }
        
        // 삭제된 항목 필터링
        if (!includeDeleted) {
          results = results.filter(item => !item.deleted)
        }
        
        // updated_at으로 정렬
        results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAllBabies(ownerId = null, includeDeleted = false) {
    await this.init()
    
    const transaction = this.getTransaction(['babies'])
    const store = transaction.objectStore('babies')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        let results = request.result
        
        if (ownerId) {
          results = results.filter(item => item.owner_id === ownerId)
        }
        
        if (!includeDeleted) {
          results = results.filter(item => !item.deleted)
        }
        
        results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // CRUD 작업 - SOFT DELETE
  async softDeleteReptile(id) {
    const reptile = await this.getReptile(id)
    if (!reptile) throw new Error(`Reptile ${id}를 찾을 수 없습니다`)
    
    reptile.deleted = true
    reptile.updated_at = new Date().toISOString()
    
    return this.upsertReptile(reptile)
  }

  // 오프라인 변경사항 큐 관리
  async queueChange(tableName, action, recordId, data) {
    await this.init()
    
    const change = {
      table_name: tableName,
      action: action, // 'create', 'update', 'delete'
      record_id: recordId,
      data: data,
      created_at: new Date().toISOString(),
      retries: 0,
    }
    
    const transaction = this.getTransaction(['pending_changes'], 'readwrite')
    const store = transaction.objectStore('pending_changes')
    
    return new Promise((resolve, reject) => {
      const request = store.add(change)
      request.onsuccess = () => {
        console.log('📝 변경사항 큐에 추가:', change)
        resolve(change)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingChanges() {
    await this.init()
    
    const transaction = this.getTransaction(['pending_changes'])
    const store = transaction.objectStore('pending_changes')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const changes = request.result.sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        )
        resolve(changes)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async removePendingChange(changeId) {
    await this.init()
    
    const transaction = this.getTransaction(['pending_changes'], 'readwrite')
    const store = transaction.objectStore('pending_changes')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(changeId)
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  // 동기화 상태 관리
  async getLastSyncTime() {
    await this.init()
    
    const transaction = this.getTransaction(['sync_status'])
    const store = transaction.objectStore('sync_status')
    
    return new Promise((resolve, reject) => {
      const request = store.get('last_sync_time')
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? new Date(result.value) : new Date('1970-01-01'))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async setLastSyncTime(timestamp = new Date()) {
    await this.init()
    
    const transaction = this.getTransaction(['sync_status'], 'readwrite')
    const store = transaction.objectStore('sync_status')
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        key: 'last_sync_time',
        value: timestamp.toISOString(),
        updated_at: new Date().toISOString(),
      })
      request.onsuccess = () => resolve(timestamp)
      request.onerror = () => reject(request.error)
    })
  }

  // 배치 작업
  async batchUpsertReptiles(reptiles) {
    await this.init()
    
    const transaction = this.getTransaction(['reptiles'], 'readwrite')
    const store = transaction.objectStore('reptiles')
    
    const promises = reptiles.map(reptile => {
      reptile.updated_at = reptile.updated_at || new Date().toISOString()
      
      return new Promise((resolve, reject) => {
        const request = store.put(reptile)
        request.onsuccess = () => resolve(reptile)
        request.onerror = () => reject(request.error)
      })
    })
    
    return Promise.all(promises)
  }

  async batchUpsertBabies(babies) {
    await this.init()
    
    const transaction = this.getTransaction(['babies'], 'readwrite')
    const store = transaction.objectStore('babies')
    
    const promises = babies.map(baby => {
      baby.updated_at = baby.updated_at || new Date().toISOString()
      
      return new Promise((resolve, reject) => {
        const request = store.put(baby)
        request.onsuccess = () => resolve(baby)
        request.onerror = () => reject(request.error)
      })
    })
    
    return Promise.all(promises)
  }

  // 데이터베이스 정리
  async clearAll() {
    await this.init()
    
    const transaction = this.getTransaction(['reptiles', 'babies', 'pending_changes', 'sync_status'], 'readwrite')
    
    const promises = [
      this.clearStore(transaction, 'reptiles'),
      this.clearStore(transaction, 'babies'),
      this.clearStore(transaction, 'pending_changes'),
      this.clearStore(transaction, 'sync_status'),
    ]
    
    return Promise.all(promises)
  }

  clearStore(transaction, storeName) {
    return new Promise((resolve, reject) => {
      const store = transaction.objectStore(storeName)
      const request = store.clear()
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  // 통계 정보
  async getStats() {
    const [reptiles, babies, pendingChanges] = await Promise.all([
      this.getAllReptiles(),
      this.getAllBabies(),
      this.getPendingChanges(),
    ])
    
    return {
      reptiles: reptiles.length,
      babies: babies.length,
      pendingChanges: pendingChanges.length,
      lastSyncTime: await this.getLastSyncTime(),
    }
  }
}

// 전역 인스턴스 생성
export const indexedDBCache = new IndexedDBCache()

// 편의 함수들
export async function initDB() {
  return indexedDBCache.init()
}

export async function getCachedReptiles(ownerId = null) {
  return indexedDBCache.getAllReptiles(ownerId)
}

export async function getCachedBabies(ownerId = null) {
  return indexedDBCache.getAllBabies(ownerId)
}

export async function cacheReptile(reptile) {
  return indexedDBCache.upsertReptile(reptile)
}

export async function cacheBaby(baby) {
  return indexedDBCache.upsertBaby(baby)
}

export default indexedDBCache