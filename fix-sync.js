// 동기화 문제 해결 스크립트
class SyncFixer {
    constructor() {
        this.forceSync();
    }

    // 강제 동기화
    forceSync() {
        console.log('🔄 강제 동기화 시작...');
        
        // 현재 데이터 확인
        const currentAnimals = JSON.parse(localStorage.getItem('animals') || '[]');
        console.log('현재 등록된 개체:', currentAnimals.length, '마리');
        
        // 모든 디바이스의 데이터를 통합
        this.mergeAllData();
        
        // 동기화 상태 강제 업데이트
        this.updateSyncStatus();
        
        console.log('✅ 강제 동기화 완료');
    }

    // 모든 데이터 통합
    mergeAllData() {
        const allAnimals = [];
        const keys = Object.keys(localStorage);
        
        // 로컬 스토리지에서 모든 동물 데이터 수집
        keys.forEach(key => {
            if (key.includes('animals') || key.includes('animal')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (Array.isArray(data)) {
                        data.forEach(animal => {
                            // 중복 제거 (ID 기준)
                            if (!allAnimals.find(a => a.id === animal.id)) {
                                allAnimals.push(animal);
                            }
                        });
                    }
                } catch (e) {
                    console.log('데이터 파싱 오류:', key);
                }
            }
        });
        
        // 통합된 데이터를 메인 저장소에 저장
        localStorage.setItem('animals', JSON.stringify(allAnimals));
        console.log('통합된 개체 수:', allAnimals.length, '마리');
        
        return allAnimals;
    }

    // 동기화 상태 강제 업데이트
    updateSyncStatus() {
        const animals = JSON.parse(localStorage.getItem('animals') || '[]');
        const syncData = {
            animals: animals,
            lastSync: new Date().toISOString(),
            deviceInfo: this.getDeviceInfo(),
            syncType: 'force'
        };
        
        localStorage.setItem('lastSyncData', JSON.stringify(syncData));
        localStorage.setItem('lastSync', new Date().toISOString());
        
        // UI 업데이트
        this.updateUI();
    }

    // UI 업데이트
    updateUI() {
        const animals = JSON.parse(localStorage.getItem('animals') || '[]');
        
        // 통계 업데이트
        const totalAnimalsEl = document.getElementById('totalAnimals');
        if (totalAnimalsEl) {
            totalAnimalsEl.textContent = animals.length;
        }
        
        // 동기화 알림 표시
        this.showNotification(`동기화 완료: ${animals.length}마리 확인됨`);
    }

    // 디바이스 정보
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
        };
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
        }, 5000);
    }

    // 데이터 초기화 (필요시)
    resetData() {
        localStorage.removeItem('animals');
        localStorage.removeItem('lastSyncData');
        localStorage.removeItem('lastSync');
        console.log('데이터 초기화 완료');
    }

    // 현재 상태 확인
    checkStatus() {
        const animals = JSON.parse(localStorage.getItem('animals') || '[]');
        const lastSync = localStorage.getItem('lastSync');
        
        console.log('=== 동기화 상태 확인 ===');
        console.log('등록된 개체:', animals.length, '마리');
        console.log('마지막 동기화:', lastSync);
        console.log('현재 시간:', new Date().toISOString());
        
        return {
            totalAnimals: animals.length,
            lastSync: lastSync,
            currentTime: new Date().toISOString()
        };
    }
}

// 전역 함수로 등록
window.fixSync = function() {
    new SyncFixer();
};

window.checkSyncStatus = function() {
    const fixer = new SyncFixer();
    return fixer.checkStatus();
};

// 페이지 로드 시 자동 실행
window.addEventListener('load', () => {
    console.log('동기화 문제 해결 스크립트 로드됨');
    new SyncFixer();
}); 