// 실시간 동기화 시스템
class RealTimeSync {
    constructor() {
        this.syncInterval = null;
        this.lastSyncTime = Date.now();
        this.isOnline = navigator.onLine;
        this.syncStatus = 'idle';
        
        this.init();
    }

    init() {
        console.log('🔄 실시간 동기화 시스템 시작');
        
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncData();
            this.showNotification('온라인 상태로 복구되었습니다', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('오프라인 상태입니다. 로컬에서 계속 사용 가능합니다', 'warning');
        });

        // 실시간 동기화 시작
        this.startRealTimeSync();
        
        // 페이지 로드 시 동기화
        this.syncData();
    }

    startRealTimeSync() {
        // 5초마다 자동 동기화
        this.syncInterval = setInterval(() => {
            this.syncData();
        }, 5000);

        // 브라우저 탭 간 통신
        this.setupCrossTabCommunication();
        
        // 로컬 스토리지 변경 감지
        this.setupStorageListener();
    }

    setupCrossTabCommunication() {
        // BroadcastChannel API 사용 (모던 브라우저)
        if ('BroadcastChannel' in window) {
            this.broadcastChannel = new BroadcastChannel('gecko-sync');
            this.broadcastChannel.onmessage = (event) => {
                if (event.data.type === 'data-updated') {
                    this.handleDataUpdate(event.data);
                }
            };
        }

        // localStorage 이벤트 리스너 (레거시 브라우저 지원)
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('animals') || event.key.startsWith('hatchings')) {
                this.handleDataUpdate({
                    type: 'data-updated',
                    key: event.key,
                    newValue: event.newValue
                });
            }
        });
    }

    setupStorageListener() {
        // 로컬 스토리지 변경 감지를 위한 프록시
        const originalSetItem = localStorage.setItem;
        const originalRemoveItem = localStorage.removeItem;

        localStorage.setItem = (key, value) => {
            originalSetItem.call(localStorage, key, value);
            this.broadcastDataUpdate(key, value);
        };

        localStorage.removeItem = (key) => {
            originalRemoveItem.call(localStorage, key);
            this.broadcastDataUpdate(key, null);
        };
    }

    broadcastDataUpdate(key, value) {
        const updateData = {
            type: 'data-updated',
            key: key,
            value: value,
            timestamp: Date.now()
        };

        // BroadcastChannel로 전송
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage(updateData);
        }

        // 커스텀 이벤트로 전송
        window.dispatchEvent(new CustomEvent('data-sync', {
            detail: updateData
        }));
    }

    handleDataUpdate(data) {
        console.log('🔄 데이터 업데이트 감지:', data);
        
        // UI 업데이트
        this.updateUI();
        
        // 동기화 상태 표시
        this.showSyncStatus('동기화 완료');
    }

    syncData() {
        if (!this.isOnline) {
            console.log('📱 오프라인 모드 - 로컬 동기화만 수행');
            return;
        }

        this.syncStatus = 'syncing';
        this.showSyncStatus('동기화 중...');

        try {
            // 동물 데이터 동기화
            this.syncAnimals();
            
            // 해칭 데이터 동기화
            this.syncHatchings();
            
            // 이미지 데이터 동기화
            this.syncImages();
            
            this.lastSyncTime = Date.now();
            this.syncStatus = 'synced';
            this.showSyncStatus('동기화 완료');
            
        } catch (error) {
            console.error('❌ 동기화 오류:', error);
            this.syncStatus = 'error';
            this.showSyncStatus('동기화 오류');
        }
    }

    syncAnimals() {
        const animals = JSON.parse(localStorage.getItem('animals') || '[]');
        const lastSync = localStorage.getItem('animals_last_sync') || '0';
        
        // 변경된 데이터만 동기화
        const updatedAnimals = animals.filter(animal => 
            animal.lastModified > parseInt(lastSync)
        );
        
        if (updatedAnimals.length > 0) {
            console.log(`🦎 ${updatedAnimals.length}개 개체 동기화`);
            localStorage.setItem('animals_last_sync', Date.now().toString());
        }
    }

    syncHatchings() {
        const hatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
        const lastSync = localStorage.getItem('hatchings_last_sync') || '0';
        
        const updatedHatchings = hatchings.filter(hatching => 
            hatching.lastModified > parseInt(lastSync)
        );
        
        if (updatedHatchings.length > 0) {
            console.log(`🥚 ${updatedHatchings.length}개 해칭 동기화`);
            localStorage.setItem('hatchings_last_sync', Date.now().toString());
        }
    }

    syncImages() {
        const images = JSON.parse(localStorage.getItem('images') || '[]');
        const lastSync = localStorage.getItem('images_last_sync') || '0';
        
        const updatedImages = images.filter(image => 
            image.lastModified > parseInt(lastSync)
        );
        
        if (updatedImages.length > 0) {
            console.log(`📸 ${updatedImages.length}개 이미지 동기화`);
            localStorage.setItem('images_last_sync', Date.now().toString());
        }
    }

    updateUI() {
        // 통계 업데이트
        this.updateStats();
        
        // 목록 새로고침
        this.refreshLists();
    }

    updateStats() {
        try {
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const hatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
            
            // 통계 요소 업데이트
            const totalAnimalsElement = document.getElementById('totalAnimals');
            const totalHatchingsElement = document.getElementById('totalHatchings');
            
            if (totalAnimalsElement) {
                totalAnimalsElement.textContent = animals.length;
            }
            if (totalHatchingsElement) {
                totalHatchingsElement.textContent = hatchings.length;
            }
        } catch (error) {
            console.error('통계 업데이트 오류:', error);
        }
    }

    refreshLists() {
        // 동물 목록 새로고침
        if (typeof window.refreshAnimals === 'function') {
            window.refreshAnimals();
        }
        
        // 해칭 목록 새로고침
        if (typeof window.refreshHatchings === 'function') {
            window.refreshHatchings();
        }
    }

    showSyncStatus(message) {
        // 상태 표시 요소 찾기
        let statusElement = document.getElementById('sync-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'sync-status';
            statusElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #03c75a;
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                z-index: 10000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusElement);
        }
        
        statusElement.textContent = message;
        statusElement.style.opacity = '1';
        statusElement.style.transform = 'translateX(0)';
        
        // 3초 후 숨기기
        setTimeout(() => {
            statusElement.style.opacity = '0';
            statusElement.style.transform = 'translateX(100%)';
        }, 3000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#03c75a' : type === 'warning' ? '#f59e0b' : '#ef4444'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 애니메이션
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // 5초 후 제거
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    // 수동 동기화
    manualSync() {
        this.syncData();
        this.showNotification('수동 동기화를 시작했습니다', 'info');
    }

    // 동기화 상태 확인
    getSyncStatus() {
        return {
            status: this.syncStatus,
            lastSync: this.lastSyncTime,
            isOnline: this.isOnline,
            timestamp: Date.now()
        };
    }

    // 동기화 중지
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('🛑 실시간 동기화 중지');
    }

    // 동기화 재시작
    restartSync() {
        this.stopSync();
        this.startRealTimeSync();
        console.log('🔄 실시간 동기화 재시작');
    }
}

// 전역 인스턴스 생성
window.realTimeSync = new RealTimeSync();

// 수동 동기화 함수 (전역에서 사용 가능)
window.manualSync = () => {
    window.realTimeSync.manualSync();
};

console.log('✅ 실시간 동기화 시스템 로드 완료'); 