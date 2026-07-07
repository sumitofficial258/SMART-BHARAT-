import React, { useState, useEffect, useRef } from "react";
import { getTranslation, LanguageCode } from "../lib/languages";
import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  increment 
} from "firebase/firestore";
import { 
  BookOpen, 
  Users, 
  Search, 
  ArrowUp, 
  Send, 
  MessageCircle, 
  Plus, 
  ChevronRight, 
  X,
  FileText,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CommunityPost, CommunityCircle } from "../types";

interface CommunityViewProps {
  userId: string;
  userName: string;
  lang: LanguageCode;
}

const INITIAL_GUIDES: CommunityPost[] = [
  {
    postId: "guide-seed-1",
    authorId: "admin-seed",
    authorName: "Ravi Menon",
    title: "How to register a Housing Society in Maharashtra (Step by Step)",
    content: `Many citizens struggle to register cooperative housing societies due to complex red tape. Here is the exact checklist that works:

1. Obtain a Reservation of Name Certificate from the Assistant Registrar (Form A).
2. Gather at least 10 promoters who are property buyers in the building.
3. Open a bank account in the proposed society's name at a cooperative bank with permission from the Registrar.
4. Prepare draft bye-laws (Standard bye-laws are available at the government printing press).
5. Submit Form B (Application for Registration) along with builder disclosures, property card, and layout blueprints.
6. Pay the processing fee of Rs. 2,500.

Following this sequence will save you Rs. 12,000 in agent fees! It took our society only 45 days to get approved using this exact path.`,
    upvotes: 342,
    tags: ["Legal", "Housing", "Maharashtra"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-2",
    authorId: "admin-seed-2",
    authorName: "Priya Krishnan",
    title: "Getting street lights fixed via Twitter tagging — it actually works",
    content: `When reporting non-functional streetlights to municipalities, standard online portals can take weeks. Tagging local administrative handles directly on social media gets action in 48 hours. Here is the template:

"Hazard Alert: Non-functional streetlights at [Exact Intersection/Road Name], Pin [Zip]. Creates safety risk for pedestrians and drivers. Please resolve @[CityMunicipalHandle] @[WardOfficerHandle] #CivicCare"

Always attach a clear photo of the dark street or pole number. I have successfully resolved 14 light failures in our locality using this exact format!`,
    upvotes: 215,
    tags: ["Civic", "Tips", "DIY"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-3",
    authorId: "admin-seed-3",
    authorName: "Anil Desai",
    title: "E-Shram Card: fixing the OTP error that blocks 70% of applicants",
    content: `Many workers get stuck on the E-Shram portal with an infinite OTP sending loop, especially if they use Jio or BSNL networks.

This is caused by a script buffer error on the portal's regional SMS gateway. The workaround:
1. Clear your browser cache and open the portal in an Incognito window.
2. If the OTP fails on the first try, wait exactly 60 seconds.
3. Click "Resend OTP" but immediately toggle your mobile phone to "Flight Mode" for 5 seconds, then toggle it back.
4. This forces your mobile provider to request a fresh signaling session, which routes the SMS through an alternate gateway almost instantly.

This technique has assisted over 800 people in our local worker circles!`,
    upvotes: 189,
    tags: ["Schemes", "Tech Fix", "E-Shram"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-4",
    authorId: "admin-seed-4",
    authorName: "Siddharth Sen",
    title: "UIDAI DOB Correction Exception Procedure (Exceeded Lifetime Limit)",
    content: `UIDAI restricts Aadhaar Date of Birth correction to only ONCE in a lifetime. If you have already corrected it once and need to fix another clerical error, online applications will automatically get rejected. Here is the official exception handling procedure that works:

1. Visit a physical Aadhaar Seva Kendra (ASK). Do NOT try online portals. Request a DOB update using your valid birth certificate.
2. Collect the Enrolment Slip from the operator.
3. Download the "Self-Declaration Form for DOB Correction Exception" (Annexure-I from UIDAI portal) and fill it out completely, stating your genuine reasons.
4. Draft an email to your regional UIDAI office (e.g., ro.bengaluru@uidai.net.in, ro.mumbai@uidai.net.in, or help@uidai.gov.in).
5. Use this subject format: Exception DOB Correction - Enrolment ID: [your 14-digit EID]
6. Attach clear PDF scans of:
   - Your Enrolment Slip
   - Your original Municipal Birth Certificate
   - Signed Self-Declaration Form
   - Copy of Aadhaar Card
7. The Regional Office will review the document and issue a backend exception override. This takes 20-30 days, but your Aadhaar will be successfully updated!`,
    upvotes: 294,
    tags: ["Aadhaar", "UIDAI", "Identity"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-5",
    authorId: "admin-seed-5",
    authorName: "Meera Nair",
    title: "Bypassing PAN-Aadhaar Linking Name Mismatch rejection online",
    content: `When linking PAN with Aadhaar, slight differences in names (like 'Sanjay Kumar' vs 'Sanjay K' or middle name omissions) trigger automated rejection on the Income Tax e-filing portal. To resolve this without formal legal name change advertisements:

Option A: Online Correction
Check which document has the typo. Correcting your Aadhaar details online is fastest (takes 3-5 days if your mobile number is linked). Once corrected, link them on the e-filing portal.

Option B: Biometric Linking (Recommended if corrections are blocked)
1. Find your nearest Protean (formerly NSDL) or UTITSL PAN Service Centre.
2. Fill out the physical 'Aadhaar-PAN Biometric Linking Form'.
3. Submit the form with copies of your PAN and Aadhaar.
4. Provide your biometric verification (fingerprint scan) at their terminal.
5. Biometric authentication overrides the string name-matching algorithms because it establishes undeniable biological identity.
6. A service fee of Rs. 50 is charged, and linking is completed in 2 days.`,
    upvotes: 261,
    tags: ["PAN", "Taxation", "Identity"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-6",
    authorId: "admin-seed-6",
    authorName: "Vikram Rathore",
    title: "EPFO PF Claim Rejection: How to submit a Joint Declaration Form",
    content: `If your PF claims get rejected due to 'Father name mismatch' or 'Incorrect Date of Joining', online profile editing won't work because these fields are locked after initial employer submission. You must submit a physical Joint Declaration Form. Here is the process:

1. Download the 'EPF Joint Declaration Form' PDF from the official EPFO website.
2. The form has two main columns: 'Correct Details' and 'Incorrect Details'. Write your correct Name, Father's Name, DOB, and joining/leaving dates clearly.
3. Print and sign the form. Get the signature and official rubber stamp of your employer's authorized signatory (HR/Director).
4. Gather supporting documents (self-attested copies):
   - Your Aadhaar Card & PAN Card
   - Company Appointment Letter & Relieving Letter
   - Stamped Bank Passbook / Cancelled Cheque
5. Visit the Regional EPF Office where your company maintains its accounts. Submit the physical set to the inward section.
6. MANDATORY: Ensure you get a stamped 'RECEIVED' acknowledgment copy on a photocopy of the form.
7. Track the status on the Member Unified Portal. It takes 15-20 days, and once updated, your claims will settle instantly!`,
    upvotes: 188,
    tags: ["EPFO", "Welfare", "Labour"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-7",
    authorId: "admin-seed-7",
    authorName: "Karan Patel",
    title: "Getting Voter ID Constituency Shift (Form 8) approved in 10 days",
    content: `When moving to a new house, transferring your Voter ID constituency via Form 8 on the NVSP (National Voters' Service Portal) often gets stuck on the 'Field Verification' stage for months because Booth Level Officers (BLOs) do not process files regularly.

Here is the exact method to fast-track your Voter Card:
1. Submit Form 8 online via NVSP or Voter Helpline App. Take a screenshot of your Reference ID.
2. Go to electoralsearch.in and select the 'Know Your BLO/Electoral Officers' tab.
3. Enter your Epic number or search by details to find the exact name and contact mobile number of your area's BLO.
4. Politely SMS or call your BLO:
   "Namaste sir, my name is [Name]. I have submitted Form 8 online to shift my voter address to [New Area]. My Reference ID is [Ref ID]. Please let me know when you are visiting my sector so I can present my utility bill for physical verification."
5. Often, they will verify your documents instantly over a quick phone call or ask you to meet them at their local office on Saturday.
6. Once the BLO marks 'Verified' on their mobile app, the Electoral Registration Officer (ERO) approves and prints your new card in 3 days!`,
    upvotes: 212,
    tags: ["VoterID", "Elections", "Civic"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-8",
    authorId: "admin-seed-8",
    authorName: "Rajesh Patil",
    title: "Resolving PM-Kisan 'Land Seeding: No' status to unblock installments",
    content: `If you are an eligible farmer but your ₹2,000 PM-Kisan quarterly installments have stopped with the status 'Land Seeding: No', it means the automated land registration sync has failed. Do not wait for online updates. Follow this physical verification route:

1. Visit your Tehsil (Land Records Office) and obtain a certified copy of your land registration record (Khatauni / Jamabandi).
2. Meet your local Lekhpal or Patwari. Ask them to write a verification report certifying that you are the active cultivator of the land plot.
3. Take these documents to your Block Agriculture Office (Krishi Vibhag):
   - Certified Khatauni copy
   - Lekhpal verification certificate
   - Aadhaar Card copy (linked with bank)
   - Printout of your PM-Kisan Beneficiary Status page showing 'Land Seeding: No'
4. Submit this to the Block Agriculture Nodal Officer. They will upload your physical records to the state agricultural database.
5. Once they approve, the portal updates in 7-10 days, and all your pending retroactive installments will clear in the very next DBT cycle!`,
    upvotes: 245,
    tags: ["PM-Kisan", "Agriculture", "Schemes"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-9",
    authorId: "admin-seed-9",
    authorName: "Anjali Deshmukh",
    title: "Correcting name spelling on Birth Certificate (e-District portal)",
    content: `If your municipal birth certificate has typo errors (like 'Anjali Desmukh' instead of 'Anjali Deshmukh') and triggers rejections on Passport or Aadhaar portals, you can fix it online without visiting the municipality:

1. Visit your state's online e-District / ServicePlus portal. Register and login.
2. Select 'Correction in Birth Certificate' or 'Correction of Name in Birth Registry' under local government department services.
3. Upload copies of:
   - The erroneous Birth Certificate
   - School Leaving Certificate (10th Board certificate) showing correct name
   - Joint Affidavit from parents sworn before a notary (stating correct name and that both spellings refer to the same person)
   - Aadhaar Cards of parents
4. Pay the nominal online processing fee (varies between ₹20 and ₹50 by state).
5. The digital file goes to the local Ward Health Inspector or Registrar of Births and Deaths. They will cross-verify with original hospital reports.
6. Once approved (takes 7-10 days), a digitally signed, secure QR-coded fresh birth certificate will be available to download from your dashboard. It is 100% legal!`,
    upvotes: 198,
    tags: ["Birth Certificate", "Identity", "Legal"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-10",
    authorId: "admin-seed-10",
    authorName: "Ramesh Hegde",
    title: "Retrieving lost Land Survey Map (FMB) from State Land Portal online",
    content: `When applying for bank agricultural loans or building approvals, officers will demand your land plot's Survey Map or Field Measurement Book (FMB) sketch. If your local land office stalls, retrieve it digitally:

1. Go to your state land records portal (e.g., AnyRoR for Gujarat, Bhulekh for UP, Bhoomi for Karnataka, or e-Services for TN).
2. Choose the 'FMB Sketch' or 'Map View' option.
3. Select your District, Taluk/Tehsil, Village, and input your Survey Number or Sub-Division Number.
4. Click on 'Generate FMB Sketch'.
5. If the system says 'Not Digitized', do not panic. Download the 'Application for Digitization of Land Map' form from the portal's circular tab.
6. Submit this form with your Khatauni copy to the Block Revenue Inspector (RI). They are legally bound to digitize it within 5 working days under the Citizen's Right to Services Act.
7. Once digitized, you can download a high-resolution, digitally signed PDF sketch of your plot boundary instantly for ₹15!`,
    upvotes: 172,
    tags: ["Land Records", "FMB", "Agriculture"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-11",
    authorId: "admin-seed-11",
    authorName: "Sanjay Dutta",
    title: "Resolving 'Session Expired' or Password Reset loop on EPFO portal",
    content: `When logging into the EPFO Member Unified Portal to check your balance or submit claims, many users get trapped in an infinite 'Session Expired' or 'Password Reset Required' redirect loop.

Here is the technical fix:
1. The EPFO portal uses legacy cookies that mismatch if you use standard Google Chrome with active Ad-blockers or security extensions.
2. The solution is to use Microsoft Edge or Brave browser in 'Strict Private/Incognito Mode'.
3. Go to the login screen. Click 'Forgot Password' even if you know it.
4. Input your UAN and the captcha. Enter the OTP sent to your Aadhaar-linked mobile.
5. Create a new password that contains exactly ONE uppercase letter, ONE lowercase letter, ONE number, and ONE special character, with total length strictly between 8 and 12 characters. (EPFO security filters fail on passwords longer than 12 characters!).
6. Wait 15 minutes after password change for the regional server database to sync before attempting your first login. It will work flawlessly without any loop!`,
    upvotes: 220,
    tags: ["EPFO", "Tech Fix", "Welfare"],
    createdAt: new Date().toISOString()
  },
  {
    postId: "guide-seed-12",
    authorId: "admin-seed-12",
    authorName: "Pooja Sharma",
    title: "Correcting name mismatch on Driving License to renew online",
    content: `If your old paper Driving License (DL) has a name variation compared to your Aadhaar card, the online Parivahan Sarathi portal will block online renewal or duplicate issuance. Follow this procedure:

1. Log into parivahan.gov.in and select 'Driving License Related Services'.
2. Select your state, and click 'Services on DL (Renewal/Duplicate/Aed/Change of Address/Others)'.
3. Enter your DL number and DOB. The system will pull your old DL record.
4. Choose 'Apply for Name Change in DL' along with 'DL Renewal'.
5. Upload:
   - Your Aadhaar Card (confirming correct name)
   - Erroneous DL copy
   - Gazette Notification copy OR Notarized Affidavit clarifying the name mismatch
6. Book an online slot for biometric verification at your RTO (some states now offer fully contactless faceless service where RTO visits are waived!).
7. Once verified, the RTO updates the central Sarathi database, and your renewed smart-card DL will be dispatched directly to your home address!`,
    upvotes: 215,
    tags: ["Driving License", "Parivahan", "Registry"],
    createdAt: new Date().toISOString()
  }
];

const INITIAL_CIRCLES: CommunityCircle[] = [
  {
    id: "circle-mumbai",
    name: "Mumbai Water Issues",
    description: "Water supply timetables, tanker delays, and pipeline leakages discussion.",
    membersCount: 12400,
    location: "Mumbai, MH",
    activityLevel: "High",
    messages: [
      { senderId: "user-101", senderName: "Rajesh S.", text: "Hey everyone, are you facing low water pressure in K-West ward (Andheri West) today? It usually comes around 7:30 AM but today it was barely a trickle.", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
      { senderId: "user-102", senderName: "Meera G.", text: "Yes, BMC announced a 15% water cut for 2 days due to pipeline repair work at Bhandup water treatment plant. It should be resolved by tomorrow evening.", timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString() },
      { senderId: "user-103", senderName: "Amit Patel", text: "Thanks for the update. Is anyone ordering a private water tanker? The local society association says tankers are charging extra today.", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { senderId: "ai", senderName: "Smart Companion", text: "Welcome to the Mumbai Water discussion circle! To report illegal tanker price gouging, you can call BMC helpline at 1916 or file a grievance on pgportal.gov.in.", timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: "circle-delhi",
    name: "Delhi Air Quality Watch",
    description: "AQI alerts, pollution complaints, and green health advisories.",
    membersCount: 45100,
    location: "Delhi NCR",
    activityLevel: "Very High",
    messages: [
      { senderId: "user-201", senderName: "Tarun Sharma", text: "AQI crossed 380 in Punjabi Bagh today. Visible smog since 6 AM.", timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
      { senderId: "user-202", senderName: "Shweta Goel", text: "Yes, GRAP Phase 3 has been activated. Construction work is banned in our sector now. Please report any violation to Green Delhi app.", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
      { senderId: "user-201", senderName: "Tarun Sharma", text: "I saw some open waste burning near sector 4 crossing yesterday. Filed a report and they cleared it within 4 hours. The app is surprisingly fast!", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { senderId: "ai", senderName: "Smart Companion", text: "Stay safe! Air purifier filters should be cleaned weekly during high AQI periods. Keep windows sealed between 5:00 AM and 10:00 AM.", timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: "circle-bangalore",
    name: "Bangalore Traffic Solutions",
    description: "Potholes, metro progress, smart signals, and alternate routing.",
    membersCount: 8200,
    location: "Bengaluru, KA",
    activityLevel: "Medium",
    messages: [
      { senderId: "user-301", senderName: "Rohan Das", text: "Silk Board is completely locked today. Metro work at Outer Ring Road is blocking two lanes.", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { senderId: "user-302", senderName: "Karthik Raja", text: "Highly recommend taking the alternate bypass route via 14th Main HSR. It saves at least 15 minutes.", timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString() },
      { senderId: "user-303", senderName: "Deepa Nair", text: "Has anyone tried raising a pothole request on the Sahaaya app? There is a massive crater near Iblur flyover.", timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
      { senderId: "ai", senderName: "Smart Companion", text: "Potholes reported on Sahaaya with photo attachments are assigned directly to the ward executive engineer and must be patched within 7 days by law.", timestamp: new Date(Date.now() - 0.5 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: "circle-chennai",
    name: "Chennai Flood Prep",
    description: "Monsoon prep, drainage maintenance, relief coordination.",
    membersCount: 15600,
    location: "Chennai, TN",
    activityLevel: "High",
    messages: [
      { senderId: "user-401", senderName: "Srinivasan K.", text: "Velachery stormwater drains are 90% completed. Hopefully, we won't see severe inundation this year.", timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
      { senderId: "user-402", senderName: "Janani R.", text: "The local residents welfare association (RWA) is organizing a desilting inspection this Sunday at 9 AM. Anyone wants to join as volunteer?", timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
      { senderId: "user-403", senderName: "Suresh Mani", text: "Count me in! We need to verify that connection channels to Pallikaranai marshland are free of plastic blocks.", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
      { senderId: "ai", senderName: "Smart Companion", text: "Excellent civic initiative. Remember to store emergency food rations and charge power banks. You can find the contact info of Chennai Corporation Zone officers in the Resources tab.", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: "circle-egov",
    name: "E-Governance Assistance",
    description: "Aadhaar locking, PAN linkages, DigiLocker bugs, and certificate verification tips.",
    membersCount: 22100,
    location: "National",
    activityLevel: "Very High",
    messages: [
      { senderId: "user-501", senderName: "Sunita Devi", text: "Aadhaar authentication failed at the ration shop. The POS machine says 'Biometric Lock active'. Help!", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
      { senderId: "user-502", senderName: "Vikram Rathore", text: "You can unlock it instantly using the mAadhaar app or by logging into uidai.gov.in. It's a security feature that gets turned on accidentally sometimes.", timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString() },
      { senderId: "user-501", senderName: "Sunita Devi", text: "Ah, let me try that on my phone right away. Thank you so much Vikram, it worked! Saved me a trip to the Aadhaar Center.", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { senderId: "ai", senderName: "Smart Companion", text: "Glad to hear it worked! Biometric lock is recommended to prevent identity theft. You can enable 'Temporary Unlock' which automatically locks back after 10 minutes.", timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
    ]
  }
];

export default function CommunityView({ userId, userName, lang }: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<"blueprints" | "circles">("blueprints");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real-time states - Initialized with INITIAL_GUIDES & INITIAL_CIRCLES for sub-millisecond loading
  const [guides, setGuides] = useState<CommunityPost[]>(INITIAL_GUIDES);
  const [circles, setCircles] = useState<CommunityCircle[]>(INITIAL_CIRCLES);
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [circleMessage, setCircleMessage] = useState("");

  // Create Guide form modal
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTitle, setGuideTitle] = useState("");
  const [guideContent, setGuideContent] = useState("");
  const [guideTagInput, setGuideTagInput] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Expanded interactive states
  const [selectedBlueprint, setSelectedBlueprint] = useState<CommunityPost | null>(null);
  const [joinedCircleIds, setJoinedCircleIds] = useState<string[]>([]);

  const activeCircleMsgEndRef = useRef<HTMLDivElement>(null);

  // Load Solution Blueprints (Guides) from Firestore
  useEffect(() => {
    const guidesCol = collection(db, "community_posts");
    const q = query(guidesCol, orderBy("upvotes", "desc"), limit(25));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed into Firestore in background - does not affect current instant memory render
        try {
          for (const s of INITIAL_GUIDES) {
            const { postId, ...payload } = s;
            await addDoc(collection(db, "community_posts"), {
              ...payload,
              seedId: postId
            });
          }
        } catch (err) {
          console.error("Failed to seed community posts:", err);
        }
        return;
      }

      const docsList: CommunityPost[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        docsList.push({
          postId: snap.id,
          authorId: d.authorId || "",
          authorName: d.authorName || "Smart Citizen",
          title: d.title || "",
          content: d.content || "",
          upvotes: d.upvotes || 0,
          tags: d.tags || [],
          createdAt: d.createdAt || new Date().toISOString()
        });
      });

      // Merge: Always keep Firestore records, but guarantee we display our rich set of initial seeds as well
      const mergedGuides = [...docsList];
      INITIAL_GUIDES.forEach(initial => {
        const alreadyExists = docsList.some(d => d.title === initial.title);
        if (!alreadyExists) {
          mergedGuides.push(initial);
        }
      });
      mergedGuides.sort((a, b) => b.upvotes - a.upvotes);
      setGuides(mergedGuides);
    }, (err) => {
      console.warn("Firestore error reading guides, rendering fallback data:", err);
    });

    return () => unsubscribe();
  }, []);

  // Load Regional Circles (Groups) from Firestore
  useEffect(() => {
    const circlesCol = collection(db, "community_circles");
    
    const unsubscribe = onSnapshot(circlesCol, async (snapshot) => {
      if (snapshot.empty) {
        // Seed in the background
        try {
          for (const circle of INITIAL_CIRCLES) {
            await addDoc(collection(db, "community_circles"), circle);
          }
        } catch (e) {
          console.error("Failed to seed circles:", e);
        }
        return;
      }

      const docsList: CommunityCircle[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        docsList.push({
          id: snap.id,
          name: d.name || "",
          description: d.description || "",
          membersCount: d.membersCount || 0,
          location: d.location || "",
          activityLevel: d.activityLevel || "Medium",
          messages: d.messages || []
        });
      });

      // Merge circles to guarantee a variety of active groups are always available instantly
      const mergedCircles = [...docsList];
      INITIAL_CIRCLES.forEach(initial => {
        const alreadyExists = docsList.some(d => d.name === initial.name);
        if (!alreadyExists) {
          mergedCircles.push(initial);
        }
      });
      setCircles(mergedCircles);
    }, (err) => {
      console.warn("Firestore error loading circles, falling back:", err);
    });

    return () => unsubscribe();
  }, []);

  // Join/Leave Circle Action Handler
  const handleJoinCircle = async (circleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isJoined = joinedCircleIds.includes(circleId);
    let newJoined = [...joinedCircleIds];
    
    try {
      const docRef = doc(db, "community_circles", circleId);
      if (isJoined) {
        newJoined = newJoined.filter(id => id !== circleId);
        await updateDoc(docRef, { membersCount: increment(-1) });
      } else {
        newJoined.push(circleId);
        await updateDoc(docRef, { membersCount: increment(1) });
      }
      setJoinedCircleIds(newJoined);
    } catch (err) {
      console.warn("Firestore error joining circle, using local fallback:", err);
      if (isJoined) {
        setJoinedCircleIds(joinedCircleIds.filter(id => id !== circleId));
        setCircles(prev => prev.map(c => c.id === circleId ? { ...c, membersCount: c.membersCount - 1 } : c));
      } else {
        setJoinedCircleIds([...joinedCircleIds, circleId]);
        setCircles(prev => prev.map(c => c.id === circleId ? { ...c, membersCount: c.membersCount + 1 } : c));
      }
    }
  };

  // Scroll active chat list to bottom
  useEffect(() => {
    activeCircleMsgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeCircleId, circles]);

  const [upvotedPostIds, setUpvotedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`upvoted_posts_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const upvotedRef = useRef<Set<string>>(new Set());

  // Synchronize upvotedRef with state
  useEffect(() => {
    upvotedRef.current = new Set(upvotedPostIds);
  }, [upvotedPostIds]);

  const handleUpvoteGuide = async (postId: string) => {
    if (upvotedRef.current.has(postId)) return;

    upvotedRef.current.add(postId);
    const newUpvoted = Array.from(upvotedRef.current);
    setUpvotedPostIds(newUpvoted);
    try {
      localStorage.setItem(`upvoted_posts_${userId}`, JSON.stringify(newUpvoted));
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }

    try {
      // Local state update immediately for instant user feedback
      setGuides(prev => prev.map(g => g.postId === postId ? { ...g, upvotes: g.upvotes + 1 } : g));

      // Update in Firestore (if not a local guide-seed ID)
      if (!postId.startsWith("guide-seed-")) {
        const docRef = doc(db, "community_posts", postId);
        await updateDoc(docRef, { upvotes: increment(1) });
      }
    } catch (err) {
      console.warn("Error updating upvote count in backend:", err);
    }
  };

  const handleWriteGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideTitle || !guideContent) return;

    setSubmitLoading(true);
    
    const tags = guideTagInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      authorId: userId,
      authorName: userName || "Smart Citizen",
      title: guideTitle,
      content: guideContent,
      upvotes: 1,
      tags: tags.length > 0 ? tags : ["General"],
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "community_posts"), payload);
      setGuideTitle("");
      setGuideContent("");
      setGuideTagInput("");
      setShowGuideModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSendCircleMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleMessage.trim() || !activeCircleId) return;

    const activeCircle = circles.find(c => c.id === activeCircleId);
    if (!activeCircle) return;

    const newMsg = {
      senderId: userId,
      senderName: userName || "Smart Citizen",
      text: circleMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...activeCircle.messages, newMsg];
    setCircleMessage("");

    try {
      const docRef = doc(db, "community_circles", activeCircleId);
      await updateDoc(docRef, { messages: updatedMessages });
    } catch (err) {
      console.error("Firestore message sync failed:", err);
    }
  };

  const activeCircle = circles.find(c => c.id === activeCircleId);

  // Search filter
  const filteredGuides = guides.filter(g => {
    const queryLower = searchQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(queryLower) ||
      g.content.toLowerCase().includes(queryLower) ||
      g.tags.some(t => t.toLowerCase().includes(queryLower)) ||
      g.authorName.toLowerCase().includes(queryLower)
    );
  });

  return (
    <div id="civic-circles-portal" className="max-w-7xl mx-auto px-4 md:px-8 py-8 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Civic Circles
          </h2>
          <p className="text-slate-500 font-medium">
            Share blueprints, find local solutions, and collaborate with citizens.
          </p>
          <div className="flex gap-4 text-xs font-semibold text-slate-400 mt-2">
            <span>{guides.length} Guides</span>
            <span>•</span>
            <span>81.3k Citizens Joined</span>
            <span>•</span>
            <span>Active Daily</span>
          </div>
        </div>
        <button
          id="write-guide-btn"
          onClick={() => setShowGuideModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Write a Guide</span>
        </button>
      </div>

      {/* Circle / Blueprint tabs */}
      <div className="border-b border-slate-100 flex gap-6 mb-8">
        <button
          onClick={() => { setActiveTab("blueprints"); setActiveCircleId(null); }}
          className={`pb-4 text-sm font-black transition relative cursor-pointer ${
            activeTab === "blueprints" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>Solution Blueprints</span>
          {activeTab === "blueprints" && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("circles")}
          className={`pb-4 text-sm font-black transition relative cursor-pointer ${
            activeTab === "circles" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>Active Circles</span>
          {activeTab === "circles" && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"></span>
          )}
        </button>
      </div>

      {activeTab === "blueprints" ? (
        <div id="blueprints-tab-content" className="space-y-6">
          {/* Search Box */}
          <div className="max-w-2xl bg-slate-50 p-2.5 rounded-2xl border border-slate-100 shadow-inner flex items-center gap-3 px-4 mb-8">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides by title, tag, or author..."
              className="w-full bg-transparent text-slate-800 font-medium placeholder-slate-400 focus:outline-none py-2 text-sm"
            />
          </div>

          {/* List of guides */}
          <div className="space-y-4">
            {filteredGuides.map((guide) => (
              <div
                id={`guide-card-${guide.postId}`}
                key={guide.postId}
                onClick={() => setSelectedBlueprint(guide)}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex gap-6 items-start hover:shadow-md transition-shadow cursor-pointer group"
              >
                {/* Left upvote pill */}
                <button
                  id={`upvote-btn-${guide.postId}`}
                  disabled={upvotedPostIds.includes(guide.postId)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpvoteGuide(guide.postId);
                  }}
                  className={`font-black p-3 rounded-2xl transition flex flex-col items-center gap-1 shrink-0 w-14 border ${
                    upvotedPostIds.includes(guide.postId)
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 cursor-not-allowed"
                      : "bg-slate-50 hover:bg-indigo-50 border-slate-100 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 cursor-pointer"
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-xs">{guide.upvotes}</span>
                </button>

                {/* Right content details */}
                <div className="flex-grow min-w-0">
                  <h3 className="text-lg font-black text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {guide.content}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                        {guide.authorName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-400">{guide.authorName}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {guide.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-extrabold uppercase bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div id="circles-tab-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[calc(100vh-280px)]">
          {/* Active groups grid list (Left panel when circular chat is inactive, otherwise sidebar) */}
          <div className={`space-y-4 overflow-y-auto max-h-[calc(100vh-320px)] ${activeCircleId ? "hidden lg:block lg:col-span-1" : "lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"}`}>
            {circles.map((circle) => (
              <div
                id={`circle-card-${circle.id}`}
                key={circle.id}
                className={`bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between group h-full ${
                  circle.id === activeCircleId ? "ring-2 ring-indigo-500 bg-indigo-50/5" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-extrabold tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">
                      {circle.activityLevel} Activity
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {circle.messages.length}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                    {circle.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-4">
                    {circle.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">{circle.membersCount.toLocaleString()} members • {circle.location}</span>
                  <div className="flex gap-2">
                    <button
                      id={`join-circle-btn-${circle.id}`}
                      onClick={(e) => handleJoinCircle(circle.id, e)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition shadow-sm border ${
                        joinedCircleIds.includes(circle.id)
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100"
                      }`}
                    >
                      {joinedCircleIds.includes(circle.id) ? "✓ Joined" : "+ Join"}
                    </button>
                    <button
                      id={`open-chat-btn-${circle.id}`}
                      onClick={() => setActiveCircleId(circle.id)}
                      className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer transition shadow-sm flex items-center gap-1"
                    >
                      <span>Chat</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Circle Real-time Chat Room */}
          {activeCircleId && activeCircle && (
            <div id="circle-chatroom" className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[calc(100vh-320px)] overflow-hidden relative">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">{activeCircle.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{activeCircle.location} • {activeCircle.membersCount.toLocaleString()} members online</p>
                </div>
                <button
                  onClick={() => setActiveCircleId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer lg:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-grow overflow-y-auto space-y-4 py-4 pr-1">
                {activeCircle.messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-semibold text-xs">
                    No messages here yet. Be the first to start the coordination conversation!
                  </div>
                ) : (
                  activeCircle.messages.map((msg, mIdx) => (
                    <div key={mIdx} className={`flex flex-col ${msg.senderId === userId ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] font-bold text-slate-400 mb-1">{msg.senderName}</span>
                      <div className={`p-3.5 rounded-2xl max-w-[80%] ${
                        msg.senderId === userId
                          ? "bg-indigo-600 text-white rounded-tr-none font-medium shadow-sm"
                          : "bg-slate-50 text-slate-800 rounded-tl-none font-semibold border border-slate-100 shadow-sm"
                      }`}>
                        <p className="text-xs">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={activeCircleMsgEndRef} />
              </div>

              {/* Message Input box */}
              <form onSubmit={handleSendCircleMessage} className="border-t border-slate-100 pt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={circleMessage}
                  onChange={(e) => setCircleMessage(e.target.value)}
                  placeholder="Type real-time circle update here..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-xs font-semibold placeholder-slate-400 focus:outline-none"
                />
                <button
                  id="send-circle-msg-btn"
                  type="submit"
                  disabled={!circleMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white p-3.5 rounded-xl transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* POPUP MODAL: Write a Guide (Blueprint) */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl relative"
            >
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Publish a Solution Blueprint</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Help fellow citizens resolve bureaucratic errors
                  </p>
                </div>
              </div>

              <form onSubmit={handleWriteGuide} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Blueprint Title
                  </label>
                  <input
                    id="guide-title-input"
                    type="text"
                    value={guideTitle}
                    onChange={(e) => setGuideTitle(e.target.value)}
                    placeholder="e.g. Correcting name spelling errors on Ration card in Bihar"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Step-by-step instructions or workaround description
                  </label>
                  <textarea
                    id="guide-content-textarea"
                    value={guideContent}
                    onChange={(e) => setGuideContent(e.target.value)}
                    placeholder="Provide a detailed list of offices, forms, fees, and exact actions that resolve this issue..."
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Tags (Comma separated)
                  </label>
                  <input
                    id="guide-tags-input"
                    type="text"
                    value={guideTagInput}
                    onChange={(e) => setGuideTagInput(e.target.value)}
                    placeholder="e.g. RationCard, Bihar, Welfare, Workaround"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(false)}
                    className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold py-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading || !guideTitle || !guideContent}
                    className="w-2/3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {submitLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      "Publish Guide"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Read Blueprint in Detail */}
      <AnimatePresence>
        {selectedBlueprint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedBlueprint(null)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedBlueprint.tags.map((tag, idx) => (
                    <span key={idx} className="text-[9px] font-black uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {selectedBlueprint.title}
                </h3>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 font-bold">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                    {selectedBlueprint.authorName.charAt(0)}
                  </div>
                  <span>Published by <strong>{selectedBlueprint.authorName}</strong></span>
                  <span>•</span>
                  <span>{new Date(selectedBlueprint.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>👍 {selectedBlueprint.upvotes} Upvotes</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedBlueprint.content}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                <button
                  disabled={upvotedPostIds.includes(selectedBlueprint.postId)}
                  onClick={() => {
                    handleUpvoteGuide(selectedBlueprint.postId);
                    setSelectedBlueprint(prev => prev ? { ...prev, upvotes: prev.upvotes + 1 } : null);
                  }}
                  className={`flex-grow font-extrabold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md ${
                    upvotedPostIds.includes(selectedBlueprint.postId)
                      ? "bg-indigo-50 text-indigo-400 border border-indigo-100 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                  <span>
                    {upvotedPostIds.includes(selectedBlueprint.postId)
                      ? `Solution Upvoted (${selectedBlueprint.upvotes})`
                      : `Upvote this solution (${selectedBlueprint.upvotes})`}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedBlueprint(null)}
                  className="px-6 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
