// 간단한 사용자 인증 시스템
class UserAuth {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.init();
    }
    
    init() {
        // 사용자가 없으면 로그인 모달 표시
        if (!this.currentUser) {
            this.showLoginModal();
        } else {
            console.log('👤 현재 사용자:', this.currentUser.name);
            this.updateUserInfo();
        }
    }
    
    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }
    
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-user mr-2"></i>사용자 정보 입력
                </h2>
                <p class="text-gray-600 mb-4">
                    다중 기기 동기화를 위해 사용자 정보를 입력해주세요.
                </p>
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                        <input type="text" id="userName" placeholder="사용자 이름" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이메일 (선택사항)</label>
                        <input type="email" id="userEmail" placeholder="example@email.com" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle mr-2"></i>
                            이 정보는 데이터를 구분하고 동기화하는 데 사용됩니다.
                        </p>
                    </div>
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            시작하기
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 폼 제출 처리
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(modal);
        });
    }
    
    handleLogin(modal) {
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        
        if (!name) {
            alert('이름을 입력해주세요.');
            return;
        }
        
        const user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            email: email || null,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser = user;
        
        // 모달 제거
        document.body.removeChild(modal);
        
        // UI 업데이트
        this.updateUserInfo();
        
        // Firebase 사용자 ID 업데이트
        if (window.firebaseConfig) {
            window.currentUserId = user.id;
            localStorage.setItem('userId', user.id);
            
            // Firebase 동기화 시스템 재초기화
            if (window.firebaseSync) {
                window.firebaseSync.currentUserId = user.id;
                window.firebaseSync.manualSync();
            }
        }
        
        console.log('✅ 사용자 로그인 완료:', user.name);
    }
    
    updateUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement && this.currentUser) {
            userInfoElement.innerHTML = `
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                    <i class="fas fa-user"></i>
                    <span>${this.currentUser.name}</span>
                </div>
            `;
        }
    }
    
    logout() {
        if (confirm('로그아웃하시겠습니까? 로컬 데이터는 유지되지만 동기화가 중단됩니다.')) {
            localStorage.removeItem('currentUser');
            this.currentUser = null;
            location.reload();
        }
    }
    
    changeUser() {
        if (confirm('사용자를 변경하시겠습니까? 현재 데이터는 클라우드에 저장된 후 새 사용자 데이터로 전환됩니다.')) {
            // 현재 데이터를 클라우드에 저장
            if (window.firebaseSync && window.firebaseSync.isInitialized) {
                window.firebaseSync.manualSync().then(() => {
                    localStorage.removeItem('currentUser');
                    this.currentUser = null;
                    location.reload();
                });
            } else {
                localStorage.removeItem('currentUser');
                this.currentUser = null;
                location.reload();
            }
        }
    }
}

// 페이지 로드 시 사용자 인증 시스템 초기화
window.addEventListener('DOMContentLoaded', () => {
    window.userAuth = new UserAuth();
});

window.UserAuth = UserAuth;