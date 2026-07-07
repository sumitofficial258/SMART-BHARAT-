export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  state: string;
  preferredLanguage: string;
  joinedAt: string;
  phone?: string;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface Scheme {
  name: string;
  authority: string;
  benefits: string;
  eligibilityCriteria: string;
  stepsToApply: string[];
  requiredDocuments: string[];
}

export interface DocumentVerification {
  documentType: string;
  legible: boolean;
  legibilityDetails: string;
  expirationStatus: string;
  expirationDetails: string;
  structuralElements: {
    name: string;
    present: boolean;
    description: string;
  }[];
  overallVerificationScore: number;
  status: "Verified" | "Review Required" | "Rejected";
  message: string;
}

export interface CivicTicket {
  ticketId: string;
  reportedBy: string;
  title: string;
  description: string;
  imageUrl?: string;
  coordinates: { lat: number; lng: number };
  category: string;
  status: "Submitted" | "AI Review" | "In Progress" | "Resolved";
  urgency: string;
  tags: string[];
  createdAt: string;
  explanation?: string; // AI generated explanation
}

export interface TrackedRequest {
  id: string;
  title: string;
  category: string;
  department: string;
  referenceNumber: string;
  userNameOnDoc: string;
  dov: string; // Date of Verification / Issue
  status: "Submitted" | "AI Review" | "In Progress" | "Resolved";
  createdAt: string;
  statusNotes?: string; // Shorthand status notes from govt
  explanation?: string; // AI translation
}

export interface CommunityPost {
  postId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  upvotes: number;
  tags: string[];
  createdAt: string;
}

export interface CommunityCircle {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  location: string;
  activityLevel: "High" | "Very High" | "Medium";
  messages: {
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}
