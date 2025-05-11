import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Picker} from '@react-native-picker/picker';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import Checkbox from './components/Checkbox';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { playClickSound } from '../sounds/playClickSound';


const Attendance = ({adminEmail}) => {
  //Theme Based Style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';

  const [modalView, setmodalView] = useState(false);
  const [selectedSemester, setselectedSemester] = useState('');
  const [selectedSubject, setselectedSubject] = useState('');
  const [semesterSubjects, setsemesterSubjects] = useState({})
  const [students, setStudents] = useState([]);
  const [checkedStudent, setcheckedStudent] = useState({})

  const [loadingBefore, setloadingBefore] = useState(false)
  const [loadingAfter, setloadingAfter] = useState(false)

  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  

  // Initialize Firestore
  const db = getFirestore();

  //Teacher based subject fetch
  useEffect(() => {
    const fetchTeacherSubjects = async () => {
      try {
        const teacherRef = doc(db, 'teachers', adminEmail);
        const teacherSnap = await getDoc(teacherRef)
        //console.log(teacherSnap)

        if(teacherSnap.exists){
          const data = teacherSnap.data()
          const subjects = {}

          Object.keys(data).forEach(key => {
            if(!isNaN(key)){
              subjects[key] = Object.keys(data[key])
            }
          })
          console.log(subjects)
          setsemesterSubjects(subjects)
        }else{
          console.log("No Fields Found")
        }

      } catch (error) {
        console.log(error)
      }
    }

    fetchTeacherSubjects();
  }, [])


  const handleTakeAttendance = async (semester, subject) => {
    playClickSound()
    setloadingBefore(true)

    const currentTime = new Date()
    const month = currentTime.getMonth() + 1
    setTime(`${currentTime.getHours()}:${currentTime.getMinutes()}`)
    setDate(`${currentTime.getFullYear()}-${month}-${currentTime.getDate()}`)
    //console.log(`${currentTime.getDate()}-${currentTime.getMonth()}-${currentTime.getFullYear()} ${currentTime.getHours()}:${currentTime.getMinutes()}`)

    try {
      const numSemester = Number(semester);

      if (semester === '0' || subject === 'SELECT SUBJECT' || subject === '0' || semester === 'SELECT SEMESTER' || !subject) {
        Alert.alert('Error', 'Fields is required.');
        setloadingBefore(false)
        return;
      }

      //Query Firestore for students in the selected semester
      const studentQuery = query(
        collection(db, 'students'),
        where('semester', '==', numSemester),
      );

      const studentSnap = await getDocs(studentQuery);

      if (studentSnap.empty) {
        setloadingBefore(false)
        Alert.alert('Info', 'No students available in this semester.');
        return;
      }

      const studentList = studentSnap.docs.map(doc => doc.data());
      setStudents(studentList);
      console.log(studentList);
      setmodalView(true);
      setloadingBefore(false)
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Fetchiing Failed! Server Issue May be');
      setloadingBefore(false)
    }
  };

  //Handle checkbox toggle
  const handleCheckBox = (studentId) => {
    playClickSound()
    setcheckedStudent(prevState => ({
      ...prevState,
      [studentId]: !prevState[studentId]
    }))
  }

  //Submit Attendence
  const submitAttendance = async () => {
    playClickSound()
    setloadingAfter(true)
    try {
      const checkedStudentList = Object.keys(checkedStudent).filter(id => checkedStudent[id]);
  
      if (checkedStudentList.length === 0) {
        Alert.alert("Error", "No Student selected");
        setloadingAfter(false)
        return;
      }
  
      await Promise.all([
        // Update student attendance in "students" collection
        ...checkedStudentList.map(async (studentId) => {
          const studentRef = doc(db, "students", studentId);
          await updateDoc(studentRef, {
            [selectedSubject]: increment(1),
          });
        }),
  
        // Update the selected subject's attendance count in "semester" collection
        (async () => {
          const semesterRef = doc(db, 'semester', selectedSemester);
          await updateDoc(semesterRef, {
            [selectedSubject]: increment(1),
          });
        })(),

        //Update the selected subject in teachers collection
        (async () => {
          const teacherRef = doc(db, 'teachers', adminEmail);
          await updateDoc(teacherRef,{
            [`${selectedSemester}.${selectedSubject}`]: increment(1)
          });
        })(),

        //Update in attendance collection
        (async () => {
          const attendanceRef = doc(db, 'attendance', `${selectedSemester}-${selectedSubject}-${date}-${adminEmail}`)

          await setDoc(attendanceRef, {
            date: date,
            time: time,
            timestamp: Timestamp.fromDate(new Date()),
            semester: Number(selectedSemester),
            subject: selectedSubject,
            teacher: adminEmail,
            totalStudent: checkedStudentList.length,
            attendedStudents: checkedStudentList.map(id => {
              const student = students.find(s => s.id === id);
              return {
                name: student.name || '',
                roll: student.roll || '',
              }
            })
          })
        })(),
      ]);
  
      Alert.alert("Success", "Attendance Recorded Successfully!");
      setcheckedStudent({});
      setmodalView(false); // Close the modal after submitting
      setselectedSemester("0")
      setselectedSemester("0")
      setloadingAfter(false)
    } catch (error) {
      console.log(error);
      Alert.alert("Error", error.message);
      setloadingAfter(false)
    }
  };
  
  const modalCloseHandle = () => {
    playClickSound()
    setloadingAfter(false)
    setloadingBefore(false)
    setmodalView(false)
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, {color: textC}]}>
        Take Student Attendance
      </Text>

      {/* First Picker */}
      <Picker
        selectedValue={selectedSemester}
        onValueChange={itemValue => {
          setselectedSemester(itemValue);
          setselectedSubject('SELECT SUBJECT');
        }}
        dropdownIconColor={bgColor}
        dropdownIconRippleColor={bgColor}
        style={[styles.pickerBox, {backgroundColor: textC, color: bgColor}]}>
        <Picker.Item label="SELECT SEMESTER" value="0" />
        <Picker.Item label="1" value="1" />
        <Picker.Item label="2" value="2" />
        <Picker.Item label="3" value="3" />
        <Picker.Item label="4" value="4" />
        <Picker.Item label="5" value="5" />
        <Picker.Item label="6" value="6" />
        <Picker.Item label="7" value="7" />
        <Picker.Item label="8" value="8" />
      </Picker>

      {/* Second Picker */}
      <Picker
        selectedValue={selectedSubject}
        onValueChange={itemValue => {
          setselectedSubject(itemValue);
        }}
        enabled={!!selectedSemester}
        dropdownIconColor={bgColor}
        dropdownIconRippleColor={bgColor}
        style={[styles.pickerBox, {backgroundColor: textC, color: bgColor}]}>
        <Picker.Item label="SELECT SUBJECT" value="0" />
        {selectedSemester &&
          semesterSubjects[selectedSemester]?.map((subject, index) => (
            <Picker.Item key={index} label={subject} value={subject} />
          ))}
      </Picker>

      {loadingBefore ? (
        <View style={{flexDirection:"row", alignItems:"center", gap:20}}>
          <ActivityIndicator size={50} color={textC} />
          <Text style={{color:textC, fontWeight:900, fontSize:18}}>Fetching...</Text>
        </View>
      ) : (
        <Pressable
        android_ripple={{color:bgColor}}
        style={[styles.btn, {backgroundColor: textC}]}
        onPress={() => handleTakeAttendance(selectedSemester, selectedSubject)}>
        <Text style={[styles.btnText, {color: bgColor}]}>Take Attendance</Text>
      </Pressable>
      )}

      {/* Modal Start */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalView}
        onRequestClose={() => modalCloseHandle()}>
        <View style={styles.centerViewed}>
          <View style={[styles.modalContent,{backgroundColor:bgColor,borderColor:textC}]}>
          <View style={{flexDirection:"row", alignItems:"center",marginBottom:20,gap:20}}>
          <Pressable
          android_ripple={{color:bgColor}}
            style={[styles.btn, {backgroundColor: textC,width:100,flexDirection:"row",gap:10}]}
            onPress={() => modalCloseHandle()}>
              <Icon name='arrow-circle-left' size={20} color={bgColor} />
            <Text style={[styles.btnText, {color:bgColor}]}>
              Back
            </Text>
          </Pressable>
          <Text style={{color:textC,fontWeight:900,fontSize:20}}>Semester {selectedSemester}</Text>
          </View>
          <Text style={{width:"100%",textAlign:"center",fontSize:18,fontWeight:900,marginBottom:5,color:textC}}>{selectedSubject}</Text>
          <Text style={{width:"100%",textAlign:"center",fontSize:18,fontWeight:900,marginBottom:5,color:textC}}>Date : {date}  {time}</Text>
          <FlatList
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            data={students}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <View
                style={[
                  styles.listContainer,
                  {borderColor: textC, backgroundColor: bgColor},
                ]}>
                <View style={{width:"80%"}}>
                  <Text style={[styles.name, {color: textC,flexWrap:"wrap"}]}>{item.name}</Text>
                  <Text style={[styles.details, {color: textC}]}>
                    Roll: {item.roll}
                  </Text>
                </View>
                <View>
                  <Checkbox 
                  isChecked={!!checkedStudent[item.id]} 
                  onChange={() => handleCheckBox(item.id)} />
                </View>
              </View>
            )}
            ListFooterComponent={() => (
              <View style={{width:'100%', justifyContent:"center", alignItems:"center"}}>

                {loadingAfter ? (
                  <View style={{flexDirection:"row", alignItems:"center", gap:20}}>
                  <ActivityIndicator size={50} color={textC} />
                  <Text style={{color:textC, fontWeight:900, fontSize:18}}>Updating...</Text>
                </View>
                ) : (
                  <Pressable android_ripple={{color:bgColor}} style={[styles.btn, { backgroundColor: textC, marginTop: 20 }]} onPress={submitAttendance}>
                <Text style={[styles.btnText, { color: bgColor }]}>Submit Attendance</Text>
              </Pressable>
                )}
              </View>
            )}
          />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Attendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    //backgroundColor: 'red',
    //justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: 800,
    textAlign: 'center',
    //backgroundColor:"red",
    marginTop: 20,
    marginBottom: 25,
  },
  pickerBox: {
    width: 250,
    marginBottom: 25,
  },
  btn: {
    //backgroundColor:"green",
    justifyContent: 'center',
    alignItems: 'center',
    width: 150,
    height: 40,
    borderRadius: 50,
  },
  btnText: {
    fontWeight: 900,
    fontSize: 16,
  },
  centerViewed: {
    flex: 1,
    //justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.86)',
    paddingTop: 100,
  },
  modalContent:{
    //backgroundColor:"white",
    width:"90%",
    height:"95%",
    justifyContent:"center",
    alignItems:"center",
    paddingHorizontal:15,
    paddingVertical:20,
    borderRadius:15,
    borderWidth:3
  },
  listContainer: {
    marginBottom: 20,
    //backgroundColor: 'skyblue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 3,
    width: 280,
    borderWidth: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
