import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { useStore } from '../store/useStore';

let isHydrating = false;
let hasInitializedData = false;

// Helpers
const getStatePayload = (state: any) => ({
  activities: state.activities || [],
  journals: state.journals || [],
  goals: state.goals || [],
  categories: state.categories || [],
  tags: state.tags || [],
  targetPeriodSetting: state.targetPeriodSetting || 7,
  statisticsTimeRange: state.statisticsTimeRange || 'week'
});

export function initSync() {
  // Listen for auth changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      useStore.getState().setUser({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // First login: upload local data
        await setDoc(docRef, { state: getStatePayload(useStore.getState()) });
        hasInitializedData = true;
      }

      // Listen to cloud changes and hydrate local store
      onSnapshot(docRef, (snap) => {
        if (snap.exists() && snap.data().state) {
          isHydrating = true; // prevent upload loop
          useStore.setState(snap.data().state);
          hasInitializedData = true; // Now safe to push future changes
          // Allow some time for React/Zustand lifecycle before re-enabling sync pushes
          setTimeout(() => { isHydrating = false; }, 300);
        }
      });

    } else {
      hasInitializedData = false;
      useStore.getState().setUser(null);
    }
  });

  // Listen to local changes and push to cloud
  useStore.subscribe((state, prevState) => {
    // Only upload if logged in, not currently applying a cloud download, AND fully initialized!
    if (state.user && !isHydrating && hasInitializedData) {
      const payload = getStatePayload(state);
      // Small debounce simulation or direct write (Firestore batches requests automatically)
      setDoc(doc(db, 'users', state.user.uid), { state: payload }).catch(err => {
        console.error('Failed to sync to Firebase:', err);
      });
    }
  });
}

// Export Auth Actions
export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Login failed:", error);
    alert('로그인에 실패했습니다.');
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
