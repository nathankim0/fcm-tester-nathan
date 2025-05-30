'use client';

import { useState, useEffect } from 'react';

interface MessageForm {
  token: string;
  messageType: 'data-only' | 'notification-data';
  customTitle: string;
  customBody: string;
  customLink: string;
  imageUrl: string;
}

export default function FCMTestPage() {
  const [form, setForm] = useState<MessageForm>({
    token: '',
    messageType: 'data-only',
    customTitle: '새로운 메시지가 도착했습니다',
    customBody: '{{username}}님, 확인해보세요',
    customLink: 'https://example.com',
    imageUrl: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [isCheckingFirebase, setIsCheckingFirebase] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Firebase 설정 확인 중...');

  // 페이지 로드 시 Firebase 설정 자동 확인
  useEffect(() => {
    checkFirebase();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/send-fcm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 성공: ${data.messageId}`);
      } else {
        setResult(`❌ 실패: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const previewMessage = () => {
    if (form.messageType === 'data-only') {
      const dataObj: Record<string, string> = { 
        title: form.customTitle, 
        body: form.customBody, 
        link: form.customLink 
      };
      
      if (form.imageUrl) {
        dataObj.image = form.imageUrl;
      }
      
      return { data: dataObj };
    } else {
      const notificationObj: Record<string, string> = { 
        title: form.customTitle, 
        body: form.customBody 
      };
      
      const dataObj: Record<string, string> = { 
        link: form.customLink 
      };
      
      if (form.imageUrl) {
        notificationObj.image = form.imageUrl;
      }
      
      return {
        notification: notificationObj,
        data: dataObj
      };
    }
  };

  const checkFirebase = async () => {
    setIsCheckingFirebase(true);
    setFirebaseStatus('Firebase 설정 확인 중...');

    try {
      const response = await fetch('/api/check-firebase');
      const data = await response.json();
      
      if (data.status === 'success') {
        // 이메일 마스킹 처리
        const maskedEmail = data.serviceAccountEmail?.replace(/(.{3}).*@/, '$1***@') || '***';
        setFirebaseStatus(`✅ Firebase 연결 성공\n📋 프로젝트: ${data.projectId}\n📧 계정: ${maskedEmail}`);
      } else {
        setFirebaseStatus(`❌ Firebase 설정 오류\n${data.message}\n💡 ${data.hint || ''}`);
      }
    } catch (error) {
      setFirebaseStatus(`❌ 네트워크 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsCheckingFirebase(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-900">
          FCM 테스터
        </h1>
        
        {/* Firebase 상태 표시 */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Firebase 연결 상태</h2>
          <div className={`p-3 rounded-md ${isCheckingFirebase ? 'bg-yellow-50' : firebaseStatus.includes('✅') ? 'bg-green-50' : 'bg-red-50'}`}>
            <pre className="text-sm whitespace-pre-wrap">{firebaseStatus}</pre>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* 폼 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">메시지 설정</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* FCM 토큰 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FCM 토큰
                </label>
                <textarea
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="FCM 토큰을 입력하세요..."
                  required
                />
              </div>

              {/* 메시지 타입 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메시지 타입
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="data-only"
                      checked={form.messageType === 'data-only'}
                      onChange={(e) => setForm({ ...form, messageType: e.target.value as 'data-only' })}
                      className="mr-2"
                    />
                    <span className="text-sm">Data만 사용 (notification 필드 제거)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="notification-data"
                      checked={form.messageType === 'notification-data'}
                      onChange={(e) => setForm({ ...form, messageType: e.target.value as 'notification-data' })}
                      className="mr-2"
                    />
                    <span className="text-sm">Notification + Data 사용</span>
                  </label>
                </div>
              </div>

              {/* 메시지 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={form.customTitle}
                  onChange={(e) => setForm({ ...form, customTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="메시지 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={form.customBody}
                  onChange={(e) => setForm({ ...form, customBody: e.target.value })}
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="메시지 내용을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  링크
                </label>
                <input
                  type="text"
                  value={form.customLink}
                  onChange={(e) => setForm({ ...form, customLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="링크 URL을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Image URL을 입력하세요"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !form.token}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '전송 중...' : 'FCM 메시지 전송'}
              </button>
            </form>

            {result && (
              <div className="mt-4 p-3 rounded-md bg-gray-100">
                <pre className="text-sm">{result}</pre>
              </div>
            )}
          </div>

          {/* 미리보기 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">메시지 미리보기</h2>
            
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(previewMessage(), null, 2)}
              </pre>
            </div>
            
            {/* 이미지 미리보기 */}
            {form.imageUrl && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2 text-gray-800">이미지 미리보기</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <img 
                    src={form.imageUrl} 
                    alt="FCM Image Preview" 
                    className="max-w-full h-auto rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden text-red-500 text-sm">
                    ❌ 이미지를 불러올 수 없습니다. URL을 확인해주세요.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Made with ❤️ by Nathan (jinyeob07@gmail.com)</p>
        </div>
      </div>
    </div>
  );
}
