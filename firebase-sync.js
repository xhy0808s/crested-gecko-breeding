// Firebase 실시간 동기화 시스템
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
            if (window.db && window.storage && window.currentUserId && window.firebaseImports) {
                resolve();
            } else {
                // firebaseReady 이벤트를 기다림
                window.addEventListener('firebaseReady', () => {
                    setTimeout(resolve, 100); // 약간의 지연을 두어 안정성 확보
                }, { once: true });
                
                // 타임아웃 설정 (10초 후 실패)
                setTimeout(() => {
                    console.warn('Firebase 초기화 타임아웃 - 오프라인 모드로 전환');
                    resolve();
                }, 10000);
            }
        });
    }
    
    // 실시간 리스너 설정
    setupRealtimeListeners() {
        const { onSnapshot, doc, collection } = window.firebaseImports || {};
        if (!onSnapshot) return;
        
        // 개체 데이터 실시간 리스너
        const animalsRef = doc(window.db, 'users', window.currentUserId, 'data', 'animals');
        onSnapshot(animalsRef, (doc) => {
            if (doc.exists()) {
                const cloudData = doc.data().animals || [];
                this.mergeCloudDataToLocal('geckoBreedingData', cloudData);
                console.log('🔄 개체 데이터 실시간 업데이트');
            }
        });
        
        // 베이비 데이터 실시간 리스너
        const babiesRef = doc(window.db, 'users', window.currentUserId, 'data', 'babies');
        onSnapshot(babiesRef, (doc) => {
            if (doc.exists()) {
                const cloudData = doc.data().babies || [];
                this.mergeCloudDataToLocal('babies', cloudData);
                console.log('🔄 베이비 데이터 실시간 업데이트');
            }
        });
    }
    
    // 초기 데이터 동기화
    async initialSync() {
        try {
            await this.downloadFromCloud();
            await this.uploadToCloud();
        } catch (error) {
            console.error('초기 동기화 실패:', error);
        }
    }
    
    // 클라우드에서 데이터 다운로드
    async downloadFromCloud() {
        try {
            const { doc, getDoc } = window.firebaseImports || {};
            if (!getDoc) return;
            
            // 개체 데이터 다운로드
            const animalsRef = doc(window.db, 'users', window.currentUserId, 'data', 'animals');
            const animalsSnap = await getDoc(animalsRef);
            
            if (animalsSnap.exists()) {
                const cloudAnimals = animalsSnap.data().animals || [];
                this.mergeCloudDataToLocal('geckoBreedingData', cloudAnimals);
            }
            
            // 베이비 데이터 다운로드
            const babiesRef = doc(window.db, 'users', window.currentUserId, 'data', 'babies');
            const babiesSnap = await getDoc(babiesRef);
            
            if (babiesSnap.exists()) {
                const cloudBabies = babiesSnap.data().babies || [];
                this.mergeCloudDataToLocal('babies', cloudBabies);
            }
            
            console.log('☁️ 클라우드 데이터 다운로드 완료');
            
        } catch (error) {
            console.error('클라우드 다운로드 실패:', error);
        }
    }
    
    // 클라우드에 데이터 업로드
    async uploadToCloud() {
        try {
            const animals = JSON.parse(localStorage.getItem('geckoBreedingData') || '[]');
            const babies = JSON.parse(localStorage.getItem('babies') || '[]');
            
            await this.saveToCloud('animals', animals);
            await this.saveToCloud('babies', babies);
            
            console.log('☁️ 클라우드 업로드 완료');
            
        } catch (error) {
            console.error('클라우드 업로드 실패:', error);
        }
    }
    
    // 클라우드 데이터를 로컬과 병합
    mergeCloudDataToLocal(key, cloudData) {
        try {
            const localData = JSON.parse(localStorage.getItem(key) || '[]');
            const mergedData = this.mergeArrays(localData, cloudData);
            
            localStorage.setItem(key, JSON.stringify(mergedData));
            
            // UI 업데이트
            if (key === 'geckoBreedingData' && window.updateStatistics) {
                window.updateStatistics();
                if (document.getElementById('animalListContainer')) {
                    window.loadAnimalList();
                }
            } else if (key === 'babies' && window.updateStatistics) {
                window.updateStatistics();
                if (document.getElementById('babyListContainer')) {
                    window.loadBabyList();
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
    
    // 데이터를 클라우드에 저장
    async saveToCloud(dataType, data) {
        try {
            if (!this.isOnline) {
                this.addToSyncQueue(dataType, data);
                return;
            }
            
            const { doc, setDoc } = window.firebaseImports || {};
            if (!setDoc) return;
            
            const docRef = doc(window.db, 'users', window.currentUserId, 'data', dataType);
            await setDoc(docRef, {
                [dataType]: data,
                lastUpdated: new Date().toISOString(),
                deviceId: this.getDeviceId()
            }, { merge: true });
            
            console.log(`☁️ ${dataType} 클라우드 저장 완료`);
            this.updateSyncStatus('synchronized');
            
        } catch (error) {
            console.error(`클라우드 저장 실패 (${dataType}):`, error);
            this.addToSyncQueue(dataType, data);
            this.updateSyncStatus('error');
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
            
            const imageRef = ref(window.storage, `images/${window.currentUserId}/${path}`);
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
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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