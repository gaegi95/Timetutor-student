export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin';
  assignedClass?: string;
  status?: 'pending' | 'approved' | 'none';
  createdAt?: any;
}

export interface ClassData {
  classCode: string;
  teacherId: string;
  isChatLocked: boolean;
  currentActivity?: {
    name: string;
    endTime: string; // ISO string
  };
  nextActivity?: {
    name: string;
  };
}

export interface Message {
  id: string;
  classCode: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}
