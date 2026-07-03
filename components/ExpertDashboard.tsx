
// // // // // // components/ExpertDashboard.tsx
// // // // // 'use client';

// // // // // import { useState, useEffect } from 'react';
// // // // // import { useRouter } from 'next/navigation';
// // // // // import { useRealTime } from '@/hooks/useRealTime';
// // // // // import { useAuth } from '@/hooks/useAuth';
// // // // // import { api } from '@/lib/api';
// // // // // import toast from 'react-hot-toast';
// // // // // import { QuestionCard } from './chat/QuestionCard';

// // // // // interface Question {
// // // // //   _id: string;
// // // // //   title: string;
// // // // //   description: string;
// // // // //   category: string;
// // // // //   tags: string[];
// // // // //   urgency: 'low' | 'medium' | 'high';
// // // // //   status: string;
// // // // //   userId: {
// // // // //     _id: string;
// // // // //     name: string;
// // // // //     email: string;
// // // // //     avatar?: string;
// // // // //   };
// // // // //   createdAt: string;
// // // // //   expertNotifications?: any[];
// // // // //   assignedExpert?: {
// // // // //     _id: string;
// // // // //     name: string;
// // // // //   };
// // // // //   matchedExperts?: Array<{
// // // // //     _id: string;
// // // // //     name: string;
// // // // //   }>;
// // // // // }

// // // // // export function ExpertDashboard() {
// // // // //   const router = useRouter();
// // // // //   const { user } = useAuth();
// // // // //   const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
// // // // //   const [myQuestions, setMyQuestions] = useState<Question[]>([]);
// // // // //   const [isLoading, setIsLoading] = useState(true);
// // // // //   const [isOnline, setIsOnline] = useState(false);
// // // // //   const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

// // // // //   const {
// // // // //     isConnected,
// // // // //     isAuthenticated,
// // // // //     acceptQuestion,
// // // // //     rejectQuestion,
// // // // //     updateAvailability,
// // // // //   } = useRealTime({
// // // // //     userId: user?.id,
    
// // // // //     // NEW: Question arrives instantly
// // // // //     onNewQuestion: (question) => {
// // // // //       console.log('📢 New question received in dashboard:', question);
      
// // // // //       // Add to available questions with animation
// // // // //       setAvailableQuestions(prev => {
// // // // //         // Check if question already exists
// // // // //         if (prev.some(q => q._id === question._id)) {
// // // // //           return prev;
// // // // //         }
        
// // // // //         // Play notification sound or toast
// // // // //         toast.success(
// // // // //           `🔔 New ${question.urgency === 'high' ? 'URGENT ' : ''}question: ${question.title}`,
// // // // //           {
// // // // //             duration: 5000,
// // // // //             icon: question.urgency === 'high' ? '🚨' : '📢',
// // // // //             style: {
// // // // //               background: question.urgency === 'high' ? '#dc2626' : '#333',
// // // // //               color: '#fff',
// // // // //             },
// // // // //           }
// // // // //         );
        
// // // // //         // If high urgency, also show browser notification
// // // // //         if (question.urgency === 'high' && 'Notification' in window && Notification.permission === 'granted') {
// // // // //           new Notification('🚨 Urgent Question', {
// // // // //             body: `${question.userId.name} needs help: ${question.title}`,
// // // // //             icon: '/notification-icon.png',
// // // // //           });
// // // // //         }
        
// // // // //         return [question, ...prev];
// // // // //       });
// // // // //     },
    
// // // // //     onQuestionAccepted: (data) => {
// // // // //       toast.success(`✅ You accepted a question! Chat started.`);
// // // // //       // Navigate to chat
// // // // //       router.push(`/ask/${data.questionId}`);
// // // // //       loadQuestions();
// // // // //     },
    
// // // // //     onStatusUpdate: (data) => {
// // // // //       if (data.status === 'resolved' || data.status === 'cancelled') {
// // // // //         loadQuestions();
// // // // //       }
// // // // //     },
    
// // // // //     onExpertAssigned: (data) => {
// // // // //       // Another expert took the question
// // // // //       setAvailableQuestions(prev => prev.filter(q => q._id !== data.questionId));
// // // // //       //toast.info(`Question was taken by another expert`);
// // // // //     },
// // // // //   });

// // // // //   useEffect(() => {
// // // // //     if (user) {
// // // // //       loadQuestions();
// // // // //       loadExpertStatus();
      
// // // // //       // Request notification permission
// // // // //       if ('Notification' in window && Notification.permission === 'default') {
// // // // //         Notification.requestPermission();
// // // // //       }
// // // // //     }
// // // // //   }, [user]);

// // // // //   // ✅ Reload questions when socket connects/authenticates
// // // // //   useEffect(() => {
// // // // //     if (isAuthenticated && user && !hasLoadedInitial) {
// // // // //       console.log('🔄 Socket authenticated, reloading questions...');
// // // // //       loadQuestions();
// // // // //       setHasLoadedInitial(true);
// // // // //     }
// // // // //   }, [isAuthenticated, user]);

// // // // //   const loadQuestions = async () => {
// // // // //     setIsLoading(true);
// // // // //     try {
// // // // //       console.log('📥 Loading questions for expert:', user?.id);
      
// // // // //       // Load all questions
// // // // //       const allQuestions = await api.getQuestions('all');
// // // // //       console.log(`📊 Loaded ${allQuestions.length} total questions`);
      
// // // // //       // ✅ Questions this expert can accept (open AND matched OR all open questions)
// // // // //       const openQuestions = allQuestions.filter((q: Question) => {
// // // // //         // Question must be open
// // // // //         if (q.status !== 'open') return false;
        
// // // // //         // Expert can accept if they are matched OR if they're an expert (show all open)
// // // // //         const isMatched = q.matchedExperts?.some(
// // // // //           (expert: any) => expert._id === user?.id || expert === user?.id
// // // // //         );
        
// // // // //         // For now, show all open questions to experts (they can choose to accept)
// // // // //         // But prioritize matched ones
// // // // //         return true; // Show all open questions
// // // // //       });
      
// // // // //       // Sort by match priority (matched ones first)
// // // // //       const sortedOpenQuestions = openQuestions.sort((a: Question, b: Question) => {
// // // // //         const aMatched = a.matchedExperts?.some(
// // // // //           (expert: any) => expert._id === user?.id || expert === user?.id
// // // // //         );
// // // // //         const bMatched = b.matchedExperts?.some(
// // // // //           (expert: any) => expert._id === user?.id || expert === user?.id
// // // // //         );
// // // // //         if (aMatched && !bMatched) return -1;
// // // // //         if (!aMatched && bMatched) return 1;
// // // // //         return 0;
// // // // //       });
      
// // // // //       console.log(`📊 Found ${sortedOpenQuestions.length} open questions`);
// // // // //       setAvailableQuestions(sortedOpenQuestions);

// // // // //       // ✅ Questions this expert is handling
// // // // //       const assignedQuestions = allQuestions.filter(
// // // // //         (q: Question) => q.assignedExpert?._id === user?.id && 
// // // // //         q.status !== 'resolved' && q.status !== 'cancelled'
// // // // //       );
// // // // //       console.log(`📊 Found ${assignedQuestions.length} assigned questions`);
// // // // //       setMyQuestions(assignedQuestions);

// // // // //     } catch (error) {
// // // // //       console.error('❌ Failed to load questions:', error);
// // // // //       toast.error('Failed to load questions');
// // // // //     } finally {
// // // // //       setIsLoading(false);
// // // // //     }
// // // // //   };

// // // // //   const loadExpertStatus = async () => {
// // // // //     try {
// // // // //       const profile = await api.getExpertProfile();
// // // // //       if (profile) {
// // // // //         setIsOnline(profile.availability?.status === 'available');
// // // // //       }
// // // // //     } catch (error) {
// // // // //       console.error('Failed to load expert status:', error);
// // // // //     }
// // // // //   };

// // // // //   const handleAcceptQuestion = async (questionId: string) => {
// // // // //     try {
// // // // //       // Optimistically update UI
// // // // //       const acceptedQuestion = availableQuestions.find(q => q._id === questionId);
// // // // //       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
      
// // // // //       if (acceptedQuestion) {
// // // // //         setMyQuestions(prev => [acceptedQuestion, ...prev]);
// // // // //       }
      
// // // // //       // Send accept through socket
// // // // //       acceptQuestion({ questionId });
      
// // // // //       // Also call API for persistence
// // // // //       await api.acceptQuestion(questionId);
      
// // // // //       toast.success('🎯 Question accepted! Redirecting to chat...');
      
// // // // //       // Navigate to chat after short delay
// // // // //       setTimeout(() => {
// // // // //         router.push(`/ask/${questionId}`);
// // // // //       }, 500);
      
// // // // //     } catch (error) {
// // // // //       console.error('❌ Failed to accept question:', error);
// // // // //       toast.error('Failed to accept question');
// // // // //       loadQuestions(); // Revert
// // // // //     }
// // // // //   };

// // // // //   const handleRejectQuestion = async (questionId: string) => {
// // // // //     try {
// // // // //       rejectQuestion({ questionId });
// // // // //       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
// // // // //       toast('Question rejected');
// // // // //     } catch (error) {
// // // // //       toast.error('Failed to reject question');
// // // // //     }
// // // // //   };

