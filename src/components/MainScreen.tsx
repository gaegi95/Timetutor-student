import { useState, useEffect } from 'react';
import { UserProfile, ClassData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Clock, MessageSquare, ChevronRight, X } from 'lucide-react';
import Chat from './Chat';

interface MainScreenProps {
  user: UserProfile;
  classData: ClassData | null;
  onLogout: () => void;
}

export default function MainScreen({ user, classData, onLogout }: MainScreenProps) {
  const [timeLeft, setTimeLeft] = useState<string>('00:00');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!classData?.currentActivity?.endTime) {
      setTimeLeft('00:00');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(classData.currentActivity!.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [classData?.currentActivity?.endTime]);

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-red-100">
          <h2 className="text-3xl font-bold text-red-600 mb-4">학급 정보를 찾을 수 없습니다.</h2>
          <p className="text-slate-600 mb-6">선생님이 학급을 삭제했거나 코드가 잘못되었습니다.</p>
          <button onClick={onLogout} className="px-6 py-3 bg-slate-200 rounded-xl font-bold">로그아웃</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b-4 border-purple-100 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-purple-900 leading-none">TimeTutor</h1>
            <p className="text-slate-500 font-bold">{user.assignedClass}반</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-lg font-bold text-slate-700">{user.name} 학생</span>
          <button
            onClick={onLogout}
            className="p-3 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-2xl transition-all"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Current Activity Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border-8 border-purple-100 p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-purple-600" />
          
          <p className="text-2xl font-black text-purple-400 uppercase tracking-widest mb-4">지금은</p>
          <h2 className="text-7xl sm:text-9xl font-black text-slate-800 mb-8 break-words">
            {classData.currentActivity?.name || '쉬는 시간'}
          </h2>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 bg-purple-50 px-10 py-6 rounded-3xl border-4 border-purple-100">
              <Clock className="w-12 h-12 text-purple-600" />
              <span className="text-6xl sm:text-8xl font-black font-mono text-purple-700 tabular-nums">
                {timeLeft}
              </span>
            </div>
            <p className="text-xl font-bold text-purple-400">남은 시간</p>
          </div>
        </motion.div>

        {/* Next Activity Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-purple-900 text-white w-full max-w-2xl rounded-3xl p-6 flex items-center justify-between shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-700 p-3 rounded-xl">
              <ChevronRight className="w-8 h-8" />
            </div>
            <div>
              <p className="text-purple-300 font-bold">다음 시간</p>
              <h3 className="text-3xl font-black">
                {classData.nextActivity?.name || '정보 없음'}
              </h3>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-20 h-20 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-90 z-20 group"
      >
        <MessageSquare className="w-10 h-10 group-hover:scale-110 transition-transform" />
        {classData.isChatLocked && (
          <div className="absolute -top-1 -right-1 bg-red-500 border-4 border-white w-6 h-6 rounded-full" />
        )}
      </button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-40 flex flex-col"
            >
              <div className="p-6 border-b-4 border-purple-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                  <h2 className="text-2xl font-black text-slate-800">우리 반 채팅</h2>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-8 h-8 text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <Chat user={user} classData={classData} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
