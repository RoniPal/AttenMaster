import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import {Picker} from '@react-native-picker/picker';
import {playClickSound} from '../sounds/playClickSound';
import emailjs from '@emailjs/browser';

const Promotion = () => {
  //Theme Based Style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';

  const [semester, setsemester] = useState('0');
  const [PromoteLoading, setPromoteLoading] = useState(false);

  // Initialize Firestore
  const db = getFirestore();

  // Handles student promotion
  const handlePromote = async semester => {
    playClickSound();
    setPromoteLoading(true);

    //Get Current Date and time
    const currentTimeDate = new Date().toLocaleString();
    const currentYear = new Date().getFullYear()

    try {
      if (semester === '0') {
        setPromoteLoading(false);
        Alert.alert('Error', 'Semester is required.');
        return;
      }

      const NumSemester = Number(semester);
      const NextSemester = NumSemester + 1;


      //Query Firestore for students in the selected semester
      const studentQuery = query(
        collection(db, 'students'),
        where('semester', '==', NumSemester),
      );
      const studentSnap = await getDocs(studentQuery);
      if (studentSnap.empty) {
        setPromoteLoading(false);
        Alert.alert('Info', 'No students available in this semester.');
        return;
      }


      // Query For Next Semester If there was not empty then not promote....
      const studentQueryNextSem = query(
        collection(db, 'students'),
        where('semester', '==', NextSemester),
      );
      const studentSnapNext = await getDocs(studentQueryNextSem);
      if (!studentSnapNext.empty) {
        setPromoteLoading(false);
        Alert.alert(
          'Info',
          `Please remove all students from semester ${NextSemester} , then Promote semester ${NumSemester} Students`,
        );
        return;
      }


      // Get semester subjects
      const semesterRef = doc(db, 'semester', NumSemester.toString());
      const semesterSnap = await getDoc(semesterRef);
      console.log(semesterSnap); //console
      if (semesterSnap.empty) {
        setPromoteLoading(false);
        Alert.log('Semester Has No Subjects');
        return;
      }
      const semesterData = semesterSnap.data();  //data store


      //Prepare attendance reset values for semester
      const updateValue = {};
      Object.keys(semesterData).forEach(key => {
        updateValue[key] = 0;
      });


      // Collect email data for students
      const emailSendStudentData = studentSnap.docs.map(doc => {
        const data = doc.data();
        const attendance = {};
        Object.entries(semesterData).map(([subject, _]) => {
          attendance[subject] = data[subject] ?? 0;
        });
        return {
          name: data.name,
          roll: data.roll,
          attendance: attendance,
        };
      });

      
      // Collect teacher data and reset their subject records
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      console.log(teachersSnapshot); //console


      //Update Teacher Data Section
      const updatePromises = [];
      teachersSnapshot.forEach(teacherDoc => {
        const teacherData = teacherDoc.data();
        if (teacherData[NumSemester.toString()]) {
          const resetSubject = {};
          Object.keys(teacherData[NumSemester.toString()]).forEach(subject => {
            resetSubject[`${NumSemester}.${subject}`] = 0;
          });
          const teacherRef = doc(db, 'teachers', teacherDoc.id);
          updatePromises.push(updateDoc(teacherRef, resetSubject));
        }
      });
      await Promise.all(updatePromises);  //Promises for teacher 


      //Teacher Data that sent to the email
      const emailSendTeacherData = teachersSnapshot.docs.map(doc => {
        const data = doc.data();
        const class_records = {};
        Object.entries(semesterData).map(([subject, _]) => {
          class_records[subject] = data[semester]?.[subject] ?? 0;
        });
        return {
          name: data.name,
          email: data.email,
          class_records: class_records,
        };
      });
      console.log(emailSendTeacherData); //console


      //Attendance data Get
      const attendanceHistorySnapShots = await getDocs(
        query(
          collection(db, 'attendance'),
          where('semester', '==', NumSemester),
        ),
      );
      const attendanceData = attendanceHistorySnapShots.docs.map(doc =>
        doc.data(),
      );
      console.log(attendanceData); //console
      const attendanceRef = attendanceHistorySnapShots.docs.map(doc => deleteDoc(doc.ref));
       await Promise.all(attendanceRef)
       

        //Send Email to HOD
        const result = await fetch(
          'https://api.emailjs.com/api/v1.0/email/send',
          {
            method: 'POST',
            headers: {
              origin: 'http://localhost',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service_id: 'service_jwvom75',
              template_id: 'template_endjkbf',
              user_id: 'EwNwPHMUos73fvJlW',
              template_params: {
                year: currentYear,
                semester: NumSemester,
                date: currentTimeDate,
                subjects: `${Object.entries(semesterData)
                  .map(([sub, val]) => `${sub}: <b>${val}</b>`)
                  .join('<br/>')}`,
                teachers: emailSendTeacherData.map(teacher => {
                  return `<hr>Name: <b>${
                    teacher.name
                  }</b>  <br/>Roll: <b>${
                    teacher.email
                  }</b> <br/><b>Attendance Progress:</b><br/>${Object.entries(
                    teacher.class_records,
                  )
                    .map(([sub, val]) => `${sub}: <b>${val}</b>`)
                    .join('<br/>')}`;
                }),
                student_list: emailSendStudentData.map(student => {
                  return `<hr>Name: <b>${
                    student.name
                  }</b>  <br/>Roll: <b>${
                    student.roll
                  }</b> <br/><b>Attendance Progress:</b><br/>${Object.entries(
                    student.attendance,
                  )
                    .map(([sub, val]) => `${sub}: <b>${val}</b>`)
                    .join('<br/>')}`;
                }),
                history: attendanceData.map(data => {
                  return `<hr><b>Date: ${data.date}  ${
                    data.time
                  }</b>  <br/>Semester: ${data.semester} <br/>Subject: ${
                    data.subject
                  } <br/>Teacher Email: ${data.teacher} <br/>Total Student: ${
                    data.totalStudent
                  } <br/><b>Attended Students:</b>
            <br/>${data.attendedStudents
              .map(s => `${s.name} - ${s.roll}`)
              .join('<br/>')}`;
                }),
              },
            }),
          },
        );
        console.log(result);


        //Sent extra only if semester 8
        if(NumSemester == 8){
          const result = await fetch(
            'https://api.emailjs.com/api/v1.0/email/send',
            {
              method: 'POST',
              headers: {
                origin: 'http://localhost',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                service_id: 'service_jwvom75',
                template_id: 'template_rfu8mjl',
                user_id: 'EwNwPHMUos73fvJlW',
                template_params: {
                  semester: NumSemester,
                  date: currentTimeDate,
                  year: currentYear,
                  students: emailSendStudentData.map(student => {
                    return `<hr>Name: <b>${
                      student.name
                    }</b>  <br/>Roll: <b>${
                      student.roll
                    }</b>`;
                  }),
                },
              }),
            },
          );
          console.log(result);  
        }



      //Promote students or delete if in 8th semester
      if (NumSemester == 8) {
        await Promise.all(
          studentSnap.docs.map(async doc => {
            const studentRef = doc.ref;
            await deleteDoc(studentRef);  //student delete
            await updateDoc(semesterRef, updateValue); //semester and teacher value = 0
          }),
        );
        setPromoteLoading(false);
        Alert.alert('Goodbye', `Farewell to Semester ${NumSemester} Students`);
        console.log('Students in Semester', semester);
      } else {
        await Promise.all(
          studentSnap.docs.map(async doc => {
            const studentRef = doc.ref;
            await updateDoc(studentRef, {
              semester: doc.data().semester + 1,
            });
            await updateDoc(semesterRef, updateValue);
          }),
        );
        setPromoteLoading(false);
        Alert.alert(
          'Sussess',
          `Semester ${NumSemester} Students Promoted To Next Semester & Sent Email to HOD`,
        );
        console.log('Students in Semester', semester);
      }
      setsemester('SELECT SEMESTER');
    } catch (error) {
      setPromoteLoading(false);
      Alert.alert('Error', 'Failed to promote student data.');
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, {color: textC}]}>
        Promote Students to Next Semester
      </Text>
      <Text style={styles.warning}>
        * Please be carefull whenever you promote any semester. After promoting semester the current semester data will be reset. But through the email the all details about the semester will be sent to the HOD
      </Text>
      <Text style={styles.warning}>
        * 8th semester studetens after promoting, they are deleted from database
        and their records are also deleted , but through the email their data will be sent to the HOD.
      </Text>
      <View style={styles.formBox}>
        <Picker
          selectedValue={semester}
          onValueChange={setsemester}
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
        {PromoteLoading ? (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              flexDirection: 'row',
            }}>
            <ActivityIndicator size={40} color={textC} />
            <Text
              style={{
                fontWeight: 900,
                color: textC,
                fontSize: 18,
                textAlign: 'center',
              }}>
              Promoting...
            </Text>
          </View>
        ) : (
          <Pressable
            android_ripple={{color: bgColor}}
            style={[styles.btn, {backgroundColor: textC}]}
            onPress={() => handlePromote(semester)}>
            <Text style={[styles.btnText, {color: bgColor}]}>Promote</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default Promotion;

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
  warning: {
    fontSize: 10,
    fontWeight: 900,
    textAlign: 'justify',
    color: 'red',
    marginBottom: 35,
  },
  formBox: {
    //backgroundColor:"red",
    width: '100%',
    alignItems: 'center',
    padding: 5,
  },
  pickerBox: {
    width: 250,
    marginBottom: 25,
  },
  btn: {
    //backgroundColor:"green",
    justifyContent: 'center',
    alignItems: 'center',
    width: 130,
    height: 40,
    borderRadius: 50,
  },
  btnText: {
    fontWeight: 900,
    fontSize: 16,
  },
});
