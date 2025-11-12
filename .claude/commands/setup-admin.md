# Setup Admin User

이 명령은 SSO System에 Admin 계정을 빠르게 생성합니다.

**실행 내용**:
1. Supabase 연결 확인
2. 이메일/비밀번호로 신규 계정 생성 (auth.users)
3. profiles 테이블에서 role='admin' 설정
4. 생성된 계정 정보 출력

**사용 예시**:
- 로컬 개발 환경 초기 설정
- 새로운 관리자 계정 추가
- 테스트 환경 구성

**절차**:
1. 사용자에게 이메일과 비밀번호 입력 요청 (AskUserQuestion 사용)
2. Supabase Admin 클라이언트로 계정 생성:
   ```javascript
   const { data, error } = await supabaseAdmin.auth.admin.createUser({
     email: 'admin@example.com',
     password: 'securePassword123',
     email_confirm: true
   });
   ```
3. profiles 테이블 업데이트:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '{user_id}';
   ```
4. 성공 메시지 출력:
   ```
   ✅ Admin 계정 생성 완료!
   Email: admin@example.com
   Role: admin

   다음 명령으로 로그인 테스트:
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"securePassword123"}'
   ```

**에러 처리**:
- Supabase 연결 실패 → .env 파일 확인 안내
- 이메일 중복 → 기존 계정 확인 및 role 업데이트 제안
- 비밀번호 약함 → 최소 8자 이상 요구

**보안 주의사항**:
- 프로덕션에서는 강력한 비밀번호 사용
- 비밀번호는 로그에 출력하지 않음
- 생성 후 즉시 변경 권장