// // // // //   const toggleOnlineStatus = async () => {
// // // // //     try {
// // // // //       const newStatus = isOnline ? 'offline' : 'available';
// // // // //       updateAvailability({ status: newStatus });
// // // // //       setIsOnline(!isOnline);
// // // // //       toast.success(`You are now ${newStatus === 'available' ? '🟢 online' : '🔴 offline'}`);
      
// // // // //       if (newStatus === 'available') {
// // // // //         loadQuestions(); // Refresh available questions
// // // // //       }
// // // // //     } catch (error) {
// // // // //       toast.error('Failed to update status');
// // // // //     }
// // // // //   };

// // // // //   if (!user || (user.role !== 'expert' && user.role !== 'both')) {
// // // // //     return (
// // // // //       <div className="text-center py-8">
// // // // //         <div className="text-6xl mb-4">🔒</div>
// // // // //         <p className="text-gray-600 mb-4">You need to be an expert to access this dashboard.</p>
// // // // //         <button 
// // // // //           className="btn-primary" 
// // // // //           onClick={() => router.push('/profile')}
// // // // //         >
// // // // //           Become an Expert
// // // // //         </button>
// // // // //       </div>
// // // // //     );
// // // // //   }

// // // // //   return (
// // // // //     <div className="space-y-6">
// // // // //       {/* Status Bar */}
// // // // //       <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
// // // // //         <div className="flex items-center space-x-6">
// // // // //           <div className="flex items-center">
// // // // //             <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
// // // // //             <span className="text-sm text-gray-600">
// // // // //               {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
// // // // //             </span>
// // // // //           </div>
// // // // //           <div className="flex items-center">
// // // // //             <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
// // // // //             <span className="text-sm text-gray-600">
// // // // //               {isOnline ? '🟢 Available' : '🔴 Offline'}
// // // // //             </span>
// // // // //           </div>
// // // // //           {isOnline && availableQuestions.length > 0 && (
// // // // //             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
// // // // //               {availableQuestions.length} pending
// // // // //             </span>
// // // // //           )}
// // // // //         </div>
// // // // //         <button
// // // // //           onClick={toggleOnlineStatus}
// // // // //           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
// // // // //             isOnline
// // // // //               ? 'bg-red-100 text-red-700 hover:bg-red-200'
// // // // //               : 'bg-green-100 text-green-700 hover:bg-green-200'
// // // // //           }`}
// // // // //         >
// // // // //           {isOnline ? '🔴 Go Offline' : '🟢 Go Online'}
// // // // //         </button>
// // // // //       </div>

// // // // //       {/* Available Questions - Instant Feed */}
// // // // //       {availableQuestions.length > 0 && (
// // // // //         <div>
// // // // //           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
// // // // //             <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 mr-2">
// // // // //               {availableQuestions.length}
// // // // //             </span>
// // // // //             Available Questions
// // // // //             {isConnected && (
// // // // //               <span className="ml-2 text-xs text-green-600 flex items-center">
// // // // //                 <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
// // // // //                 Live
// // // // //               </span>
// // // // //             )}
// // // // //           </h3>
// // // // //           <div className="space-y-3">
// // // // //             {availableQuestions.map((question, index) => {
// // // // //               // Check if this question is matched with the expert
// // // // //               const isMatched = question.matchedExperts?.some(
// // // // //                 (expert: any) => expert._id === user?.id || expert === user?.id
// // // // //               );
              
// // // // //               return (
// // // // //                 <div 
// // // // //                   key={question._id} 
// // // // //                   className={`animate-slideIn ${isMatched ? 'border-l-4 border-blue-500' : ''}`}
// // // // //                   style={{ animationDelay: `${index * 100}ms` }}
// // // // //                 >
// // // // //                   <QuestionCard
// // // // //                     question={question}
// // // // //                     showAccept={true}
// // // // //                     onAccept={handleAcceptQuestion}
// // // // //                     onReject={handleRejectQuestion}
// // // // //                   />
// // // // //                   {isMatched && (
// // // // //                     <div className="mt-1 text-xs text-blue-600 font-medium">
// // // // //                       ⭐ Matched with your expertise
// // // // //                     </div>
// // // // //                   )}
// // // // //                 </div>
// // // // //               );
// // // // //             })}
// // // // //           </div>
// // // // //         </div>
// // // // //       )}

// // // // //       {/* My Active Questions */}
// // // // //       {myQuestions.length > 0 && (
// // // // //         <div>
// // // // //           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
// // // // //             <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 mr-2">
// // // // //               {myQuestions.length}
// // // // //             </span>
// // // // //             My Active Questions
// // // // //           </h3>
// // // // //           <div className="space-y-3">
// // // // //             {myQuestions.map((question) => (
// // // // //               <QuestionCard
// // // // //                 key={question._id}
// // // // //                 question={question}
// // // // //                 showAccept={false}
// // // // //               />
// // // // //             ))}
// // // // //           </div>
// // // // //         </div>
// // // // //       )}

// // // // //       {/* Empty State */}
// // // // //       {!isLoading && availableQuestions.length === 0 && myQuestions.length === 0 && (
// // // // //         <div className="bg-white rounded-xl shadow-sm p-8 text-center">
// // // // //           <div className="text-6xl mb-4">🕊️</div>
// // // // //           <h3 className="text-xl font-semibold text-gray-900 mb-2">
// // // // //             No questions right now
// // // // //           </h3>
// // // // //           <p className="text-gray-600 mb-4">
// // // // //             {isOnline 
// // // // //               ? "You're online and ready to help. Questions will appear here instantly."
// // // // //               : "Go online to start receiving questions in real-time."}
// // // // //           </p>
// // // // //           {!isOnline && (
// // // // //             <button
// // // // //               onClick={toggleOnlineStatus}
// // // // //               className="btn-primary"
// // // // //             >
// // // // //               🟢 Go Online
// // // // //             </button>
// // // // //           )}
// // // // //         </div>
// // // // //       )}
// // // // //     </div>
// // // // //   );
// // // // // }


// // // // // components/ExpertDashboard.tsx
// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import { useRouter } from 'next/navigation';
// // // // import { useRealTime } from '@/hooks/useRealTime';
// // // // import { useAuth } from '@/hooks/useAuth';
// // // // import { api } from '@/lib/api';
// // // // import toast from 'react-hot-toast';
// // // // import { QuestionCard } from './chat/QuestionCard';

// // // // interface Question {
// // // //   _id: string;
// // // //   title: string;
// // // //   description: string;
// // // //   category: string;
// // // //   tags: string[];
// // // //   urgency: 'low' | 'medium' | 'high';
// // // //   status: string;
// // // //   userId: {
// // // //     _id: string;
// // // //     name: string;
// // // //     email: string;
// // // //     avatar?: string;
// // // //   };
// // // //   createdAt: string;
// // // //   expertNotifications?: any[];
// // // //   assignedExpert?: {
// // // //     _id: string;
// // // //     name: string;
// // // //   };
// // // //   matchedExperts?: Array<{
// // // //     _id: string;
// // // //     name: string;
// // // //   }>;
// // // // }

// // // // export function ExpertDashboard() {
// // // //   const router = useRouter();
// // // //   const { user } = useAuth();
// // // //   const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
// // // //   const [myQuestions, setMyQuestions] = useState<Question[]>([]);
// // // //   const [isLoading, setIsLoading] = useState(true);
// // // //   const [isOnline, setIsOnline] = useState(false);
// // // //   const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
// // // //   // ✅ Track if we've already loaded historical data
// // // //   const [historicalLoaded, setHistoricalLoaded] = useState(false);

// // // //   const {
// // // //     isConnected,
// // // //     isAuthenticated,
// // // //     acceptQuestion,
// // // //     rejectQuestion,
// // // //     updateAvailability,
// // // //   } = useRealTime({
// // // //     userId: user?.id,
    
// // // //     onNewQuestion: (question) => {
// // // //       console.log('📢 New question received in dashboard:', question);
      
// // // //       setAvailableQuestions(prev => {
// // // //         // Check if question already exists
// // // //         if (prev.some(q => q._id === question._id)) {
// // // //           return prev;
// // // //         }
        
// // // //         // Play notification
// // // //         toast.success(
// // // //           `🔔 New ${question.urgency === 'high' ? 'URGENT ' : ''}question: ${question.title}`,
// // // //           {
// // // //             duration: 5000,
// // // //             icon: question.urgency === 'high' ? '🚨' : '📢',
// // // //             style: {
// // // //               background: question.urgency === 'high' ? '#dc2626' : '#333',
// // // //               color: '#fff',
// // // //             },
// // // //           }
// // // //         );
        
// // // //         if (question.urgency === 'high' && 'Notification' in window && Notification.permission === 'granted') {
// // // //           new Notification('🚨 Urgent Question', {
// // // //             body: `${question.userId.name} needs help: ${question.title}`,
// // // //             icon: '/notification-icon.png',
// // // //           });
// // // //         }
        
// // // //         return [question, ...prev];
// // // //       });
// // // //     },
    
// // // //     onQuestionAccepted: (data) => {
// // // //       toast.success(`✅ You accepted a question! Chat started.`);
// // // //       router.push(`/ask/${data.questionId}`);
// // // //       loadQuestions();
// // // //     },
    
