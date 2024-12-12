// app/data/mockData.ts

// Types
export interface MonthlyDataType {
    month: string;
    players: number;
    revenue: number;
    premiumSubscribed: number;
    premiumUnsubscribed: number;
  }
  
  export interface PopularItem {
    id: number;
    name: string;
    participants: number;
  }
  
  export interface UserProfile {
    id: string;
    name: string;
    handle: string;
    imageUrl: string;
    physicalStats: {
      height: string;
      weight: string;
      wingspan: string;
      verticalJump: string;
    };
    isPremium: boolean;
    highlightVideo: string;
    courses: {
      id: number;
      name: string;
      progress: number;
    }[];
    drills: {
      id: number;
      name: string;
      score: number;
      date: string;
    }[];
    challenges: {
      id: number;
      name: string;
      score: number;
      rank: string;
    }[];
  }
  
  export interface ReportDetails {
    id: string;
    author: {
      name: string;
      handle: string;
    };
    date: string;
    media?: string;
    content: string;
    type: 'post' | 'comment';
    reportedBy: {
      name: string;
      handle: string;
      date: string;
      comment: string;
    };
  }
  
  // Mock Data
  export const monthlyData: MonthlyDataType[] = [
    { month: 'Jan', players: 50, revenue: 300, premiumSubscribed: 30, premiumUnsubscribed: 10 },
    { month: 'Feb', players: 70, revenue: 400, premiumSubscribed: 45, premiumUnsubscribed: 15 },
    { month: 'Mar', players: 40, revenue: 350, premiumSubscribed: 25, premiumUnsubscribed: 20 },
    { month: 'Apr', players: 90, revenue: 500, premiumSubscribed: 60, premiumUnsubscribed: 25 },
    { month: 'May', players: 60, revenue: 450, premiumSubscribed: 40, premiumUnsubscribed: 30 },
  ];
  
  export const popularCourses: PopularItem[] = [
    { id: 1, name: "Shooting Fundamentals 101", participants: 1234 },
    { id: 2, name: "Advanced Dribbling Techniques", participants: 982 },
    { id: 3, name: "Basketball IQ Masterclass", participants: 876 },
    { id: 4, name: "Pro-Level Defense Training", participants: 654 },
  ];
  
  export const popularChallenges: PopularItem[] = [
    { id: 1, name: "100 Free Throws Challenge", participants: 2341 },
    { id: 2, name: "3-Point Shootout", participants: 1876 },
    { id: 3, name: "Dribble Marathon", participants: 1543 },
    { id: 4, name: "Defense Drill Challenge", participants: 1232 },
  ];
  
  export const popularDrills: PopularItem[] = [
    { id: 1, name: "Mikan Drill", participants: 3214 },
    { id: 2, name: "Figure-8 Dribbling", participants: 2876 },
    { id: 3, name: "Spot Shooting Drill", participants: 2654 },
    { id: 4, name: "Box-Out Practice", participants: 2143 },
  ];
  
  export const communityPosts = [
    { id: 1, content: "Player A: Great game today!", status: "Approved" },
    { id: 2, content: "Player B: Need help with dribbling.", status: "Reported" },
  ];
  
  export const players = [
    "John Smith",
    "Sarah Johnson",
    "Mike Wilson",
    "Emma Davis"
  ];
  
  export const reports = [
    { 
      id: 1, 
      reporter: "User123", 
      reported: "ToxicPlayer99", 
      reason: "Inappropriate language",
      comment: "This behavior is unacceptable in our community",
      reportedContent: "You're all terrible at this game! *explicit content*",
      date: "2024-03-20" 
    },
    { 
      id: 2, 
      reporter: "Coach_Mike", 
      reported: "SpamBot42", 
      reason: "Spam messages",
      comment: "This user keeps posting promotional links",
      reportedContent: "Buy cheap coins at www.scam-site.com!",
      date: "2024-03-19" 
    },
    { 
      id: 3, 
      reporter: "Admin_Sarah", 
      reported: "Hacker777", 
      reason: "Suspected cheating",
      comment: "Player was showing impossible scores",
      reportedContent: "Just won 50 matches in a row! Too easy!",
      date: "2024-03-18" 
    },
  ];
  
  export const discounts = [
    { id: 1, percentage: "20%", duration: "10 days", status: "Active" },
  ];
  
  export const mockUserProfile: UserProfile = {
    id: "1",
    name: "John Smith",
    handle: "@jsmith_baller",
    imageUrl: "https://example.com/profile.jpg",
    physicalStats: {
      height: "6'2\"",
      weight: "185 lbs",
      wingspan: "6'5\"",
      verticalJump: "32 inches"
    },
    isPremium: true,
    highlightVideo: "https://example.com/highlight.mp4",
    courses: [
      { id: 1, name: "Advanced Dribbling", progress: 75 },
      { id: 2, name: "Shooting Fundamentals", progress: 90 },
      { id: 3, name: "Defense Mastery", progress: 45 }
    ],
    drills: [
      { id: 1, name: "Free Throw Challenge", score: 85, date: "2024-03-15" },
      { id: 2, name: "3-Point Shootout", score: 78, date: "2024-03-18" },
      { id: 3, name: "Dribbling Course", score: 92, date: "2024-03-20" }
    ],
    challenges: [
      { id: 1, name: "Weekly Shootout", score: 95, rank: "1st" },
      { id: 2, name: "Defense Challenge", score: 88, rank: "3rd" },
      { id: 3, name: "Team Tournament", score: 90, rank: "2nd" }
    ]
  };
  
  export const mockReportDetails: ReportDetails = {
    id: "1",
    author: {
      name: "John Smith",
      handle: "@jsmith_baller",
    },
    date: "2024-03-20 14:30",
    media: "https://example.com/post-image.jpg",
    content: "I hate player who are alwsy take up space in the gynm doing sma edirll for hours on th ehoop like give some space for a game",
    type: "post",
    reportedBy: {
      name: "Mike Wilson",
      handle: "@mike_moderator",
      date: "2024-03-20 15:45",
      comment: "This user is creating a hostile environment and targeting specific players at the gym. This kind of aggressive behavior could lead to conflicts on the court."
    }
  };