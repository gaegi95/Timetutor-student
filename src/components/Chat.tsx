import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, ClassData, Message } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { Send, Lock, AlertCircle } from 'lucide-react';

interface ChatProps {
  user: UserProfile;
  classData: ClassData;
}

export default function Chat({ user, classData }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('classCode', '==', classData.classCode),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs.reverse());
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));

    return () => unsubscribe();
  }, [classData.classCode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || classData.isChatLocked || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        classCode: classData.classCode,
        senderId: user.uid,
        senderName: user.name,
        text: inputText.trim(),
        createdAt: serverTimestamp()
      });
      setInputText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              {!isMe && (
                <span className="text-sm font-bold text-slate-500 mb-1 ml-1">
                  {msg.senderName}
                </span>
              )}
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-lg font-medium shadow-sm ${
                  isMe
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="font-bold">아직 메시지가 없어요.</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t-4 border-purple-50">
        {classData.isChatLocked ? (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-bold">
            <Lock className="w-6 h-6" />
            <p className="text-lg">지금은 수업 시간입니다 (채팅 잠금)</p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 p-4 bg-slate-100 rounded-2xl text-lg font-bold outline-none focus:ring-4 ring-purple-100 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white rounded-2xl transition-all shadow-lg active:scale-95"
            >
              <Send className="w-7 h-7" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function MessageSquare(props: any) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