// // // //     onStatusUpdate: (data) => {
// // // //       if (data.status === 'resolved' || data.status === 'cancelled') {
// // // //         loadQuestions();
// // // //       }
// // // //     },
    
// // // //     onExpertAssigned: (data) => {
// // // //       setAvailableQuestions(prev => prev.filter(q => q._id !== data.questionId));
// // // //     },
// // // //   });

// // // //   useEffect(() => {
// // // //     if (user) {
// // // //       loadQuestions();
// // // //       loadExpertStatus();
      
// // // //       if ('Notification' in window && Notification.permission === 'default') {
// // // //         Notification.requestPermission();
// // // //       }
// // // //     }
// // // //   }, [user]);

// // // //   // ✅ Also reload when socket authenticates (for real-time updates)
// // // //   useEffect(() => {
// // // //     if (isAuthenticated && user && !hasLoadedInitial) {
// // // //       console.log('🔄 Socket authenticated, refreshing questions...');
// // // //       loadQuestions();
// // // //       setHasLoadedInitial(true);
// // // //     }
// // // //   }, [isAuthenticated, user]);

// // // //   const loadQuestions = async () => {
// // // //     setIsLoading(true);
// // // //     try {
// // // //       console.log('📥 Loading questions for expert:', user?.id);
      
// // // //       const allQuestions = await api.getQuestions('all');
// // // //       console.log(`📊 Loaded ${allQuestions.length} total questions`);
      
// // // //       // ✅ Filter open questions (status === 'open')
// // // //       const openQuestions = allQuestions.filter((q: Question) => q.status === 'open');
      
// // // //       // Sort by urgency (high first) and then by creation date
// // // //       const sortedOpenQuestions = openQuestions.sort((a: Question, b: Question) => {
// // // //         const urgencyOrder = { high: 0, medium: 1, low: 2 };
// // // //         const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
// // // //         if (urgencyDiff !== 0) return urgencyDiff;
// // // //         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
// // // //       });
      
// // // //       console.log(`📊 Found ${sortedOpenQuestions.length} open questions`);
      
// // // //       // ✅ CRITICAL FIX: Set available questions from API
// // // //       // This should be the primary source, and socket events should ADD to it
// // // //       setAvailableQuestions(sortedOpenQuestions);
      
// // // //       // Mark that we've loaded historical data
// // // //       setHistoricalLoaded(true);

// // // //       // ✅ Questions this expert is handling
// // // //       const assignedQuestions = allQuestions.filter(
// // // //         (q: Question) => q.assignedExpert?._id === user?.id && 
// // // //         q.status !== 'resolved' && q.status !== 'cancelled'
// // // //       );
// // // //       console.log(`📊 Found ${assignedQuestions.length} assigned questions`);
// // // //       setMyQuestions(assignedQuestions);

// // // //     } catch (error) {
// // // //       console.error('❌ Failed to load questions:', error);
// // // //       toast.error('Failed to load questions');
// // // //     } finally {
// // // //       setIsLoading(false);
// // // //     }
// // // //   };

// // // //   const loadExpertStatus = async () => {
// // // //     try {
// // // //       const profile = await api.getExpertProfile();
// // // //       if (profile) {
// // // //         setIsOnline(profile.availability?.status === 'available');
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Failed to load expert status:', error);
// // // //     }
// // // //   };

// // // //   const handleAcceptQuestion = async (questionId: string) => {
// // // //     try {
// // // //       // Optimistically update UI
// // // //       const acceptedQuestion = availableQuestions.find(q => q._id === questionId);
// // // //       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
      
// // // //       if (acceptedQuestion) {
// // // //         setMyQuestions(prev => [acceptedQuestion, ...prev]);
// // // //       }
      
// // // //       // Send accept through socket
// // // //       acceptQuestion({ questionId });
      
// // // //       // Also call API for persistence
// // // //       await api.acceptQuestion(questionId);
      
// // // //       toast.success('🎯 Question accepted! Redirecting to chat...');
      
// // // //       setTimeout(() => {
// // // //         router.push(`/ask/${questionId}`);
// // // //       }, 500);
      
// // // //     } catch (error) {
// // // //       console.error('❌ Failed to accept question:', error);
// // // //       toast.error('Failed to accept question');
// // // //       loadQuestions(); // Revert
// // // //     }
// // // //   };

// // // //   const handleRejectQuestion = async (questionId: string) => {
// // // //     try {
// // // //       rejectQuestion({ questionId });
// // // //       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
// // // //       toast('Question rejected');
// // // //     } catch (error) {
// // // //       toast.error('Failed to reject question');
// // // //     }
// // // //   };

// // // //   const toggleOnlineStatus = async () => {
// // // //     try {
// // // //       const newStatus = isOnline ? 'offline' : 'available';
// // // //       updateAvailability({ status: newStatus });
// // // //       setIsOnline(!isOnline);
// // // //       toast.success(`You are now ${newStatus === 'available' ? '🟢 online' : '🔴 offline'}`);
      
// // // //       if (newStatus === 'available') {
// // // //         loadQuestions();
// // // //       }
// // // //     } catch (error) {
// // // //       toast.error('Failed to update status');
// // // //     }
// // // //   };

// // // //   if (!user || (user.role !== 'expert' && user.role !== 'both')) {
// // // //     return (
// // // //       <div className="text-center py-8">
// // // //         <div className="text-6xl mb-4">🔒</div>
// // // //         <p className="text-gray-600 mb-4">You need to be an expert to access this dashboard.</p>
// // // //         <button 
// // // //           className="btn-primary" 
// // // //           onClick={() => router.push('/profile')}
// // // //         >
// // // //           Become an Expert
// // // //         </button>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className="space-y-6">
// // // //       {/* Status Bar */}
// // // //       <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
// // // //         <div className="flex items-center space-x-6">
// // // //           <div className="flex items-center">
// // // //             <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
// // // //             <span className="text-sm text-gray-600">
// // // //               {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
// // // //             </span>
// // // //           </div>
// // // //           <div className="flex items-center">
// // // //             <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
// // // //             <span className="text-sm text-gray-600">
// // // //               {isOnline ? '🟢 Available' : '🔴 Offline'}
// // // //             </span>
// // // //           </div>
// // // //           {isOnline && availableQuestions.length > 0 && (
// // // //             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
// // // //               {availableQuestions.length} pending
// // // //             </span>
// // // //           )}
// // // //         </div>
// // // //         <button
// // // //           onClick={toggleOnlineStatus}
// // // //           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
// // // //             isOnline
// // // //               ? 'bg-red-100 text-red-700 hover:bg-red-200'
// // // //               : 'bg-green-100 text-green-700 hover:bg-green-200'
// // // //           }`}
// // // //         >
// // // //           {isOnline ? '🔴 Go Offline' : '🟢 Go Online'}
// // // //         </button>
// // // //       </div>

// // // //       {/* ✅ Loading State */}
// // // //       {isLoading && !historicalLoaded && (
// // // //         <div className="flex justify-center py-12">
// // // //           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
// // // //         </div>
// // // //       )}

// // // //       {/* ✅ Available Questions - Shows both historical and real-time */}
// // // //       {!isLoading && availableQuestions.length > 0 && (
// // // //         <div>
// // // //           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
// // // //             <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 mr-2">
// // // //               {availableQuestions.length}
// // // //             </span>
// // // //             Available Questions
// // // //             {isConnected && (
// // // //               <span className="ml-2 text-xs text-green-600 flex items-center">
// // // //                 <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
// // // //                 Live
// // // //               </span>
// // // //             )}
// // // //             {historicalLoaded && (
// // // //               <span className="ml-2 text-xs text-gray-400">
// // // //                 (historical + new)
// // // //               </span>
// // // //             )}
// // // //           </h3>
// // // //           <div className="space-y-3">
// // // //             {availableQuestions.map((question, index) => {
// // // //               // Check if this question is matched with the expert
// // // //               const isMatched = question.matchedExperts?.some(
// // // //                 (expert: any) => expert._id === user?.id || expert === user?.id
// // // //               );
              
// // // //               return (
// // // //                 <div 
// // // //                   key={question._id} 
// // // //                   className={`animate-slideIn ${isMatched ? 'border-l-4 border-blue-500' : ''}`}
// // // //                   style={{ animationDelay: `${Math.min(index, 10) * 100}ms` }}
// // // //                 >
// // // //                   <QuestionCard
// // // //                     question={question}
// // // //                     showAccept={true}
// // // //                     onAccept={handleAcceptQuestion}
// // // //                     onReject={handleRejectQuestion}
// // // //                   />
// // // //                   {isMatched && (
// // // //                     <div className="mt-1 text-xs text-blue-600 font-medium">
// // // //                       ⭐ Matched with your expertise
// // // //                     </div>
// // // //                   )}
// // // //                 </div>
// // // //               );
// // // //             })}
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {/* My Active Questions */}
// // // //       {myQuestions.length > 0 && (
// // // //         <div>
// // // //           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
// // // //             <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 mr-2">
// // // //               {myQuestions.length}
// // // //             </span>
// // // //             My Active Questions
// // // //           </h3>
// // // //           <div className="space-y-3">
// // // //             {myQuestions.map((question) => (
// // // //               <QuestionCard
// // // //                 key={question._id}
// // // //                 question={question}
// // // //                 showAccept={false}
// // // //               />
// // // //             ))}
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {/* ✅ Empty State - Only show when both lists are empty AND not loading */}
// // // //       {!isLoading && availableQuestions.length === 0 && myQuestions.length === 0 && (
// // // //         <div className="bg-white rounded-xl shadow-sm p-8 text-center">
// // // //           <div className="text-6xl mb-4">🕊️</div>
// // // //           <h3 className="text-xl font-semibold text-gray-900 mb-2">
// // // //             No questions right now
// // // //           </h3>
// // // //           <p className="text-gray-600 mb-4">
// // // //             {isOnline 
// // // //               ? "You're online and ready to help. Questions will appear here instantly."
// // // //               : "Go online to start receiving questions in real-time."}
// // // //           </p>
// // // //           {!isOnline && (
// // // //             <button
// // // //               onClick={toggleOnlineStatus}
// // // //               className="btn-primary"
// // // //             >
// // // //               🟢 Go Online
// // // //             </button>
// // // //           )}
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // }

