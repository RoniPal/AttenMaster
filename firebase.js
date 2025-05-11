import {initializeApp} from '@react-native-firebase/app';
import {getFirestore} from '@react-native-firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyBthZ-tz4PU2kTk_og9vRFEb88JVHFec1Q',
    authDomain: 'college-project.firebaseapp.com',
    projectId: 'college-project-2025',
    storageBucket: 'college-project-2025.appspot.com',
    messagingSenderId: '885024045499',
    appId: '1:885024045499:android:d12531dc899c7578af6c9e',
};

const app = initializeApp(firebaseConfig)
export const firestore = getFirestore(app)