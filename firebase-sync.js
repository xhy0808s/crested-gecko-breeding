// Firebase 실시간 동기화 시스템
'use strict';

class FirebaseSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.isInitialized = false;
        
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 온라인 상태로 변경됨');
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 오프라인 상태로 변경됨');
        });
        
        this.init();
    }
    
    async init() {
        try {
            // Firebase가 로드될 때까지 대기
            await this.waitForFirebase();
            
            // 실시간 리스너 설정
            this.setupRealtimeListeners();
            
            // 초기 데이터 동기화
            await this.initialSync();
            
            this.isInitialized = true;
            console.log('🚀 Firebase 동기화 시스템 초기화 완료');
            
            // 동기화 상태를 UI에 표시
            this.updateSyncStatus('synchronized');
            
        } catch (error) {
            console.error('❌ Firebase 동기화 초기화 실패:', error);
            this.updateSyncStatus('error');
        }
    }
    
    async waitForFirebase() {
        return new Promise((resolve) => {
            // 이미 초기화되어 있으면 즉시 실행
            if (window.db && window.currentUserId && window.firebaseImports) {
                resolve();
                return;
            }
            
            let resolved = false;
            
            // firebaseReady 이벤트를 기다림
            const handleFirebaseReady = () => {
                if (!resolved) {
                    resolved = true;
                    setTimeout(resolve, 200); // 약간의 지연을 두어 안정성 확보
                }
            };
            
            window.addEventListener('firebaseReady', handleFirebaseReady, { once: true });
            
            // 타임아웃 설정 (5초 후 오프라인 모드로 전환)
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn('⚠️ Firebase 초기화 타임아웃 - 오프라인 모드로 전환');
                    this.updateSyncStatus('offline');
                    resolve();
                }
            }, 5000);
        });
    }
    
    // 데이터 타입별 설정
    getDataTypes() {
        return [
            { key: 'animals', localKey: 'geckoBreedingData', label: '개체 데이터' },
            { key: 'babies', localKey: 'babies', label: '베이비 데이터' },
            { key: 'healthRecords', localKey: 'healthRecords', label: '건강 기록' }
        ];
    }

    // Firestore 문서 참조 생성
    createDocRef(dataType) {
        const { doc } = window.firebaseImports || {};
        return doc(window.db, 'users', window.currentUserId, 'data', dataType);
    }

    // 단일 리스너 설정
    setupDataListener(dataType) {
        const { onSnapshot } = window.firebaseImports || {};
        const docRef = this.createDocRef(dataType.key);
        
        const debouncedUpdate = window.debounce((cloudData) => {
            this.mergeCloudDataToLocal(dataType.localKey, cloudData);
            console.log(`🔄 ${dataType.label} 실시간 업데이트`);
        }, 1000);
        
        return onSnapshot(docRef, 
            (doc) => {
                if (doc.exists()) {
                    const cloudData = doc.data()[dataType.key] || [];
                    debouncedUpdate(cloudData);
                }
            },
            (error) => {
                console.warn(`${dataType.label} 리스너 오류:`, error);
                this.updateSyncStatus('error');
            }
        );
    }

    // 실시간 리스너 설정 강화
    setupRealtimeListeners() {
        const { onSnapshot } = window.firebaseImports || {};
        if (!onSnapshot || !window.db || !window.currentUserId) {
            console.log('⚠️ Firebase 서비스를 사용할 수 없어 실시간 동기화가 비활성화됩니다.');
            this.updateSyncStatus('offline');
            return;
        }
        
        try {
            this.getDataTypes().forEach(dataType => {
                this.setupDataListener(dataType);
            });
            
            // 연결 상태 모니터링
            this.setupConnectionMonitoring();
            
            console.log('🔄 실시간 동기화 활성화됨');
        } catch (error) {
            console.error('❌ 실시간 리스너 설정 실패:', error);
            this.updateSyncStatus('error');
        }
    }
    
    // 연결 상태 모니터링
    setupConnectionMonitoring() {
        const { onSnapshot, doc } = window.firebaseImports || {};
        
        // Firebase 연결 상태 감지
        const connectedRef = doc(window.db, '.info/connected');
        
        try {
            onSnapshot(connectedRef, (snapshot) => {
                if (snapshot.exists() && snapshot.data().connected) {
                    console.log('🟢 Firebase 연결됨');
                    this.updateSyncStatus('synchronized');
                    this.processSyncQueue(); // 대기 중인 데이터 동기화
                } else {
                    console.log('🔴 Firebase 연결 끊김');
                    this.updateSyncStatus('offline');
                }
            });
        } catch (error) {
            console.warn('연결 상태 모니터링 설정 실패:', error);
        }
    }
    
    // 초기 데이터 동기화
    async initialSync() {
        try {
            await this.downloadFromCloud();
            await this.uploadToCloud();
            
            // Service Worker에게 동기화 완료 알림
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SYNC_COMPLETE'
                });
            }
        } catch (error) {
            console.error('초기 동기화 실패:', error);
        }
    }
    
    // 클라우드에서 데이터 다운로드
    async downloadFromCloud() {
        try {
            const { doc, getDoc } = window.firebaseImports || {};
            if (!getDoc || !window.db || !window.currentUserId) {
                console.log('⚠️ Firebase를 사용할 수 없어 클라우드 다운로드를 건너뜁니다.');
                return;
            }
            
            await Promise.all(
                this.getDataTypes().map(dataType => this.downloadSingleData(dataType))
            );
            
            console.log('☁️ 클라우드 데이터 다운로드 완료');
            
        } catch (error) {
            console.error('❌ 클라우드 다운로드 전체 실패:', error);
            this.updateSyncStatus('error');
        }
    }
    
    // 단일 데이터 다운로드
    async downloadSingleData(dataType) {
        try {
            const { getDoc } = window.firebaseImports || {};
            const docRef = this.createDocRef(dataType.key);
            const snapshot = await getDoc(docRef);
            
            if (snapshot.exists()) {
                const cloudData = snapshot.data()[dataType.key] || [];
                this.mergeCloudDataToLocal(dataType.localKey, cloudData);
            }
        } catch (error) {
            console.warn(`${dataType.label} 다운로드 실패:`, error.message);
        }
    }

    // 클라우드에 데이터 업로드
    async uploadToCloud() {
        if (!this.checkFirebaseAvailability()) return;
        
        try {
            const uploadPromises = this.getDataTypes()
                .map(dataType => {
                    const data = JSON.parse(localStorage.getItem(dataType.localKey) || '[]');
                    return data.length > 0 ? 
                        this.saveToCloud(dataType.key, data).catch(err => 
                            console.warn(`${dataType.label} 업로드 실패:`, err.message)
                        ) : Promise.resolve();
                })
                .filter(promise => promise !== Promise.resolve());
            
            if (uploadPromises.length > 0) {
                await Promise.allSettled(uploadPromises);
                console.log('☁️ 클라우드 업로드 완료');
            }
            
        } catch (error) {
            this.handleError('클라우드 업로드 전체 실패', error);
        }
    }
    
    // 클라우드 데이터를 로컬과 병합
    mergeCloudDataToLocal(key, cloudData) {
        try {
            const localData = JSON.parse(localStorage.getItem(key) || '[]');
            const mergedData = this.mergeArrays(localData, cloudData);
            
            localStorage.setItem(key, JSON.stringify(mergedData));
            
            // UI 업데이트 및 실시간 알림
            if (key === 'geckoBreedingData' && window.updateStatistics) {
                window.updateStatistics();
                if (document.getElementById('animalListContainer')) {
                    window.loadAnimalList();
                }
                // 실시간 동기화 알림 (조용히)
                if (window.showToast && cloudData.length !== localData.length) {
                    window.showToast('개체 데이터가 동기화되었습니다', 'info');
                }
            } else if (key === 'babies' && window.updateStatistics) {
                window.updateStatistics();
                if (document.getElementById('babyListContainer')) {
                    window.loadBabyList();
                }
                // 베이비 데이터 동기화 알림
                if (window.showToast && cloudData.length !== localData.length) {
                    window.showToast('베이비 데이터가 동기화되었습니다', 'info');
                }
            }
            
        } catch (error) {
            console.error('데이터 병합 실패:', error);
        }
    }
    
    // 배열 데이터 병합 (중복 제거)
    mergeArrays(localArray, cloudArray) {
        const merged = [...localArray];
        
        cloudArray.forEach(cloudItem => {
            const existingIndex = merged.findIndex(localItem => 
                localItem.id === cloudItem.id
            );
            
            if (existingIndex >= 0) {
                // 더 최신 데이터로 업데이트
                const localUpdated = new Date(merged[existingIndex].updatedAt || merged[existingIndex].createdAt);
                const cloudUpdated = new Date(cloudItem.updatedAt || cloudItem.createdAt);
                
                if (cloudUpdated > localUpdated) {
                    merged[existingIndex] = cloudItem;
                }
            } else {
                merged.push(cloudItem);
            }
        });
        
        return merged;
    }
    
    // Firebase 가용성 확인
    checkFirebaseAvailability() {
        if (!window.db || !window.currentUserId) {
            console.log('⚠️ Firebase를 사용할 수 없어 클라우드 작업을 건너뜁니다.');
            return false;
        }
        return true;
    }

    // 에러 핸들링 통합
    handleError(message, error) {
        console.error(`❌ ${message}:`, error);
        this.updateSyncStatus('error');
    }

    // 데이터를 클라우드에 저장
    async saveToCloud(dataType, data) {
        try {
            if (!this.isOnline) {
                console.log(`📴 오프라인 상태 - ${dataType} 동기화 큐에 추가`);
                this.addToSyncQueue(dataType, data);
                return;
            }
            
            const { setDoc } = window.firebaseImports || {};
            if (!setDoc || !this.checkFirebaseAvailability()) {
                console.warn(`⚠️ Firebase 서비스 없음 - ${dataType} 동기화 큐에 추가`);
                this.addToSyncQueue(dataType, data);
                return;
            }
            
            const docRef = this.createDocRef(dataType);
            await setDoc(docRef, {
                [dataType]: data,
                lastUpdated: new Date().toISOString(),
                deviceId: this.getDeviceId()
            }, { merge: true });
            
            console.log(`☁️ ${dataType} 클라우드 저장 완료 (${data.length}개 항목)`);
            this.updateSyncStatus('synchronized');
            
        } catch (error) {
            console.warn(`⚠️ ${dataType} 클라우드 저장 실패: ${error.message}`);
            this.addToSyncQueue(dataType, data);
            this.updateSyncStatus('pending');
        }
    }
    
    // 이미지를 클라우드에 업로드
    async uploadImage(file, path) {
        try {
            if (!this.isOnline) {
                throw new Error('오프라인 상태에서는 이미지 업로드가 불가능합니다.');
            }
            
            const { ref, uploadBytes, getDownloadURL } = window.firebaseImports || {};
            if (!uploadBytes) throw new Error('Firebase Storage를 사용할 수 없습니다.');
            
            const storage = window.firebaseStorage || window.storage;
            if (!storage) {
                throw new Error('Firebase Storage를 사용할 수 없습니다.');
            }
            const imageRef = ref(storage, `images/${window.currentUserId}/${path}`);
            const snapshot = await uploadBytes(imageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            console.log('🖼️ 이미지 업로드 완료:', downloadURL);
            return downloadURL;
            
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            throw error;
        }
    }
    
    // 동기화 큐에 추가 (오프라인 시)
    addToSyncQueue(dataType, data) {
        this.syncQueue.push({
            dataType,
            data,
            timestamp: Date.now()
        });
        
        console.log(`📝 동기화 큐에 추가: ${dataType}`);
        this.updateSyncStatus('pending');
    }
    
    // 동기화 큐 처리
    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) return;
        
        console.log(`🔄 동기화 큐 처리 시작 (${this.syncQueue.length}개 항목)`);
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queue) {
            try {
                await this.saveToCloud(item.dataType, item.data);
            } catch (error) {
                console.error('큐 처리 실패:', error);
                this.syncQueue.push(item); // 실패한 항목 다시 큐에 추가
            }
        }
        
        if (this.syncQueue.length === 0) {
            this.updateSyncStatus('synchronized');
        }
    }
    
    // 기기 ID 생성
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }
    
    // 동기화 상태 UI 업데이트
    updateSyncStatus(status) {
        const statusElement = document.getElementById('syncStatus');
        if (!statusElement) return;
        
        const statusConfig = {
            synchronized: { icon: '✅', text: '동기화됨', color: 'text-green-600' },
            pending: { icon: '⏳', text: '동기화 대기중', color: 'text-yellow-600' },
            syncing: { icon: '🔄', text: '동기화 중', color: 'text-blue-600' },
            error: { icon: '❌', text: '동기화 오류', color: 'text-red-600' },
            offline: { icon: '📴', text: '오프라인', color: 'text-gray-600' }
        };
        
        const config = statusConfig[status] || statusConfig.offline;
        statusElement.innerHTML = `
            <span class="${config.color}">
                ${config.icon} ${config.text}
            </span>
        `;
    }
    
    // 수동 동기화
    async manualSync() {
        try {
            this.updateSyncStatus('syncing');
            await this.uploadToCloud();
            await this.downloadFromCloud();
            await this.processSyncQueue();
            console.log('🔄 수동 동기화 완료');
            this.updateSyncStatus('synchronized');
        } catch (error) {
            console.error('수동 동기화 실패:', error);
            this.updateSyncStatus('error');
        }
    }
}

// Firebase 동기화 시스템 초기화
window.addEventListener('firebaseReady', () => {
    console.log('🔥 Firebase 준비 완료 - 동기화 시스템 초기화 시작');
    window.firebaseSync = new FirebaseSync();
});

// 페이지 로드 시 대기 (Firebase가 아직 준비되지 않은 경우)
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.firebaseSync) {
            console.log('⏳ Firebase 대기 중...');
            // 최대 5초 더 대기
            setTimeout(() => {
                if (!window.firebaseSync && window.db) {
                    console.log('🔄 지연 초기화 시작');
                    window.firebaseSync = new FirebaseSync();
                }
            }, 5000);
        }
    }, 1000);
});

// 전역 함수로 내보내기
window.FirebaseSync = FirebaseSync;