// // // // components/ExpertDashboard.tsx
// // // 'use client';

// // // import { useState, useEffect } from 'react';
// // // import { useRouter } from 'next/navigation';
// // // import { useRealTime } from '@/hooks/useRealTime';
// // // import { useAuth } from '@/hooks/useAuth';
// // // import { api } from '@/lib/api';
// // // import toast from 'react-hot-toast';
// // // import { QuestionCard } from './chat/QuestionCard';
// // // import { Question } from '@/types'; // ✅ Import the proper type

// // // export function ExpertDashboard() {
// // //   const router = useRouter();
// // //   const { user } = useAuth();
// // //   const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
// // //   const [myQuestions, setMyQuestions] = useState<Question[]>([]);
// // //   const [isLoading, setIsLoading] = useState(true);
// // //   const [isOnline, setIsOnline] = useState(false);
// // //   const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
// // //   const [historicalLoaded, setHistoricalLoaded] = useState(false);
// // //   const [error, setError] = useState<string | null>(null);

// // //   const {
// // //     isConnected,
// // //     isAuthenticated,
// // //     acceptQuestion,
// // //     rejectQuestion,
// // //     updateAvailability,
// // //   } = useRealTime({
// // //     userId: user?.id,
    
// // //     onNewQuestion: (question) => {
// // //       console.log('📢 New question received in dashboard:', question);
      
// // //       setAvailableQuestions(prev => {
// // //         if (prev.some(q => q._id === question._id)) {
// // //           return prev;
// // //         }
        
// // //         toast.success(
// // //           `🔔 New ${question.urgency === 'high' ? 'URGENT ' : ''}question: ${question.title}`,
// // //           {
// // //             duration: 5000,
// // //             icon: question.urgency === 'high' ? '🚨' : '📢',
// // //             style: {
// // //               background: question.urgency === 'high' ? '#dc2626' : '#333',
// // //               color: '#fff',
// // //             },
// // //           }
// // //         );
        
// // //         if (question.urgency === 'high' && 'Notification' in window && Notification.permission === 'granted') {
// // //           new Notification('🚨 Urgent Question', {
// // //             body: `${question.userId.name} needs help: ${question.title}`,
// // //             icon: '/notification-icon.png',
// // //           });
// // //         }
        
// // //         return [question, ...prev];
// // //       });
// // //     },
    
// // //     onQuestionAccepted: (data) => {
// // //       toast.success(`✅ You accepted a question! Chat started.`);
// // //       router.push(`/ask/${data.questionId}`);
// // //       loadQuestions();
// // //     },
    
// // //     onStatusUpdate: (data) => {
// // //       if (data.status === 'resolved' || data.status === 'cancelled') {
// // //         loadQuestions();
// // //       }
// // //     },
    
// // //     onExpertAssigned: (data) => {
// // //       setAvailableQuestions(prev => prev.filter(q => q._id !== data.questionId));
// // //     },
// // //   });

// // //   useEffect(() => {
// // //     if (user) {
// // //       loadQuestions();
// // //       loadExpertStatus();
      
// // //       if ('Notification' in window && Notification.permission === 'default') {
// // //         Notification.requestPermission();
// // //       }
// // //     }
// // //   }, [user]);

// // //   useEffect(() => {
// // //     if (isAuthenticated && user && !hasLoadedInitial) {
// // //       console.log('🔄 Socket authenticated, refreshing questions...');
// // //       loadQuestions();
// // //       setHasLoadedInitial(true);
// // //     }
// // //   }, [isAuthenticated, user]);

// // //   const loadQuestions = async () => {
// // //     setIsLoading(true);
// // //     setError(null);
// // //     try {
// // //       console.log('📥 Loading questions for expert:', user?.id);
      
// // //       // ✅ Use the role parameter to get questions for expert
// // //       const allQuestions = await api.getQuestions('all');
// // //       console.log(`📊 Loaded ${allQuestions.length} total questions`);
      
// // //       if (!allQuestions || allQuestions.length === 0) {
// // //         console.log('📭 No questions found');
// // //         setAvailableQuestions([]);
// // //         setMyQuestions([]);
// // //         setHistoricalLoaded(true);
// // //         return;
// // //       }

// // //       // ✅ Filter open questions (status === 'open')
// // //       const openQuestions = allQuestions.filter((q: Question) => q.status === 'open');
      
// // //       // Sort by urgency (high first) and then by creation date
// // //       const sortedOpenQuestions = openQuestions.sort((a: Question, b: Question) => {
// // //         const urgencyOrder = { high: 0, medium: 1, low: 2 };
// // //         const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
// // //         if (urgencyDiff !== 0) return urgencyDiff;
// // //         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
// // //       });
      
// // //       console.log(`📊 Found ${sortedOpenQuestions.length} open questions`);
// // //       console.log('📊 Open questions:', sortedOpenQuestions.map(q => q.title));
      
// // //       setAvailableQuestions(sortedOpenQuestions);
// // //       setHistoricalLoaded(true);

// // //       // ✅ Questions this expert is handling (assigned to them)
// // //       const assignedQuestions = allQuestions.filter(
// // //         (q: Question) => q.assignedExpert?._id === user?.id && 
// // //         q.status !== 'resolved' && q.status !== 'cancelled'
// // //       );
// // //       console.log(`📊 Found ${assignedQuestions.length} assigned questions`);
// // //       setMyQuestions(assignedQuestions);

// // //     } catch (error: any) {
// // //       console.error('❌ Failed to load questions:', error);
// // //       setError(error.message || 'Failed to load questions');
// // //       toast.error('Failed to load questions');
// // //     } finally {
// // //       setIsLoading(false);
// // //     }
// // //   };

// // //   const loadExpertStatus = async () => {
// // //     try {
// // //       const profile = await api.getExpertProfile();
// // //       if (profile) {
// // //         setIsOnline(profile.availability?.status === 'available');
// // //         console.log('📊 Expert profile loaded:', {
// // //           isActive: profile.isActive,
// // //           availability: profile.availability,
// // //           primaryExpertise: profile.primaryExpertise
// // //         });
// // //       } else {
// // //         console.warn('⚠️ No expert profile found');
// // //         // If no profile, try to create one automatically
// // //         await createDefaultExpertProfile();
// // //       }
// // //     } catch (error) {
// // //       console.error('Failed to load expert status:', error);
// // //     }
// // //   };

// // //   const createDefaultExpertProfile = async () => {
// // //     try {
// // //       console.log('🔄 Creating default expert profile...');
// // //       await api.updateExpertProfile({
// // //         title: 'Expert',
// // //         bio: 'I am here to help answer questions.',
// // //         primaryExpertise: ['General'],
// // //         secondarySkills: [],
// // //         yearsOfExperience: 0,
// // //         availability: {
// // //           status: 'available',
// // //           maxQuestionsPerDay: 5,
// // //           currentQuestionsToday: 0,
// // //         },
// // //         isActive: true,
// // //       });
// // //       setIsOnline(true);
// // //       toast.success('Expert profile created! You are now online.');
// // //     } catch (error) {
// // //       console.error('Failed to create expert profile:', error);
// // //     }
// // //   };

// // //   const handleAcceptQuestion = async (questionId: string) => {
// // //     try {
// // //       const acceptedQuestion = availableQuestions.find(q => q._id === questionId);
// // //       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
      
// // //       if (acceptedQuestion) {
// // //         setMyQuestions(prev => [acceptedQuestion, ...prev]);
// // //       }
      
// // //       acceptQuestion({ questionId });
// // //       await api.acceptQuestion(questionId);
      
// // //       toast.success('🎯 Question accepted! Redirecting to chat...');
      
// // //       setTimeout(() => {
// // //         router.push(`/ask/${questionId}`);
// // //       }, 500);
      
// // //     } catch (error) {
// // //       console.error('❌ Failed to accept question:', error);
// // //       toast.error('Failed to accept question');
// // //       loadQuestions();
// // //     }
// // //   };

// // //   const handleRejectQuestion = async (questionId: string) => {
// // //     try {
// // //       rejectQuestion({ questionId });
// // //       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
// // //       toast('Question rejected');
// // //     } catch (error) {
// // //       toast.error('Failed to reject question');
// // //     }
// // //   };

