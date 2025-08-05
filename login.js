// 사용자 관리 시스템
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
    }
    
    // 사용자 데이터 로드
    loadUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : {
            'admin@crestedgecko.com': {
                email: 'admin@crestedgecko.com',
                password: 'Admin2024!',
                name: '시스템 관리자',
                plan: 'admin',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        };
    }
    
    // 사용자 데이터 저장
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }
    
    // 로그인
    login(email, password) {
        const user = this.users[email];
        if (user && user.password === password) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }
    
    // 회원가입
    register(email, password, name) {
        if (this.users[email]) {
            return { success: false, message: '이미 존재하는 이메일입니다.' };
        }
        
        const user = {
            email,
            password,
            name,
            plan: 'free',
            createdAt: new Date().toISOString()
        };
        
        this.users[email] = user;
        this.saveUsers();
        
        return { success: true, user };
    }
    
    // 게스트 로그인
    loginAsGuest() {
        const guestUser = {
            email: 'guest',
            name: '게스트 사용자',
            plan: 'guest',
            createdAt: new Date().toISOString()
        };
        
        this.currentUser = guestUser;
        localStorage.setItem('currentUser', JSON.stringify(guestUser));
        return { success: true, user: guestUser };
    }
    
    // 로그아웃
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
    
    // 현재 사용자 확인
    getCurrentUser() {
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        }
        return this.currentUser;
    }
}

// 전역 사용자 매니저 인스턴스
const userManager = new UserManager();

// DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // 로그인 폼 제출 처리
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // 입력 검증
        if (!email || !password) {
            showError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }
        
        // 로그인 시도
        const result = userManager.login(email, password);
        
        if (result.success) {
            showSuccess('로그인 성공! 메인 페이지로 이동합니다.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showError(result.message);
        }
    });
});

// 게스트 로그인
function loginAsGuest() {
    const result = userManager.loginAsGuest();
    if (result.success) {
        showSuccess('게스트로 로그인했습니다. 메인 페이지로 이동합니다.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// 회원가입 폼 표시
function showRegisterForm() {
    const container = document.querySelector('.login-container');
    container.innerHTML = `
        <div class="logo">🦎 크레스티드 게코</div>
        <div class="subtitle">회원가입</div>
        
        <div id="errorMessage" class="error-message"></div>
        <div id="successMessage" class="success-message"></div>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="regName">이름</label>
                <input type="text" id="regName" class="form-control" placeholder="이름을 입력하세요" required>
            </div>
            
            <div class="form-group">
                <label for="regEmail">이메일</label>
                <input type="email" id="regEmail" class="form-control" placeholder="이메일을 입력하세요" required>
            </div>
            
            <div class="form-group">
                <label for="regPassword">비밀번호</label>
                <input type="password" id="regPassword" class="form-control" placeholder="비밀번호를 입력하세요" required>
            </div>
            
            <div class="form-group">
                <label for="regPasswordConfirm">비밀번호 확인</label>
                <input type="password" id="regPasswordConfirm" class="form-control" placeholder="비밀번호를 다시 입력하세요" required>
            </div>
            
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-user-plus"></i> 회원가입
            </button>
        </form>
        
        <div class="register-link">
            이미 계정이 있으신가요? <a href="#" onclick="showLoginForm()">로그인</a>
        </div>
    `;
    
    // 회원가입 폼 이벤트 리스너 추가
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;
        
        // 입력 검증
        if (!name || !email || !password || !passwordConfirm) {
            showError('모든 필드를 입력해주세요.');
            return;
        }
        
        if (password !== passwordConfirm) {
            showError('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        if (password.length < 6) {
            showError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        
        // 회원가입 시도
        const result = userManager.register(email, password, name);
        
        if (result.success) {
            showSuccess('회원가입 성공! 로그인 페이지로 이동합니다.');
            setTimeout(() => {
                showLoginForm();
            }, 1000);
        } else {
            showError(result.message);
        }
    });
}

// 로그인 폼 표시
function showLoginForm() {
    window.location.reload();
}

// 에러 메시지 표시
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// 성공 메시지 표시
function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
} 