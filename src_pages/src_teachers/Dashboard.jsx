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
import DatePicker from 'react-native-date-picker';
import {playClickSound} from '../sounds/playClickSound';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Dashboard = ({adminEmail}) => {
  //Theme Based Style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';
  const [Loading, setLoading] = useState(true);
  const [records, setrecords] = useState({});
  const [info, setinfo] = useState(false);
  const [modal, setmodal] = useState(false);
  const [teacherData, setteacherData] = useState([])

  const [teacherLoading, setteacherLoading] = useState(false)

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [open, setOpen] = useState(false);

  const db = getFirestore();

  //Fetch attendance
  const fetchAttendanceByData = async selectedDate => {
    setLoading(true)
    setinfo(false)
    setmodal(false)
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
        where('teacher', '==', adminEmail),
      );

      const attendanceSnap = await getDocs(attendanceQuery);

      console.log('Query Result:', attendanceSnap.docs);

      if (attendanceSnap.empty) {
        console.log('No documents found');
        Alert.alert('Nothing Found');
        setmodal(false);
        setinfo(false)
        setLoading(false)
        return;
      }

      const recordList = attendanceSnap.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
      }));
      setrecords(recordList);
      setmodal(true);
      setinfo(true)
      setLoading(false)
    } catch (error) {
      setmodal(false)
      setinfo(false)
      setLoading(false)
      console.log(error);
    }
  };

  //Fetch Perticular Subject Attendance
  const handlePerticularSubjectAttendance = async (semester, subjectName) => {
setLoading(true)
    setinfo(false)
    setmodal(false)
    console.log("Query for : ", semester, subjectName)
    console.log(semester)
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('semester', '==', Number(semester)),
        where('subject', '==', subjectName),
      );

      const attendanceSnap = await getDocs(attendanceQuery);

      console.log('Query Result:', attendanceSnap.docs);

      if (attendanceSnap.empty) {
        console.log('No documents found');
        Alert.alert('Nothing Found');
        setmodal(false);
        setinfo(false)
        setLoading(false)
        return;
      }

      const recordList = attendanceSnap.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
      }));
      setrecords(recordList);
      setmodal(true);
      setinfo(true)
      setLoading(false)
    } catch (error) {
      setmodal(false)
      setinfo(false)
      setLoading(false)
      console.log(error);
    }
  }

  //Calendar Open
  const openCalendar = () => {
    playClickSound();
    setOpen(true);
  };

  //Modal close
  const handleModalClose = () => {
    playClickSound()
    setmodal(false);
    setSelectedDate(new Date());
  };

  //Date format
  const formatDate = selectedDate => {
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = selectedDate.getFullYear().toString();
    return `${day}-${month}-${year}`;
  };


  //Get teacher classes
  const getTeacherData = async () => {
    setteacherLoading(true)
    try {
      const teacherRef = doc(db, 'teachers', adminEmail,)
      const teacherSnap = await getDoc(teacherRef)

      if(teacherSnap.empty){
        console.log('NO DATA')
        Alert.alert("Error",'No Data Found')
        setteacherLoading(false)
        return
      }

      const data = teacherSnap.data()
      console.log(data)

      const semesterData = {}

      for(let key in data){
        if(!['name', 'email'].includes(key)){
          semesterData[key] = data[key]
        }
      }

      console.log(semesterData)
      setteacherData(semesterData)
      setteacherLoading(false)
    } catch (error) {
      Alert.alert('Error',error.message)
      console.log(error)
      setteacherLoading(false)
    }
  }

  useEffect(() => {
    getTeacherData()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, {color: textC}]}>
        Search Taken Class By Date
      </Text>
      <View style={{alignItems: 'center'}}>
        <Pressable
          android_ripple={{color: bgColor}}
          style={[styles.btn, {backgroundColor: textC, width: 50, height: 50, marginBottom:20}]}
          onPress={openCalendar}>
          <Icon name="calendar-alt" size={25} color={bgColor} />
        </Pressable>

        <DatePicker
          modal
          open={open}
          date={selectedDate}
          mode="date"
          onConfirm={date => {
            console.log('Date selected:', date);
            setOpen(false);
            setSelectedDate(date);
            fetchAttendanceByData(date);
          }}
          onCancel={() => {
            setOpen(false);
          }}
        />

        <View style={{width:"100%", alignItems:"center"}}>
        <Text style={[styles.heading, {color: textC, textAlign:"center", width:"100%"}]}>Your Class Report</Text>
        {teacherLoading ? (
          <View style={{flex:1, alignItems:"center", justifyContent:"center", marginTop:50}}>
          <ActivityIndicator size={40} color={textC} />
        </View>
        ):(
        <FlatList
        data={Object.entries(teacherData)}
        keyExtractor={([semester], index) => semester+index}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom:300}}
        style={{width:"100%"}}
        renderItem={({item}) => {
          const [semester, subjects] = item

          return(
          <View style={{flex:1, width:300, borderWidth:3, borderColor:textC, borderRadius:10, marginBottom:20, paddingVertical:5,paddingHorizontal:10}}>
            <Text style={[styles.heading, {color: textC,fontSize:14}]}>Semester {semester}</Text>
            {Object.entries(subjects).map(([subjectName, attendance], index) => (
              <View 
               key={subjectName}
               style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between", flexWrap:"wrap"}}>
                <Text style={{color:textC,marginBottom:20,fontWeight:700,fontSize:12,flexWrap:"wrap",width:150}}>{subjectName}</Text>
                <Text style={{color:textC,marginBottom:20,fontWeight:700,fontSize:12,flexWrap:"wrap",width:60, textAlign:"right"}}>{attendance} Taken</Text>
                <Pressable
                style={[styles.btn,{backgroundColor:textC,width:25,height:25, borderRadius:"50%",marginBottom:20}]}
                android_ripple={{color:bgColor}}
                onPress={() => handlePerticularSubjectAttendance(semester, subjectName)}>
                  <Icon name='info-circle' size={20} color={bgColor} />
                </Pressable>
              </View>
            ))}
          </View>
        )}}
        />
      )}
        </View>
      </View>

      {/* Modal View */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modal}
        onRequestClose={() => setmodal(false)}>
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
                onPress={() => handleModalClose()}>
                <Icon name="arrow-circle-left" size={20} color={bgColor} />
                <Text style={[styles.btnText, {color: bgColor}]}>Back</Text>
              </Pressable>
              <Text style={{color: textC, fontWeight: 900, fontSize: 14}}>
                Date : {formatDate(selectedDate)}
              </Text>
            </View>

            <View style={{ flex: 1, width: '100%' }}>
              {Loading ? (
                <View style={{marginTop: 100}}>
                  <ActivityIndicator size={40} color={textC} />
                </View>
              ) : info ? (
                <FlatList
                  data={records}
                  style={styles.listStyle}
                  contentContainerStyle={{gap: 20, paddingBottom: 10}}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  keyExtractor={(item, index) => item.id + index}
                  renderItem={({item}) => (
                    <View style={[styles.detailBox, {borderColor: textC}]}>
                      <View style={[styles.nameBox]}>
                        <Text
                          style={[
                            styles.textStyle,
                            {color: textC, fontSize: 18},
                          ]}>
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
                      <View style={[styles.nameBox, {marginTop: 5}]}>
                        <Text
                          style={[
                            styles.textStyle,
                            {color: textC, fontSize: 12},
                          ]}>
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
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Dashboard;

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

  listStyle: {
    //backgroundColor:"blue",
    //paddingHorizontal:10,
    marginTop: 30,
    flex: 1,
    width: '100%',
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
    marginBottom: 10,
  },
  textStyle: {
    fontWeight: 900,
    flexWrap: 'wrap',
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

  //MODAL
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
});