// // //   const toggleOnlineStatus = async () => {
// // //     try {
// // //       const newStatus = isOnline ? 'offline' : 'available';
// // //       updateAvailability({ status: newStatus });
// // //       setIsOnline(!isOnline);
// // //       toast.success(`You are now ${newStatus === 'available' ? '🟢 online' : '🔴 offline'}`);
      
// // //       if (newStatus === 'available') {
// // //         loadQuestions();
// // //       }
// // //     } catch (error) {
// // //       toast.error('Failed to update status');
// // //     }
// // //   };

// // //   if (!user || (user.role !== 'expert' && user.role !== 'both')) {
// // //     return (
// // //       <div className="text-center py-8">
// // //         <div className="text-6xl mb-4">🔒</div>
// // //         <p className="text-gray-600 mb-4">You need to be an expert to access this dashboard.</p>
// // //         <button 
// // //           className="btn-primary" 
// // //           onClick={() => router.push('/profile')}
// // //         >
// // //           Become an Expert
// // //         </button>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="space-y-6">
// // //       {/* Status Bar */}
// // //       <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
// // //         <div className="flex items-center space-x-6">
// // //           <div className="flex items-center">
// // //             <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
// // //             <span className="text-sm text-gray-600">
// // //               {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
// // //             </span>
// // //           </div>
// // //           <div className="flex items-center">
// // //             <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
// // //             <span className="text-sm text-gray-600">
// // //               {isOnline ? '🟢 Available' : '🔴 Offline'}
// // //             </span>
// // //           </div>
// // //           {isOnline && availableQuestions.length > 0 && (
// // //             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
// // //               {availableQuestions.length} pending
// // //             </span>
// // //           )}
// // //           {error && (
// // //             <span className="text-sm text-red-600">⚠️ {error}</span>
// // //           )}
// // //         </div>
// // //         <button
// // //           onClick={toggleOnlineStatus}
// // //           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
// // //             isOnline
// // //               ? 'bg-red-100 text-red-700 hover:bg-red-200'
// // //               : 'bg-green-100 text-green-700 hover:bg-green-200'
// // //           }`}
// // //         >
// // //           {isOnline ? '🔴 Go Offline' : '🟢 Go Online'}
// // //         </button>
// // //       </div>

// // //       {/* Loading State */}
// // //       {isLoading && !historicalLoaded && (
// // //         <div className="flex justify-center py-12">
// // //           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
// // //         </div>
// // //       )}

// // //       {/* Available Questions */}
// // //       {!isLoading && availableQuestions.length > 0 && (
// // //         <div>
// // //           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
// // //             <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 mr-2">
// // //               {availableQuestions.length}
// // //             </span>
// // //             Available Questions
// // //             {isConnected && (
// // //               <span className="ml-2 text-xs text-green-600 flex items-center">
// // //                 <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
// // //                 Live
// // //               </span>
// // //             )}
// // //             {historicalLoaded && (
// // //               <span className="ml-2 text-xs text-gray-400">
// // //                 (historical + new)
// // //               </span>
// // //             )}
// // //           </h3>
// // //           <div className="space-y-3">
// // //             {availableQuestions.map((question, index) => {
// // //               const isMatched = question.matchedExperts?.some(
// // //                 (expert: any) => expert._id === user?.id || expert === user?.id
// // //               );
              
// // //               return (
// // //                 <div 
// // //                   key={question._id} 
// // //                   className={`animate-slideIn ${isMatched ? 'border-l-4 border-blue-500' : ''}`}
// // //                   style={{ animationDelay: `${Math.min(index, 10) * 100}ms` }}
// // //                 >
// // //                   <QuestionCard
// // //                     question={question}
// // //                     showAccept={true}
// // //                     onAccept={handleAcceptQuestion}
// // //                     onReject={handleRejectQuestion}
// // //                   />
// // //                   {isMatched && (
// // //                     <div className="mt-1 text-xs text-blue-600 font-medium">
// // //                       ⭐ Matched with your expertise
// // //                     </div>
// // //                   )}
// // //                 </div>
// // //               );
// // //             })}
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* My Active Questions */}
// // //       {myQuestions.length > 0 && (
// // //         <div>
// // //           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
// // //             <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 mr-2">
// // //               {myQuestions.length}
// // //             </span>
// // //             My Active Questions
// // //           </h3>
// // //           <div className="space-y-3">
// // //             {myQuestions.map((question) => (
// // //               <QuestionCard
// // //                 key={question._id}
// // //                 question={question}
// // //                 showAccept={false}
// // //               />
// // //             ))}
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Empty State */}
// // //       {!isLoading && historicalLoaded && availableQuestions.length === 0 && myQuestions.length === 0 && (
// // //         <div className="bg-white rounded-xl shadow-sm p-8 text-center">
// // //           <div className="text-6xl mb-4">🕊️</div>
// // //           <h3 className="text-xl font-semibold text-gray-900 mb-2">
// // //             No questions right now
// // //           </h3>
// // //           <p className="text-gray-600 mb-4">
// // //             {isOnline 
// // //               ? "You're online and ready to help. Questions will appear here instantly."
// // //               : "Go online to start receiving questions in real-time."}
// // //           </p>
// // //           {!isOnline && (
// // //             <button
// // //               onClick={toggleOnlineStatus}
// // //               className="btn-primary"
// // //             >
// // //               🟢 Go Online
// // //             </button>
// // //           )}
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }

// // // components/ExpertDashboard.tsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { useRealTime } from '@/hooks/useRealTime';
// // import { useAuth } from '@/hooks/useAuth';
// // import { api } from '@/lib/api';
// // import toast from 'react-hot-toast';
// // import { QuestionCard } from './chat/QuestionCard';

// // interface Question {
// //   _id: string;
// //   title: string;
// //   description: string;
// //   category: string;
// //   tags: string[];
// //   urgency: 'low' | 'medium' | 'high';
// //   status: string;
// //   userId: {
// //     _id: string;
// //     name: string;
// //     email: string;
// //     avatar?: string;
// //   };
// //   createdAt: string;
// //   expertNotifications?: any[];
// //   assignedExpert?: {
// //     _id: string;
// //     name: string;
// //   };
// //   matchedExperts?: Array<{
// //     _id: string;
// //     name: string;
// //   }>;
// // }

// // export function ExpertDashboard() {
// //   const router = useRouter();
// //   const { user } = useAuth();
// //   const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
// //   const [myQuestions, setMyQuestions] = useState<Question[]>([]);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [isOnline, setIsOnline] = useState(false);

// //   const {
// //     isConnected,
// //     isAuthenticated,
// //     acceptQuestion,
// //     rejectQuestion,
// //     updateAvailability,
// //   } = useRealTime({
// //     userId: user?.id,
    
// //     onNewQuestion: (question) => {
// //       console.log('📢 New question received in dashboard:', question);
      
// //       setAvailableQuestions(prev => {
// //         if (prev.some(q => q._id === question._id)) {
// //           return prev;
// //         }
        
// //         toast.success(
// //           `🔔 New ${question.urgency === 'high' ? 'URGENT ' : ''}question: ${question.title}`,
// //           {
// //             duration: 5000,
// //             icon: question.urgency === 'high' ? '🚨' : '📢',
// //             style: {
// //               background: question.urgency === 'high' ? '#dc2626' : '#333',
// //               color: '#fff',
// //             },
// //           }
// //         );
        
// //         if (question.urgency === 'high' && 'Notification' in window && Notification.permission === 'granted') {
// //           new Notification('🚨 Urgent Question', {
// //             body: `${question.userId.name} needs help: ${question.title}`,
// //             icon: '/notification-icon.png',
// //           });
// //         }
        
// //         return [question, ...prev];
// //       });
// //     },
    
// //     onQuestionAccepted: (data) => {
// //       toast.success(`✅ You accepted a question! Chat started.`);
// //       router.push(`/ask/${data.questionId}`);
// //       loadQuestions();
// //     },
    
// //     onStatusUpdate: (data) => {
// //       if (data.status === 'resolved' || data.status === 'cancelled') {
// //         loadQuestions();
// //       }
// //     },
    
// //     onExpertAssigned: (data) => {
// //       setAvailableQuestions(prev => prev.filter(q => q._id !== data.questionId));
// //       toast.info(`Question was taken by another expert`);
// //     },
// //   });

// //   useEffect(() => {
// //     if (user) {
// //       console.log('👤 ExpertDashboard mounted for user:', user.id);
// //       loadQuestions();
// //       loadExpertStatus();
      
// //       if ('Notification' in window && Notification.permission === 'default') {
// //         Notification.requestPermission();
// //       }
// //     }
// //   }, [user]);

// //   // ✅ Reload when socket authenticates
// //   useEffect(() => {
// //     if (isAuthenticated && user) {
// //       console.log('🔄 Socket authenticated, reloading questions...');
// //       loadQuestions();
// //     }
// //   }, [isAuthenticated, user]);

// //   const loadQuestions = async () => {
// //     setIsLoading(true);
// //     try {
// //       console.log('📥 Loading questions for expert:', user?.id);
      
// //       // ✅ Load ALL questions with no filter to get everything
// //       const allQuestions = await api.getQuestions('all');
// //       console.log(`📊 Loaded ${allQuestions.length} total questions`);
      
