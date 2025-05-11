import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Picker} from '@react-native-picker/picker';
import { doc, getDoc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import { playClickSound } from './sounds/playClickSound';

//Main App
const Home = () => {
  //Theme Based Style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white'; //Use => SafeAreaView
  const textC = isDarkMode ? 'white' : 'black'; //Use => head section / teacher and Student section / ModalTeaxt /
  const btnText = isDarkMode ? 'black' : 'white'; //Use => Registration Btn / Input / Modal Btn /
  const btnBack = isDarkMode ? 'white' : 'black'; //Use => Registration Btn / Input / Submit Btn
  const boxColor = isDarkMode ? '#2E2E32' : '#cfcfcf'; //Use => Student and Teacher Section / Modal View

  //Modal
  const [modalVisible, setModalVisible] = useState(false);

  //Form
  const [name, setName] = useState('');
  const [rollno, setRollno] = useState('');
  const [semester, setSemester] = useState(); //Picker
  const [year, setYear] = useState(''); //Picker
  const [regLoading, setregLoading] = useState(false);

  //Auto Year Generate
  const currentYear = new Date().getFullYear();
const years = [
  'ADMISSON YEAR',
  ...Array.from({ length: 5 }, (_, i) => (currentYear - 4 + i).toString()),
];

  const db = getFirestore()

  //Submit BTN
  const handleSubmit = async () => {
    Keyboard.dismiss();

    playClickSound()

    setregLoading(true);

    //Input Empty Validate
    if (!name || !rollno || semester === null || year === '' || !year || year === 'ADMISSON YEAR') {
      setregLoading(false)
      Alert.alert('Invalid Input', 'All fields are required!');
      return;
    }

    //Roll Validate
    if (!/^\d+$/.test(rollno)) {
      setregLoading(false)
      Alert.alert('Invalid Input', 'Only numbers are allowed.');
      return;
    }
    if (rollno.length !== 4) {
      setregLoading(false)
      Alert.alert('Invalid Input', 'Roll Number must be exactly 4 digits.');
      return;
    }

    //send the form data to a server
    try {
      const studentRef = doc(db, 'students', `${semester}-${rollno}-${year}`)
      const pendingRef = doc(db, 'pending_students', `${semester}-${rollno}-${year}`)

      const studentSnap = await getDoc(studentRef);
      const pendingSnap = await getDoc(pendingRef);

      console.log(studentRef, pendingRef)
      if (studentSnap.exists() || pendingSnap.exists()) {
        setregLoading(false)
        Alert.alert('Exist', 'User Already Registered');
        return;
      }

      await setDoc(pendingRef, {
        name: name,
        roll: Number(rollno),
        semester: semester,
        admission_year: year,
        current_year: new Date().getFullYear(),
      });

      setregLoading(false);
      Alert.alert('Success', 'Registration Complete');
      //console.log('Form submitted with:', {name, rollno, semester, year});
    } catch (error) {
      setregLoading(false);
      Alert.alert('Error', 'Not Submitted! May Be Server Issue');
      //console.log(error)
    }

    // Reset form fields
    setName('');
    setRollno('');
    setSemester(null);
    setYear('');

    // Close the modal
    setModalVisible(false);
  };

  //Cancel btn
  const handleCancel = () => {

    playClickSound()

    // Reset form fields
    setName('');
    setRollno('');
    setSemester(null);
    setYear('');

    // Close the modal
    setModalVisible(false);
  };

  //Text Capital
  const capitalConvert = text => {
    setName(text.toUpperCase());
  };

  //register btn
  const registerHandle = async () => {
    setModalVisible(true)
    playClickSound()
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: bgColor}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Head Section */}
        <Text style={[styles.heading, {color: textC}]}>
          AttenMaster
        </Text>
        <Text style={[styles.description, {color: textC}]}>
          Welcome to AttenMaster a Attendance Management System App. Use the bottom navigation
          to access different features.
        </Text>

        {/* Teacher Details */}
        <View style={[styles.lowerContainer, {backgroundColor: boxColor}]}>
          <Text style={[styles.lowerHead, {color: textC}]}>For Teachers</Text>
          <Text style={[styles.description, {color: textC}]}>
            Take attendance and manage Students Enrollments to avoid misuse of
            database system.
          </Text>
        </View>

        {/* Student Details */}
        <View style={[styles.lowerContainer, {backgroundColor: boxColor}]}>
          <Text style={[styles.lowerHead, {color: textC}]}>For Students</Text>
          <Text style={[styles.description, {color: textC}]}>
            View your attendance records for all subjects. At first register as
            a student using following 'Register' button. One Time Registration
            Required.
          </Text>
        </View>

        {/* Registration Button */}
        <Pressable
          style={[styles.registerButton, {backgroundColor: btnBack}]}
          onPress={() => registerHandle()}
          android_ripple={{color:bgColor}}>
          <Text style={{fontSize: 17, fontWeight: 700, color: btnText}}>
            Register Yourself
          </Text>
        </Pressable>

        {/* Tech Stack */}
        <View
          style={{
            width: '90%',
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 25,
          }}>
          <Image
            source={require('./images/react-native.png')}
            style={{width: 50, height: 50}}
          />
          <Image
            source={require('./images/js.png')}
            style={{width: 50, height: 50}}
          />
          <Image
            source={require('./images/firebase.png')}
            style={{width: 50, height: 50}}
          />
        </View>

        {/* Registration Form */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={[styles.centeredView,{backgroundColor: 'rgba(187, 186, 186, 0.9)'}]}>
            <View
              style={[
                styles.modalView,
                {backgroundColor: boxColor, borderColor: btnBack},
              ]}>
              <Text style={[styles.modalText, {color: textC}]}>
                Fill in your details
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {backgroundColor: btnBack, color: btnText},
                ]}
                value={name}
                onChangeText={capitalConvert}
                placeholder="FULL NAME"
                placeholderTextColor={btnText}
              />
              <TextInput
                style={[
                  styles.input,
                  {backgroundColor: btnBack, color: btnText},
                ]}
                onChangeText={setRollno}
                value={rollno}
                placeholder="COLLEGE ID CARD ROLL"
                keyboardType="number-pad"
                maxLength={4}
                placeholderTextColor={btnText}
              />
              <Picker
                selectedValue={semester}
                onValueChange={itemValue => setSemester(Number(itemValue))}
                mode="dialoge"
                dropdownIconColor={'black'}
                dropdownIconRippleColor={'gray'}
                style={[
                  styles.input,
                  {backgroundColor: btnBack, color: btnText},
                ]}>
                <Picker.Item label="Select SEMESTER" value={null} />
                <Picker.Item label="1st SEMESTER" value="1" />
                <Picker.Item label="2nd SEMESTER" value="2" />
                <Picker.Item label="3rd SEMESTER" value="3" />
                <Picker.Item label="4th SEMESTER" value="4" />
                <Picker.Item label="5th SEMESTER" value="5" />
                <Picker.Item label="6th SEMESTER" value="6" />
                <Picker.Item label="7th SEMESTER" value="7" />
                <Picker.Item label="8th SEMESTER" value="8" />
              </Picker>
              <Picker
                selectedValue={year}
                onValueChange={itemValue => setYear(Number(itemValue))}
                mode="dialoge"
                dropdownIconColor={'black'}
                dropdownIconRippleColor={'gray'}
                style={[
                  styles.input,
                  {backgroundColor: btnBack, color: btnText},
                ]}>
                {years.map(year => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
              {regLoading ? (
                <View style={[styles.buttonContainer,{justifyContent:"center",alignItems:"center",gap:10}]}>
                  <ActivityIndicator size={40} color={textC} />
                  <Text
                    style={{
                      fontWeight: 900,
                      color: textC,
                      fontSize: 18,
                      textAlign:"center",
                    }}>
                    Registering...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={handleCancel}
                    android_ripple={{color:textC}}>
                    <Text style={[styles.textStyle, {color: btnText}]}>
                      CANCEL
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, {backgroundColor: btnBack}]}
                    onPress={() => handleSubmit()}
                    android_ripple={{color:textC}}>
                    <Text style={[styles.textStyle, {color: btnText}]}>
                      SUBMIT
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //justifyContent: 'center',
    //alignItems: 'center',
    //padding: 15,
    //gap: 10,
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    //paddingBottom: 80, // Extra padding to avoid overlap with bottom navigation
  },
  heading: {
    fontSize: 24,
    fontWeight: 800,
    textAlign: 'center',
    //backgroundColor:"white",
    width: 200,
    marginTop: 15,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'justify',
    fontWeight: 500,
    //backgroundColor:"blue",
    width: '90%',
    marginBottom: 20,
  },
  lowerContainer: {
    backgroundColor: '#2E2E32',
    width: '90%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  lowerHead: {
    //color: 'white',
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 15,
  },
  registerButton: {
    //backgroundColor: 'white',
    width: 175,
    height: 35,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  modalView: {
    //margin: 20,
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    borderWidth: 3,
    //borderColor: 'white',
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    //backgroundColor:"blue"
  },
  input: {
    height: 50,
    width: 250,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 15,
    paddingHorizontal: 35,
    //backgroundColor:"blue"
  },
  button: {
    borderRadius: 20,
    padding: 10,
    width: 100,
  },
  buttonClose: {
    backgroundColor: 'gray',
  },
  buttonSubmit: {
    //backgroundColor: 'white',
  },
  textStyle: {
    //color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
