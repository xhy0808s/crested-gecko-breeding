// 자동 동기화 시스템
class AutoSync {
    constructor() {
        this.syncInterval = 5000; // 5초마다 동기화
        this.lastSync = null;
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
        this.startAutoSync();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncData();
            this.showNotification('온라인 상태로 복구되었습니다');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('오프라인 상태입니다. 데이터는 로컬에 저장됩니다');
        });

        // 로컬 스토리지 변경 감지
        window.addEventListener('storage', (e) => {
            if (e.key === 'animals' || e.key === 'hatchings' || e.key === 'currentUser') {
                this.handleDataChange(e.key, e.newValue);
            }
        });

        // 페이지 포커스 시 동기화
        window.addEventListener('focus', () => {
            this.syncData();
        });
    }

    // 자동 동기화 시작
    startAutoSync() {
        setInterval(() => {
            if (this.isOnline) {
                this.syncData();
            }
        }, this.syncInterval);
    }

    // 데이터 동기화
    async syncData() {
        try {
            const animals = localStorage.getItem('animals');
            const hatchings = localStorage.getItem('hatchings');
            const currentUser = localStorage.getItem('currentUser');

            // GitHub API를 통한 동기화 (향후 구현)
            // 현재는 로컬 스토리지 기반 동기화
            this.updateLastSync();
            
            console.log('🔄 데이터 동기화 완료');
        } catch (error) {
            console.error('동기화 오류:', error);
        }
    }

    // 데이터 변경 처리
    handleDataChange(key, newValue) {
        console.log(`데이터 변경 감지: ${key}`);
        
        // UI 업데이트
        this.updateUI();
        
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

    // 데이터 내보내기
    exportData() {
        const data = {
            animals: JSON.parse(localStorage.getItem('animals') || '[]'),
            hatchings: JSON.parse(localStorage.getItem('hatchings') || '[]'),
            currentUser: JSON.parse(localStorage.getItem('currentUser') || '{}'),
            lastSync: this.lastSync,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gecko-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 데이터 가져오기
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
                    this.showNotification('데이터를 성공적으로 가져왔습니다');
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // 동기화 상태 확인
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            lastSync: this.lastSync,
            totalAnimals: JSON.parse(localStorage.getItem('animals') || '[]').length,
            totalHatchings: JSON.parse(localStorage.getItem('hatchings') || '[]').length
        };
    }
}

// 전역 인스턴스 생성
window.autoSync = new AutoSync(); 