// //       // ✅ Questions this expert can accept (all open questions)
// //       const openQuestions = allQuestions.filter((q: Question) => {
// //         // Only show open questions
// //         if (q.status !== 'open') return false;
        
// //         // Check if expert is matched with this question
// //         const isMatched = q.matchedExperts?.some(
// //           (expert: any) => expert._id === user?.id || expert === user?.id
// //         );
        
// //         // Show all open questions, but mark matched ones
// //         return true;
// //       });
      
// //       // Sort: matched questions first, then by urgency
// //       const sortedOpenQuestions = openQuestions.sort((a: Question, b: Question) => {
// //         // Priority 1: Matched questions
// //         const aMatched = a.matchedExperts?.some(
// //           (expert: any) => expert._id === user?.id || expert === user?.id
// //         );
// //         const bMatched = b.matchedExperts?.some(
// //           (expert: any) => expert._id === user?.id || expert === user?.id
// //         );
// //         if (aMatched && !bMatched) return -1;
// //         if (!aMatched && bMatched) return 1;
        
// //         // Priority 2: Urgency (high first)
// //         const urgencyOrder = { high: 0, medium: 1, low: 2 };
// //         return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
// //       });
      
// //       console.log(`📊 Found ${sortedOpenQuestions.length} open questions`);
// //       setAvailableQuestions(sortedOpenQuestions);

// //       // ✅ Questions this expert is handling (assigned to them)
// //       const assignedQuestions = allQuestions.filter(
// //         (q: Question) => {
// //           const isAssigned = q.assignedExpert?._id === user?.id || q.assignedExpert === user?.id;
// //           const isActive = q.status !== 'resolved' && q.status !== 'cancelled';
// //           return isAssigned && isActive;
// //         }
// //       );
// //       console.log(`📊 Found ${assignedQuestions.length} assigned questions`);
// //       setMyQuestions(assignedQuestions);

// //     } catch (error) {
// //       console.error('❌ Failed to load questions:', error);
// //       toast.error('Failed to load questions');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const loadExpertStatus = async () => {
// //     try {
// //       const profile = await api.getExpertProfile();
// //       if (profile) {
// //         setIsOnline(profile.availability?.status === 'available');
// //         console.log('📊 Expert status:', profile.availability?.status);
// //       }
// //     } catch (error) {
// //       console.error('Failed to load expert status:', error);
// //     }
// //   };

// //   const handleAcceptQuestion = async (questionId: string) => {
// //     try {
// //       console.log('🎯 Attempting to accept question:', questionId);
      
// //       const questionToAccept = availableQuestions.find(q => q._id === questionId);
// //       if (!questionToAccept) {
// //         toast.error('Question no longer available');
// //         return;
// //       }

// //       // Optimistically update UI
// //       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
      
// //       if (questionToAccept) {
// //         setMyQuestions(prev => [questionToAccept, ...prev]);
// //       }
      
// //       // Send accept through socket
// //       acceptQuestion({ questionId });
      
// //       // Call API for persistence
// //       await api.acceptQuestion(questionId);
      
// //       toast.success('🎯 Question accepted! Redirecting to chat...');
      
// //       setTimeout(() => {
// //         router.push(`/ask/${questionId}`);
// //       }, 500);
      
// //     } catch (error: any) {
// //       console.error('❌ Failed to accept question:', error);
// //       const errorMessage = error.response?.data?.error || 'Failed to accept question';
// //       toast.error(errorMessage);
// //       loadQuestions(); // Revert
// //     }
// //   };

// //   const handleRejectQuestion = async (questionId: string) => {
// //     try {
// //       rejectQuestion({ questionId });
// //       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
// //       toast('Question rejected');
// //     } catch (error) {
// //       toast.error('Failed to reject question');
// //     }
// //   };

// //   const toggleOnlineStatus = async () => {
// //     try {
// //       const newStatus = isOnline ? 'offline' : 'available';
// //       updateAvailability({ status: newStatus });
// //       setIsOnline(!isOnline);
// //       toast.success(`You are now ${newStatus === 'available' ? '🟢 online' : '🔴 offline'}`);
      
// //       if (newStatus === 'available') {
// //         loadQuestions();
// //       }
// //     } catch (error) {
// //       toast.error('Failed to update status');
// //     }
// //   };

// //   if (!user || (user.role !== 'expert' && user.role !== 'both')) {
// //     return (
// //       <div className="text-center py-8">
// //         <div className="text-6xl mb-4">🔒</div>
// //         <p className="text-gray-600 mb-4">You need to be an expert to access this dashboard.</p>
// //         <button 
// //           className="btn-primary" 
// //           onClick={() => router.push('/profile')}
// //         >
// //           Become an Expert
// //         </button>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="space-y-6">
// //       {/* Status Bar */}
// //       <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
// //         <div className="flex items-center space-x-6">
// //           <div className="flex items-center">
// //             <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
// //             <span className="text-sm text-gray-600">
// //               {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
// //             </span>
// //           </div>
// //           <div className="flex items-center">
// //             <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
// //             <span className="text-sm text-gray-600">
// //               {isOnline ? '🟢 Available' : '🔴 Offline'}
// //             </span>
// //           </div>
// //           {isOnline && availableQuestions.length > 0 && (
// //             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
// //               {availableQuestions.length} pending
// //             </span>
// //           )}
// //         </div>
// //         <button
// //           onClick={toggleOnlineStatus}
// //           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
// //             isOnline
// //               ? 'bg-red-100 text-red-700 hover:bg-red-200'
// //               : 'bg-green-100 text-green-700 hover:bg-green-200'
// //           }`}
// //         >
// //           {isOnline ? '🔴 Go Offline' : '🟢 Go Online'}
// //         </button>
// //       </div>

// //       {/* Available Questions - Shows ALL open questions */}
// //       {availableQuestions.length > 0 && (
// //         <div>
// //           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
// //             <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 mr-2">
// //               {availableQuestions.length}
// //             </span>
// //             Available Questions
// //             {isConnected && (
// //               <span className="ml-2 text-xs text-green-600 flex items-center">
// //                 <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
// //                 Live
// //               </span>
// //             )}
// //           </h3>
// //           <div className="space-y-3">
// //             {availableQuestions.map((question, index) => {
// //               // Check if this question is matched with the expert
// //               const isMatched = question.matchedExperts?.some(
// //                 (expert: any) => expert._id === user?.id || expert === user?.id
// //               );
              
// //               return (
// //                 <div 
// //                   key={question._id} 
// //                   className={`animate-slideIn ${isMatched ? 'border-l-4 border-blue-500 pl-2' : ''}`}
// //                   style={{ animationDelay: `${index * 100}ms` }}
// //                 >
// //                   <QuestionCard
// //                     question={question}
// //                     showAccept={true}
// //                     onAccept={handleAcceptQuestion}
// //                     onReject={handleRejectQuestion}
// //                   />
// //                   {isMatched && (
// //                     <div className="mt-1 text-xs text-blue-600 font-medium flex items-center">
// //                       ⭐ Matched with your expertise
// //                     </div>
// //                   )}
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         </div>
// //       )}

// //       {/* My Active Questions */}
// //       {myQuestions.length > 0 && (
// //         <div>
// //           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
// //             <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 mr-2">
// //               {myQuestions.length}
// //             </span>
// //             My Active Questions
// //           </h3>
// //           <div className="space-y-3">
// //             {myQuestions.map((question) => (
// //               <QuestionCard
// //                 key={question._id}
// //                 question={question}
// //                 showAccept={false}
// //               />
// //             ))}
// //           </div>
// //         </div>
// //       )}

// //       {/* Empty State */}
// //       {!isLoading && availableQuestions.length === 0 && myQuestions.length === 0 && (
// //         <div className="bg-white rounded-xl shadow-sm p-8 text-center">
// //           <div className="text-6xl mb-4">🕊️</div>
// //           <h3 className="text-xl font-semibold text-gray-900 mb-2">
// //             No questions right now
// //           </h3>
// //           <p className="text-gray-600 mb-4">
// //             {isOnline 
// //               ? "You're online and ready to help. Questions will appear here instantly."
// //               : "Go online to start receiving questions in real-time."}
// //           </p>
// //           {!isOnline && (
// //             <button
// //               onClick={toggleOnlineStatus}
// //               className="btn-primary"
// //             >
// //               🟢 Go Online
// //             </button>
// //           )}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // components/ExpertDashboard.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useRealTime } from '@/hooks/useRealTime';
// import { useAuth } from '@/hooks/useAuth';
// import { api } from '@/lib/api';
// import toast from 'react-hot-toast';
// import { QuestionCard } from './chat/QuestionCard';

// interface Question {
//   _id: string;
//   title: string;
//   description: string;
//   category: string;
//   tags: string[];
//   urgency: 'low' | 'medium' | 'high';
//   status: string;
//   userId: {
//     _id: string;
//     name: string;
//     email: string;
//     avatar?: string;
//   };
//   createdAt: string;
//   expertNotifications?: any[];
//   assignedExpert?: {
//     _id: string;
//     name: string;
//   };
//   matchedExperts?: Array<{
//     _id: string;
//     name: string;
//   }>;
// }

// export function ExpertDashboard() {
//   const router = useRouter();
//   const { user } = useAuth();
//   const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
//   const [myQuestions, setMyQuestions] = useState<Question[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isOnline, setIsOnline] = useState(false);

