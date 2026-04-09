import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, ClassData } from './types';
import { handleFirestoreError, OperationType } from './lib/errorUtils';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Loader2, AlertCircle, X } from 'lucide-react';
import MainScreen from './components/MainScreen';
import Onboarding from './components/Onboarding';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [prevStatus, setPrevStatus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [kicked, setKicked] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleError = (err: any, op: OperationType, path: string) => {
    const errInfo = handleFirestoreError(err, op, path);
    setGlobalError(JSON.stringify(errInfo, null, 2));
    console.error('Firestore Error Details:', errInfo);
  };

  useEffect(() => {
    if (prevStatus === 'approved' && user && user.status !== 'approved') {
      setKicked(true);
    }
    setPrevStatus(user?.status);
  }, [user?.status]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUser(profile);
            
            if (profile.assignedClass && profile.status === 'approved') {
              const classRef = doc(db, 'classes', profile.assignedClass);
              const unsubscribeClass = onSnapshot(classRef, (classSnap) => {
                if (classSnap.exists()) {
                  setClassData(classSnap.data() as ClassData);
                } else {
                  setClassData(null);
                }
              }, (err) => handleError(err, OperationType.GET, `classes/${profile.assignedClass}`));
              
              return () => unsubscribeClass();
            } else {
              setClassData(null);
            }
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '학생',
              displayName: firebaseUser.displayName || '학생',
              role: 'student',
              status: 'none',
              createdAt: serverTimestamp()
            };
            setDoc(userRef, newProfile).catch(err => handleError(err, OperationType.WRITE, userRef.path));
            setUser(newProfile);
          }
          setLoading(false);
        }, (err) => handleError(err, OperationType.GET, userRef.path));

        return () => unsubscribeUser();
      } else {
        setUser(null);
        setClassData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 text-slate-900 font-sans">
      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-2xl z-[200] flex items-start gap-3"
          >
            <AlertCircle className="w-6 h-6 shrink-0 mt-1" />
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold mb-1">데이터베이스 연결 오류</h3>
              <pre className="text-xs bg-red-700 p-2 rounded overflow-auto max-h-32 font-mono">
                {globalError}
              </pre>
            </div>
            <button onClick={() => setGlobalError(null)} className="p-1 hover:bg-red-500 rounded">
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {kicked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border-8 border-red-100">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="w-14 h-14 text-red-600" />
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-4">학급에서 제외되었습니다</h2>
              <p className="text-xl text-slate-600 mb-10">선생님이 학생님을 학급에서 제외하셨습니다. 다시 코드를 입력해주세요.</p>
              <button
                onClick={() => setKicked(false)}
                className="w-full py-5 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded-2xl transition-all shadow-lg active:scale-95"
              >
                확인했습니다
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border-4 border-purple-200">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <BookOpen className="w-12 h-12 text-purple-600" />
              </div>
              <h1 className="text-4xl font-black text-purple-800 mb-4">TimeTutor</h1>
              <p className="text-xl text-slate-600 mb-10">우리 반 시간표를 확인해요!</p>
              <button
                onClick={handleLogin}
                className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-8 h-8 bg-white p-1 rounded-full" alt="Google" referrerPolicy="no-referrer" />
                구글로 로그인하기
              </button>
            </div>
          </motion.div>
        ) : user.status !== 'approved' ? (
          <Onboarding user={user} onLogout={handleLogout} />
        ) : (
          <MainScreen user={user} classData={classData} onLogout={handleLogout} />
        )}
      </AnimatePresence>
    </div>
  );
}
