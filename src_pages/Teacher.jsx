import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import Attendance from './src_teachers/Attendance';
import Verification from './src_teachers/Verification';
import Promotion from './src_HOD/Promotion';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {getApp} from '@react-native-firebase/app';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from '@react-native-firebase/firestore';
import Management from './src_HOD/Management';
import Assignment from './src_HOD/Assignment';
import Dashboard from './src_teachers/Dashboard';
import { playClickSound } from './sounds/playClickSound';
import Progress from './src_HOD/Progress';

const Teacher = () => {

  const db = getFirestore();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '885024045499-hmlhkk5bvab6dab6rnu2ifdnnflj8kal.apps.googleusercontent.com',
    });
  }, []);


  //Teacher and HOD Login
  const signInWithGoogle = async (role) => {
    playClickSound();
    setLoading(true);
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      console.log(signInResult);
      //setLoading(false);

      // Try the new style of google-sign in result, from v13+ of that module
      const {idToken} = await GoogleSignin.getTokens();

      if (!idToken) {
        Alert.alert('Error', 'No ID Token Found');
        setLoading(false)
        return;
      }

      const userID = signInResult.data.user.email;
      const roleCollection = role === 'admin' ? 'admin' : 'teachers'
      console.log(userID, typeof userID);
      console.log(roleCollection);
      const teacherRef = query(
        collection(db, roleCollection),
        where('email', '==', userID),
      );
      const teacherSnap = await getDocs(teacherRef);

      if (teacherSnap.empty) {
        await GoogleSignin.signOut(); // Clear the cached account
        Alert.alert(`Non ${role} found`, `You Are Not ${role === 'admin' ? 'HOD' : 'Teacher'}`);
        setLoading(false);
        return;
      }

      const app = getApp();
      const auth = getAuth(app);

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential in FIrebase
      const firebaseUserCredential = await signInWithCredential(
        auth,
        googleCredential,
      );

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        'user',
        JSON.stringify(firebaseUserCredential.user),
      );
      await AsyncStorage.setItem('role', role);
      setAdminEmail(firebaseUserCredential.user.displayName);
      setAdminPhoto(firebaseUserCredential.user.photoURL);
      setAdminName(firebaseUserCredential.user.email);
      
      setadminView(role === 'admin' ? true : false)
      setteacherView(role === 'admin' ? false : true)
      setloginView(false); // Hide login modal
      setLoading(false);
      console.log('Login Success ✅', role,  firebaseUserCredential);
    } catch (error) {
      Alert.alert('Error');
      console.log(error);
      setLoading(false);
    }
  };


  const signOut = async () => {
    playClickSound()
    try {
      const app = getApp();
      const auth = getAuth(app);

      const currentUser = auth.currentUser;
      if(currentUser){
      await GoogleSignin.signOut();
      await firebaseSignOut(auth);
      }

      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('role')
      setloginView(true);
      setteacherView(false)
      setadminView(false)
      setLoading(false);
      setView(1)
      console.log('User signed out');
    } catch (error) {
      console.error(error);
      setloginView(false);
    }
  };

  //Theme baased style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';

  //Nav Page
  const [view, setView] = useState(1);
  const [loginView, setloginView] = useState(true);
  const [adminView, setadminView] = useState(false); //if true go to admin page
  const [teacherView, setteacherView] = useState(false); //if true go to teacher dash board
  const [AdminEmail, setAdminEmail] = useState(''); //Admin Name
  const [AdminPhoto, setAdminPhoto] = useState(''); //Admin Photo
  const [AdminName, setAdminName] = useState(''); //Admin Email
  const [loading, setLoading] = useState(true); // Google login

  //All Function Calls

  useEffect(() => {
    const app = getApp();
    const auth = getAuth(app);
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        let storedRole = await AsyncStorage.getItem('role')

        //Retry after 1s check role
        let attempts = 0;
        while(!storedRole && attempts < 5){
          await new Promise(resolve => setTimeout(resolve, 500)) // wait 500ms
          storedRole = await AsyncStorage.getItem('role')
          attempts++;
        }


        if(storedRole === 'admin'){
          const teacherQuery = query(
            collection(db, 'admin'),
            where('email', '==', user.email)
          )
          const teacherSnap = await getDocs(teacherQuery)
          if(teacherSnap.empty){
            await signOut()
          }else{
            setadminView(true)
            setteacherView(false)
            setAdminEmail(user.displayName);
            setAdminPhoto(user.photoURL);
            setAdminName(user.email);
            setloginView(false);
            setLoading(false)
          }
        }else if(storedRole === 'teacher'){
          const teacherQuery = query(
            collection(db, 'teachers'),
            where('email', '==', user.email)
          )
          const teacherSnap = await getDocs(teacherQuery)
          if(teacherSnap.empty){
            await signOut()
          }else{
            setadminView(false)
            setteacherView(true)
            setAdminEmail(user.displayName);
            setAdminPhoto(user.photoURL);
            setAdminName(user.email);
            setloginView(false);
            setLoading(false)
          }
        }else{
         await signOut()
        }
      } else {
        await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('role');
  setAdminEmail('');
  setAdminPhoto('');
  setAdminName('');
  setloginView(true);
  setadminView(false);
  setteacherView(false);
  setLoading(false);
  return;
      }
    });
    return () => unsubscribe();
  }, []);


  //Handle View
  const handleView = (viewNumber) => {
    setView(viewNumber);
    playClickSound();
  };
  



  if (loginView) {
    return (
      <SafeAreaView style={[styles.Modalcontainer, {backgroundColor: bgColor}]}>
        <Text style={[styles.Modalheading, {color: textC}]}>
          Admin's Login
        </Text>
        <View style={styles.ModalloginContainer}>
          {!loading ? (
            <View style={{gap:20}}>
              <Pressable
              android_ripple={{color:bgColor}}
                style={[
                  styles.Modalbtn,
                  {backgroundColor: textC, flexDirection: 'row',justifyContent:"space-between",paddingHorizontal:15},
                ]}
                onPress={() => signInWithGoogle('admin')}>
                <Image
                  source={require('./images/google.png')}
                  style={{width: 50, height: 50}}
                />
                <Text style={[styles.ModalbtnText, {color: bgColor,textAlign:"center"}]}>
                  HOD
                </Text>
              </Pressable>

              
              <Pressable
              android_ripple={{color:bgColor}}
                style={[
                  styles.Modalbtn,
                  {backgroundColor: textC, flexDirection: 'row',justifyContent:"space-between",paddingHorizontal:15},
                ]}
                onPress={() => signInWithGoogle('teacher')}>
                <Image
                  source={require('./images/google.png')}
                  style={{width: 50, height: 50}}
                />
                <Text style={[styles.ModalbtnText, {color: bgColor}]}>
                  Teacher
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <ActivityIndicator size="large" color={textC} />
              <Text
                style={{
                  marginTop: 20,
                  fontWeight: 900,
                  color: textC,
                  fontSize: 15,
                }}>
                Signing in with Google...
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }



  //HOD dashboard
  if (adminView) {
    return(
    <SafeAreaView style={[styles.container, {backgroundColor: bgColor}]}>
      <Text style={[styles.heading, {color: textC}]}>HOD Dashboard</Text>
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: 10,
          alignItems: 'center',
          gap: 5,
        }}>
        <Image
          source={{uri: AdminPhoto}}
          style={{height: 35, width: 35, borderRadius: 50}}
        />
        <Text
          style={{
            color: textC,
            textAlign: 'left',
            width: '75%',
          }}>
          {AdminEmail}
        </Text>
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            {
              borderColor: textC,
              height: 35,
              width: 35,
              padding: 5,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
          onPress={signOut}>
          <Icon name="power-off" size={11} color={textC} />
        </Pressable>
      </View>

      {/* Btn Box */}
      <View style={styles.btnContainer}>
        {/* Attendance */}
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            view === 1
              ? {backgroundColor: textC}
              : {backgroundColor: bgColor, borderColor: textC},
          ]}
          onPress={() => handleView(1)}>
          <Icon name="book" size={25} color={view === 1 ? bgColor : textC} />
        </Pressable>

        {/* Verification */}
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            view === 2
              ? {backgroundColor: textC}
              : {backgroundColor: bgColor, borderColor: textC},
          ]}
          onPress={() => handleView(2)}>
          <Icon name="chalkboard-teacher" size={25} color={view === 2 ? bgColor : textC} />
        </Pressable>

        {/* Promotion */}
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            view === 3
              ? {backgroundColor: textC}
              : {backgroundColor: bgColor, borderColor: textC},
          ]}
          onPress={() => handleView(3)}>
          <Icon name="sort-amount-up" size={25} color={view === 3 ? bgColor : textC} />
        </Pressable>

        {/* Progress */}
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            view === 4
              ? {backgroundColor: textC}
              : {backgroundColor: bgColor, borderColor: textC},
          ]}
          onPress={() => handleView(4)}>
          <Icon name="chart-bar" size={25} color={view === 4 ? bgColor : textC} />
        </Pressable>
      </View>
      <View>
        {view === 1 && <Assignment /> }
        {view === 2 && <Management /> }
        {view === 3 && <Promotion />}
        {view === 4 && <Progress />}
      </View>
    </SafeAreaView>
    );
  }




  //Teacher Dashboard
  if(teacherView){
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: bgColor}]}>
      <Text style={[styles.heading, {color: textC}]}>Teacher Dashboard</Text>
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: 10,
          alignItems: 'center',
          gap: 5,
        }}>
        <Image
          source={{uri: AdminPhoto}}
          style={{height: 35, width: 35, borderRadius: 50}}
        />
        <Text
          style={{
            color: textC,
            textAlign: 'left',
            width: '75%',
          }}>
          {AdminEmail}
        </Text>
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            {
              borderColor: textC,
              height: 35,
              width: 35,
              padding: 5,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
          onPress={signOut}>
          <Icon name="power-off" size={11} color={textC} />
        </Pressable>
      </View>

      {/* Btn Box */}
      <View style={styles.btnContainer}>
        {/* Attendance */}
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            view === 1
              ? {backgroundColor: textC}
              : {backgroundColor: bgColor, borderColor: textC},
          ]}
          onPress={() => handleView(1)}>
            <Icon name="tasks" size={25} color={view === 1 ? bgColor : textC} />
        </Pressable>

        {/* Verification */}
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            view === 2
              ? {backgroundColor: textC}
              : {backgroundColor: bgColor, borderColor: textC},
          ]}
          onPress={() => handleView(2)}>
          <Icon name="user-check" size={25} color={view === 2 ? bgColor : textC} />
        </Pressable>

        {/* Profile Dashboard */}
        <Pressable
        android_ripple={{color:bgColor}}
          style={[
            styles.btn,
            view === 3
              ? {backgroundColor: textC}
              : {backgroundColor: bgColor, borderColor: textC},
          ]}
          onPress={() => handleView(3)}>
          <Icon name="tachometer-alt" size={25} color={view === 3 ? bgColor : textC} />
        </Pressable>
      </View>
      <View>
        {view === 1 && <Attendance adminEmail={AdminName} />}
        {view === 2 && <Verification />}
        {view === 3 && <Dashboard adminEmail={AdminName} />}
      </View>
    </SafeAreaView>
  );
};
}

export default Teacher;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: 800,
    textAlign: 'center',
    //backgroundColor:"white",
    width: 200,
    marginTop: 15,
  },
  btnContainer: {
    flexDirection: 'row',
    //backgroundColor: 'red',
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'space-evenly',
    padding: 5,
  },
  btn: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    width: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 10,
  },
  btnText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 800,
  },
  // Modal
  Modalcontainer: {
    flex: 1,
    //justifyContent: 'center',
    alignItems: 'center',
    //padding: 15,
    //gap: 10,
  },
  Modalheading: {
    fontSize: 24,
    fontWeight: 800,
    textAlign: 'center',
    //backgroundColor:"white",
    width: 200,
    marginTop: 15,
    marginBottom: 10,
  },
  ModalloginContainer: {
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    //backgroundColor:"white",
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    flex: 1,
  },
  Modalbtn: {
    //:"red",Modal
    width: 180,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    gap: 30,
  },
  ModalbtnText: {
    fontWeight: 900,
    fontSize: 20,
  },
});