//   const {
//     isConnected,
//     isAuthenticated,
//     acceptQuestion,
//     rejectQuestion,
//     updateAvailability,
//   } = useRealTime({
//     userId: user?.id,
    
//     onNewQuestion: (question) => {
//       console.log('📢 New question received in dashboard:', question);
      
//       setAvailableQuestions(prev => {
//         if (prev.some(q => q._id === question._id)) {
//           return prev;
//         }
        
//         toast.success(
//           `🔔 New ${question.urgency === 'high' ? 'URGENT ' : ''}question: ${question.title}`,
//           {
//             duration: 5000,
//             icon: question.urgency === 'high' ? '🚨' : '📢',
//             style: {
//               background: question.urgency === 'high' ? '#dc2626' : '#333',
//               color: '#fff',
//             },
//           }
//         );
        
//         if (question.urgency === 'high' && 'Notification' in window && Notification.permission === 'granted') {
//           new Notification('🚨 Urgent Question', {
//             body: `${question.userId.name} needs help: ${question.title}`,
//             icon: '/notification-icon.png',
//           });
//         }
        
//         return [question, ...prev];
//       });
//     },
    
//     onQuestionAccepted: (data) => {
//       toast.success(`✅ You accepted a question! Chat started.`);
//       router.push(`/ask/${data.questionId}`);
//       loadQuestions();
//     },
    
//     onStatusUpdate: (data) => {
//       if (data.status === 'resolved' || data.status === 'cancelled') {
//         loadQuestions();
//       }
//     },
    
//     onExpertAssigned: (data) => {
//       setAvailableQuestions(prev => prev.filter(q => q._id !== data.questionId));
//       toast.info(`Question was taken by another expert`);
//     },
//   });

//   // ✅ Load questions on mount and when user changes
//   useEffect(() => {
//     if (user) {
//       console.log('👤 ExpertDashboard mounted for user:', user.id);
//       console.log('👤 User role:', user.role);
//       loadQuestions();
//       loadExpertStatus();
      
//       if ('Notification' in window && Notification.permission === 'default') {
//         Notification.requestPermission();
//       }
//     }
//   }, [user]);

//   // ✅ Reload when socket authenticates
//   useEffect(() => {
//     if (isAuthenticated && user) {
//       console.log('🔄 Socket authenticated, reloading questions...');
//       loadQuestions();
//     }
//   }, [isAuthenticated, user]);

//   const loadQuestions = async () => {
//     setIsLoading(true);
//     try {
//       console.log('📥 Loading questions for expert:', user?.id);
      
//       // ✅ Load ALL questions with no filter to get everything
//       const allQuestions = await api.getQuestions('all');
//       console.log(`📊 Loaded ${allQuestions.length} total questions`);
      
//       // Log each question for debugging
//       allQuestions.forEach((q: Question) => {
//         console.log(`  - ${q.title} (${q.status}) - ${q.userId.name}`);
//       });
      
//       // ✅ Questions this expert can accept (all open questions)
//       const openQuestions = allQuestions.filter((q: Question) => {
//         // Only show open questions
//         if (q.status !== 'open') return false;
        
//         // Check if expert is matched with this question
//         const isMatched = q.matchedExperts?.some(
//           (expert: any) => expert._id === user?.id || expert === user?.id
//         );
        
//         // Show all open questions
//         return true;
//       });
      
//       // Sort: matched questions first, then by urgency
//       const sortedOpenQuestions = openQuestions.sort((a: Question, b: Question) => {
//         // Priority 1: Matched questions
//         const aMatched = a.matchedExperts?.some(
//           (expert: any) => expert._id === user?.id || expert === user?.id
//         );
//         const bMatched = b.matchedExperts?.some(
//           (expert: any) => expert._id === user?.id || expert === user?.id
//         );
//         if (aMatched && !bMatched) return -1;
//         if (!aMatched && bMatched) return 1;
        
//         // Priority 2: Urgency (high first)
//         const urgencyOrder = { high: 0, medium: 1, low: 2 };
//         return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
//       });
      
//       console.log(`📊 Found ${sortedOpenQuestions.length} open questions available`);
//       setAvailableQuestions(sortedOpenQuestions);

//       // ✅ Questions this expert is handling (assigned to them)
//       const assignedQuestions = allQuestions.filter(
//         (q: Question) => {
//           const isAssigned = q.assignedExpert?._id === user?.id || q.assignedExpert === user?.id;
//           const isActive = q.status !== 'resolved' && q.status !== 'cancelled';
//           return isAssigned && isActive;
//         }
//       );
//       console.log(`📊 Found ${assignedQuestions.length} assigned questions`);
//       setMyQuestions(assignedQuestions);

//     } catch (error) {
//       console.error('❌ Failed to load questions:', error);
//       toast.error('Failed to load questions');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const loadExpertStatus = async () => {
//     try {
//       const profile = await api.getExpertProfile();
//       if (profile) {
//         setIsOnline(profile.availability?.status === 'available');
//         console.log('📊 Expert status:', profile.availability?.status);
//       }
//     } catch (error) {
//       console.error('Failed to load expert status:', error);
//     }
//   };

//   const handleAcceptQuestion = async (questionId: string) => {
//     try {
//       console.log('🎯 Attempting to accept question:', questionId);
      
//       const questionToAccept = availableQuestions.find(q => q._id === questionId);
//       if (!questionToAccept) {
//         toast.error('Question no longer available');
//         return;
//       }

//       // Optimistically update UI
//       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
      
//       if (questionToAccept) {
//         setMyQuestions(prev => [questionToAccept, ...prev]);
//       }
      
//       // Send accept through socket
//       acceptQuestion({ questionId });
      
//       // Call API for persistence
//       await api.acceptQuestion(questionId);
      
//       toast.success('🎯 Question accepted! Redirecting to chat...');
      
//       setTimeout(() => {
//         router.push(`/ask/${questionId}`);
//       }, 500);
      
//     } catch (error: any) {
//       console.error('❌ Failed to accept question:', error);
//       const errorMessage = error.response?.data?.error || 'Failed to accept question';
//       toast.error(errorMessage);
//       loadQuestions(); // Revert
//     }
//   };

//   const handleRejectQuestion = async (questionId: string) => {
//     try {
//       rejectQuestion({ questionId });
//       setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
//       toast('Question rejected');
//     } catch (error) {
//       toast.error('Failed to reject question');
//     }
//   };

//   const toggleOnlineStatus = async () => {
//     try {
//       const newStatus = isOnline ? 'offline' : 'available';
//       updateAvailability({ status: newStatus });
//       setIsOnline(!isOnline);
//       toast.success(`You are now ${newStatus === 'available' ? '🟢 online' : '🔴 offline'}`);
      
//       if (newStatus === 'available') {
//         loadQuestions();
//       }
//     } catch (error) {
//       toast.error('Failed to update status');
//     }
//   };

//   if (!user || (user.role !== 'expert' && user.role !== 'both')) {
//     return (
//       <div className="text-center py-8">
//         <div className="text-6xl mb-4">🔒</div>
//         <p className="text-gray-600 mb-4">You need to be an expert to access this dashboard.</p>
//         <button 
//           className="btn-primary" 
//           onClick={() => router.push('/profile')}
//         >
//           Become an Expert
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Status Bar */}
//       <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
//         <div className="flex items-center space-x-6">
//           <div className="flex items-center">
//             <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
//             <span className="text-sm text-gray-600">
//               {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
//             </span>
//           </div>
//           <div className="flex items-center">
//             <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
//             <span className="text-sm text-gray-600">
//               {isOnline ? '🟢 Available' : '🔴 Offline'}
//             </span>
//           </div>
//           {isOnline && availableQuestions.length > 0 && (
//             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
//               {availableQuestions.length} pending
//             </span>
//           )}
//         </div>
//         <button
//           onClick={toggleOnlineStatus}
//           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//             isOnline
//               ? 'bg-red-100 text-red-700 hover:bg-red-200'
//               : 'bg-green-100 text-green-700 hover:bg-green-200'
//           }`}
//         >
//           {isOnline ? '🔴 Go Offline' : '🟢 Go Online'}
//         </button>
//       </div>

//       {/* Available Questions - Shows ALL open questions */}
//       {availableQuestions.length > 0 && (
//         <div>
//           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
//             <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 mr-2">
//               {availableQuestions.length}
//             </span>
//             Available Questions
//             {isConnected && (
//               <span className="ml-2 text-xs text-green-600 flex items-center">
//                 <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
//                 Live
//               </span>
//             )}
//           </h3>
//           <div className="space-y-3">
//             {availableQuestions.map((question, index) => {
//               // Check if this question is matched with the expert
//               const isMatched = question.matchedExperts?.some(
//                 (expert: any) => expert._id === user?.id || expert === user?.id
//               );
              
