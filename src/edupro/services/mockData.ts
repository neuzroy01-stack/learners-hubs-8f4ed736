import {
  User,
  StudentProfile,
  TeacherProfile,
  Course,
  Batch,
  Enrollment,
  FeeAdjustment,
  PaymentRecord,
  StaffSalaryRecord,
  LiveClass,
  RecordedClass,
  AttendanceRecord,
  Assignment,
  Quiz,
  QuizAttempt,
  StudyMaterial,
  Certificate,
  Announcement,
  NotificationItem,
  ActivityLog,
  InstituteSettings,
  HomeBanner,
  SupportTicket
} from '../types/lms';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-superadmin',
    name: 'Eleanor Vance (Super Admin)',
    email: 'superadmin@edupro.com',
    phone: '+91 98765 00001',
    role: 'super_admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    lastLogin: '2026-07-23T07:30:00Z'
  },
  {
    id: 'usr-admin',
    name: 'Marcus Sterling (Academic Admin)',
    email: 'admin@edupro.com',
    phone: '+91 98765 00002',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-01-05T00:00:00Z',
    lastLogin: '2026-07-23T07:45:00Z'
  },
  {
    id: 'usr-teacher-1',
    name: 'Dr. Rajesh Sharma',
    email: 'teacher.sharma@edupro.com',
    phone: '+91 98765 00003',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-01-10T00:00:00Z'
  },
  {
    id: 'usr-teacher-2',
    name: 'Prof. Ananya Roy',
    email: 'teacher.roy@edupro.com',
    phone: '+91 98765 00004',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'usr-student-1',
    name: 'Rahul Verma',
    email: 'student.rahul@edupro.com',
    phone: '+91 98765 11111',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    policyAccepted: false // Demonstrates First Login policy modal requirement!
  },
  {
    id: 'usr-student-2',
    name: 'Priya Sundaram',
    email: 'student.priya@edupro.com',
    phone: '+91 98765 22222',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-02-05T00:00:00Z',
    policyAccepted: true,
    policyAcceptedAt: '2026-02-05T10:00:00Z',
    policyAcceptedVersion: 'v2.1-2026'
  },
  {
    id: 'usr-student-3',
    name: 'Aman Deep Singh',
    email: 'student.aman@edupro.com',
    phone: '+91 98765 33333',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-02-10T00:00:00Z',
    policyAccepted: true
  },
  {
    id: 'usr-student-4',
    name: 'Sneha Kulkarni',
    email: 'student.sneha@edupro.com',
    phone: '+91 98765 44444',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-02-12T00:00:00Z',
    policyAccepted: true
  },
  {
    id: 'usr-student-5',
    name: 'Vikram Mehta',
    email: 'student.vikram@edupro.com',
    phone: '+91 98765 55555',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    createdAt: '2026-02-15T00:00:00Z',
    policyAccepted: true
  }
];

export const INITIAL_STUDENTS: StudentProfile[] = [
  {
    id: 'stu-1',
    userId: 'usr-student-1',
    studentCode: 'STU-2026-001',
    fullName: 'Rahul Verma',
    fatherName: 'Suresh Verma',
    motherName: 'Sunita Verma',
    phone: '+91 98765 11111',
    whatsappPhone: '+91 98765 11111',
    email: 'student.rahul@edupro.com',
    dob: '2002-05-14',
    gender: 'Male',
    address: '42 Lotus Colony, MG Road, Bengaluru, Karnataka',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    admissionDate: '2026-02-01',
    batchId: 'batch-fswd-1',
    batchName: 'Full Stack MERN Alpha',
    counselorName: 'Kavita Menon',
    status: 'active',
    remarks: 'Consistent student, keen interest in React and Backend.'
  },
  {
    id: 'stu-2',
    userId: 'usr-student-2',
    studentCode: 'STU-2026-002',
    fullName: 'Priya Sundaram',
    fatherName: 'R. Sundaram',
    motherName: 'Meenakshi Sundaram',
    phone: '+91 98765 22222',
    whatsappPhone: '+91 98765 22222',
    email: 'student.priya@edupro.com',
    dob: '2001-09-20',
    gender: 'Female',
    address: '108 Anna Nagar 2nd Street, Chennai, Tamil Nadu',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    admissionDate: '2026-02-05',
    batchId: 'batch-fswd-1',
    batchName: 'Full Stack MERN Alpha',
    counselorName: 'Kavita Menon',
    status: 'active',
    remarks: 'Top performer in weekly quizzes.'
  },
  {
    id: 'stu-3',
    userId: 'usr-student-3',
    studentCode: 'STU-2026-003',
    fullName: 'Aman Deep Singh',
    fatherName: 'Gurpreet Singh',
    motherName: 'Harpreet Kaur',
    phone: '+91 98765 33333',
    whatsappPhone: '+91 98765 33333',
    email: 'student.aman@edupro.com',
    dob: '2003-01-11',
    gender: 'Male',
    address: '77 Model Town, Ludhiana, Punjab',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    admissionDate: '2026-02-10',
    batchId: 'batch-dsai-1',
    batchName: 'Data Science & AI Batch 1',
    counselorName: 'Rohan Joshi',
    status: 'active',
    remarks: 'Working professional upgrading Python & Machine Learning skills.'
  },
  {
    id: 'stu-4',
    userId: 'usr-student-4',
    studentCode: 'STU-2026-004',
    fullName: 'Sneha Kulkarni',
    fatherName: 'Anant Kulkarni',
    motherName: 'Vaishali Kulkarni',
    phone: '+91 98765 44444',
    whatsappPhone: '+91 98765 44444',
    email: 'student.sneha@edupro.com',
    dob: '2002-11-30',
    gender: 'Female',
    address: '210 Kothrud, Pune, Maharashtra',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    admissionDate: '2026-02-12',
    batchId: 'batch-fswd-1',
    batchName: 'Full Stack MERN Alpha',
    counselorName: 'Kavita Menon',
    status: 'active'
  },
  {
    id: 'stu-5',
    userId: 'usr-student-5',
    studentCode: 'STU-2026-005',
    fullName: 'Vikram Mehta',
    fatherName: 'Dinesh Mehta',
    motherName: 'Saroj Mehta',
    phone: '+91 98765 55555',
    whatsappPhone: '+91 98765 55555',
    email: 'student.vikram@edupro.com',
    dob: '2001-03-08',
    gender: 'Male',
    address: '55 Civil Lines, Jaipur, Rajasthan',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    admissionDate: '2026-02-15',
    batchId: 'batch-dsai-1',
    batchName: 'Data Science & AI Batch 1',
    counselorName: 'Rohan Joshi',
    status: 'active'
  }
];

