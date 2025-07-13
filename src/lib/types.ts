import type { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  name: string;
  username?: string;
  email: string;
  photoURL?: string | null;
  redeemedGiftCodes?: number;
  redeemedThinkCodes?: number;
  paymentCategory?: string;
  paymentAccountName?: string;
  paymentAccountNumber?: string;
  paymentNotes?: string;
  country?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  timestamp: Timestamp;
  likes: string[]; // Array of user UIDs
  comments: Comment[];
  mediaURL?: string;
  mediaType?: 'image' | 'video';
}

export interface Comment {
    id: string;
    authorId: string;
    authorName:string;
    content: string;
    timestamp: Timestamp;
}
