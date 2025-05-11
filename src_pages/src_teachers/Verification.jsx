import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from '@react-native-firebase/firestore';
import {Picker} from '@react-native-picker/picker';
import { playClickSound } from '../sounds/playClickSound';

const Verification = () => {
  //Theme Based Style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';
  const btnColorDelete = isDarkMode ? '#858383' : 'gray'; //Use => Delete Btn

  //Filtter data
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [filteredData, setFilteredData] = useState(pendingStudents);

  //Student List
  const [pendingStudents, setpendingStudents] = useState([]);

  //Loading
  const [loadingAccept, setloadingAccept] = useState(null);
  const [loadingReject, setloadingReject] = useState(null);

  //Call Functions...
  useEffect(() => {
    getPendingStudents();
  }, []);

  //Fillter Data Call
  useEffect(() => {
    if (selectedFilter === 'All') {
      setFilteredData(pendingStudents);
    } else {
      setFilteredData(
        pendingStudents.filter(item => item.semester == selectedFilter),
      );
    }
  }, [selectedFilter, pendingStudents]);


  const db = getFirestore()

  //Pending Students Data Fetch...
  const getPendingStudents = async () => {
    try {
      const studentRef = collection(db, 'pending_students');
      const studentSnap = await getDocs(studentRef);

      // Fetch all semesters first
    const semesterRef = collection(db, 'semester');
    const semesterSnap = await getDocs(semesterRef);
    
    let allSubject = {}

    semesterSnap.docs.forEach(docItem => {
      const subjects = docItem.data()
      Object.keys(subjects).forEach(subject => {
        allSubject[subject] = 0
      })
    })

      const studentList = studentSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ...allSubject
      }));
      setpendingStudents(studentList);
      console.log(studentList);
    } catch (error) {
      Alert.alert('Error', 'Fetchiing Failed! Server Issue May be');
      console.log(error)
    }
  };

  //Add Function
  async function addStudent(student) {
    playClickSound()
    setloadingAccept(student.id)
    try {
      const studentRef = doc(db, 'students', student.id)
      await setDoc(studentRef, student);
      await deleteDoc(doc(db, 'pending_students', student.id));
      Alert.alert('Success', 'Verified Student');
      getPendingStudents();
    } catch (error) {
      //console.log(error)
      Alert.alert('Error', 'Server Issue May Be');
    }
    setloadingAccept(null)
  }

  //Delete Function
  async function deleteStudent(student) {
    playClickSound()
    setloadingReject(student.id)
    try {
      await deleteDoc(doc(db, 'pending_students', student.id));
      Alert.alert('Success', 'Rejected');
      getPendingStudents();
    } catch (error) {
      //console.log(error);
      Alert.alert('Error', 'Servere Issue');
    }
    setloadingReject(null)
  }

  return (
    <View style={styles.container}>
      {/* Head and filtter */}
      <View style={styles.headBox}>
        <Text style={[styles.heading, {color: textC}]}>
          Verify The Students
        </Text>

        {/* Fillter Picker */}
        <Picker
          selectedValue={selectedFilter}
          onValueChange={itemValue => setSelectedFilter(itemValue)}
          dropdownIconColor={textC}
          dropdownIconRippleColor={textC}
          style={[styles.pickerBox, {backgroundColor: bgColor, color: textC}]}>
          <Picker.Item label="All" value="All" />
          <Picker.Item label="1" value="1" />
          <Picker.Item label="2" value="2" />
          <Picker.Item label="3" value="3" />
          <Picker.Item label="4" value="4" />
          <Picker.Item label="5" value="5" />
          <Picker.Item label="6" value="6" />
          <Picker.Item label="7" value="7" />
          <Picker.Item label="8" value="8" />
        </Picker>
      </View>
      {/* List Of Student */}
      <FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.listStyle}
        data={filteredData}
        contentContainerStyle={{paddingBottom:100}}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={[styles.listContainer, {borderColor: textC}]}>
            <Text style={[styles.name, {color: textC}]}>{item.name}</Text>
            <Text style={[styles.details, {color: textC}]}>
              Semester: {item.semester}
            </Text>
            <Text style={[styles.details, {color: textC}]}>
              Roll: {item.roll}
            </Text>
            <Text style={[styles.details, {color: textC}]}>
              Admission Year: {item.admission_year}
            </Text>
            <View style={styles.btnContainer}>
            {loadingReject === item.id ? (
              <View>
                <ActivityIndicator size={40} color={btnColorDelete} />
              </View>
            ) : (
              <Pressable
              android_ripple={{color:bgColor}}
                onPress={() => deleteStudent(item)}
                style={[styles.btn, {backgroundColor: btnColorDelete}]}>
                <Text style={[styles.btnText, {color: bgColor}]}>Reject</Text>
              </Pressable>
            )}
            {loadingAccept === item.id ? (
              <View>
              <ActivityIndicator size={40} color={textC} />
            </View>
            ) : (
              <Pressable
              android_ripple={{color:bgColor}}
              onPress={() => addStudent(item)}
              style={[styles.btn, {backgroundColor: textC}]}>
              <Text style={[styles.btnText, {color: bgColor}]}>Accept</Text>
            </Pressable>
            )}
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default Verification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 175,
    //backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headBox: {
    flexDirection: 'row',
    alignItems: 'center',
    //backgroundColor:"red",
    justifyContent: 'space-evenly',
    width: '100%',
  },
  heading: {
    fontSize: 16,
    fontWeight: 800,
    textAlign: 'center',
    //backgroundColor:"red",
    //marginTop:15,
    marginBottom: 15,
  },
  pickerBox: {
    width: 90,
    height: 49,
    marginBottom: 15,
  },
  listContainer: {
    marginBottom: 15,
    //backgroundColor: 'skyblue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 3,
    width: 300,
    borderWidth: 3,
    borderRadius: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 10,
  },
  details: {
    fontSize: 15,
    fontWeight: 500,
  },
  btnContainer: {
    //backgroundColor:"red",
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btn: {
    //backgroundColor:"red",
    width: 70,
    height: 30,
    padding: 5,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btnText: {
    fontWeight: 700,
  },
});