export const INITIAL_TEACHERS: TeacherProfile[] = [
  {
    id: 'tch-1',
    userId: 'usr-teacher-1',
    employeeCode: 'EMP-T-001',
    fullName: 'Dr. Rajesh Sharma',
    email: 'teacher.sharma@edupro.com',
    phone: '+91 98765 00003',
    subjectSpecialization: 'Full Stack Web Development, Node.js & React',
    designation: 'Senior Lead Instructor',
    joiningDate: '2024-06-01',
    monthlySalary: 85000,
    status: 'active',
    assignedBatchIds: ['batch-fswd-1'],
    assignedCourseIds: ['course-fswd-101']
  },
  {
    id: 'tch-2',
    userId: 'usr-teacher-2',
    employeeCode: 'EMP-T-002',
    fullName: 'Prof. Ananya Roy',
    email: 'teacher.roy@edupro.com',
    phone: '+91 98765 00004',
    subjectSpecialization: 'Python, Data Analytics, Machine Learning & AI',
    designation: 'Head of Data Science Faculty',
    joiningDate: '2024-08-15',
    monthlySalary: 92000,
    status: 'active',
    assignedBatchIds: ['batch-dsai-1'],
    assignedCourseIds: ['course-dsai-102']
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-yt-master-101',
    code: 'YT-ALL-CREATOR-2026',
    title: 'YouTube All Creator Master Program',
    description: '3 Months Live Training + 2 Months Growth Support. 121+ Live Sessions, 14 Modules covering Foundation, Apps, Video Production, Editing, AI Workflows, SEO, Branding, Studio Analytics, Copyright, Monetization, Shorts, Live Streaming, Data Growth, and Account Security.',
    category: 'Digital Content & Creator Economy',
    thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800',
    banner: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1200',
    instructorId: 'tch-1',
    instructorName: 'Dr. Rajesh Sharma',
    durationMonths: 5,
    feeAmount: 25000,
    startDate: '2026-02-01',
    endDate: '2026-07-01',
    status: 'published',
    certificateEligiblePercentage: 80,
    weeks: [
      {
        id: 'wk-yt-1',
        weekNumber: 1,
        title: 'Month 1: Foundation, Essential Apps & Video Production',
        description: 'Niche selection, channel creation, mobile/PC creation apps, lighting, audio & filming.',
        topics: [
          { id: 'tp-yt-1', title: 'Module 1: Niche Selection & Channel Creation Strategy', description: 'Finding high RPM niches, setting up branded Google account.', dayNumber: 1, isCompleted: true },
          { id: 'tp-yt-2', title: 'Module 2: Essential Apps & Editing Tools Setup', description: 'VN Editor, CapCut, Premiere Pro, Canva, OBS Studio setup.', dayNumber: 2, isCompleted: true },
          { id: 'tp-yt-3', title: 'Module 3: Camera, Audio & Studio Lighting Rigging', description: 'Framing, mic gain, 3-point lighting on budget.', dayNumber: 3, isCompleted: true }
        ]
      },
      {
        id: 'wk-yt-2',
        weekNumber: 2,
        title: 'Month 2: Editing, AI Workflows, SEO & Thumbnails',
        description: 'CapCut & Premiere masterclass, ChatGPT/Gemini scriptwriting, SEO keyword research & CTR thumbnails.',
        topics: [
          { id: 'tp-yt-4', title: 'Module 4: Professional Video Editing Masterclass', description: 'Jump cuts, B-rolls, sound effects, lower thirds & color grading.', dayNumber: 8, isCompleted: true },
          { id: 'tp-yt-5', title: 'Module 5: AI-Powered YouTube Workflow & Prompting', description: 'AI scripts, voiceovers, Midjourney/DALL-E assets.', dayNumber: 9, isCompleted: true },
          { id: 'tp-yt-6', title: 'Module 6: YouTube SEO, Tags & Algorithm Hacking', description: 'Search intent, VidIQ, TubeBuddy, CTR & AVD metrics.', dayNumber: 10, isCompleted: false },
          { id: 'tp-yt-7', title: 'Module 7: Channel Branding & Click-Worthy Thumbnail Design', description: 'Color psychology, 3D text pop, face expressions.', dayNumber: 11, isCompleted: false }
        ]
      },
      {
        id: 'wk-yt-3',
        weekNumber: 3,
        title: 'Month 3-5: Studio Analytics, Monetization, Shorts & Account Security',
        description: 'YPP compliance, Copyright strikes, Brand sponsors, Shorts funnels, Live Streaming & Account Protection.',
        topics: [
          { id: 'tp-yt-8', title: 'Module 8: YouTube Studio Deep Dive & Retention Graphs', description: 'Hook retention, audience demographics, traffic sources.', dayNumber: 15, isCompleted: false },
          { id: 'tp-yt-9', title: 'Module 9: Copyright, Fair Use, Content ID & Policy Guidelines', description: 'Avoiding strikes, re-used content policies, license audio.', dayNumber: 16, isCompleted: false },
          { id: 'tp-yt-10', title: 'Module 10: Monetization, AdSense, Sponsorships & Affiliate Streams', description: 'Unlocking YPP, media kits, pitch emails to brands.', dayNumber: 17, isCompleted: false },
          { id: 'tp-yt-11', title: 'Module 11: Shorts Algorithm & Viral Long-Form Strategy', description: '3-second hook loop, remixing long-form to viral shorts.', dayNumber: 18, isCompleted: false },
          { id: 'tp-yt-12', title: 'Module 12: Community Tab, Live Streaming & Audience Loyalty', description: 'OBS live stream setups, polls, membership perks.', dayNumber: 19, isCompleted: false },
          { id: 'tp-yt-13', title: 'Module 13: Growth Hacking, Competitor Benchmarking & A/B Testing', description: 'Thumbnail A/B test tools, trend hijacking.', dayNumber: 20, isCompleted: false },
          { id: 'tp-yt-14', title: 'Module 14: Channel Security, 2FA, Backups & Brand Recovery', description: 'Session hijacking defense, multi-user manager permissions.', dayNumber: 21, isCompleted: false }
        ]
      }
    ],
    modules: [
      {
        id: 'mod-yt-1',
        courseId: 'course-yt-master-101',
        title: 'Module 1: Foundation & Channel Setup',
        description: 'Understand YouTube ecosystem, high-RPM niche selection, and strategic brand setup.',
        order: 1,
        lessons: [
          {
            id: 'les-yt-1',
            moduleId: 'mod-yt-1',
            title: '1.1 YouTube Algorithm Foundations & Niche Selection Framework',
            description: 'Selecting profitable niches, audience persona mapping, and channel mission positioning.',
            durationMinutes: 45,
            videoUrl: 'https://www.youtube.com/watch?v=SccSCuHhOw0',
            videoType: 'youtube',
            attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            attachmentName: 'Niche_Selection_Matrix_2026.pdf',
            order: 1,
            isLocked: false
          },
          {
            id: 'les-yt-2',
            moduleId: 'mod-yt-1',
            title: '1.2 Advanced Google Brand Account Setup & Custom Handle Claiming',
            description: 'Step-by-step channel setup, default upload defaults, and handle verification.',
            durationMinutes: 40,
            videoUrl: 'https://www.youtube.com/watch?v=mr15Xzb1Ook',
            videoType: 'youtube',
            order: 2,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-2',
        courseId: 'course-yt-master-101',
        title: 'Module 2: Essential Apps & Tools Setup',
        description: 'Master mobile and desktop creator software for rapid production.',
        order: 2,
        lessons: [
          {
            id: 'les-yt-3',
            moduleId: 'mod-yt-2',
            title: '2.1 Mobile Creator Suite: VN Editor, CapCut Mobile & Canva',
            description: 'Setting up mobile editing environment, cloud syncing, and graphic templates.',
            durationMinutes: 50,
            videoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            videoType: 'youtube',
            attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            attachmentName: 'Essential_Creator_Apps_List.pdf',
            order: 1,
            isLocked: false
          },
          {
            id: 'les-yt-4',
            moduleId: 'mod-yt-2',
            title: '2.2 Desktop Power Tools: Premiere Pro, DaVinci Resolve & OBS Studio',
            description: 'Configuring timelines, GPU hardware acceleration, and screen recording profiles.',
            durationMinutes: 55,
            videoUrl: 'https://www.youtube.com/watch?v=7H_bA0A2a30',
            videoType: 'youtube',
            order: 2,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-3',
        courseId: 'course-yt-master-101',
        title: 'Module 3: Video Production & Content Creation',
        description: 'Camera gear setups, lighting arrangements, framing techniques, and crisp audio capture.',
        order: 3,
        lessons: [
          {
            id: 'les-yt-5',
            moduleId: 'mod-yt-3',
            title: '3.1 Lighting & Framing: 3-Point Studio Lighting on a Budget',
            description: 'Key lights, fill lights, hair lights, and color temperature balance.',
            durationMinutes: 60,
            videoUrl: 'https://www.youtube.com/watch?v=DZBGEExL05o',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          },
          {
            id: 'les-yt-6',
            moduleId: 'mod-yt-3',
            title: '3.2 Audio Mastery: Lavalier vs Shotgun Mics & Noise Reduction',
            description: 'Setting audio gain levels, room acoustics treatment, and background noise removal.',
            durationMinutes: 48,
            videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
            videoType: 'youtube',
            order: 2,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-4',
        courseId: 'course-yt-master-101',
        title: 'Module 4: Professional Video Editing',
        description: 'Engaging jump cuts, motion graphics, sound design, lower thirds, and color grading.',
        order: 4,
        lessons: [
          {
            id: 'les-yt-7',
            moduleId: 'mod-yt-4',
            title: '4.1 High-Retention Editing: Pacing, Jump Cuts & B-Roll Layering',
            description: 'Eliminating dead air, inserting stock footage, sound effects, and visual hooks.',
            durationMinutes: 65,
            videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
            videoType: 'youtube',
            attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            attachmentName: 'SFX_Boll_Resource_Pack.pdf',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-5',
        courseId: 'course-yt-master-101',
        title: 'Module 5: AI-Powered YouTube Workflow',
        description: 'Supercharge scriptwriting, AI voice synthesis, avatar generation, and auto-captions.',
        order: 5,
        lessons: [
          {
            id: 'les-yt-8',
            moduleId: 'mod-yt-5',
            title: '5.1 AI Scriptwriting & Prompt Engineering with ChatGPT & Gemini',
            description: 'Generating high-hook script outlines, storytelling arcs, and retention calls-to-action.',
            durationMinutes: 52,
            videoUrl: 'https://www.youtube.com/watch?v=SccSCuHhOw0',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-6',
        courseId: 'course-yt-master-101',
        title: 'Module 6: YouTube SEO & Algorithm Mastery',
        description: 'Keyword research, search intent optimization, VidIQ/TubeBuddy, and metadata.',
        order: 6,
        lessons: [
          {
            id: 'les-yt-9',
            moduleId: 'mod-yt-6',
            title: '6.1 Keyword Research & YouTube Search Intent Optimization',
            description: 'Finding high-volume, low-competition tags using VidIQ and TubeBuddy analytics.',
            durationMinutes: 50,
            videoUrl: 'https://www.youtube.com/watch?v=mr15Xzb1Ook',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-7',
        courseId: 'course-yt-master-101',
        title: 'Module 7: Channel Branding & Thumbnail Design',
        description: 'Designing high CTR thumbnails in Photoshop and Canva with color theory.',
        order: 7,
        lessons: [
          {
            id: 'les-yt-10',
            moduleId: 'mod-yt-7',
            title: '7.1 Click-Worthy Thumbnail Design Masterclass',
            description: 'Facial expressions, high-contrast typography, border glows, and composition rules.',
            durationMinutes: 58,
            videoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-8',
        courseId: 'course-yt-master-101',
        title: 'Module 8: YouTube Studio & Channel Analytics',
        description: 'Understanding Click-Through Rate (CTR), Average Percentage Viewed (APV), and Traffic Sources.',
        order: 8,
        lessons: [
          {
            id: 'les-yt-11',
            moduleId: 'mod-yt-8',
            title: '8.1 Deciphering YouTube Studio Analytics & Audience Retention',
            description: 'Analyzing audience dips, spikes, impression CTR vs views, and demographic insights.',
            durationMinutes: 55,
            videoUrl: 'https://www.youtube.com/watch?v=7H_bA0A2a30',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-9',
        courseId: 'course-yt-master-101',
        title: 'Module 9: Copyright, Content ID & Policy Guidelines',
        description: 'Avoiding copyright strikes, Fair Use doctrine, licensed music, and community rules.',
        order: 9,
        lessons: [
          {
            id: 'les-yt-12',
            moduleId: 'mod-yt-9',
            title: '9.1 Copyright Strikes, Content ID & Fair Use Guidelines',
            description: 'Protecting your channel against strikes, royalty-free audio libraries, and dispute appeals.',
            durationMinutes: 45,
            videoUrl: 'https://www.youtube.com/watch?v=DZBGEExL05o',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-10',
        courseId: 'course-yt-master-101',
        title: 'Module 10: YouTube Monetization & Revenue Streams',
        description: 'YPP eligibility, AdSense, Brand sponsorships, affiliate marketing, and merchandise.',
        order: 10,
        lessons: [
          {
            id: 'les-yt-13',
            moduleId: 'mod-yt-10',
            title: '10.1 Multiple Creator Revenue Streams & Brand Sponsorship Pitches',
            description: 'Calculating RPM/CPM, creating media kits, negotiating sponsorships, and affiliate links.',
            durationMinutes: 60,
            videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-11',
        courseId: 'course-yt-master-101',
        title: 'Module 11: Shorts & Long-Form Content Strategy',
        description: 'Viral Shorts hooks, looping techniques, and converting Shorts viewers to Long-Form subscribers.',
        order: 11,
        lessons: [
          {
            id: 'les-yt-14',
            moduleId: 'mod-yt-11',
            title: '11.1 Viral Shorts Strategy & Long-Form Funnel Integration',
            description: '3-second visual hooks, seamless audio loops, and Shorts remixing workflows.',
            durationMinutes: 50,
            videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-12',
        courseId: 'course-yt-master-101',
        title: 'Module 12: Community, Live Streaming & Engagement',
        description: 'OBS live stream setups, Community Tab polls, premiere events, and membership perks.',
        order: 12,
        lessons: [
          {
            id: 'les-yt-15',
            moduleId: 'mod-yt-12',
            title: '12.1 Interactive Live Streaming & Community Building',
            description: 'Setting up OBS live alerts, chat moderation, super chats, and community posts.',
            durationMinutes: 55,
            videoUrl: 'https://www.youtube.com/watch?v=SccSCuHhOw0',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-13',
        courseId: 'course-yt-master-101',
        title: 'Module 13: Data Analytics & Growth Hacking',
        description: 'A/B testing titles & thumbnails, trend hijacking, and viral content replication.',
        order: 13,
        lessons: [
          {
            id: 'les-yt-16',
            moduleId: 'mod-yt-13',
            title: '13.1 Growth Hacking, Competitor Benchmarking & Trend Hijacking',
            description: 'Identifying viral spikes in your niche and implementing thumbnail A/B testing.',
            durationMinutes: 52,
            videoUrl: 'https://www.youtube.com/watch?v=mr15Xzb1Ook',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-yt-14',
        courseId: 'course-yt-master-101',
        title: 'Module 14: Security, Backup & Account Protection',
        description: '2FA security, session hijacking defense, permissions management, and disaster recovery.',
        order: 14,
        lessons: [
          {
            id: 'les-yt-17',
            moduleId: 'mod-yt-14',
            title: '14.1 Channel Security, 2-Factor Auth & Account Recovery Preparedness',
            description: 'Securing primary Google accounts, managing manager roles, and automated backup routines.',
            durationMinutes: 45,
            videoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          }
        ]
      }
    ]
  },
  {
    id: 'course-fswd-101',
    code: 'CS-FSWD-2026',
    title: 'Full-Stack MERN Enterprise Engineering',
    description: 'Master MongoDB, Express.js, React 19, Node.js, TypeScript, REST APIs, GraphQL, Microservices, and Cloud Deployment.',
    category: 'Software Engineering',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    banner: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
    instructorId: 'tch-1',
    instructorName: 'Dr. Rajesh Sharma',
    durationMonths: 6,
    feeAmount: 35000,
    startDate: '2026-02-01',
    endDate: '2026-08-01',
    status: 'published',
    certificateEligiblePercentage: 85,
    weeks: [
      {
        id: 'wk-1',
        weekNumber: 1,
        title: 'Modern Web Architecture & HTML5/CSS3 Deep Dive',
        description: 'Semantic HTML, CSS Flexbox, Grid, Responsive Design & Tailwind CSS.',
        topics: [
          { id: 'tp-1', title: 'HTTP/HTTPS, Client-Server Protocol & DOM', description: 'Understanding web fundamentals.', dayNumber: 1, isCompleted: true },
          { id: 'tp-2', title: 'Advanced CSS Layouts with Tailwind CSS v4', description: 'Utility-first modern styling.', dayNumber: 2, isCompleted: true },
          { id: 'tp-3', title: 'Responsive Design & Mobile-First Principles', description: 'Breakpoints and viewport units.', dayNumber: 3, isCompleted: true }
        ]
      },
      {
        id: 'wk-2',
        weekNumber: 2,
        title: 'JavaScript ES6+ Core Concepts & Asynchronous Programming',
        description: 'Promises, Async/Await, Closures, Prototypes, Event Loop.',
        topics: [
          { id: 'tp-4', title: 'ES6 Syntax, Destructuring & Modules', description: 'Clean modern syntax.', dayNumber: 8, isCompleted: true },
          { id: 'tp-5', title: 'Event Loop, Callbacks & Promises', description: 'Non-blocking I/O concepts.', dayNumber: 9, isCompleted: true },
          { id: 'tp-6', title: 'Async/Await & Fetch API / Axios', description: 'Handling API data streams.', dayNumber: 10, isCompleted: false }
        ]
      },
      {
        id: 'wk-3',
        weekNumber: 3,
        title: 'React 19 Hooks, State Management & Tailwind Styling',
        description: 'JSX, useState, useEffect, Custom Hooks, Context API.',
        topics: [
          { id: 'tp-7', title: 'React Core Concept & JSX Architecture', description: 'Component lifecycle.', dayNumber: 15, isCompleted: false },
          { id: 'tp-8', title: 'State & Props Management', description: 'Interactive React components.', dayNumber: 16, isCompleted: false }
        ]
      }
    ],
    modules: [
      {
        id: 'mod-1',
        courseId: 'course-fswd-101',
        title: 'Module 1: Web Fundamentals & Frontend Foundations',
        description: 'Build responsive single page applications.',
        order: 1,
        lessons: [
          {
            id: 'les-1',
            moduleId: 'mod-1',
            title: '1.1 Modern Web Architecture & HTTP Protocols',
            description: 'In-depth overview of web servers, DNS, headers, status codes, and HTTPS.',
            durationMinutes: 45,
            videoUrl: 'https://www.youtube.com/watch?v=SccSCuHhOw0',
            videoType: 'youtube',
            attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            attachmentName: 'HTTP_Protocols_Guide.pdf',
            order: 1,
            isLocked: false
          },
          {
            id: 'les-2',
            moduleId: 'mod-1',
            title: '1.2 Advanced Tailwind CSS Design Systems',
            description: 'Creating theme tokens, responsive layouts, dark mode, and component utilities.',
            durationMinutes: 55,
            videoUrl: 'https://www.youtube.com/watch?v=mr15Xzb1Ook',
            videoType: 'youtube',
            attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            attachmentName: 'Tailwind_CheatSheet.pdf',
            order: 2,
            isLocked: false
          },
          {
            id: 'les-3',
            moduleId: 'mod-1',
            title: '1.3 React 19 State, Effects and Custom Hooks',
            description: 'Mastering hooks lifecycle, avoiding re-renders, and custom state patterns.',
            durationMinutes: 60,
            videoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            videoType: 'youtube',
            attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            attachmentName: 'React_Hooks_Guide.pdf',
            order: 3,
            isLocked: false
          }
        ]
      },
      {
        id: 'mod-2',
        courseId: 'course-fswd-101',
        title: 'Module 2: Backend Architecture with Express & MongoDB',
        description: 'RESTful API construction, middleware, Mongoose schemas, and JWT security.',
        order: 2,
        lessons: [
          {
            id: 'les-4',
            moduleId: 'mod-2',
            title: '2.1 Express Server Setup & REST Route Handler Patterns',
            description: 'Building robust Node.js servers with TypeScript and middleware.',
            durationMinutes: 50,
            videoUrl: 'https://www.youtube.com/watch?v=7H_bA0A2a30',
            videoType: 'youtube',
            order: 1,
            isLocked: false
          },
          {
            id: 'les-5',
            moduleId: 'mod-2',
            title: '2.2 Database Modeling with MongoDB & Mongoose',
            description: 'Schema validation, indexing, aggregations, and population.',
            durationMinutes: 65,
            videoUrl: 'https://www.youtube.com/watch?v=DZBGEExL05o',
            videoType: 'youtube',
            order: 2,
            isLocked: true
          }
        ]
      }
    ]
  },
  {
    id: 'course-dsai-102',
    code: 'CS-DSAI-2026',
    title: 'Data Science, Applied Machine Learning & Generative AI',
    description: 'Comprehensive curriculum covering Python Data Stack (NumPy, Pandas, Matplotlib, Seaborn), Scikit-Learn, TensorFlow, PyTorch, LLMs, and RAG pipelines.',
    category: 'Artificial Intelligence',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    instructorId: 'tch-2',
    instructorName: 'Prof. Ananya Roy',
    durationMonths: 6,
    feeAmount: 42000,
    startDate: '2026-02-10',
    endDate: '2026-08-10',
    status: 'published',
    certificateEligiblePercentage: 80,
    weeks: [
      {
        id: 'wk-ds-1',
        weekNumber: 1,
        title: 'Python Core Programming & Numerical Computing with NumPy',
        description: 'Data structures, vectorized matrix math, array manipulation.',
        topics: [
          { id: 'tp-ds-1', title: 'Python Syntax, OOP & Functional Tools', description: 'Base Python mastery.', dayNumber: 1, isCompleted: true },
          { id: 'tp-ds-2', title: 'NumPy N-Dimensional Arrays & Linear Algebra', description: 'Matrix operations.', dayNumber: 2, isCompleted: true }
        ]
      },
      {
        id: 'wk-ds-2',
        weekNumber: 2,
        title: 'Data Wrangling & Exploratory Data Analysis with Pandas',
        description: 'Cleaning, merging, grouping, pivot tables, handling missing values.',
        topics: [
          { id: 'tp-ds-3', title: 'Pandas DataFrames, Series & Indexing', description: 'Data structures.', dayNumber: 8, isCompleted: true },
          { id: 'tp-ds-4', title: 'Exploratory Data Analysis & Seaborn Plots', description: 'Visual insight generation.', dayNumber: 9, isCompleted: false }
        ]
      }
    ],
    modules: [
      {
        id: 'mod-ds-1',
        courseId: 'course-dsai-102',
        title: 'Module 1: Data Foundations & Analytics Stack',
        description: 'Master numerical and analytical processing.',
        order: 1,
        lessons: [
          {
            id: 'les-ds-1',
            moduleId: 'mod-ds-1',
            title: '1.1 Advanced Python & Data Structures for AI',
            description: 'Optimized Python code, generator functions, memory efficiency.',
            durationMinutes: 50,
            videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
            videoType: 'youtube',
            attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            attachmentName: 'Python_AI_Cheatsheet.pdf',
            order: 1,
            isLocked: false
          },
          {
            id: 'les-ds-2',
            moduleId: 'mod-ds-1',
            title: '1.2 Pandas Data Wrangling & Feature Engineering',
            description: 'Cleaning noisy datasets, missing value imputation, categorical encoding.',
            durationMinutes: 60,
            videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
            videoType: 'youtube',
            order: 2,
            isLocked: false
          }
        ]
      }
    ]
  }
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'batch-yt-1',
    name: 'YouTube All Creator Master Batch 1',
    courseId: 'course-yt-master-101',
    courseTitle: 'YouTube All Creator Master Program',
    teacherId: 'tch-1',
    teacherName: 'Dr. Rajesh Sharma',
    startDate: '2026-02-01',
    endDate: '2026-07-01',
    timing: 'Mon - Fri | 11:00 AM - 01:00 PM IST',
    status: 'ongoing',
    maxCapacity: 50,
    currentEnrolledCount: 5
  },
  {
    id: 'batch-fswd-1',
    name: 'Full Stack MERN Alpha',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    teacherId: 'tch-1',
    teacherName: 'Dr. Rajesh Sharma',
    startDate: '2026-02-01',
    endDate: '2026-08-01',
    timing: 'Mon - Fri | 10:00 AM - 12:00 PM IST',
    status: 'ongoing',
    maxCapacity: 30,
    currentEnrolledCount: 3
  },
  {
    id: 'batch-dsai-1',
    name: 'Data Science & AI Batch 1',
    courseId: 'course-dsai-102',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    teacherId: 'tch-2',
    teacherName: 'Prof. Ananya Roy',
    startDate: '2026-02-10',
    endDate: '2026-08-10',
    timing: 'Mon - Fri | 02:00 PM - 04:00 PM IST',
    status: 'ongoing',
    maxCapacity: 25,
    currentEnrolledCount: 2
  }
];

export const INITIAL_ENROLLMENTS: Enrollment[] = [
  {
    id: 'enr-1',
    studentId: 'stu-1',
    studentName: 'Rahul Verma',
    courseId: 'course-yt-master-101',
    courseTitle: 'YouTube All Creator Master Program',
    batchId: 'batch-yt-1',
    batchName: 'YouTube All Creator Master Batch 1',
    enrollmentDate: '2026-02-01',
    originalFee: 25000,
    discountAmount: 2000,
    finalFee: 23000,
    status: 'enrolled',
    progressPercentage: 55
  },
  {
    id: 'enr-2',
    studentId: 'stu-2',
    studentName: 'Priya Sundaram',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    batchName: 'Full Stack MERN Alpha',
    enrollmentDate: '2026-02-05',
    originalFee: 35000,
    discountAmount: 5000,
    finalFee: 30000,
    status: 'enrolled',
    progressPercentage: 88
  },
  {
    id: 'enr-3',
    studentId: 'stu-3',
    studentName: 'Aman Deep Singh',
    courseId: 'course-dsai-102',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    batchId: 'batch-dsai-1',
    batchName: 'Data Science & AI Batch 1',
    enrollmentDate: '2026-02-10',
    originalFee: 42000,
    discountAmount: 2000,
    finalFee: 40000,
    status: 'enrolled',
    progressPercentage: 45
  },
  {
    id: 'enr-4',
    studentId: 'stu-4',
    studentName: 'Sneha Kulkarni',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    batchName: 'Full Stack MERN Alpha',
    enrollmentDate: '2026-02-12',
    originalFee: 35000,
    discountAmount: 2000,
    finalFee: 33000,
    status: 'enrolled',
    progressPercentage: 30
  },
  {
    id: 'enr-5',
    studentId: 'stu-5',
    studentName: 'Vikram Mehta',
    courseId: 'course-dsai-102',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    batchId: 'batch-dsai-1',
    batchName: 'Data Science & AI Batch 1',
    enrollmentDate: '2026-02-15',
    originalFee: 42000,
    discountAmount: 4000,
    finalFee: 38000,
    status: 'enrolled',
    progressPercentage: 15
  }
];

export const INITIAL_FEE_ADJUSTMENTS: FeeAdjustment[] = [
  {
    id: 'adj-1',
    enrollmentId: 'enr-1',
    studentId: 'stu-1',
    type: 'discount',
    amount: -3000,
    reason: 'Early Bird Admission Scholarship',
    date: '2026-02-01',
    createdBy: 'Marcus Sterling (Admin)'
  },
  {
    id: 'adj-2',
    enrollmentId: 'enr-1',
    studentId: 'stu-1',
    type: 'extra_charge',
    amount: 1000,
    reason: 'Hardcopy Study Kit & Cloud Lab Voucher',
    date: '2026-03-01',
    createdBy: 'Marcus Sterling (Admin)'
  },
  {
    id: 'adj-3',
    enrollmentId: 'enr-2',
    studentId: 'stu-2',
    type: 'scholarship',
    amount: -5000,
    reason: 'Merit Academic Award',
    date: '2026-02-05',
    createdBy: 'Eleanor Vance (Super Admin)'
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    enrollmentId: 'enr-1',
    studentId: 'stu-1',
    studentName: 'Rahul Verma',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    receiptNumber: 'RCP-2026-1001',
    amount: 15000,
    paymentDate: '2026-02-01',
    paymentMode: 'UPI',
    transactionId: 'UPI/6120893301/PAY',
    status: 'approved',
    remarks: 'Installment 1 Received via Razorpay/PhonePe',
    recordedBy: 'Marcus Sterling (Admin)',
    verifiedAt: '2026-02-01T11:20:00Z'
  },
  {
    id: 'pay-2',
    enrollmentId: 'enr-1',
    studentId: 'stu-1',
    studentName: 'Rahul Verma',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    receiptNumber: 'RCP-2026-1045',
    amount: 10000,
    paymentDate: '2026-05-10',
    paymentMode: 'Net Banking',
    transactionId: 'HDFC9843201123',
    status: 'approved',
    remarks: 'Installment 2 Approved',
    recordedBy: 'Marcus Sterling (Admin)',
    verifiedAt: '2026-05-10T14:10:00Z'
  },
  {
    id: 'pay-3',
    enrollmentId: 'enr-2',
    studentId: 'stu-2',
    studentName: 'Priya Sundaram',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    receiptNumber: 'RCP-2026-1002',
    amount: 30000,
    paymentDate: '2026-02-05',
    paymentMode: 'Credit Card',
    transactionId: 'TXN-ICICI-883921',
    status: 'approved',
    remarks: 'Full One-Time Payment Settled',
    recordedBy: 'Marcus Sterling (Admin)',
    verifiedAt: '2026-02-05T12:00:00Z'
  },
  {
    id: 'pay-4',
    enrollmentId: 'enr-3',
    studentId: 'stu-3',
    studentName: 'Aman Deep Singh',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    receiptNumber: 'RCP-2026-1010',
    amount: 20000,
    paymentDate: '2026-02-10',
    paymentMode: 'UPI',
    transactionId: 'UPI/9982301111/PAY',
    status: 'approved',
    remarks: 'Installment 1 Paid',
    recordedBy: 'Marcus Sterling (Admin)',
    verifiedAt: '2026-02-10T15:30:00Z'
  },
  {
    id: 'pay-5',
    enrollmentId: 'enr-1',
    studentId: 'stu-1',
    studentName: 'Rahul Verma',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    receiptNumber: 'RCP-2026-1099',
    amount: 8000,
    paymentDate: '2026-07-22',
    paymentMode: 'UPI',
    transactionId: 'UPI/7723910001/VERIFY',
    screenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    status: 'pending_verification',
    remarks: 'Student uploaded receipt for final installment clearance',
    recordedBy: 'Rahul Verma (Student)'
  }
];

export const INITIAL_STAFF_SALARIES: StaffSalaryRecord[] = [
  {
    id: 'sal-1',
    teacherId: 'tch-1',
    teacherName: 'Dr. Rajesh Sharma',
    monthYear: 'June 2026',
    baseSalary: 85000,
    bonus: 5000,
    deductions: 0,
    netSalary: 90000,
    paidAmount: 90000,
    pendingSalary: 0,
    paymentDate: '2026-07-01',
    paymentMode: 'Bank Transfer (NEFT)',
    transactionId: 'N1829301982',
    status: 'paid',
    remarks: 'Salary + Excellence in Mentorship Bonus'
  },
  {
    id: 'sal-2',
    teacherId: 'tch-1',
    teacherName: 'Dr. Rajesh Sharma',
    monthYear: 'July 2026',
    baseSalary: 85000,
    bonus: 0,
    deductions: 0,
    netSalary: 85000,
    paidAmount: 50000,
    pendingSalary: 35000,
    paymentDate: '2026-07-15',
    paymentMode: 'Bank Transfer (NEFT)',
    transactionId: 'N1920391823',
    status: 'partial',
    remarks: 'Mid-month partial salary release'
  },
  {
    id: 'sal-3',
    teacherId: 'tch-2',
    teacherName: 'Prof. Ananya Roy',
    monthYear: 'June 2026',
    baseSalary: 92000,
    bonus: 3000,
    deductions: 0,
    netSalary: 95000,
    paidAmount: 95000,
    pendingSalary: 0,
    paymentDate: '2026-07-01',
    paymentMode: 'Bank Transfer (NEFT)',
    transactionId: 'N1829301985',
    status: 'paid',
    remarks: 'June Salary Cleared'
  },
  {
    id: 'sal-4',
    teacherId: 'tch-2',
    teacherName: 'Prof. Ananya Roy',
    monthYear: 'July 2026',
    baseSalary: 92000,
    bonus: 0,
    deductions: 0,
    netSalary: 92000,
    paidAmount: 0,
    pendingSalary: 92000,
    status: 'pending',
    remarks: 'July Salary pending cycle end'
  }
];

export const INITIAL_LIVE_CLASSES: LiveClass[] = [
  {
    id: 'live-1',
    title: 'Live Workshop: Building Production GraphQL Services & Redis Cache',
    topic: 'GraphQL Queries, Mutations & Subscriptions in Node.js',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    batchName: 'Full Stack MERN Alpha',
    teacherId: 'tch-1',
    teacherName: 'Dr. Rajesh Sharma',
    date: '2026-07-23',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    status: 'live',
    notes: 'Please keep your Node.js v20 runtime and Docker Desktop installed before joining.'
  },
  {
    id: 'live-2',
    title: 'Deep Learning: Building Convolutional Neural Networks with PyTorch',
    topic: 'CNN Layers, Filters, Max Pooling & Image Classification',
    courseId: 'course-dsai-102',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    batchId: 'batch-dsai-1',
    batchName: 'Data Science & AI Batch 1',
    teacherId: 'tch-2',
    teacherName: 'Prof. Ananya Roy',
    date: '2026-07-23',
    startTime: '02:00 PM',
    endTime: '04:00 PM',
    meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
    status: 'upcoming',
    notes: 'Download the CIFAR-10 Jupyter notebook dataset from study materials.'
  },
  {
    id: 'live-3',
    title: 'System Design: Designing High Throughput Distributed Chat Services',
    topic: 'WebSockets, Pub/Sub Messaging, Database Sharding',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    batchName: 'Full Stack MERN Alpha',
    teacherId: 'tch-1',
    teacherName: 'Dr. Rajesh Sharma',
    date: '2026-07-24',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    status: 'upcoming'
  }
];

export const INITIAL_RECORDED_CLASSES: RecordedClass[] = [
  {
    id: 'rec-1',
    title: 'React 19 Server Components & Concurrent Rendering',
    topic: 'Server Actions, Suspense Boundaries, and Streaming SSR',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    recordingDate: '2026-07-20',
    durationMinutes: 115,
    weekNumber: 1,
    videoUrl: 'https://www.youtube.com/embed/SccSCuHhOw0',
    notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notesPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600',
    isLocked: false
  },
  {
    id: 'rec-1b',
    title: 'TypeScript Generics, Utility Types & Type Guards',
    topic: 'Advanced type narrowing, infer keyword, and mapped types',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    recordingDate: '2026-07-21',
    durationMinutes: 90,
    weekNumber: 1,
    videoUrl: 'https://www.youtube.com/embed/7H_bA0A2a30',
    notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notesPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
    isLocked: false
  },
  {
    id: 'rec-2',
    title: 'Exploratory Data Analysis with Pandas & Seaborn',
    topic: 'Data cleaning, feature scaling, and statistical distributions',
    courseId: 'course-dsai-102',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    batchId: 'batch-dsai-1',
    recordingDate: '2026-07-18',
    durationMinutes: 98,
    weekNumber: 2,
    videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg',
    notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notesPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
    isLocked: false
  },
  {
    id: 'rec-3',
    title: 'Node.js Microservices architecture & Event-Driven Systems',
    topic: 'RabbitMQ, Kafka messaging, and Redis Pub/Sub integration',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    recordingDate: '2026-07-15',
    durationMinutes: 105,
    weekNumber: 3,
    videoUrl: 'https://www.youtube.com/embed/DZBGEExL05o',
    notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notesPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
    isLocked: false
  },
  {
    id: 'rec-4',
    title: 'Building Neural Networks with PyTorch & CUDA',
    topic: 'Tensors, autograd, backpropagation, and loss functions',
    courseId: 'course-dsai-102',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    batchId: 'batch-dsai-1',
    recordingDate: '2026-07-12',
    durationMinutes: 110,
    weekNumber: 4,
    videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw',
    notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notesPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=600',
    isLocked: false
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', date: '2026-07-21', batchId: 'batch-fswd-1', studentId: 'stu-1', studentName: 'Rahul Verma', status: 'present', markedBy: 'Dr. Rajesh Sharma' },
  { id: 'att-2', date: '2026-07-21', batchId: 'batch-fswd-1', studentId: 'stu-2', studentName: 'Priya Sundaram', status: 'present', markedBy: 'Dr. Rajesh Sharma' },
  { id: 'att-3', date: '2026-07-21', batchId: 'batch-fswd-1', studentId: 'stu-4', studentName: 'Sneha Kulkarni', status: 'absent', markedBy: 'Dr. Rajesh Sharma', remarks: 'Sick leave requested' },
  { id: 'att-4', date: '2026-07-22', batchId: 'batch-fswd-1', studentId: 'stu-1', studentName: 'Rahul Verma', status: 'present', markedBy: 'Dr. Rajesh Sharma' },
  { id: 'att-5', date: '2026-07-22', batchId: 'batch-fswd-1', studentId: 'stu-2', studentName: 'Priya Sundaram', status: 'present', markedBy: 'Dr. Rajesh Sharma' },
  { id: 'att-6', date: '2026-07-22', batchId: 'batch-fswd-1', studentId: 'stu-4', studentName: 'Sneha Kulkarni', status: 'present', markedBy: 'Dr. Rajesh Sharma' }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    title: 'Assignment 1: Build a Scalable E-Commerce REST API with JWT Auth & Express',
    description: 'Implement user registration, password hashing with bcrypt, JWT token authentication, product CRUD routes, shopping cart endpoints, and error handling middleware.',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    batchName: 'Full Stack MERN Alpha',
    teacherId: 'tch-1',
    teacherName: 'Dr. Rajesh Sharma',
    dueDate: '2026-07-28',
    maxMarks: 100,
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    attachmentName: 'Assignment1_ECommerce_Specs.pdf',
    status: 'active',
    submissions: [
      {
        id: 'sub-1',
        assignmentId: 'asg-1',
        studentId: 'stu-2',
        studentName: 'Priya Sundaram',
        submittedAt: '2026-07-22T16:00:00Z',
        content: 'Completed express API backend with TypeScript, PostgreSQL and JWT integration. GitHub repo link attached in documentation.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'Priya_ECommerce_Backend_Doc.pdf',
        marksObtained: 98,
        feedback: 'Outstanding clean architecture! Excellent error handling and modular middleware.',
        status: 'graded'
      },
      {
        id: 'sub-2',
        assignmentId: 'asg-1',
        studentId: 'stu-1',
        studentName: 'Rahul Verma',
        submittedAt: '2026-07-23T06:30:00Z',
        content: 'Submitted Node.js Express server code with MongoDB Mongoose schemas.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'Rahul_Assignment1_Code.zip',
        status: 'submitted'
      }
    ]
  },
  {
    id: 'asg-2',
    title: 'Assignment 2: Housing Price Prediction with Random Forest & XGBoost',
    description: 'Perform exploratory analysis, handle missing numerical and categorical features, scale inputs, train baseline and tuned models, and output evaluation metrics (RMSE, R2 score).',
    courseId: 'course-dsai-102',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    batchId: 'batch-dsai-1',
    batchName: 'Data Science & AI Batch 1',
    teacherId: 'tch-2',
    teacherName: 'Prof. Ananya Roy',
    dueDate: '2026-07-30',
    maxMarks: 100,
    status: 'active',
    submissions: []
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'React 19 & JavaScript Async Ecosystem Diagnostic Quiz',
    description: 'Test your understanding of Promises, Async/Await, Virtual DOM reconciliation, and React 19 Hooks.',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    batchId: 'batch-fswd-1',
    durationMinutes: 15,
    passingPercentage: 70,
    totalMarks: 30,
    status: 'active',
    questions: [
      {
        id: 'q-1',
        questionText: 'What is the primary function of the JavaScript Event Loop?',
        options: [
          'To run multi-threaded parallel background processes in C++',
          'To monitor the Call Stack and Task Queue, pushing callback tasks onto the Call Stack when empty',
          'To compile JavaScript directly into native machine bytecode',
          'To manage DOM rendering styles exclusively'
        ],
        correctOptionIndex: 1,
        marks: 10,
        explanation: 'The event loop continuously checks if the call stack is empty and executes queued callbacks.'
      },
      {
        id: 'q-2',
        questionText: 'Which React Hook is specifically designed for performing asynchronous side-effects in React 19?',
        options: [
          'useLayoutEffect',
          'useActionState / useEffect',
          'useMemo',
          'useCallback'
        ],
        correctOptionIndex: 1,
        marks: 10,
        explanation: 'useEffect handles side effects, while useActionState handles async actions in forms.'
      },
      {
        id: 'q-3',
        questionText: 'What happens when you return a rejected Promise inside an async function without a try/catch block?',
        options: [
          'The program automatically restarts',
          'An unhandled promise rejection occurs and can be caught at the call site or window event',
          'The function silently returns null',
          'It throws a syntax error at compile time'
        ],
        correctOptionIndex: 1,
        marks: 10,
        explanation: 'Async functions always return promises that reject when an error occurs inside them.'
      }
    ]
  }
];

export const INITIAL_QUIZ_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'att-q1',
    quizId: 'quiz-1',
    quizTitle: 'React 19 & JavaScript Async Ecosystem Diagnostic Quiz',
    studentId: 'stu-2',
    studentName: 'Priya Sundaram',
    score: 30,
    totalMarks: 30,
    percentage: 100,
    passed: true,
    attemptedAt: '2026-07-20T11:00:00Z',
    userAnswers: { 'q-1': 1, 'q-2': 1, 'q-3': 1 }
  }
];

export const INITIAL_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-1',
    title: 'Complete MERN Architecture & Microservices Handbook 2026',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    category: 'PDF Notes',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'MERN_Enterprise_Architecture.pdf',
    fileSize: '4.8 MB',
    uploadedBy: 'Dr. Rajesh Sharma',
    uploadedAt: '2026-02-02'
  },
  {
    id: 'mat-2',
    title: 'React 19 Hooks & State Design Pattern Cheat Sheet',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    category: 'Lecture Slides',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'React19_CheatSheet.pdf',
    fileSize: '2.1 MB',
    uploadedBy: 'Dr. Rajesh Sharma',
    uploadedAt: '2026-03-10'
  },
  {
    id: 'mat-3',
    title: 'Python Data Science Stack (Pandas, Seaborn, Scikit-Learn) Workbook',
    courseId: 'course-dsai-102',
    courseTitle: 'Data Science, Applied Machine Learning & Generative AI',
    category: 'Practice Sheet',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'DataScience_Workbook.pdf',
    fileSize: '6.3 MB',
    uploadedBy: 'Prof. Ananya Roy',
    uploadedAt: '2026-02-12'
  }
];

export const INITIAL_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    certificateNumber: 'CERT-2026-EDUPRO-88301',
    studentId: 'stu-2',
    studentName: 'Priya Sundaram',
    courseId: 'course-fswd-101',
    courseTitle: 'Full-Stack MERN Enterprise Engineering',
    issueDate: '2026-07-20',
    completionDate: '2026-07-19',
    grade: 'A+ (Distinction - 96%)',
    verifyUrl: 'https://edupro.com/verify/CERT-2026-EDUPRO-88301'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1',
    title: '🚀 Upcoming Hackathon & Live System Design Masterclass',
    content: 'All enrolled students are invited to our quarterly EduPro Enterprise Hackathon this Saturday! Special cash rewards & internship placements with top SaaS partners.',
    targetRole: 'all',
    priority: 'high',
    publishDate: '2026-07-22',
    createdBy: 'Eleanor Vance (Super Admin)',
    bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'anc-2',
    title: '📢 Mid-Term Assignment Submission Deadline Extension',
    content: 'Full Stack MERN Alpha batch students have received a 48-hour extension on Assignment 1. Please ensure your GitHub repository link and PDF report are uploaded properly.',
    targetRole: 'students',
    courseId: 'course-fswd-101',
    batchId: 'batch-fswd-1',
    priority: 'medium',
    publishDate: '2026-07-21',
    createdBy: 'Dr. Rajesh Sharma'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'usr-student-1',
    title: '💳 Payment Upload Received',
    message: 'Your payment proof for ₹8,000 has been uploaded and is pending verification by Academic Admin.',
    type: 'info',
    isRead: false,
    createdAt: '2026-07-22T12:00:00Z'
  },
  {
    id: 'notif-2',
    userId: 'usr-student-1',
    title: '🎥 Live Class Starting Today',
    message: 'Live Workshop: Building Production GraphQL Services starts at 10:00 AM IST.',
    type: 'alert',
    isRead: false,
    createdAt: '2026-07-23T07:00:00Z'
  },
  {
    id: 'notif-3',
    userId: 'usr-student-2',
    title: '🎓 Graduation Certificate Issued!',
    message: 'Congratulations Priya! Your official Certificate of Excellence is now available for download.',
    type: 'success',
    isRead: true,
    createdAt: '2026-07-20T14:00:00Z'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    userId: 'usr-superadmin',
    userName: 'Eleanor Vance',
    userRole: 'super_admin',
    action: 'POLICY_UPDATE',
    targetEntity: 'Institute Terms & Privacy Policy',
    details: 'Updated First-Login Terms and Conditions to Version 2.1-2026',
    ipAddress: '192.168.1.10',
    timestamp: '2026-07-20T09:15:00Z'
  },
  {
    id: 'log-2',
    userId: 'usr-admin',
    userName: 'Marcus Sterling',
    userRole: 'admin',
    action: 'FEE_PAYMENT_RECORDED',
    targetEntity: 'Rahul Verma (STU-2026-001)',
    details: 'Recorded payment of ₹10,000 via Net Banking. Receipt #RCP-2026-1045',
    ipAddress: '192.168.1.25',
    timestamp: '2026-05-10T14:10:00Z'
  },
  {
    id: 'log-3',
    userId: 'usr-teacher-1',
    userName: 'Dr. Rajesh Sharma',
    userRole: 'teacher',
    action: 'ASSIGNMENT_GRADED',
    targetEntity: 'Priya Sundaram (Assignment 1)',
    details: 'Graded submission with 98/100 marks and feedback.',
    ipAddress: '192.168.1.42',
    timestamp: '2026-07-22T16:30:00Z'
  }
];

export const INITIAL_BANNERS: HomeBanner[] = [
  {
    id: 'ban-1',
    title: 'YouTube All Creator Master Program 2026',
    subtitle: '3 Months Live Training + 2 Months Growth Support | 121+ Live Sessions & 14 Modules',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=1200',
    targetCourseId: 'course-yt-master-101',
    buttonText: 'View Syllabus & Enroll Now',
    isActive: true,
    order: 1
  },
  {
    id: 'ban-2',
    title: 'Full-Stack MERN Enterprise Engineering',
    subtitle: 'Master Node.js, React 19, TypeScript, Docker, Redis & Microservices',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
    targetCourseId: 'course-fswd-101',
    buttonText: 'Explore Engineering Track',
    isActive: true,
    order: 2
  },
  {
    id: 'ban-3',
    title: 'Applied Machine Learning & Generative AI',
    subtitle: 'PyTorch, LLMs, LangChain & Autonomous AI Agents',
    imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=1200',
    targetCourseId: 'course-dsai-102',
    buttonText: 'Join AI Cohort',
    isActive: true,
    order: 3
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1',
    studentId: 'stu-1',
    studentName: 'Rahul Verma',
    subject: 'Fee Verification Status Inquiry for Final Installment',
    category: 'Billing & Fee',
    message: 'I have uploaded the UTR number and payment screenshot for my ₹8,000 payment on July 22. Kindly verify and update my receipt status.',
    priority: 'medium',
    status: 'in_progress',
    attachmentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    replies: [
      {
        id: 'rep-1',
        senderId: 'usr-admin',
        senderName: 'Marcus Sterling',
        senderRole: 'admin',
        message: 'Hello Rahul, we have received your UTR submission. Our accounting department is verifying the bank credit and will approve your receipt shortly.',
        createdAt: '2026-07-22T14:30:00Z'
      }
    ],
    createdAt: '2026-07-22T12:00:00Z',
    updatedAt: '2026-07-22T14:30:00Z'
  },
  {
    id: 'tkt-2',
    studentId: 'stu-2',
    studentName: 'Priya Sundaram',
    subject: 'Request for Certificate Hardcopy Signature Validation',
    category: 'Certificate',
    message: 'Could you please confirm if the digital signature on my Certificate CERT-2026-EDUPRO-88301 is QR-verified on the public verification page?',
    priority: 'low',
    status: 'resolved',
    replies: [
      {
        id: 'rep-2',
        senderId: 'usr-superadmin',
        senderName: 'Eleanor Vance',
        senderRole: 'super_admin',
        message: 'Hi Priya! Yes, scanning the QR code on your PDF certificate points directly to our official portal verification URL with live status.',
        createdAt: '2026-07-21T10:00:00Z'
      }
    ],
    createdAt: '2026-07-21T08:00:00Z',
    updatedAt: '2026-07-21T10:00:00Z'
  }
];

export const INITIAL_SETTINGS: InstituteSettings = {
  name: 'Learner Hub',
  tagline: 'Enterprise Learning Management & Skill Accelerator',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
  contactEmail: 'support@learnerhub.com',
  phone: '+91 (800) 456-7890',
  whatsapp: '+91 98765 00000',
  address: 'Learner Hub Tech Park, 5th Floor, Silicon Valley Zone, Bengaluru, India 560103',
  primaryColor: '#2563eb',
  currencySymbol: '₹',
  footerText: '© 2026 Learner Hub LMS. All Rights Reserved. Enterprise Edition.',
  policy: {
    version: 'v2.1-2026',
    effectiveDate: '2026-01-01',
    termsContent: `WELCOME TO LEARNER HUB TERMS & CONDITIONS (Version v2.1-2026)

1. ACADEMIC INTEGRITY & CODE OF CONDUCT
Students enrolled in Learner Hub LMS courses are expected to uphold strict academic integrity. All assignments, code projects, and quizzes must represent your original work. Plagiarism or unauthorized distribution of proprietary course videos, notes, or codebases will result in immediate suspension without refund.

2. FEES, INSTALLMENTS & REFUND POLICY
- Course fees are payable according to the agreed payment schedule (lump-sum or monthly installments).
- Late payments beyond 7 days of the due date may incur a late administrative fee.
- Course fee refund requests are valid within 7 calendar days of course start date. After 7 days, fees are non-refundable.

3. ATTENDANCE & CERTIFICATION REQUIREMENTS
- Students must maintain a minimum of 80% attendance in live classes and complete at least 85% of mandatory modules to be eligible for the official Learner Hub Certificate of Excellence.
- Certificate numbers are uniquely cryptographically signed and stored in audit logs.

4. SYSTEM ACCESS & INTELLECTUAL PROPERTY
- Your login credentials are personal to you and cannot be shared.
- All course recordings, study materials, and code repositories are copyrighted by Learner Hub.

By clicking "I Agree", you acknowledge that you have read, understood, and accept these Terms & Conditions.`,
    privacyContent: `PRIVACY & DATA PROTECTION POLICY (Version v2.1-2026)

1. INFORMATION WE COLLECT
We collect personal information necessary for academic administration, including your full name, contact details, parent/guardian contact, educational history, attendance records, payment transaction IDs, and IP log data.

2. HOW WE USE YOUR DATA
- To provide full LMS portal access, live class video links, assignment tracking, and grade reports.
- To process payment receipts and communicate administrative alerts via In-App, Email, and WhatsApp.
- To issue verified digital certificates.

3. DATA SECURITY & PRIVACY
We enforce industry-standard Row Level Security (RLS), encrypted database backups, and strict access control. We never sell or share student data with unauthorized third parties.

4. YOUR DATA RIGHTS
You may request access to or updates of your personal profile data through the Academic Admin desk.`,
    updatedBy: 'Eleanor Vance (Super Admin)'
  }
};
