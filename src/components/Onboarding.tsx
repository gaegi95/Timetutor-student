import React, { useState } from 'react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { motion } from 'motion/react';
import { LogOut, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface OnboardingProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Onboarding({ user, onLogout }: OnboardingProps) {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (classCode.length !== 6) {
      setError('학급 코드 6자리를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      // 보안 규칙의 isValidUser 필드 검사를 통과하기 위해 필수 필드 모두 포함
      await setDoc(userRef, {
        displayName: user.displayName || user.name || '학생',
        role: 'student',
        assignedClass: classCode,
        status: 'pending',
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      setError('코드 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-6"
    >
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border-4 border-purple-200 relative">
        <button
          onClick={onLogout}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-6 h-6" />
        </button>

        {user.status === 'pending' ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">승인 대기 중</h2>
            <p className="text-lg text-slate-600 mb-2">
              학급 코드: <span className="font-bold text-purple-600">{user.assignedClass}</span>
            </p>
            <p className="text-slate-500">선생님이 승인해주실 때까지 잠시만 기다려주세요!</p>
            
            <button
              onClick={() => {
                const userRef = doc(db, 'users', user.uid);
                updateDoc(userRef, { assignedClass: null, status: 'none' });
              }}
              className="mt-8 text-purple-600 font-bold hover:underline"
            >
              코드 다시 입력하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">반가워요, {user.name}님!</h2>
            <p className="text-lg text-slate-600 mb-8">선생님께 받은 학급 코드를 입력해주세요.</p>

            <input
              type="text"
              maxLength={6}
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="w-full text-center text-4xl font-black tracking-widest p-4 border-4 border-purple-100 rounded-2xl focus:border-purple-500 outline-none transition-all mb-4 uppercase"
            />

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-500 mb-4 font-bold">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || classCode.length !== 6}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-2xl font-bold rounded-2xl transition-all shadow-lg active:scale-95"
            >
              {loading ? '등록 중...' : '입장하기'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
