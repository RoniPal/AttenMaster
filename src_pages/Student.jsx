import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Picker} from '@react-native-picker/picker';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Svg, {Circle} from 'react-native-svg';
import { playClickSound } from './sounds/playClickSound';

const Student = () => {
  //Theme Based Style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';

  const [selectedSemester, setselectedSemester] = useState();
  const [rollNo, setrollNo] = useState('');
  const [loading, setloading] = useState(false);
  const [dataFound, setdataFound] = useState(false);
  const [commonSubject, setcommonSubject] = useState();
  const [studentData, setstudentData] = useState();
  const [semesterData, setsemesterData] = useState();

  const db = getFirestore();

  const handleCheckAttendance = async () => {
    Keyboard.dismiss();
    playClickSound()
    setloading(true)

    if (selectedSemester === '0' || !rollNo) {
      setloading(false)
      Alert.alert('Invalid Input', 'All fields are required!');
      return;
    }

    if (!/^\d+$/.test(rollNo)) {
      setloading(false)
      Alert.alert('Invalid Input', 'Only numbers are allowed.');
      return;
    }
    if (rollNo.length !== 4) {
      setloading(false)
      Alert.alert('Invalid Input', 'Roll Number must be exactly 4 digits.');
      return;
    }
    console.log(
      `RollNo : ${rollNo} Semester : ${selectedSemester}`,
      typeof rollNo,
    );

    try {
      const studenQuery = query(
        collection(db, 'students'),
        where('semester', '==', Number(selectedSemester)),
        where('roll', '==', Number(rollNo)),
      );
      const studentData = await getDocs(studenQuery);
      const studentSnap = studentData.docs[0];
      if (studentData.empty) {
        setloading(false)
        Alert.alert('Student Data Not Found');
        return;
      }
      const studentDetails = studentSnap.data();
      setstudentData(studentDetails);
      console.log(studentDetails);

      const semesterQuery = doc(db, 'semester', selectedSemester);
      const semesterData = await getDoc(semesterQuery);
      const semseterDetails = semesterData.data();
      setsemesterData(semseterDetails);
      console.log(semseterDetails);

      //Common subjects
      const semesterSubjects = Object.keys(semseterDetails);
      const studentSubjects = Object.keys(studentDetails);

      const commonSubjectFromData = semesterSubjects.filter(subject =>
        studentSubjects.includes(subject),
      );

      const filterSubjects = {};
      commonSubjectFromData.forEach(subject => {
        filterSubjects[subject] = studentDetails[subject];
      });
      setcommonSubject(filterSubjects);
      console.log('Filtered subjects:', filterSubjects);

      setrollNo('');
      setselectedSemester('');
      setdataFound(true);
      setloading(false)
    } catch (error) {
      setloading(false)
      console.log(error);
      Alert.alert('Error', error.message);
    }
  };

  //back btn
  const backHandle = () => {
    playClickSound()
    setdataFound(false)
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: bgColor}]}>
      {/* Head Section */}
      <Text style={[styles.heading, {color: textC}]}>Student Dashboard</Text>
      <View
        style={{
          //backgroundColor: 'red',
          width: '100%',
          alignItems: 'center',
          justifyContent:"center",
          flex: 1,
        }}>
        {dataFound ? (
          <View
            style={{
              //backgroundColor: 'skyblue',
              width: '100%',
              alignItems: 'center',
              padding: 10,
              marginTop: 20,
              flex: 1,
            }}>
            <View
              style={{
                //backgroundColor: 'green',
                width: '100%',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderWidth: 3,
                borderColor: textC,
                borderRadius: 10,
              }}>
              <View
                style={{
                  //backgroundColor: 'red',
                  width: '70%',
                }}>
                <Text
                  style={{
                    fontWeight: 900,
                    fontSize: 20,
                    color: textC,
                    width: '100%',
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}>
                  {studentData.name}
                </Text>
                <Text
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    marginBottom: 5,
                    color: textC,
                  }}>
                  Semester : {studentData.semester}
                </Text>
                <Text style={{fontWeight: 600, fontSize: 16, color: textC}}>
                  Roll : {studentData.roll}
                </Text>
              </View>
              <View>
                <Pressable
                android_ripple={{color:bgColor}}
                  style={[
                    styles.btn,
                    {
                      backgroundColor: textC,
                      width: 90,
                      flexDirection: 'row',
                      gap: 10,
                    },
                  ]}
                  onPress={() => backHandle()}>
                  <Icon name="arrow-circle-left" size={18} color={bgColor} />
                  <Text
                    style={[styles.btnText, {color: bgColor, fontSize: 14}]}>
                    Back
                  </Text>
                </Pressable>
              </View>
            </View>
            <FlatList
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              data={Object.keys(commonSubject || {}).map(subjectKey => ({
                key: subjectKey,
                studentValue: studentData[subjectKey],
                semesterValue: semesterData[subjectKey],
              }))}
              keyExtractor={(item, index) => index.toString()}
              style={{width: '100%', marginTop: 20}}
              contentContainerStyle={{paddingBottom: 20}}
              renderItem={({item}) => {
                const studentValue = item.studentValue || 0;
                const semesterValue = item.semesterValue || '!Taken'; //avoide divide by 0
                const radius = 20;
                const strokeWidth = 3;
                const circumference = 2 * Math.PI * radius;
                const percentage = Math.min(
                  (studentValue / semesterValue) * 100,
                  100,
                );
                const strokeDashoffset =
                  circumference - (circumference * percentage) / 100;

                return (
                  <View
                    style={{
                      width: '100%',
                      marginBottom: 20,
                      borderWidth: 3,
                      borderColor: textC,
                      borderRadius: 10,
                      paddingHorizontal: 15,
                      paddingTop: 5,
                    }}>
                    <Text
                      style={{
                        color: textC,
                        fontWeight: 900,
                        fontSize: 18,
                        width: '100%',
                        flexWrap: 'wrap',
                      }}>
                      {item.key}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <View style={{justifyContent: 'center'}}>
                        <Text
                          style={{
                            color: textC,
                            fontWeight: 700,
                            fontSize: 14,
                            marginBottom: 7,
                          }}>
                          {' '}
                          Total Classes: {semesterValue}
                        </Text>
                        <Text
                          style={{color: textC, fontWeight: 700, fontSize: 14}}>
                          {' '}
                          Attendance: {studentValue}
                        </Text>
                      </View>

                      {/* BAR SVG */}
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Svg height="80" width="80" viewBox="0 0 80 80">
                          {/* Outer Circle as Border */}
                          <Circle
                            cx="40"
                            cy="40"
                            r={radius + 2} // Slightly larger radius to simulate border
                            stroke={textC} // Border color
                            strokeWidth={1} // Border thickness
                            fill="none"
                          />
                          {/* Inner Border Circle */}
                          <Circle
                            cx="40"
                            cy="40"
                            r={radius - strokeWidth / 2} // slightly smaller
                            stroke={textC}
                            strokeWidth={2}
                            fill="none"
                          />
                          {/* Background Circle (red) */}
                          <Circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke={bgColor}
                            strokeWidth={strokeWidth}
                            fill="none"
                          />
                          {/* Foreground Circle (green Progress) */}
                          <Circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke={textC}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 40 40)`}
                          />
                        </Svg>
                        <Text
                          style={{
                            color: textC,
                            fontWeight: 900,
                            fontSize: 16,
                            width: 45,
                            textAlign: 'center',
                          }}>
                          {Math.floor(percentage)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        ) : (
          <View
            style={{
              //backgroundColor: 'green',
              width: '100%',
              alignItems: 'center',
            }}>
            {/* First Picker */}
            <Picker
              selectedValue={selectedSemester}
              onValueChange={itemValue => {
                setselectedSemester(itemValue);
              }}
              dropdownIconColor={bgColor}
              dropdownIconRippleColor={bgColor}
              style={[
                styles.pickerBox,
                {backgroundColor: textC, color: bgColor},
              ]}>
              <Picker.Item label="CURRENT SEMESTER" value="0" />
              <Picker.Item label="1" value="1" />
              <Picker.Item label="2" value="2" />
              <Picker.Item label="3" value="3" />
              <Picker.Item label="4" value="4" />
              <Picker.Item label="5" value="5" />
              <Picker.Item label="6" value="6" />
              <Picker.Item label="7" value="7" />
              <Picker.Item label="8" value="8" />
            </Picker>
            <TextInput
              style={[
                styles.pickerBox,
                {
                  backgroundColor: textC,
                  color: bgColor,
                  height: 50,
                  paddingHorizontal: 10,
                },
              ]}
              onChangeText={setrollNo}
              value={rollNo}
              placeholder="COLLEGE ID CARD ROLL"
              keyboardType="number-pad"
              maxLength={4}
              placeholderTextColor={bgColor}
            />
            <View
              style={{
                //backgroundColor: 'red',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {loading ? (
                <View
                  style={[
                    styles.buttonContainer,
                    {justifyContent: 'center', alignItems: 'center', gap: 10,flexDirection:"row"},
                  ]}>
                  <ActivityIndicator size={40} color={textC} />
                  <Text
                    style={{
                      fontWeight: 900,
                      color: textC,
                      fontSize: 18,
                      textAlign: 'center',
                    }}>
                    Checking...
                  </Text>
                </View>
              ) : (
                <Pressable
                 android_ripple={{color:bgColor}}
                  style={[styles.btn, {backgroundColor: textC}]}
                  onPress={() => handleCheckAttendance()}>
                  <Text style={[styles.btnText, {color: bgColor}]}>
                    Check Attendance
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Student;

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
});
