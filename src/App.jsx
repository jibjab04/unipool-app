import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
} from 'firebase/firestore';
import {
  Car,
  Users,
  Calendar,
  Shield,
  LogOut,
  Plus,
  Trash2,
  Building2,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserPlus,
  Navigation,
  Clock,
  Info,
  X,
  UserCheck,
  Repeat,
  HelpCircle,
  Download,
  Cloud,
  Copy,
  Code,
  Database,
} from 'lucide-react';

// ==========================================
// FIREBASE INITIALIZATION & CONFIGURATION
// ==========================================
let app = null;
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'unipool-carpool-app';

try {
  // Support both Canvas environment and standard Vite/Vercel environment variables
  const envFirebaseConfig =
    typeof __firebase_config !== 'undefined' && __firebase_config
      ? JSON.parse(__firebase_config)
      : typeof import.meta !== 'undefined' &&
        import.meta.env &&
        import.meta.env.VITE_FIREBASE_CONFIG
      ? JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG)
      : null;

  if (envFirebaseConfig) {
    app = initializeApp(envFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.error('Firebase initialization fallback:', err);
}

// ==========================================
// CONSTANTS & TIMETABLE DEFINITIONS
// ==========================================
const DEFAULT_ADMIN_PHONE = '0199080269';
const DEFAULT_ADMIN_PASS = '4321';
const LOCAL_STORAGE_USERS_KEY = 'unipool_users_v1';
const LOCAL_STORAGE_FACULTIES_KEY = 'unipool_faculties_v1';
const LOCAL_STORAGE_BUILDINGS_KEY = 'unipool_buildings_v1';
const LOCAL_STORAGE_SUPABASE_KEY = 'unipool_supabase_cfg_v1';

const DAYS = [
  { id: 'MON', label: 'MON', breakLetter: 'B' },
  { id: 'TUES', label: 'TUES', breakLetter: 'R' },
  { id: 'WED', label: 'WED', breakLetter: 'E' },
  { id: 'THURS', label: 'THURS', breakLetter: 'A' },
  { id: 'FRI', label: 'FRI', breakLetter: 'K' },
];

const SLOTS = [
  { id: 2, time: '8.00-8.50' },
  { id: 3, time: '9.00-9.50' },
  { id: 4, time: '10.00-10.50' },
  { id: 5, time: '11.00-11.50' },
  { id: 6, time: '12.00-12.50' },
  { id: 7, time: '13.00-13.50', isBreak: true },
  { id: 8, time: '1400-1450' },
  { id: 9, time: '1500-1550' },
  { id: 10, time: '1600-1650' },
  { id: 11, time: '1700-1750' },
  { id: 12, time: '1800-1850' },
  { id: 13, time: '2000-2250' },
];

const DEFAULT_FACULTIES = [
  {
    id: 'FKE',
    name: 'Faculty of Electrical Engineering (SKE / FKE)',
    color: 'bg-purple-100 border-purple-400 text-purple-950',
    badge: 'bg-purple-600 text-white',
    lightBg: '#e9d5ff',
  },
  {
    id: 'FKM',
    name: 'Faculty of Mechanical Engineering (SKEM / FKM)',
    color: 'bg-orange-100 border-orange-400 text-orange-950',
    badge: 'bg-orange-500 text-white',
    lightBg: '#fed7aa',
  },
  {
    id: 'FC',
    name: 'Faculty of Computing (SC / FC)',
    color: 'bg-sky-100 border-sky-400 text-sky-950',
    badge: 'bg-sky-600 text-white',
    lightBg: '#bae6fd',
  },
  {
    id: 'FABU',
    name: 'Faculty of Built Environment & Central Halls',
    color: 'bg-yellow-100 border-yellow-400 text-yellow-950',
    badge: 'bg-amber-500 text-white',
    lightBg: '#fef08a',
  },
  {
    id: 'FKT',
    name: 'Faculty of Chemical & Energy Engineering',
    color: 'bg-emerald-100 border-emerald-400 text-emerald-950',
    badge: 'bg-emerald-600 text-white',
    lightBg: '#a7f3d0',
  },
];

const DEFAULT_BUILDINGS = {
  P19a: { code: 'P19a', label: 'P19a (BT1 / BT2 / BT9)', facultyId: 'FKE' },
  P16: { code: 'P16', label: 'P16 (DEMO 2 / BKT2)', facultyId: 'FKE' },
  P08: { code: 'P08', label: 'P08 (115)', facultyId: 'FKE' },
  P07: { code: 'P07', label: 'P07 (411.2)', facultyId: 'FKE' },
  P02: { code: 'P02', label: 'P02 (418)', facultyId: 'FKE' },
  P23: { code: 'P23', label: 'P23 (Mech Lab)', facultyId: 'FKM' },
  P24: { code: 'P24', label: 'P24 (Lecture Block)', facultyId: 'FKM' },
  N28: { code: 'N28', label: 'N28 (Computing)', facultyId: 'FC' },
  N28a: { code: 'N28a', label: 'N28a (Labs)', facultyId: 'FC' },
  L50: { code: 'L50', label: 'L50 (Central Lecture Hall)', facultyId: 'FABU' },
  D06: { code: 'D06', label: 'D06 (Language / UHLB)', facultyId: 'FABU' },
  N01: { code: 'N01', label: 'N01 (Chemical Block)', facultyId: 'FKT' },
};

// ==========================================
// UPLOADED IMAGE SCHEDULE PRESET (SKEL A23KE)
// ==========================================
const IMAGE_PRESET_SCHEDULE = {
  MON_5: 'P16',
  MON_6: 'P16',
  MON_8: 'D06',
  MON_9: 'D06',
  TUES_2: 'P19a',
  TUES_3: 'P19a',
  TUES_5: 'P16',
  TUES_6: 'P16',
  WED_2: 'P08',
  WED_3: 'P08',
  WED_4: 'P19a',
  WED_5: 'P07',
  WED_6: 'P07',
  THURS_4: 'P02',
  THURS_8: 'P19a',
  FRI_9: 'P19a',
  FRI_10: 'P19a',
};

// ==========================================
// DEMO STUDENTS GENERATOR (FOR TESTING GROUPINGS)
// ==========================================
const DEMO_USERS_LIST = [
  {
    phone: '0123450001',
    passcode: '1111',
    name: 'Aiman (Block A-12)',
    role: 'student',
    hasCar: true,
    schedule: { ...IMAGE_PRESET_SCHEDULE },
  },
  {
    phone: '0123450002',
    passcode: '1111',
    name: 'Farah (Block A-04)',
    role: 'student',
    hasCar: false,
    schedule: { ...IMAGE_PRESET_SCHEDULE },
  },
  {
    phone: '0123450003',
    passcode: '1111',
    name: 'Daniel (Block B-08)',
    role: 'student',
    hasCar: false,
    schedule: {
      MON_5: 'P16',
      TUES_2: 'P19a',
      WED_2: 'P08',
      WED_4: 'P19a',
      THURS_4: 'P02',
      FRI_9: 'P19a',
    },
  },
  {
    phone: '0123450004',
    passcode: '1111',
    name: 'Mei Ling (Block B-15)',
    role: 'student',
    hasCar: false,
    schedule: {
      MON_5: 'P16',
      TUES_2: 'P19a',
      WED_2: 'P08',
      THURS_4: 'P19a', // Same faculty (FKE), different building on THURS_4
      FRI_9: 'P19a',
    },
  },
  {
    phone: '0123450005',
    passcode: '1111',
    name: 'Harith (Block C-02)',
    role: 'student',
    hasCar: false,
    schedule: {
      MON_5: 'P19a', // Same faculty (FKE), joins Aiman's 5th seat!
      TUES_2: 'P19a',
      WED_2: 'P08',
      THURS_4: 'P02',
      FRI_9: 'P16', // Same faculty (FKE)
    },
  },
  // Overflow students (No driver left -> Grouped into Uber/Grab Split Cost!)
  {
    phone: '0123450006',
    passcode: '1111',
    name: 'Sofea (Block A-09)',
    role: 'student',
    hasCar: false,
    schedule: {
      MON_5: 'P16',
      TUES_2: 'P19a',
      WED_2: 'P08',
      THURS_8: 'P19a',
    },
  },
  {
    phone: '0123450007',
    passcode: '1111',
    name: 'Zack (Block C-11)',
    role: 'student',
    hasCar: false,
    schedule: {
      MON_5: 'P16',
      TUES_2: 'P19a',
      WED_2: 'P16', // Same faculty FKE on WED_2
      THURS_8: 'P19a',
    },
  },
  {
    phone: '0123450008',
    passcode: '1111',
    name: 'Nadia (Block B-03)',
    role: 'student',
    hasCar: false,
    schedule: {
      MON_5: 'P08', // Same faculty FKE on MON_5 -> joins Uber with Sofea & Zack!
      TUES_2: 'P16', // Same faculty FKE on TUES_2
      WED_2: 'P08',
      THURS_8: 'P19a',
    },
  },
  // Computing Students (N28 / N28a)
  {
    phone: '0123450009',
    passcode: '1111',
    name: 'Kevin (Block A-19)',
    role: 'student',
    hasCar: true,
    schedule: {
      MON_5: 'N28',
      TUES_2: 'N28',
      WED_4: 'N28a',
    },
  },
  {
    phone: '0123450010',
    passcode: '1111',
    name: 'Priya (Block C-07)',
    role: 'student',
    hasCar: false,
    schedule: {
      MON_5: 'N28',
      TUES_2: 'N28a', // Same faculty (FC) as Kevin -> grouped into Kevin's car!
      WED_4: 'N28a',
    },
  },
];

// ==========================================
// HIERARCHICAL GROUPING ENGINE
// ==========================================
/**
 * Priority 1: Same Time Slot (Day + Slot)
 * Priority 2: Same Building (Group students with drivers in the exact same building)
 * Priority 3: Same Faculty (Fill remaining seats in same-faculty drivers, then group remaining students into Uber/Grab)
 * Vehicle Capacity: 5 students per Car (1 Driver + 4 Passengers), 4 students per Uber/Grab ride-share.
 */
function computeGroupingsForSlot(users, dayId, slotId, buildingsMap, facultiesList, firstClassOnly) {
  const slotKey = `${dayId}_${slotId}`;

  // Filter active students for this Day + Slot
  const activeStudents = users.filter((u) => {
    const bCode = u.schedule?.[slotKey];
    if (!bCode) return false;

    if (firstClassOnly) {
      // Check if user has an earlier class on the same day
      for (let s = 2; s < slotId; s++) {
        if (s === 7) continue; // skip break
        if (u.schedule?.[`${dayId}_${s}`]) {
          return false; // Already on campus from an earlier slot
        }
      }
    }
    return true;
  });

  if (activeStudents.length === 0) return [];

  const facultyLookup = {};
  facultiesList.forEach((f) => {
    facultyLookup[f.id] = f;
  });

  // Enrich student records with building & faculty metadata
  const enriched = activeStudents.map((u) => {
    const bCode = u.schedule[slotKey];
    const bInfo = buildingsMap[bCode] || {
      code: bCode,
      label: bCode,
      facultyId: 'UNASSIGNED',
    };
    const fInfo = facultyLookup[bInfo.facultyId] || {
      id: 'UNASSIGNED',
      name: 'Unassigned Faculty',
      color: 'bg-slate-100 border-slate-400 text-slate-800',
      badge: 'bg-slate-600 text-white',
    };
    return {
      ...u,
      targetBuilding: bCode,
      buildingLabel: bInfo.label,
      facultyId: fInfo.id,
      facultyName: fInfo.name,
      facultyBadge: fInfo.badge,
    };
  });

  // Group enriched students by Faculty ID so we process each faculty pool
  const byFaculty = {};
  enriched.forEach((st) => {
    if (!byFaculty[st.facultyId]) byFaculty[st.facultyId] = [];
    byFaculty[st.facultyId].push(st);
  });

  const finalGroups = [];

  Object.keys(byFaculty).forEach((facId) => {
    const facStudents = byFaculty[facId];
    const facName = facStudents[0]?.facultyName || facId;
    const facBadge = facStudents[0]?.facultyBadge || 'bg-slate-600 text-white';

    // Bucket by Building inside this Faculty
    const byBuilding = {};
    facStudents.forEach((st) => {
      if (!byBuilding[st.targetBuilding]) {
        byBuilding[st.targetBuilding] = { drivers: [], passengers: [] };
      }
      if (st.hasCar) {
        byBuilding[st.targetBuilding].drivers.push(st);
      } else {
        byBuilding[st.targetBuilding].passengers.push(st);
      }
    });

    const openCarGroups = [];
    const leftoverPassengers = [];

    // ---------------------------------------------------------
    // STEP 1: SAME BUILDING MATCHING (Drivers + Passengers in exact same building)
    // ---------------------------------------------------------
    Object.keys(byBuilding).forEach((bCode) => {
      const bucket = byBuilding[bCode];
      const bDrivers = [...bucket.drivers];
      const bPassengers = [...bucket.passengers];

      // Create a car group for each driver in this building
      const carsInBuilding = bDrivers.map((drv) => ({
        id: `car_${drv.phone}_${slotKey}`,
        type: 'CAR',
        driver: drv,
        members: [drv], // Driver occupies 1 of the 5 seats
        capacity: 5,
        primaryBuilding: bCode,
        buildingsSet: new Set([bCode]),
        facultyId: facId,
        facultyName: facName,
        facultyBadge: facBadge,
        matchTier: 'SAME_BUILDING',
      }));

      // Fill these building cars with passengers going to the exact same building
      let carIdx = 0;
      while (bPassengers.length > 0 && carIdx < carsInBuilding.length) {
        const currentCar = carsInBuilding[carIdx];
        if (currentCar.members.length < 5) {
          const pax = bPassengers.shift();
          currentCar.members.push(pax);
        } else {
          carIdx++;
        }
      }

      // If there are still multiple drivers in the same building with spare capacity and no passengers left,
      // keep them open for same-faculty passengers in Step 2
      carsInBuilding.forEach((c) => {
        if (c.members.length < 5) {
          openCarGroups.push(c);
        } else {
          finalGroups.push(c);
        }
      });

      // Remaining passengers in this building without a building-driver go to the faculty overflow pool
      leftoverPassengers.push(...bPassengers);
    });

    // ---------------------------------------------------------
    // STEP 2: SAME FACULTY CARPOOL FILLING
    // Fill remaining seats in openCarGroups using leftoverPassengers from the same faculty
    // ---------------------------------------------------------
    let openCarIdx = 0;
    while (leftoverPassengers.length > 0 && openCarIdx < openCarGroups.length) {
      const car = openCarGroups[openCarIdx];
      if (car.members.length < 5) {
        const pax = leftoverPassengers.shift();
        car.members.push(pax);
        car.buildingsSet.add(pax.targetBuilding);
        if (car.buildingsSet.size > 1) {
          car.matchTier = 'SAME_FACULTY';
        }
      } else {
        openCarIdx++;
      }
    }

    // Push all open cars to finalGroups
    openCarGroups.forEach((c) => finalGroups.push(c));

    // ---------------------------------------------------------
    // STEP 3: UBER / GRAB RIDE-SHARE GROUPING (When Drivers Run Out)
    // First group remaining passengers by Exact Building (up to 4 per Uber),
    // then combine partial groups across the Same Faculty so students split costs!
    // ---------------------------------------------------------
    if (leftoverPassengers.length > 0) {
      // Group leftover passengers by building first
      const uberByBuilding = {};
      leftoverPassengers.forEach((pax) => {
        if (!uberByBuilding[pax.targetBuilding]) uberByBuilding[pax.targetBuilding] = [];
        uberByBuilding[pax.targetBuilding].push(pax);
      });

      constfacultyRemainderForUber = [];

      Object.keys(uberByBuilding).forEach((bCode) => {
        const list = uberByBuilding[bCode];
        // Form full 4-person Uber groups for the exact same building first
        while (list.length >= 4) {
          const chunk = list.splice(0, 4);
          finalGroups.push({
            id: `uber_b_${bCode}_${chunk[0].phone}_${slotKey}`,
            type: 'UBER',
            driver: null,
            members: chunk,
            capacity: 4,
            primaryBuilding: bCode,
            buildingsSet: new Set([bCode]),
            facultyId: facId,
            facultyName: facName,
            facultyBadge: facBadge,
            matchTier: 'SAME_BUILDING',
          });
        }
        // Remaining 1-3 passengers in this building can either stay together or merge with same-faculty peers
        constfacultyRemainderForUber.push(...list);
      });

      // Group remaining same-faculty students into Uber/Grab groups of up to 4
      while (constfacultyRemainderForUber.length > 0) {
        const chunk = constfacultyRemainderForUber.splice(0, 4);
        const bSet = new Set(chunk.map((m) => m.targetBuilding));
        finalGroups.push({
          id: `uber_f_${facId}_${chunk[0].phone}_${slotKey}`,
          type: 'UBER',
          driver: null,
          members: chunk,
          capacity: 4,
          primaryBuilding: Array.from(bSet).join(', '),
          buildingsSet: bSet,
          facultyId: facId,
          facultyName: facName,
          facultyBadge: facBadge,
          matchTier: bSet.size === 1 ? 'SAME_BUILDING' : 'SAME_FACULTY',
        });
      }
    }
  });

  // Sort so CAR groups appear first, then UBER groups, and Same Building before Same Faculty
  return finalGroups.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'CAR' ? -1 : 1;
    if (a.matchTier !== b.matchTier) return a.matchTier === 'SAME_BUILDING' ? -1 : 1;
    return b.members.length - a.members.length;
  });
}

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Firebase Auth User
  const [fbUser, setFbUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);

  // App Data State (Backed by Firestore / Supabase + localStorage Fallback)
  const [usersMap, setUsersMap] = useState(() => {
    const defaultAdmin = {
      phone: DEFAULT_ADMIN_PHONE,
      passcode: DEFAULT_ADMIN_PASS,
      name: 'Head Admin (Apartment Manager)',
      role: 'admin',
      hasCar: true,
      schedule: { ...IMAGE_PRESET_SCHEDULE },
    };
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed[DEFAULT_ADMIN_PHONE]) {
          parsed[DEFAULT_ADMIN_PHONE] = defaultAdmin;
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return { [DEFAULT_ADMIN_PHONE]: defaultAdmin };
  });

  const [faculties, setFaculties] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FACULTIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_FACULTIES;
  });

  const [buildings, setBuildings] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BUILDINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BUILDINGS;
  });

  // Optional Supabase REST Cloud Sync Config (for Vercel 100-user free deployment)
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    try {
      const envUrl =
        typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
          ? import.meta.env.VITE_SUPABASE_URL
          : '';
      const envKey =
        typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY
          ? import.meta.env.VITE_SUPABASE_ANON_KEY
          : '';
      if (envUrl && envKey) return { url: envUrl, anonKey: envKey };

      const saved = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return { url: '', anonKey: '' };
  });

  const [showVercelModal, setShowVercelModal] = useState(false);

  // Logged-in Student / Admin State
  const [currentUserPhone, setCurrentUserPhone] = useState(null);
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' | 'groupings' | 'admin'

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPasscode, setLoginPasscode] = useState('');
  const [loginName, setLoginName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  // Timetable Modal / Interaction State
  const [selectedCell, setSelectedCell] = useState(null); // { dayId, slotId }
  const [spanSlots, setSpanSlots] = useState(1);
  const [showTUESCoCurriculum, setShowTUESCoCurriculum] = useState(true);

  // Groupings Filter State
  const [selectedDay, setSelectedDay] = useState('MON');
  const [selectedSlot, setSelectedSlot] = useState('ALL'); // 'ALL' or slotId number
  const [firstClassOnly, setFirstClassOnly] = useState(false);

  // Admin Portal Form State
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newBuildingCode, setNewBuildingCode] = useState('');
  const [newBuildingLabel, setNewBuildingLabel] = useState('');
  const [newBuildingFaculty, setNewBuildingFaculty] = useState('FKE');
  const [newFacultyId, setNewFacultyId] = useState('');
  const [newFacultyName, setNewFacultyName] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.msg === msg ? null : prev));
    }, 3500);
  };

  // ==========================================
  // 1. FIREBASE AUTHENTICATION INITIALIZATION
  // ==========================================
  useEffect(() => {
    if (!auth) {
      setIsSyncing(false);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setIsSyncing(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      if (!u) setIsSyncing(false);
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // 2. FIRESTORE REAL-TIME LISTENERS
  // ==========================================
  useEffect(() => {
    if (!fbUser || !db) return;

    const usersCol = collection(db, 'artifacts', appId, 'public', 'data', 'unipool_users');
    const configCol = collection(db, 'artifacts', appId, 'public', 'data', 'unipool_config');

    const unsubUsers = onSnapshot(
      usersCol,
      (snapshot) => {
        const loadedUsers = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.phone) {
            loadedUsers[data.phone] = {
              ...data,
              schedule:
                typeof data.schedule === 'string'
                  ? JSON.parse(data.schedule || '{}')
                  : data.schedule || {},
            };
          }
        });

        // Ensure default admin account 0199080269 / 4321 always exists
        if (!loadedUsers[DEFAULT_ADMIN_PHONE]) {
          const defaultAdminObj = {
            phone: DEFAULT_ADMIN_PHONE,
            passcode: DEFAULT_ADMIN_PASS,
            name: 'Head Admin (0199080269)',
            role: 'admin',
            hasCar: true,
            schedule: { ...IMAGE_PRESET_SCHEDULE },
          };
          loadedUsers[DEFAULT_ADMIN_PHONE] = defaultAdminObj;
          setDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'unipool_users', DEFAULT_ADMIN_PHONE),
            {
              ...defaultAdminObj,
              schedule: JSON.stringify(defaultAdminObj.schedule),
            }
          ).catch(() => {});
        }

        setUsersMap(loadedUsers);
        setIsSyncing(false);
      },
      (err) => {
        console.error('Users snapshot error:', err);
        setIsSyncing(false);
      }
    );

    const unsubConfig = onSnapshot(
      configCol,
      (snapshot) => {
        let hasFaculties = false;
        let hasBuildings = false;

        snapshot.forEach((docSnap) => {
          if (docSnap.id === 'faculties_doc') {
            const raw = docSnap.data()?.list;
            if (raw) {
              setFaculties(typeof raw === 'string' ? JSON.parse(raw) : raw);
              hasFaculties = true;
            }
          }
          if (docSnap.id === 'buildings_doc') {
            const raw = docSnap.data()?.map;
            if (raw) {
              setBuildings(typeof raw === 'string' ? JSON.parse(raw) : raw);
              hasBuildings = true;
            }
          }
        });

        if (!hasFaculties) {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'unipool_config', 'faculties_doc'), {
            list: JSON.stringify(DEFAULT_FACULTIES),
          }).catch(() => {});
        }
        if (!hasBuildings) {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'unipool_config', 'buildings_doc'), {
            map: JSON.stringify(DEFAULT_BUILDINGS),
          }).catch(() => {});
        }
      },
      (err) => {
        console.error('Config snapshot error:', err);
      }
    );

    return () => {
      unsubUsers();
      unsubConfig();
    };
  }, [fbUser]);

  // ==========================================
  // PERSISTENCE HELPERS
  // ==========================================
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersMap));
    } catch (e) {
      console.error(e);
    }
  }, [usersMap]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FACULTIES_KEY, JSON.stringify(faculties));
    } catch (e) {
      console.error(e);
    }
  }, [faculties]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BUILDINGS_KEY, JSON.stringify(buildings));
    } catch (e) {
      console.error(e);
    }
  }, [buildings]);

  // Optional Supabase Cloud Sync Fetcher
  const syncFromSupabase = async (cfg = supabaseConfig) => {
    if (!cfg?.url || !cfg?.anonKey) return;
    const baseUrl = cfg.url.replace(/\/$/, '');
    const headers = {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      'Content-Type': 'application/json',
    };
    try {
      const res = await fetch(`${baseUrl}/rest/v1/unipool_state?id=eq.main&select=*`, {
        headers,
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].payload) {
          const payload = rows[0].payload;
          if (payload.usersMap) {
            payload.usersMap[DEFAULT_ADMIN_PHONE] = payload.usersMap[DEFAULT_ADMIN_PHONE] || {
              phone: DEFAULT_ADMIN_PHONE,
              passcode: DEFAULT_ADMIN_PASS,
              name: 'Head Admin',
              role: 'admin',
              hasCar: true,
              schedule: { ...IMAGE_PRESET_SCHEDULE },
            };
            setUsersMap(payload.usersMap);
          }
          if (payload.faculties) setFaculties(payload.faculties);
          if (payload.buildings) setBuildings(payload.buildings);
        }
      }
    } catch (err) {
      console.error('Supabase sync error:', err);
    }
  };

  const pushToSupabase = async (nextUsers, nextFaculties, nextBuildings, cfg = supabaseConfig) => {
    if (!cfg?.url || !cfg?.anonKey) return;
    const baseUrl = cfg.url.replace(/\/$/, '');
    const headers = {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    };
    try {
      await fetch(`${baseUrl}/rest/v1/unipool_state`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: 'main',
          payload: {
            usersMap: nextUsers,
            faculties: nextFaculties,
            buildings: nextBuildings,
            updatedAt: new Date().toISOString(),
          },
        }),
      });
    } catch (err) {
      console.error('Supabase push error:', err);
    }
  };

  useEffect(() => {
    if (supabaseConfig?.url && supabaseConfig?.anonKey) {
      syncFromSupabase(supabaseConfig);
    }
  }, []);

  const saveUserRecord = async (userObj) => {
    const nextUsers = {
      ...usersMap,
      [userObj.phone]: userObj,
    };
    setUsersMap(nextUsers);
    pushToSupabase(nextUsers, faculties, buildings);

    if (fbUser && db) {
      try {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'unipool_users', userObj.phone),
          {
            ...userObj,
            schedule: JSON.stringify(userObj.schedule || {}),
          }
        );
      } catch (err) {
        console.error('Error saving user:', err);
      }
    }
  };

  const saveFacultiesConfig = async (newFaculties) => {
    setFaculties(newFaculties);
    pushToSupabase(usersMap, newFaculties, buildings);
    if (fbUser && db) {
      try {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'unipool_config', 'faculties_doc'),
          { list: JSON.stringify(newFaculties) }
        );
      } catch (err) {
        console.error('Error saving faculties:', err);
      }
    }
  };

  const saveBuildingsConfig = async (newBuildings) => {
    setBuildings(newBuildings);
    pushToSupabase(usersMap, faculties, newBuildings);
    if (fbUser && db) {
      try {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'unipool_config', 'buildings_doc'),
          { map: JSON.stringify(newBuildings) }
        );
      } catch (err) {
        console.error('Error saving buildings:', err);
      }
    }
  };

  // ==========================================
  // CURRENT USER OBJECT
  // ==========================================
  const currentUser = useMemo(() => {
    if (!currentUserPhone) return null;
    return usersMap[currentUserPhone] || null;
  }, [currentUserPhone, usersMap]);

  // ==========================================
  // AUTHENTICATION HANDLERS
  // ==========================================
  const handleLoginOrRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');

    const cleanPhone = loginPhone.trim().replace(/[\s-]/g, '');
    const cleanPass = loginPasscode.trim();

    if (!cleanPhone || cleanPhone.length < 6) {
      setAuthError('Please enter a valid phone number (e.g., 0123456789).');
      return;
    }
    if (!cleanPass) {
      setAuthError('Please enter a passcode.');
      return;
    }

    // Special check for hardcoded admin credentials
    if (cleanPhone === DEFAULT_ADMIN_PHONE && cleanPass === DEFAULT_ADMIN_PASS) {
      const existingAdmin = usersMap[DEFAULT_ADMIN_PHONE] || {
        phone: DEFAULT_ADMIN_PHONE,
        passcode: DEFAULT_ADMIN_PASS,
        name: loginName.trim() || 'Head Admin',
        role: 'admin',
        hasCar: true,
        schedule: { ...IMAGE_PRESET_SCHEDULE },
      };
      const updatedAdmin = { ...existingAdmin, role: 'admin', passcode: DEFAULT_ADMIN_PASS };
      await saveUserRecord(updatedAdmin);
      setCurrentUserPhone(DEFAULT_ADMIN_PHONE);
      showToast('Welcome, Administrator!');
      return;
    }

    const existingUser = usersMap[cleanPhone];

    if (existingUser) {
      // Verify passcode
      if (String(existingUser.passcode) !== String(cleanPass)) {
        setAuthError('Incorrect passcode for this phone number. Please try again.');
        return;
      }
      setCurrentUserPhone(cleanPhone);
      showToast(`Welcome back, ${existingUser.name || cleanPhone}!`);
    } else {
      // First login! Create account automatically with their chosen passcode
      const newStudent = {
        phone: cleanPhone,
        passcode: cleanPass,
        name: loginName.trim() || `Student (${cleanPhone.slice(-4)})`,
        role: 'student',
        hasCar: false,
        schedule: {},
      };
      await saveUserRecord(newStudent);
      setCurrentUserPhone(cleanPhone);
      showToast('Account created with your new passcode! Set up your timetable below.');
    }
  };

  const handleLogout = () => {
    setCurrentUserPhone(null);
    setLoginPhone('');
    setLoginPasscode('');
    setLoginName('');
    setActiveTab('timetable');
  };

  // ==========================================
  // TIMETABLE INTERACTION HANDLERS
  // ==========================================
  const handleToggleCarStatus = async (hasCarVal) => {
    if (!currentUser) return;
    const updated = { ...currentUser, hasCar: hasCarVal };
    await saveUserRecord(updated);
    showToast(
      hasCarVal
        ? 'Driver Mode ON: Your car fits up to 5 students (You + 4 Passengers).'
        : 'Passenger Mode ON: You will be matched with drivers or Uber/Grab groups.'
    );
  };

  const handleAssignBuildingToSlot = async (buildingCode) => {
    if (!currentUser || !selectedCell) return;
    const { dayId, slotId } = selectedCell;
    const newSchedule = { ...(currentUser.schedule || {}) };

    // Assign for the selected number of consecutive slots (skipping break slot 7)
    let slotsRemaining = spanSlots;
    let currentSlot = slotId;

    while (slotsRemaining > 0 && currentSlot <= 13) {
      const isFriExtendedBreak = dayId === 'FRI' && (currentSlot === 6 || currentSlot === 7 || currentSlot === 8);
      if (currentSlot !== 7 && !isFriExtendedBreak) {
        if (buildingCode === null) {
          delete newSchedule[`${dayId}_${currentSlot}`];
        } else {
          newSchedule[`${dayId}_${currentSlot}`] = buildingCode;
        }
        slotsRemaining--;
      }
      currentSlot++;
    }

    const updated = { ...currentUser, schedule: newSchedule };
    await saveUserRecord(updated);
    setSelectedCell(null);
    setSpanSlots(1);
  };

  const handleLoadImagePresetForCurrentUser = async () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      schedule: { ...IMAGE_PRESET_SCHEDULE },
    };
    await saveUserRecord(updated);
    showToast('Loaded the SKEL (A23KE) image schedule into your timetable!');
  };

  const handleClearMySchedule = async () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      schedule: {},
    };
    await saveUserRecord(updated);
    showToast('Cleared your timetable.');
  };

  // ==========================================
  // DEMO DATA SEEDER (FOR IMMEDIATE TESTING)
  // ==========================================
  const handleSeedDemoStudents = async () => {
    const updatedMap = { ...usersMap };
    for (const demoUser of DEMO_USERS_LIST) {
      updatedMap[demoUser.phone] = demoUser;
      if (fbUser && db) {
        try {
          await setDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'unipool_users', demoUser.phone),
            {
              ...demoUser,
              schedule: JSON.stringify(demoUser.schedule),
            }
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
    setUsersMap(updatedMap);
    showToast('Loaded 10 Demo Apartment Students (Drivers & Passengers) for Carpool & Uber testing!');
  };

  // ==========================================
  // ADMIN PORTAL HANDLERS
  // ==========================================
  const handleCreateOrPromoteAdmin = async (e) => {
    e.preventDefault();
    const cleanPhone = newAdminPhone.trim().replace(/[\s-]/g, '');
    const cleanPass = newAdminPass.trim();
    if (!cleanPhone || !cleanPass) {
      showToast('Please enter both a phone number and passcode for the admin.', 'error');
      return;
    }

    const existing = usersMap[cleanPhone];
    const adminObj = {
      phone: cleanPhone,
      passcode: cleanPass,
      name: newAdminName.trim() || existing?.name || `Admin (${cleanPhone.slice(-4)})`,
      role: 'admin',
      hasCar: existing?.hasCar ?? false,
      schedule: existing?.schedule || {},
    };

    await saveUserRecord(adminObj);
    setNewAdminPhone('');
    setNewAdminPass('');
    setNewAdminName('');
    showToast(`Admin privileges granted to ${cleanPhone}!`);
  };

  const handleToggleUserAdminRole = async (targetUser) => {
    if (targetUser.phone === DEFAULT_ADMIN_PHONE) {
      showToast('Primary Admin (0199080269) cannot be demoted.', 'error');
      return;
    }
    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin';
    await saveUserRecord({ ...targetUser, role: nextRole });
    showToast(`Updated ${targetUser.phone} role to ${nextRole.toUpperCase()}.`);
  };

  const handleDeleteUser = async (phoneToDelete) => {
    if (phoneToDelete === DEFAULT_ADMIN_PHONE) {
      showToast('Cannot delete the primary admin account.', 'error');
      return;
    }
    setUsersMap((prev) => {
      const copy = { ...prev };
      delete copy[phoneToDelete];
      return copy;
    });
    if (fbUser && db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'unipool_users', phoneToDelete));
      } catch (e) {
        console.error(e);
      }
    }
    showToast(`Removed user ${phoneToDelete}.`);
  };

  const handleAddOrUpdateBuilding = async (e) => {
    e.preventDefault();
    const code = newBuildingCode.trim();
    if (!code) return;
    const label = newBuildingLabel.trim() || code;
    const updated = {
      ...buildings,
      [code]: {
        code,
        label,
        facultyId: newBuildingFaculty,
      },
    };
    await saveBuildingsConfig(updated);
    setNewBuildingCode('');
    setNewBuildingLabel('');
    showToast(`Building "${code}" assigned to ${newBuildingFaculty}.`);
  };

  const handleReassignBuildingFaculty = async (buildingCode, newFacId) => {
    const existing = buildings[buildingCode];
    if (!existing) return;
    const updated = {
      ...buildings,
      [buildingCode]: {
        ...existing,
        facultyId: newFacId,
      },
    };
    await saveBuildingsConfig(updated);
    showToast(`Reassigned ${buildingCode} to ${newFacId}.`);
  };

  const handleDeleteBuilding = async (buildingCode) => {
    const updated = { ...buildings };
    delete updated[buildingCode];
    await saveBuildingsConfig(updated);
    showToast(`Deleted building ${buildingCode}.`);
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    const id = newFacultyId.trim().toUpperCase();
    const name = newFacultyName.trim();
    if (!id || !name) return;

    const paletteOptions = [
      {
        color: 'bg-indigo-100 border-indigo-400 text-indigo-950',
        badge: 'bg-indigo-600 text-white',
        lightBg: '#e0e7ff',
      },
      {
        color: 'bg-rose-100 border-rose-400 text-rose-950',
        badge: 'bg-rose-600 text-white',
        lightBg: '#ffe4e6',
      },
      {
        color: 'bg-teal-100 border-teal-400 text-teal-950',
        badge: 'bg-teal-600 text-white',
        lightBg: '#ccfbf1',
      },
    ];
    const chosenPalette = paletteOptions[faculties.length % paletteOptions.length];

    const updated = [
      ...faculties.filter((f) => f.id !== id),
      {
        id,
        name,
        ...chosenPalette,
      },
    ];
    await saveFacultiesConfig(updated);
    setNewFacultyId('');
    setNewFacultyName('');
    setNewBuildingFaculty(id);
    showToast(`Added faculty ${id}: ${name}`);
  };

  // ==========================================
  // HELPER COMPUTATIONS FOR UI
  // ==========================================
  const allUsersList = useMemo(() => Object.values(usersMap), [usersMap]);

  const facultyMap = useMemo(() => {
    const map = {};
    faculties.forEach((f) => {
      map[f.id] = f;
    });
    return map;
  }, [faculties]);

  // Groupings for the currently selected Day & Slot filter
  const activeDayGroupings = useMemo(() => {
    const slotsToCompute =
      selectedSlot === 'ALL'
        ? SLOTS.filter((s) => !s.isBreak).map((s) => s.id)
        : [Number(selectedSlot)];

    const resultsBySlot = [];
    slotsToCompute.forEach((sId) => {
      const slotMeta = SLOTS.find((s) => s.id === sId);
      const groups = computeGroupingsForSlot(
        allUsersList,
        selectedDay,
        sId,
        buildings,
        faculties,
        firstClassOnly
      );
      if (groups.length > 0 || selectedSlot !== 'ALL') {
        resultsBySlot.push({
          slotId: sId,
          timeLabel: slotMeta?.time || '',
          groups,
        });
      }
    });
    return resultsBySlot;
  }, [allUsersList, selectedDay, selectedSlot, buildings, faculties, firstClassOnly]);

  // ==========================================
  // VIEW 1: LOGIN / REGISTRATION SCREEN
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
        {/* Top Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.msg}</span>
          </div>
        )}

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-white/15 backdrop-blur rounded-xl">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">UniPool Residence</h1>
                  <p className="text-xs text-indigo-100">
                    Apartment Carpool &amp; Uber/Grab Split Matcher
                  </p>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">
                5 Seats / Car
              </span>
            </div>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Matches students in the same apartment complex by <strong>1. Time Slot</strong> &rarr;{' '}
              <strong>2. Same Building</strong> &rarr; <strong>3. Same Faculty</strong>.
            </p>
          </div>

          {/* Login / First-Login Passcode Creation Form */}
          <form onSubmit={handleLoginOrRegister} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Phone Number (Login ID)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 0123456789"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Passcode (Created on 1st Login)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter your passcode"
                  value={loginPasscode}
                  onChange={(e) => setLoginPasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                First time logging in? The passcode you enter now will be saved for your number.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Display Name / Apartment Unit (Optional on 1st Login)
              </label>
              <input
                type="text"
                placeholder="e.g. Amir (Block B-10)"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authNotice && (
              <div className="p-3 bg-indigo-950/80 border border-indigo-700 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{authNotice}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In / Register Passcode</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED MAIN APPLICATION
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium text-white transition-all ${
            toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight">UniPool</h1>
                <span className="text-[11px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  Apartment Carpool
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Time &rarr; Building &rarr; Faculty Matcher (5 Students / Car or Uber Split)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'timetable'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1. My Timetable</span>
            </button>

            <button
              onClick={() => setActiveTab('groupings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'groupings'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>2. Groupings ({allUsersList.length} Students)</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-amber-300 hover:text-amber-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>

          {/* Current User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-white">
                  {currentUser.name}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-end gap-1.5">
                <span>{currentUser.phone}</span>
                <span>&bull;</span>
                <span className={currentUser.hasCar ? 'text-emerald-400 font-semibold' : 'text-sky-400'}>
                  {currentUser.hasCar ? 'Driver (5 Seats)' : 'Passenger'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 space-y-6">
        {/* ============================================================
            TAB 1: STUDENT TIMETABLE (REPLICATING UPLOADED IMAGE LAYOUT)
           ============================================================ */}
        {activeTab === 'timetable' && (
          <div className="space-y-5">
            {/* Driver / Car Ownership Banner + Preset Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Vehicle &amp; Commute Status
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                    Courses Ignored &bull; Buildings &amp; Times Only
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Do you have a car at the apartment complex? Every car fits{' '}
                  <strong>5 students total (You + 4 Passengers)</strong>.
                </p>
              </div>

              {/* Toggle Switch for Car Owner */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleToggleCarStatus(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                      currentUser.hasCar
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>I Have a Car (Driver • Fits 5)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCarStatus(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                      !currentUser.hasCar
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>No Car (Passenger / Uber Split)</span>
                  </button>
                </div>

                {/* Quick Preset Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadImagePresetForCurrentUser}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Load Image Schedule (SKEL)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearMySchedule}
                    className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Faculty Colour Legend */}
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Faculty Legend:
                </span>
                {faculties.map((f) => (
                  <span
                    key={f.id}
                    className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${f.color}`}
                  >
                    {f.id}: {f.name}
                  </span>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showTUESCoCurriculum}
                  onChange={(e) => setShowTUESCoCurriculum(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show TUES Afternoon &ldquo;CO-CURRICULUM&rdquo; Banner</span>
              </label>
            </div>

            {/* TIMETABLE GRID MATCHING UPLOADED UNIVERSITY SCHEDULE IMAGE */}
            <div className="bg-white rounded-2xl shadow-md border-2 border-slate-800 overflow-hidden">
              {/* Top Schedule Title Bar replicating "SKEL (A23KE INTAKE SEM2 & DIP A24KE)" */}
              <div className="bg-slate-50 border-b-2 border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="font-serif italic font-black text-base sm:text-xl tracking-wide text-slate-900">
                  UNIVERSITY TIMETABLE &mdash; BUILDING &amp; TIME SCHEDULE ({currentUser.name})
                </div>
                <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Click any time slot cell to set or change your Building</span>
                </div>
              </div>

              {/* Scrollable Grid Container */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[980px] table-fixed">
                  <thead>
                    {/* Row 1: Slot Numbers (2 through 13) */}
                    <tr className="border-b border-slate-400 bg-white text-center text-xs font-bold text-slate-900">
                      <th className="w-24 border-r-2 border-slate-800 py-1.5 bg-slate-50"></th>
                      {SLOTS.map((slot) => (
                        <th
                          key={slot.id}
                          className={`py-1.5 border-r border-slate-400 ${
                            slot.isBreak ? 'bg-neutral-300 border-x-2 border-slate-800' : ''
                          }`}
                        >
                          {slot.id}
                        </th>
                      ))}
                    </tr>
                    {/* Row 2: Time Ranges (8.00-8.50 through 2000-2250) */}
                    <tr className="border-b-2 border-slate-800 bg-white text-center text-[11px] font-medium text-slate-800">
                      <th className="border-r-2 border-slate-800 py-1.5 bg-slate-50 uppercase tracking-wider font-bold text-xs">
                        DAY / TIME
                      </th>
                      {SLOTS.map((slot) => (
                        <th
                          key={slot.id}
                          className={`py-1.5 px-1 border-r border-slate-400 font-normal ${
                            slot.isBreak ? 'bg-neutral-300 border-x-2 border-slate-800 font-semibold' : ''
                          }`}
                        >
                          {slot.time}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {DAYS.map((day) => {
                      return (
                        <tr key={day.id} className="border-b-2 border-slate-800 h-24">
                          {/* Day Header Cell (MON, TUES, WED, THURS, FRI) */}
                          <td className="border-r-2 border-slate-800 bg-white text-center font-serif font-medium text-sm sm:text-base text-slate-900 select-none">
                            {day.label}
                          </td>

                          {/* Render Slots 2 through 13 */}
                          {SLOTS.map((slot) => {
                            // Special Case 1: FRIDAY Extended Break (Slots 6, 7, 8 merged into "K" break block like the image)
                            if (day.id === 'FRI' && slot.id === 6) {
                              return (
                                <td
                                  key={slot.id}
                                  colSpan={3}
                                  className="bg-neutral-300 border-x-2 border-slate-800 text-center align-middle select-none"
                                >
                                  <div className="font-bold text-base text-slate-900 tracking-widest">
                                    K
                                  </div>
                                  <div className="text-[10px] text-slate-600 font-medium">
                                    FRIDAY BREAK (12.00-14.50)
                                  </div>
                                </td>
                              );
                            }
                            if (day.id === 'FRI' && (slot.id === 7 || slot.id === 8)) {
                              return null; // Covered by colSpan=3 on FRI slot 6
                            }

                            // Special Case 2: Standard Slot 7 Break Column (B, R, E, A)
                            if (slot.isBreak) {
                              return (
                                <td
                                  key={slot.id}
                                  className="bg-neutral-300 border-x-2 border-slate-800 text-center align-middle select-none"
                                >
                                  <span className="font-bold text-base text-slate-900">
                                    {day.breakLetter}
                                  </span>
                                </td>
                              );
                            }

                            // Special Case 3: TUESDAY Afternoon Co-Curriculum (Slots 8-13) if toggled on & no building assigned
                            const hasTuesAfternoonBuilding =
                              day.id === 'TUES' &&
                              [8, 9, 10, 11, 12, 13].some(
                                (s) => currentUser.schedule?.[`TUES_${s}`]
                              );

                            if (
                              day.id === 'TUES' &&
                              showTUESCoCurriculum &&
                              !hasTuesAfternoonBuilding &&
                              slot.id === 8
                            ) {
                              return (
                                <td
                                  key={slot.id}
                                  colSpan={6}
                                  onClick={() => {
                                    setSelectedCell({ dayId: day.id, slotId: 8 });
                                    setSpanSlots(1);
                                  }}
                                  className="bg-neutral-300 hover:bg-neutral-200 border-r border-slate-500 text-center align-middle cursor-pointer transition group"
                                >
                                  <div className="font-bold text-sm sm:text-base text-slate-900 tracking-wide">
                                    CO-CURRICULUM
                                  </div>
                                  <div className="text-[10px] text-slate-700 opacity-0 group-hover:opacity-100 transition">
                                    Click to assign a specific building
                                  </div>
                                </td>
                              );
                            }
                            if (
                              day.id === 'TUES' &&
                              showTUESCoCurriculum &&
                              !hasTuesAfternoonBuilding &&
                              slot.id > 8
                            ) {
                              return null;
                            }

                            // Standard Timetable Slot Cell
                            const cellKey = `${day.id}_${slot.id}`;
                            const assignedBuildingCode = currentUser.schedule?.[cellKey];
                            const buildingObj = assignedBuildingCode
                              ? buildings[assignedBuildingCode] || {
                                  code: assignedBuildingCode,
                                  label: assignedBuildingCode,
                                  facultyId: 'UNASSIGNED',
                                }
                              : null;
                            const facultyObj = buildingObj
                              ? facultyMap[buildingObj.facultyId]
                              : null;

                            return (
                              <td
                                key={slot.id}
                                onClick={() => {
                                  setSelectedCell({ dayId: day.id, slotId: slot.id });
                                  setSpanSlots(1);
                                }}
                                style={{
                                  backgroundColor: facultyObj ? facultyObj.lightBg : undefined,
                                }}
                                className={`border-r border-slate-400 p-1.5 align-middle text-center cursor-pointer transition relative group ${
                                  assignedBuildingCode
                                    ? 'hover:brightness-95'
                                    : 'bg-white hover:bg-indigo-50/60'
                                }`}
                              >
                                {/* Subtle horizontallined appearance like the original spreadsheet image */}
                                {!assignedBuildingCode && (
                                  <div className="h-full w-full flex flex-col justify-between pointer-events-none opacity-30">
                                    <div className="border-b border-slate-300 h-1/3"></div>
                                    <div className="border-b border-slate-300 h-1/3"></div>
                                    <div className="h-1/3"></div>
                                  </div>
                                )}

                                {assignedBuildingCode ? (
                                  <div className="flex flex-col items-center justify-center h-full space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/10 text-slate-900">
                                      {facultyObj ? facultyObj.id : 'FACULTY'}
                                    </span>
                                    <span className="font-bold text-xs sm:text-sm text-slate-950 leading-tight">
                                      {buildingObj.code}
                                    </span>
                                    {buildingObj.label !== buildingObj.code && (
                                      <span className="text-[10px] text-slate-700 leading-tight line-clamp-1">
                                        {buildingObj.label}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shadow-sm">
                                      + Building
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Helper Bar */}
            <div className="bg-indigo-950 text-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs sm:text-sm">
                  <strong>Want to see how multi-car &amp; Uber cost-splitting works right away?</strong>{' '}
                  Load 10 sample apartment students with overlapping building &amp; faculty schedules.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSeedDemoStudents}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow"
                >
                  Load 10 Demo Students
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('groupings')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  View Groupings &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL: SELECT BUILDING FOR TIMETABLE SLOT
           ============================================================ */}
        {selectedCell && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">
                    Select Target Building &mdash; {selectedCell.dayId} (Slot {selectedCell.slotId})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Time: {SLOTS.find((s) => s.id === selectedCell.slotId)?.time} &bull; Courses do not matter
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Duration / Consecutive Slots Selector */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">
                    Apply to consecutive hours:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setSpanSlots(cnt)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          spanSlots === cnt
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cnt} {cnt === 1 ? 'Slot (1 hr)' : `Slots (${cnt} hrs)`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buildings Grouped by Faculty */}
                <div className="space-y-4">
                  {faculties.map((fac) => {
                    const facBuildings = Object.values(buildings).filter(
                      (b) => b.facultyId === fac.id
                    );
                    if (facBuildings.length === 0) return null;

                    return (
                      <div key={fac.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${fac.badge}`}>
                            {fac.id}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{fac.name}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {facBuildings.map((b) => {
                            const isCurrent =
                              currentUser.schedule?.[`${selectedCell.dayId}_${selectedCell.slotId}`] ===
                              b.code;
                            return (
                              <button
                                key={b.code}
                                type="button"
                                onClick={() => handleAssignBuildingToSlot(b.code)}
                                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                                  isCurrent
                                    ? ' ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50'
                                    : `${fac.color} hover:brightness-95`
                                }`}
                              >
                                <div className="font-bold text-sm">{b.code}</div>
                                <div className="text-[11px] opacity-80 truncate">{b.label}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleAssignBuildingToSlot(null)}
                  className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Slot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: CARPOOL & UBER RIDE-SHARING GROUPINGS
           ============================================================ */}
        {activeTab === 'groupings' && (
          <div className="space-y-5">
            {/* Algorithm Summary & Filter Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-indigo-600" />
                    <span>Apartment Carpool &amp; Uber Split Groupings</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Students are grouped hierarchically: <strong>1. Same Time</strong> &rarr;{' '}
                    <strong>2. Same Building</strong> &rarr; <strong>3. Same Faculty</strong>. Cars
                    fit <strong>5 students (1 Driver + 4 Passengers)</strong>. Overflow students are
                    grouped to split an <strong>Uber / Grab</strong>!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSeedDemoStudents}
                    className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Load Demo Students</span>
                  </button>
                </div>
              </div>

              {/* Filter Controls: Day Selector + Time Slot Selector + Commute Mode */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Day Pills */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {DAYS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDay(d.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedDay === d.id
                          ? 'bg-slate-900 text-white shadow'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Slot Dropdown */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">Time Slot:</span>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">All Active Slots ({selectedDay})</option>
                      {SLOTS.filter((s) => !s.isBreak).map((s) => (
                        <option key={s.id} value={s.id}>
                          Slot {s.id} ({s.time})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Toggle First Departure Only vs All Classes */}
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={firstClassOnly}
                      onChange={(e) => setFirstClassOnly(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>First Departure of the Day Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Groupings Output List */}
            {activeDayGroupings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  No Student Schedules Found for {selectedDay}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Add buildings to your timetable or click &ldquo;Load Demo Students&rdquo; above to
                  test multi-student carpools and Uber cost-splitting groups.
                </p>
                <button
                  type="button"
                  onClick={handleSeedDemoStudents}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                >
                  Load 10 Demo Apartment Students
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {activeDayGroupings.map((slotBlock) => (
                  <div
                    key={slotBlock.slotId}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    {/* Slot Header Banner */}
                    <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          {selectedDay} &bull; SLOT {slotBlock.slotId}
                        </span>
                        <span className="text-sm font-bold tracking-wide">
                          {slotBlock.timeLabel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        {slotBlock.groups.reduce((acc, g) => acc + g.members.length, 0)} Students
                        Matched into {slotBlock.groups.length} Ride Group(s)
                      </div>
                    </div>

                    {/* Ride Groups Grid */}
                    {slotBlock.groups.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No students scheduled for Slot {slotBlock.slotId} ({slotBlock.timeLabel}).
                      </div>
                    ) : (
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {slotBlock.groups.map((grp, idx) => {
                          const isCar = grp.type === 'CAR';
                          const isMyGroup = grp.members.some(
                            (m) => m.phone === currentUser.phone
                          );
                          const splitCount = grp.members.length;
                          const splitPct = Math.round(100 / splitCount);

                          return (
                            <div
                              key={grp.id || idx}
                              className={`rounded-2xl border-2 p-4 flex flex-col justify-between space-y-4 transition ${
                                isMyGroup
                                  ? 'border-indigo-600 bg-indigo-50/30 shadow-md'
                                  : isCar
                                  ? 'border-emerald-200 bg-emerald-50/20'
                                  : 'border-amber-300 bg-amber-50/30'
                              }`}
                            >
                              {/* Top Badges & Group Header */}
                              <div className="space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {isCar ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                                        <Car className="w-3.5 h-3.5" />
                                        <span>STUDENT CARPOOL ({grp.members.length}/5 Seats)</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-xs">
                                        <Navigation className="w-3.5 h-3.5" />
                                        <span>
                                          UBER / GRAB RIDE ({grp.members.length}/4 Riders)
                                        </span>
                                      </span>
                                    )}

                                    {isMyGroup && (
                                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-indigo-600 text-white">
                                        YOU ARE IN THIS GROUP
                                      </span>
                                    )}
                                  </div>

                                  {/* Match Priority Tier Badge */}
                                  <span
                                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                      grp.matchTier === 'SAME_BUILDING'
                                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                                        : 'bg-sky-100 text-sky-900 border-sky-300'
                                    }`}
                                  >
                                    {grp.matchTier === 'SAME_BUILDING'
                                      ? 'Tier 1: Exact Same Building'
                                      : 'Tier 2: Same Faculty Combined'}
                                  </span>
                                </div>

                                {/* Destination Faculty & Buildings Summary */}
                                <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${grp.facultyBadge}`}
                                    >
                                      {grp.facultyId}
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                      Drop-off Building(s):{' '}
                                      <strong className="text-indigo-700">
                                        {Array.from(grp.buildingsSet).join(' → ')}
                                      </strong>
                                    </span>
                                  </div>

                                  {!isCar && (
                                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                      Split {splitCount} way{splitCount > 1 ? 's' : ''} ({splitPct}%
                                      each)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Members List (Driver + Passengers) */}
                              <div className="space-y-1.5">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  Group Members &amp; Contact Numbers:
                                </div>
                                <div className="divide-y divide-slate-200/70 bg-white rounded-xl border border-slate-200 overflow-hidden">
                                  {grp.members.map((member) => {
                                    const isDriver = isCar && grp.driver?.phone === member.phone;
                                    const isMe = member.phone === currentUser.phone;
                                    return (
                                      <div
                                        key={member.phone}
                                        className={`px-3 py-2 flex items-center justify-between text-xs ${
                                          isDriver ? 'bg-emerald-50/70' : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`w-2 h-2 rounded-full ${
                                              isDriver ? 'bg-emerald-600' : 'bg-indigo-500'
                                            }`}
                                          ></span>
                                          <div>
                                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                              <span>{member.name}</span>
                                              {isMe && (
                                                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                                                  You
                                                </span>
                                              )}
                                              {isDriver && (
                                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                                                  DRIVER
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-mono">
                                              Tel: {member.phone}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="text-right">
                                          <span className="inline-block font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                                            Bldg: {member.targetBuilding}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Footer Callout */}
                              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                                {isCar ? (
                                  <span>
                                    Driver: <strong>{grp.driver?.name}</strong> ({grp.driver?.phone})
                                  </span>
                                ) : (
                                  <span>
                                    No drivers left for this slot &mdash; Book 1 Uber/Grab together!
                                  </span>
                                )}
                                <span>
                                  {grp.capacity - grp.members.length} seat(s) open
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 3: ADMIN PORTAL (FOR 0199080269 & PROMOTED ADMINS)
           ============================================================ */}
        {activeTab === 'admin' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            {/* Admin Welcome Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold">Administrator Control Panel</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Signed in as <strong>{currentUser.phone}</strong>. Configure which buildings
                  belong to which faculty, manage admins, or export for Vercel deployment.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowVercelModal(true)}
                  className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Vercel Export &amp; Cloud Setup (100 Users)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSeedDemoStudents}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  Seed / Reset 10 Demo Students
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION A: MANAGE BUILDINGS & ASSIGN TO FACULTIES */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <span>Assign Buildings to Faculties</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set which university buildings belong to which faculty for Tier-2 carpool
                    matching.
                  </p>
                </div>

                {/* Add New Building Form */}
                <form
                  onSubmit={handleAddOrUpdateBuilding}
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3"
                >
                  <div className="text-xs font-bold text-slate-700">
                    Add or Update a Building Mapping
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Code (e.g. P19a)"
                      value={newBuildingCode}
                      onChange={(e) => setNewBuildingCode(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g. P19a BT9)"
                      value={newBuildingLabel}
                      onChange={(e) => setNewBuildingLabel(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={newBuildingFaculty}
                      onChange={(e) => setNewBuildingFaculty(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.id} - {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Building to Faculty</span>
                  </button>
                </form>

                {/* Add New Faculty Form */}
                <form
                  onSubmit={handleAddFaculty}
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5"
                >
                  <div className="text-xs font-bold text-slate-700">Create New Faculty</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Short ID (e.g. FS)"
                      value={newFacultyId}
                      onChange={(e) => setNewFacultyId(e.target.value)}
                      className="sm:w-28 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Full Faculty Name (e.g. Faculty of Science)"
                      value={newFacultyName}
                      onChange={(e) => setNewFacultyName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                    >
                      Add Faculty
                    </button>
                  </div>
                </form>

                {/* Existing Buildings List with Instant Faculty Dropdown Reassignment */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {Object.values(buildings).map((b) => {
                    const fac = facultyMap[b.facultyId];
                    return (
                      <div
                        key={b.code}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              fac ? fac.badge : 'bg-slate-600 text-white'
                            }`}
                          >
                            {b.code}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{b.label}</div>
                            <div className="text-[11px] text-slate-500">
                              Faculty: {fac ? fac.name : b.facultyId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={b.facultyId}
                            onChange={(e) =>
                              handleReassignBuildingFaculty(b.code, e.target.value)
                            }
                            className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                          >
                            {faculties.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.id}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteBuilding(b.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Delete building"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION B: MANAGE ADMIN ACCOUNTS & REGISTERED USERS */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    <span>Create &amp; Manage Admin Accounts</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create new admin accounts with a phone number and passcode, or promote existing
                    students.
                  </p>
                </div>

                {/* Create New Admin Form */}
                <form
                  onSubmit={handleCreateOrPromoteAdmin}
                  className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 space-y-3"
                >
                  <div className="text-xs font-bold text-amber-950">
                    Add New Admin Account
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Phone Number"
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Passcode (e.g. 4321)"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Admin Name"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Create Admin / Grant Admin Rights</span>
                  </button>
                </form>

                {/* All Users & Admins Directory */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Registered Apartment Users ({allUsersList.length})</span>
                    <span>Role / Actions</span>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {allUsersList.map((u) => (
                      <div
                        key={u.phone}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{u.name}</span>
                            {u.role === 'admin' && (
                              <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded">
                                ADMIN
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                u.hasCar
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {u.hasCar ? 'Driver (Car)' : 'Passenger'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Phone: {u.phone} &bull; Passcode: {u.passcode} &bull;{' '}
                            {Object.keys(u.schedule || {}).length} active slots
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {u.phone !== DEFAULT_ADMIN_PHONE && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleUserAdminRole(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  u.role === 'admin'
                                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                }`}
                              >
                                {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.phone)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {u.phone === DEFAULT_ADMIN_PHONE && (
                            <span className="text-[11px] text-slate-400 italic px-2">
                              Primary Admin
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* VERCEL DEPLOYMENT & 100-USER FREE CLOUD SYNC MODAL */}
            {showVercelModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
                  <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Cloud className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h3 className="font-bold text-base">
                          Vercel Export &amp; Free 100-User Cloud Sync Guide
                        </h3>
                        <p className="text-xs text-slate-400">
                          Ready to upload to Vercel with optional free Supabase real-time sync
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowVercelModal(false)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700">
                    {/* Step 1: Connect Live Supabase Cloud (Optional) */}
                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-indigo-950">
                        <Database className="w-4 h-4 text-indigo-600" />
                        <span>1. Connect Free Supabase Cloud Database (For 100+ Shared Users)</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Create a free project on <strong>supabase.com</strong>, run the 3-line SQL
                        snippet below in the SQL Editor, and paste your Project URL &amp; Anon Key
                        here (or in Vercel Environment Variables as{' '}
                        <code className="bg-white px-1 py-0.5 rounded border">VITE_SUPABASE_URL</code>{' '}
                        and{' '}
                        <code className="bg-white px-1 py-0.5 rounded border">
                          VITE_SUPABASE_ANON_KEY
                        </code>
                        ).
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Supabase Project URL (https://xyz.supabase.co)"
                          value={supabaseConfig.url}
                          onChange={(e) =>
                            setSupabaseConfig((prev) => ({ ...prev, url: e.target.value }))
                          }
                          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                        <input
                          type="password"
                          placeholder="Supabase Anon Public Key"
                          value={supabaseConfig.anonKey}
                          onChange={(e) =>
                            setSupabaseConfig((prev) => ({ ...prev, anonKey: e.target.value }))
                          }
                          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem(
                              LOCAL_STORAGE_SUPABASE_KEY,
                              JSON.stringify(supabaseConfig)
                            );
                            pushToSupabase(usersMap, faculties, buildings, supabaseConfig);
                            showToast('Supabase Cloud Config saved & current data pushed!');
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Save &amp; Push Current Data to Cloud
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            syncFromSupabase(supabaseConfig);
                            showToast('Pulled latest schedules from Supabase Cloud!');
                          }}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold rounded-lg text-xs cursor-pointer"
                        >
                          Pull Latest from Cloud
                        </button>
                      </div>

                      <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                        <div className="text-slate-400 mb-1">
                          -- Run once in Supabase SQL Editor:
                        </div>
                        <div>
                          create table if not exists unipool_state (id text primary key, payload
                          jsonb);
                        </div>
                        <div>alter table unipool_state disable row level security;</div>
                      </div>
                    </div>

                    {/* Step 2: Export Project Files for Vercel */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <Code className="w-4 h-4 text-indigo-600" />
                        <span>2. Upload to Vercel (Project Structure)</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Save this file as <code className="font-mono font-bold">src/App.jsx</code>{' '}
                        inside a standard Vite + React + Tailwind folder, push to GitHub, and click{' '}
                        <strong>Import Project</strong> on Vercel:
                      </p>

                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto space-y-1">
                        <div className="text-amber-400"># Quick Terminal Commands for Vercel:</div>
                        <div>npm create vite@latest unipool-app -- --template react</div>
                        <div>cd unipool-app</div>
                        <div>npm install lucide-react firebase tailwindcss @tailwindcss/vite</div>
                        <div className="text-slate-400">
                          # Replace src/App.jsx with this code, then push to GitHub &amp; import in
                          Vercel!
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowVercelModal(false)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}