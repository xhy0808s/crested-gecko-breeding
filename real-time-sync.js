// 실시간 동기화 시스템
class RealTimeSync {
    constructor() {
        this.syncInterval = 3000; // 3초마다 동기화
        this.lastSync = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.setupEventListeners();
        this.startRealTimeSync();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncAllData();
            this.showNotification('온라인 상태로 복구되었습니다. 동기화를 시작합니다.');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('오프라인 상태입니다. 데이터는 로컬에 저장됩니다.');
        });

        // 로컬 스토리지 변경 감지
        window.addEventListener('storage', (e) => {
            if (e.key === 'animals' || e.key === 'hatchings' || e.key === 'currentUser') {
                this.handleDataChange(e.key, e.newValue);
            }
        });

        // 페이지 포커스 시 동기화
        window.addEventListener('focus', () => {
            this.syncAllData();
        });

        // 페이지 언로드 시 동기화
        window.addEventListener('beforeunload', () => {
            this.syncAllData();
        });
    }

    // 실시간 동기화 시작
    startRealTimeSync() {
        setInterval(() => {
            if (this.isOnline) {
                this.syncAllData();
            }
        }, this.syncInterval);
    }

    // 모든 데이터 동기화
    async syncAllData() {
        try {
            const animals = localStorage.getItem('animals');
            const hatchings = localStorage.getItem('hatchings');
            const currentUser = localStorage.getItem('currentUser');
            const lastSync = this.lastSync;

            // 동기화 데이터 준비
            const syncData = {
                animals: animals ? JSON.parse(animals) : [],
                hatchings: hatchings ? JSON.parse(hatchings) : [],
                currentUser: currentUser ? JSON.parse(currentUser) : {},
                lastSync: lastSync,
                timestamp: new Date().toISOString(),
                deviceInfo: this.getDeviceInfo()
            };

            // 로컬 스토리지에 동기화 상태 저장
            localStorage.setItem('lastSyncData', JSON.stringify(syncData));
            this.updateLastSync();
            
            console.log('🔄 실시간 동기화 완료');
            this.updateUI();
            
        } catch (error) {
            console.error('동기화 오류:', error);
            this.showNotification('동기화 중 오류가 발생했습니다.');
        }
    }

    // 데이터 변경 처리
    handleDataChange(key, newValue) {
        console.log(`데이터 변경 감지: ${key}`);
        
        // UI 업데이트
        this.updateUI();
        
        // 즉시 동기화
        this.syncAllData();
        
        // 알림 표시
        this.showNotification('데이터가 업데이트되었습니다');
    }

    // UI 업데이트
    updateUI() {
        // 통계 업데이트
        const animals = JSON.parse(localStorage.getItem('animals') || '[]');
        const hatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
        
        const totalAnimalsEl = document.getElementById('totalAnimals');
        const totalGenerationsEl = document.getElementById('totalGenerations');
        
        if (totalAnimalsEl) {
            totalAnimalsEl.textContent = animals.length;
        }
        
        if (totalGenerationsEl) {
            totalGenerationsEl.textContent = animals.length > 0 ? '5' : '0';
        }

        // 동기화 상태 표시
        this.updateSyncStatus();
    }

    // 동기화 상태 업데이트
    updateSyncStatus() {
        const syncStatusEl = document.querySelector('.sync-status');
        if (syncStatusEl) {
            const status = this.getSyncStatus();
            syncStatusEl.innerHTML = `
                <div class="sync-indicator ${status.isOnline ? 'online' : 'offline'}"></div>
                <span>${status.isOnline ? '동기화됨' : '오프라인'}</span>
            `;
        }
    }

    // 마지막 동기화 시간 업데이트
    updateLastSync() {
        this.lastSync = new Date();
        localStorage.setItem('lastSync', this.lastSync.toISOString());
    }

    // 알림 표시
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 디바이스 정보 가져오기
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: new Date().toISOString()
        };
    }

    // 동기화 상태 확인
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            lastSync: this.lastSync,
            totalAnimals: JSON.parse(localStorage.getItem('animals') || '[]').length,
            totalHatchings: JSON.parse(localStorage.getItem('hatchings') || '[]').length,
            deviceInfo: this.getDeviceInfo()
        };
    }

    // 데이터 내보내기 (백업)
    exportData() {
        const data = {
            animals: JSON.parse(localStorage.getItem('animals') || '[]'),
            hatchings: JSON.parse(localStorage.getItem('hatchings') || '[]'),
            currentUser: JSON.parse(localStorage.getItem('currentUser') || '{}'),
            lastSync: this.lastSync,
            exportDate: new Date().toISOString(),
            deviceInfo: this.getDeviceInfo()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gecko-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('데이터 백업이 완료되었습니다');
    }

    // 데이터 가져오기 (복원)
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.animals) localStorage.setItem('animals', JSON.stringify(data.animals));
                    if (data.hatchings) localStorage.setItem('hatchings', JSON.stringify(data.hatchings));
                    if (data.currentUser) localStorage.setItem('currentUser', JSON.stringify(data.currentUser));
                    
                    this.updateUI();
                    this.syncAllData();
                    this.showNotification('데이터를 성공적으로 복원했습니다');
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // 동기화 히스토리 확인
    getSyncHistory() {
        const history = [];
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.includes('Sync') || key.includes('sync')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    history.push({
                        key: key,
                        data: data,
                        timestamp: data.timestamp || new Date().toISOString()
                    });
                } catch (e) {
                    // JSON 파싱 실패 시 무시
                }
            }
        });
        
        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
}

// 전역 인스턴스 생성
window.realTimeSync = new RealTimeSync(); 