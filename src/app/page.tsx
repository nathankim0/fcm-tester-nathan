'use client';

import { useState, useEffect } from 'react';

interface CustomField {
  key: string;
  value: string;
}

interface MessageForm {
  token: string;
  messageType: 'data-only' | 'notification-data';
  customTitle: string;
  customBody: string;
  customLink: string;
  imageUrl: string;
  customDataFields: CustomField[];
  customNotificationFields: CustomField[];
  includeTitle: boolean;
  includeBody: boolean;
  includeLink: boolean;
  includeImage: boolean;
}

export default function FCMTestPage() {
  const [form, setForm] = useState<MessageForm>({
    token: '',
    messageType: 'data-only',
    customTitle: '새로운 메시지가 도착했습니다',
    customBody: '{{username}}님, 확인해보세요',
    customLink: 'https://example.com',
    imageUrl: 'https://designcompass.org/wp-content/uploads/2025/05/google-new-logo-04-1024x768.jpg',
    customDataFields: [],
    customNotificationFields: [],
    includeTitle: true,
    includeBody: true,
    includeLink: true,
    includeImage: true
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
      const dataObj: Record<string, string> = {};
      
      if (form.includeTitle && form.customTitle) {
        dataObj.title = form.customTitle;
      }
      if (form.includeBody && form.customBody) {
        dataObj.body = form.customBody;
      }
      if (form.includeLink && form.customLink) {
        dataObj.link = form.customLink;
      }
      if (form.includeImage && form.imageUrl) {
        dataObj.image = form.imageUrl;
      }

      // 커스텀 데이터 필드 추가
      form.customDataFields.forEach(field => {
        if (field.key && field.value) {
          dataObj[field.key] = field.value;
        }
      });
      
      return { data: dataObj };
    } else {
      const notificationObj: Record<string, string> = {};
      const dataObj: Record<string, string> = {};
      
      if (form.includeTitle && form.customTitle) {
        notificationObj.title = form.customTitle;
      }
      if (form.includeBody && form.customBody) {
        notificationObj.body = form.customBody;
      }
      if (form.includeImage && form.imageUrl) {
        notificationObj.image = form.imageUrl;
      }
      if (form.includeLink && form.customLink) {
        dataObj.link = form.customLink;
      }

      // 커스텀 notification 필드 추가
      form.customNotificationFields.forEach(field => {
        if (field.key && field.value) {
          notificationObj[field.key] = field.value;
        }
      });

      // 커스텀 데이터 필드 추가
      form.customDataFields.forEach(field => {
        if (field.key && field.value) {
          dataObj[field.key] = field.value;
        }
      });
      
      return {
        notification: notificationObj,
        data: dataObj
      };
    }
  };

  const addCustomField = (type: 'data' | 'notification') => {
    if (type === 'data') {
      setForm({
        ...form,
        customDataFields: [...form.customDataFields, { key: '', value: '' }]
      });
    } else {
      setForm({
        ...form,
        customNotificationFields: [...form.customNotificationFields, { key: '', value: '' }]
      });
    }
  };

  const removeCustomField = (type: 'data' | 'notification', index: number) => {
    if (type === 'data') {
      const newFields = form.customDataFields.filter((_, i) => i !== index);
      setForm({ ...form, customDataFields: newFields });
    } else {
      const newFields = form.customNotificationFields.filter((_, i) => i !== index);
      setForm({ ...form, customNotificationFields: newFields });
    }
  };

  const updateCustomField = (type: 'data' | 'notification', index: number, key: string, value: string) => {
    if (type === 'data') {
      const newFields = [...form.customDataFields];
      newFields[index] = { key, value };
      setForm({ ...form, customDataFields: newFields });
    } else {
      const newFields = [...form.customNotificationFields];
      newFields[index] = { key, value };
      setForm({ ...form, customNotificationFields: newFields });
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

              {/* 기본 필드 포함 설정 */}
              <div className="border rounded-md p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    🎛️ 기본 필드 포함 설정
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        includeTitle: true,
                        includeBody: true,
                        includeLink: true,
                        includeImage: true
                      })}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 transition-colors"
                    >
                      모두 선택
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        includeTitle: false,
                        includeBody: false,
                        includeLink: false,
                        includeImage: false
                      })}
                      className="text-xs bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      모두 해제
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.includeTitle}
                      onChange={(e) => setForm({ ...form, includeTitle: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">제목 (title)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.includeBody}
                      onChange={(e) => setForm({ ...form, includeBody: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">내용 (body)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.includeLink}
                      onChange={(e) => setForm({ ...form, includeLink: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">링크 (link)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.includeImage}
                      onChange={(e) => setForm({ ...form, includeImage: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">이미지 (image)</span>
                  </label>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 체크 해제하면 해당 필드가 FCM 메시지에서 제외됩니다.
                </p>
              </div>

              {/* 메시지 내용 */}
              {form.includeTitle && (
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
              )}

              {form.includeBody && (
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
              )}

              {form.includeLink && (
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
              )}

              {form.includeImage && (
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
              )}

              {/* 커스텀 Notification 필드 (notification-data 모드에서만 표시) */}
              {form.messageType === 'notification-data' && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      커스텀 Notification 필드
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const examples = [
                            { key: 'sound', value: 'notification.wav' },
                            { key: 'badge', value: '5' },
                            { key: 'color', value: '#FF0000' }
                          ];
                          setForm({...form, customNotificationFields: [...form.customNotificationFields, ...examples]});
                        }}
                        className="text-xs bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        예시 추가
                      </button>
                      <button
                        type="button"
                        onClick={() => addCustomField('notification')}
                        className="text-sm bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
                      >
                        + 필드 추가
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">
                    💡 notification 페이로드에 추가 속성을 넣을 수 있습니다. (예: sound, badge, color 등)
                  </p>
                  
                  {form.customNotificationFields.map((field, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="키"
                        value={field.key}
                        onChange={(e) => updateCustomField('notification', index, e.target.value, field.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="값"
                        value={field.value}
                        onChange={(e) => updateCustomField('notification', index, field.key, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField('notification', index)}
                        className="text-red-500 hover:text-red-700 px-2 py-2 transition-colors"
                        title="필드 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {form.customNotificationFields.length === 0 && (
                    <p className="text-sm text-gray-500 italic">커스텀 notification 필드가 없습니다. 추가하려면 &quot;필드 추가&quot; 버튼을 클릭하세요.</p>
                  )}
                </div>
              )}

              {/* 커스텀 Data 필드 */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    커스텀 Data 필드
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const examples = [
                          { key: 'userId', value: '12345' },
                          { key: 'action', value: 'view_profile' },
                          { key: 'category', value: 'notification' }
                        ];
                        setForm({...form, customDataFields: [...form.customDataFields, ...examples]});
                      }}
                      className="text-xs bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      예시 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomField('data')}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      + 필드 추가
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mb-3">
                  💡 data 페이로드에 앱에서 처리할 커스텀 데이터를 추가할 수 있습니다. (예: userId, action, metadata 등)
                </p>
                
                {form.customDataFields.map((field, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="키"
                      value={field.key}
                      onChange={(e) => updateCustomField('data', index, e.target.value, field.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="값"
                      value={field.value}
                      onChange={(e) => updateCustomField('data', index, field.key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField('data', index)}
                      className="text-red-500 hover:text-red-700 px-2 py-2 transition-colors"
                      title="필드 삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {form.customDataFields.length === 0 && (
                  <p className="text-sm text-gray-500 italic">커스텀 data 필드가 없습니다. 추가하려면 &quot;필드 추가&quot; 버튼을 클릭하세요.</p>
                )}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">메시지 미리보기</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    customDataFields: [],
                    customNotificationFields: []
                  })}
                  className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                >
                  커스텀 필드 모두 삭제
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(previewMessage(), null, 2));
                  }}
                  className="text-xs bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition-colors"
                >
                  JSON 복사
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4 border">
              <pre className="text-sm overflow-x-auto text-gray-800 whitespace-pre-wrap break-words">
                {JSON.stringify(previewMessage(), null, 2)}
              </pre>
            </div>

            {/* 필드 카운트 정보 */}
            <div className="mt-4 text-xs text-gray-600 space-y-1">
              <div>📊 Data 필드: {Object.keys(previewMessage().data || {}).length}개</div>
              {form.messageType === 'notification-data' && (
                <div>🔔 Notification 필드: {Object.keys(previewMessage().notification || {}).length}개</div>
              )}
              <div>📝 커스텀 Data 필드: {form.customDataFields.length}개</div>
              {form.messageType === 'notification-data' && (
                <div>🎨 커스텀 Notification 필드: {form.customNotificationFields.length}개</div>
              )}
            </div>
            
            {/* 이미지 미리보기 */}
            {form.includeImage && form.imageUrl && (
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
