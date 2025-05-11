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
import {playClickSound} from '../sounds/playClickSound';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  Timestamp,
  where,
} from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Progress = () => {
  //Theme Based Style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';

  const [semester, setsemester] = useState('0');
  const [loading, setloading] = useState(false);
  const [info, setinfo] = useState(false);
  const [historyLoading, sethistoryLoading] = useState(false);
  const [modalView, setmodalView] = useState(false);

  const [students, setstudents] = useState({});
  const [subjects, setSubjects] = useState([]);

  const [records, setrecords] = useState({});

  //Initialize DB
  const db = getFirestore();

  //Progress check btn
  const handelProgress = async () => {
    setloading(true);
    playClickSound();

    const NumSem = Number(semester);

    try {
      if (semester === '0') {
        setloading(false);
        Alert.alert('Error', 'Semester is required.');
        return;
      }

      //Get Semester Subjects
      const semesterRef = doc(db, 'semester', semester);
      const semesterSnap = await getDoc(semesterRef);
      const semesterData = semesterSnap.data();
      setSubjects(semesterData);
      console.log(semesterData);

      //Get Semester Students
      const studentRef = query(
        collection(db, 'students'),
        where('semester', '==', NumSem),
      );
      const studentSnap = await getDocs(studentRef);

      if (studentSnap.empty) {
        setloading(false);
        Alert.alert('No Data Found');
        console.log('Empty Semester Student in ' + semester);
        return;
      }
      const studentData = studentSnap.docs.map(doc => {
        const subjectStudent = {};
        for (const sub in semesterData) {
          subjectStudent[sub] = doc.data()[sub];
        }

        return {
          id: doc.id,
          name: doc.data().name,
          roll: doc.data().roll,
          subjects: subjectStudent,
        };
      });
      console.log(studentData);
      setstudents(studentData);

      setmodalView(true);
    } catch (error) {
      Alert.alert('Error', error.message);
      console.log(error);
    }
    setloading(false);
  };

  //Back BTN
  const handleBack = () => {
    setmodalView(false);
    playClickSound();
    setsemester('0');
  };

  //Fetch todays attendance history
  const fetchTodaysHistory = async () => {
    sethistoryLoading(true);
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      );

      const attendanceSnap = await getDocs(attendanceQuery);

      console.log('Query Result:', attendanceSnap.docs);

      if (attendanceSnap.empty) {
        console.log('No documents found');
        sethistoryLoading(false);
        setinfo(false);
        return;
      }

      const recordList = attendanceSnap.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
      }));
      setrecords(recordList);
      sethistoryLoading(false);
      setinfo(true);
    } catch (error) {
      setinfo(false);
      sethistoryLoading(false);
      console.log(error);
    }
  };

  //call function
  useEffect(() => {
    fetchTodaysHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, {color: textC}]}>
        Check Students Progress
      </Text>
      <View style={{alignItems: 'center', marginBottom: 20}}>
        <Picker
          selectedValue={semester}
          onValueChange={itemValue => {
            setsemester(itemValue);
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
        {loading ? (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 20}}>
            <ActivityIndicator size={50} color={textC} />
            <Text style={{color: textC, fontWeight: 900, fontSize: 18}}>
              Fetching...
            </Text>
          </View>
        ) : (
          <Pressable
            style={[styles.btn, {backgroundColor: textC}]}
            onPress={handelProgress}
            android_ripple={{color: bgColor}}>
            <Text style={[styles.btnText, {color: bgColor}]}>
              Check Students
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.heading, {color: textC}]}>
        Today's Class History
      </Text>

      <View style={{flex: 1, width: '100%'}}>
        {historyLoading ? (
          <View style={{marginTop: 100}}>
            <ActivityIndicator size={40} color={textC} />
          </View>
        ) : info ? (
          <FlatList
            data={records}
            style={styles.listStyle}
            contentContainerStyle={{gap: 20, paddingBottom: 20}}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => item.id + index}
            renderItem={({item}) => (
              <View style={[styles.detailBox, {borderColor: textC}]}>
                <View style={[styles.nameBox,{marginBottom:5}]}>
                  <Text
                    style={[styles.textStyle, {color: textC, fontSize: 16}]}>
                    Semester {item.data.semester}
                  </Text>
                  <Text
                    style={[
                      styles.textStyle,
                      {
                        color: textC,
                        fontSize: 14,
                        width: '60%',
                        textAlign: 'center',
                      },
                    ]}>
                    {item.data.subject}
                  </Text>
                </View>
                <View style={[styles.nameBox, {marginTop: 2,marginBottom:2}]}>
                  <Text
                    style={[styles.textStyle, {color: textC, fontSize: 12}]}>
                    Attended : {item.data.totalStudent}
                  </Text>
                  <Text
                    style={[
                      styles.textStyle,
                      {
                        color: textC,
                        fontSize: 12,
                        width: '60%',
                        textAlign: 'center',
                      },
                    ]}>
                    Date : {item.data.date} - {item.data.time}
                  </Text>
                </View>
                <Text
                    style={[
                      styles.textStyle,
                      {
                        color: textC,
                        fontSize: 12,
                        width: '100%',
                        textAlign: 'left',
                      },
                    ]}>
                    Teacher : {item.data.teacher}
                  </Text>
                <Text
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    fontWeight: 900,
                    fontSize: 14,
                    marginTop: 10,
                    marginBottom: 5,
                    color: textC,
                  }}>
                  Student List
                </Text>
                {item.data.attendedStudents &&
                  item.data.attendedStudents.map((student, index) => (
                    <View
                      key={index}
                      style={{
                        marginBottom: 5,
                        flexDirection: 'row',
                        width: '100%',
                      }}>
                      <Text
                        style={{
                          width: '70%',
                          flexWrap: 'wrap',
                          fontWeight: 900,
                          fontSize: 12,
                          color: textC,
                        }}>
                        {student.name}
                      </Text>
                      <Text
                        style={{
                          width: '30%',
                          textAlign: 'right',
                          flexWrap: 'wrap',
                          fontWeight: 900,
                          fontSize: 12,
                          color: textC,
                        }}>
                        Roll : {student.roll}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          />
        ) : (
          <View style={{margin: 100}}>
            <Text
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: textC,
                textAlign: 'center',
              }}>
              No Data Found
            </Text>
          </View>
        )}
      </View>

      {/* Modal View */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalView}
        onRequestClose={() => setmodalView(false)}>
        <View style={styles.centerViewed}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: bgColor, borderColor: textC},
            ]}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
                gap: 20,
              }}>
              <Pressable
                android_ripple={{color: bgColor}}
                style={[
                  styles.btn,
                  {
                    backgroundColor: textC,
                    width: 100,
                    flexDirection: 'row',
                    gap: 10,
                  },
                ]}
                onPress={handleBack}>
                <Icon name="arrow-circle-left" size={20} color={bgColor} />
                <Text style={[styles.btnText, {color: bgColor}]}>Back</Text>
              </Pressable>
              <Text style={{color: textC, fontWeight: 900, fontSize: 20}}>
                Semester : {semester}
              </Text>
            </View>
            <View style={{width: '100%'}}>
              {Object.entries(subjects).map(([key, value], index) => (
                <Text
                  key={index}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    color: textC,
                    fontWeight: 800,
                    fontSize: 16,
                    marginBottom: 10,
                    flexWrap: 'wrap',
                  }}>
                  {key} : {value}
                </Text>
              ))}
            </View>
            <View style={{flex: 1, width: '100%', marginTop: 15}}>
              <FlatList
                data={students}
                style={styles.listStyle}
                contentContainerStyle={{gap: 20, paddingBottom: 10}}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <View style={[styles.detailBox, {borderColor: textC}]}>
                    <View style={[styles.nameBox]}>
                      <Text
                        style={[
                          styles.textStyle,
                          {
                            color: textC,
                            fontSize: 18,
                            width: '65%',
                            flexWrap: 'wrap',
                          },
                        ]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.textStyle,
                          {
                            color: textC,
                            fontSize: 14,
                            width: '30%',
                            textAlign: 'right',
                          },
                        ]}>
                        Roll : {item.roll}
                      </Text>
                    </View>
                    <View>
                      {Object.entries(item.subjects).map(
                        ([key, value], index) => (
                          <Text
                            key={index}
                            style={{
                              width: '100%',
                              flexWrap: 'wrap',
                              fontWeight: 600,
                              marginBottom: 5,
                              color: textC,
                            }}>
                            {key} : {value}
                          </Text>
                        ),
                      )}
                    </View>
                  </View>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Progress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 175,
    //backgroundColor: 'red',
    //justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: 800,
    textAlign: 'center',
    //backgroundColor:"red",
    //marginTop:15,
    marginBottom: 15,
    width: '100%',
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
  modalContent: {
    //backgroundColor:"white",
    width: '90%',
    height: '95%',
    //justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderRadius: 15,
    borderWidth: 3,
  },
  detailBox: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '100%',
    borderWidth: 3,
    borderRadius: 10,
  },
  nameBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    //backgroundColor:"green",
    alignItems: 'center',
    //width:"100%"
    marginBottom: 15,
  },
  textStyle: {
    fontWeight: 900,
    flexWrap: 'wrap',
  },
});