//               return (
//                 <div 
//                   key={question._id} 
//                   className={`animate-slideIn ${isMatched ? 'border-l-4 border-blue-500 pl-2' : ''}`}
//                   style={{ animationDelay: `${index * 100}ms` }}
//                 >
//                   <QuestionCard
//                     question={question}
//                     showAccept={true}
//                     onAccept={handleAcceptQuestion}
//                     onReject={handleRejectQuestion}
//                   />
//                   {isMatched && (
//                     <div className="mt-1 text-xs text-blue-600 font-medium flex items-center">
//                       ⭐ Matched with your expertise
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* My Active Questions */}
//       {myQuestions.length > 0 && (
//         <div>
//           <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
//             <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 mr-2">
//               {myQuestions.length}
//             </span>
//             My Active Questions
//           </h3>
//           <div className="space-y-3">
//             {myQuestions.map((question) => (
//               <QuestionCard
//                 key={question._id}
//                 question={question}
//                 showAccept={false}
//               />
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Empty State */}
//       {!isLoading && availableQuestions.length === 0 && myQuestions.length === 0 && (
//         <div className="bg-white rounded-xl shadow-sm p-8 text-center">
//           <div className="text-6xl mb-4">🕊️</div>
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">
//             No questions right now
//           </h3>
//           <p className="text-gray-600 mb-4">
//             {isOnline 
//               ? "You're online and ready to help. Questions will appear here instantly."
//               : "Go online to start receiving questions in real-time."}
//           </p>
//           {!isOnline && (
//             <button
//               onClick={toggleOnlineStatus}
//               className="btn-primary"
//             >
//               🟢 Go Online
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// components/ExpertDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRealTime } from '@/hooks/useRealTime';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { QuestionCard } from './chat/QuestionCard';

interface Question {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  urgency: 'low' | 'medium' | 'high';
  status: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  expertNotifications?: any[];
  assignedExpert?: {
    _id: string;
    name: string;
  };
  matchedExperts?: Array<{
    _id: string;
    name: string;
  }>;
}

export function ExpertDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const {
    isConnected,
    isAuthenticated,
    acceptQuestion,
    rejectQuestion,
    updateAvailability,
  } = useRealTime({
    userId: user?.id,
    
    onNewQuestion: (question) => {
      console.log('📢 New question received in dashboard:', question);
      
      setAvailableQuestions(prev => {
        if (prev.some(q => q._id === question._id)) {
          return prev;
        }
        
        toast.success(
          `🔔 New ${question.urgency === 'high' ? 'URGENT ' : ''}question: ${question.title}`,
          {
            duration: 5000,
            icon: question.urgency === 'high' ? '🚨' : '📢',
            style: {
              background: question.urgency === 'high' ? '#dc2626' : '#333',
              color: '#fff',
            },
          }
        );
        
        if (question.urgency === 'high' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 Urgent Question', {
            body: `${question.userId.name} needs help: ${question.title}`,
            icon: '/notification-icon.png',
          });
        }
        
        return [question, ...prev];
      });
    },
    
    onQuestionAccepted: (data) => {
      toast.success(`✅ You accepted a question! Chat started.`);
      router.push(`/ask/${data.questionId}`);
      loadQuestions();
    },
    
    onStatusUpdate: (data) => {
      if (data.status === 'resolved' || data.status === 'cancelled') {
        loadQuestions();
      }
    },
    
    onExpertAssigned: (data) => {
      setAvailableQuestions(prev => prev.filter(q => q._id !== data.questionId));
      toast.info(`Question was taken by another expert`);
    },
  });

  useEffect(() => {
    if (user) {
      console.log('👤 ExpertDashboard mounted for user:', user.id);
      console.log('👤 User role:', user.role);
      loadQuestions();
      loadExpertStatus();
      
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Socket authenticated, reloading questions...');
      loadQuestions();
    }
  }, [isAuthenticated, user]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      console.log('📥 Loading questions for expert:', user?.id);
      
      // ✅ IMPORTANT: Pass 'expert' as role to get all open questions
      const allQuestions = await api.getQuestions('all', 'expert');
      console.log(`📊 Loaded ${allQuestions.length} total questions`);
      
      // Log each question for debugging
      if (allQuestions.length > 0) {
        allQuestions.forEach((q: Question, index: number) => {
          console.log(`  ${index + 1}. ${q.title} (${q.status}) - ${q.userId.name}`);
        });
      } else {
        console.log('⚠️ No questions found in the database');
        console.log('💡 Make sure there are questions in the database');
      }
      
      // ✅ Questions this expert can accept (all open questions)
      const openQuestions = allQuestions.filter((q: Question) => {
        // Only show open questions
        return q.status === 'open';
      });
      
      // Sort: matched questions first, then by urgency
      const sortedOpenQuestions = openQuestions.sort((a: Question, b: Question) => {
        // Priority 1: Matched questions
        const aMatched = a.matchedExperts?.some(
          (expert: any) => expert._id === user?.id || expert === user?.id
        );
        const bMatched = b.matchedExperts?.some(
          (expert: any) => expert._id === user?.id || expert === user?.id
        );
        if (aMatched && !bMatched) return -1;
        if (!aMatched && bMatched) return 1;
        
        // Priority 2: Urgency (high first)
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 1) - 
               (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 1);
      });
      
      console.log(`📊 Found ${sortedOpenQuestions.length} open questions available`);
      setAvailableQuestions(sortedOpenQuestions);

      // ✅ Questions this expert is handling (assigned to them)
      const assignedQuestions = allQuestions.filter((q: Question) => {
        const isAssigned = q.assignedExpert?._id === user?.id || q.assignedExpert === user?.id;
        const isActive = q.status !== 'resolved' && q.status !== 'cancelled';
        return isAssigned && isActive;
      });
      console.log(`📊 Found ${assignedQuestions.length} assigned questions`);
      setMyQuestions(assignedQuestions);

    } catch (error) {
      console.error('❌ Failed to load questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpertStatus = async () => {
    try {
      const profile = await api.getExpertProfile();
      if (profile) {
        setIsOnline(profile.availability?.status === 'available');
        console.log('📊 Expert status:', profile.availability?.status);
      }
    } catch (error) {
      console.error('Failed to load expert status:', error);
    }
  };

  const handleAcceptQuestion = async (questionId: string) => {
    try {
      console.log('🎯 Attempting to accept question:', questionId);
      
      const questionToAccept = availableQuestions.find(q => q._id === questionId);
      if (!questionToAccept) {
        toast.error('Question no longer available');
        return;
      }

      setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
      
      if (questionToAccept) {
        setMyQuestions(prev => [questionToAccept, ...prev]);
      }
      
      acceptQuestion({ questionId });
      await api.acceptQuestion(questionId);
      
      toast.success('🎯 Question accepted! Redirecting to chat...');
      
      setTimeout(() => {
        router.push(`/ask/${questionId}`);
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Failed to accept question:', error);
      const errorMessage = error.response?.data?.error || 'Failed to accept question';
      toast.error(errorMessage);
      loadQuestions();
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    try {
      rejectQuestion({ questionId });
      setAvailableQuestions(prev => prev.filter(q => q._id !== questionId));
      toast('Question rejected');
    } catch (error) {
      toast.error('Failed to reject question');
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = isOnline ? 'offline' : 'available';
      updateAvailability({ status: newStatus });
      setIsOnline(!isOnline);
      toast.success(`You are now ${newStatus === 'available' ? '🟢 online' : '🔴 offline'}`);
      
      if (newStatus === 'available') {
        loadQuestions();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (!user || (user.role !== 'expert' && user.role !== 'both')) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-gray-600 mb-4">You need to be an expert to access this dashboard.</p>
        <button 
          className="btn-primary" 
          onClick={() => router.push('/profile')}
        >
          Become an Expert
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isOnline ? '🟢 Available' : '🔴 Offline'}
            </span>
          </div>
          {isOnline && availableQuestions.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
              {availableQuestions.length} pending
            </span>
          )}
        </div>
        <button
          onClick={toggleOnlineStatus}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isOnline
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isOnline ? '🔴 Go Offline' : '🟢 Go Online'}
        </button>
      </div>

      {/* Available Questions */}
      {availableQuestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 mr-2">
              {availableQuestions.length}
            </span>
            Available Questions
            {isConnected && (
              <span className="ml-2 text-xs text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Live
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {availableQuestions.map((question, index) => {
              const isMatched = question.matchedExperts?.some(
                (expert: any) => expert._id === user?.id || expert === user?.id
              );
              
              return (
                <div 
                  key={question._id} 
                  className={`animate-slideIn ${isMatched ? 'border-l-4 border-blue-500 pl-2' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <QuestionCard
                    question={question}
                    showAccept={true}
                    onAccept={handleAcceptQuestion}
                    onReject={handleRejectQuestion}
                  />
                  {isMatched && (
                    <div className="mt-1 text-xs text-blue-600 font-medium flex items-center">
                      ⭐ Matched with your expertise
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Active Questions */}
      {myQuestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 mr-2">
              {myQuestions.length}
            </span>
            My Active Questions
          </h3>
          <div className="space-y-3">
            {myQuestions.map((question) => (
              <QuestionCard
                key={question._id}
                question={question}
                showAccept={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && availableQuestions.length === 0 && myQuestions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🕊️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No questions right now
          </h3>
          <p className="text-gray-600 mb-4">
            {isOnline 
              ? "You're online and ready to help. Questions will appear here instantly."
              : "Go online to start receiving questions in real-time."}
          </p>
          {!isOnline && (
            <button
              onClick={toggleOnlineStatus}
              className="btn-primary"
            >
              🟢 Go Online
            </button>
          )}
        </div>
      )}
    </div>
  );
}