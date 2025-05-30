// FCM API 테스트 스크립트
// 사용법: node test-fcm.js [FCM_TOKEN]

const testData = {
  token: process.argv[2] || 'TEST_TOKEN_HERE',
  messageType: 'data-only',
  username: '테스트유저',
  userId: '12345',
  customTitle: '{{username}}님 안녕하세요',
  customBody: '새로운 메시지가 있습니다',
  customLink: 'https://example.com/{{user_id}}'
};

async function testFCM() {
  if (!process.argv[2]) {
    console.log('❌ FCM 토큰을 제공해주세요.');
    console.log('사용법: node test-fcm.js YOUR_FCM_TOKEN');
    return;
  }

  try {
    console.log('🚀 FCM 메시지 전송 테스트 시작...');
    console.log('📝 전송할 데이터:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/send-fcm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 성공!');
      console.log('📧 메시지 ID:', result.messageId);
      console.log('📨 전송된 메시지:', JSON.stringify(result.sentMessage, null, 2));
    } else {
      console.log('❌ 실패!');
      console.log('🔍 오류:', result.error);
    }
  } catch (error) {
    console.error('💥 네트워크 오류:', error.message);
  }
}

testFCM(); 