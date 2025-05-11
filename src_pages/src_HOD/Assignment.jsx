import {Alert, Modal, Pressable, StyleSheet, Text, useColorScheme, View, FlatList, ActivityIndicator} from 'react-native';
import React, { useEffect, useState } from 'react';
import {Picker} from '@react-native-picker/picker';
import {collection, deleteField, doc, getDocs, getFirestore, updateDoc} from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { initClickSound, playClickSound, releaseClickSound } from '../sounds/playClickSound';


const Assignment = () => {
  //Theme baased style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';
  const btnColorRemove = isDarkMode ? '#858383' : 'gray'; //Use => Delete Btn

  const [selectedTeacher, setselectedTeacher] = useState('')
  const [teachers, setteachers] = useState([])
  const [subjects, setsubjects] = useState({})
  const [teacherName, setteacherName] = useState('')
  const [loading, setloading] = useState(false)
  const [modalView, setmodalView] = useState(false)

  const db = getFirestore();

  //Fetch teacher
  const teacherFetchData = async () => {
    try {
      const teacherRef = collection(db, 'teachers');
      const teacherSnap = await getDocs(teacherRef);
      const teacherData = teacherSnap.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
      console.log(teacherData)
      setteachers(teacherData)

      const subjectRef = collection(db, 'semester')
      const subjectSnap = await getDocs(subjectRef)
      const subjectData = {}

      subjectSnap.docs.forEach(doc => {
        subjectData[doc.id] = doc.data()
      })

      console.log(subjectData)
      setsubjects(subjectData)
    } catch (error) {
      console.log(error);
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    teacherFetchData()
  },[])

  //subject assign function...
  const handelAssignBtn = () => {
    playClickSound()
    setloading(true)
    //Validation
    if(selectedTeacher === '0' || selectedTeacher === 'SELECT TEACHER' || !selectedTeacher){
      Alert.alert("Validation Error","All Fields are required")
      setloading(false)
      return
    }

    const teacher = teachers.find(t => t.data.email === selectedTeacher)
    setteacherName(teacher.data.name)
    console.log(teacher.data.name)
    setmodalView(true)
    setloading(false)
  }


  //Add
  const handleAdd = async (semester, subject) => {
    playClickSound()
    const teacher = teachers.find(t => t.data.email === selectedTeacher)
    if(!teacher) return;

    try {
      const teacherRef = doc(db, 'teachers', teacher.id)
      await updateDoc(teacherRef, {
        [`${semester}.${subject}`]: 0
      })
      Alert.alert('Success',`${subject} Added`)
      teacherFetchData();
    } catch (error) {
      console.log(error)
      Alert.alert('Error', error.message)
    }
  }


  //Remove
  const handleRemove = async (semester, subject) => {
    playClickSound()
    const teacher = teachers.find(t => t.data.email === selectedTeacher)
    if(!teacher) return; 

    try {
      const teacherRef = doc(db, 'teachers', teacher.id)
      await updateDoc(teacherRef, {
        [`${semester}.${subject}`] : deleteField()
      })
      Alert.alert('Removed', `${subject} Removed`)
      teacherFetchData();
    } catch (error) {
      console.log(error)
      Alert.alert('Error', error.message)
    }
  }


  //back btn
  const handleBackBtn = () => {
    setmodalView(false)
    setselectedTeacher('0')
    playClickSound();
  }
  return (
    <View style={styles.container}>
      <Text
        style={{
          color: textC,
          fontSize: 16,
          fontWeight: 800,
          textAlign: 'center',
          marginTop: 20,
          marginBottom: 25,
          //width:"100%"
        }}>
        Assign Subject To Teachers
      </Text>

      <View style={{flex:1,alignItems:"center"}}>
        <Picker
        selectedValue={selectedTeacher}
        onValueChange={itemValue => {
          setselectedTeacher(itemValue)
        }}
        dropdownIconColor={bgColor}
        dropdownIconRippleColor={bgColor}
        style={[styles.pickerBox, {backgroundColor: textC, color: bgColor}]}>
          <Picker.Item label="SELECT TEACHER" value="0" />
          {teachers.map((teacher, index) => (
            <Picker.Item
            key={index} 
            label={teacher.data.name} 
            value={teacher.data.email} />
          ))}
        </Picker>
        {loading ? (
          <View style={{flexDirection:"row", alignItems:"center", gap:20}}>
                    <ActivityIndicator size={50} color={textC} />
                    <Text style={{color:textC, fontWeight:900, fontSize:18}}>Assigning...</Text>
                  </View>
        ) : (
          <Pressable
        style={[styles.btn, {backgroundColor: textC}]}
        onPress={handelAssignBtn}
        android_ripple={{color: bgColor}}>
          <Text style={[styles.btnText, {color: bgColor}]}>Assign Subject</Text>
        </Pressable>
        )}
      </View>

      {/* Modal Start */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalView}
        onRequestClose={() => setmodalView(false)}>
        <View style={styles.centerViewed}>
          <View style={[styles.modalContent,{backgroundColor:bgColor,borderColor:textC}]}>
          <View style={{flexDirection:"row", alignItems:"center",marginBottom:20,gap:20}}>
          <Pressable
          android_ripple={{color:bgColor}}
            style={[styles.btn, {backgroundColor: textC,width:100,flexDirection:"row",gap:10}]}
            onPress={handleBackBtn}>
              <Icon name='arrow-circle-left' size={20} color={bgColor} />
            <Text style={[styles.btnText, {color:bgColor}]}>
              Back
            </Text>
          </Pressable>
          <Text style={{color:textC,width:"50%",flexWrap:"wrap",fontSize:14,fontWeight:900, textAlign:"center"}}>{teacherName}</Text>
          </View>

          {Object.keys(subjects).length > 0 && selectedTeacher !== '' && selectedTeacher !== '0' && (
            <FlatList
            data={Object.entries(subjects)}
            keyExtractor={([semester], index) => semester+index}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={{width:"100%"}}
            renderItem={({item}) => {
              const [semester, subjectList] = item;
              const teacher = teachers.find(t => t.data.email === selectedTeacher)

              return(
                <View style={[styles.listBox,{borderColor:textC}]}>
                  <Text style={[styles.listHeading,{color:textC}]}>Semester {semester}</Text>

                  {Object.keys(subjectList).map((subject, index) => {
                    const isAssigned = teacher?.data?.[semester]?.hasOwnProperty(subject);

                    return(
                      <View
                      key={index}
                      style={styles.subjectBox}>
                        <Text style={[styles.subjectText,{color:textC}]}>{subject}</Text>
                        <Pressable
                        android_ripple={{color:bgColor}}
                        style={[styles.btn,{width:100,padding:5,backgroundColor: isAssigned ? btnColorRemove : textC}]}
                        onPress={() => isAssigned ? handleRemove(semester, subject) : handleAdd(semester, subject)}>
                          <Text style={[styles.btnText,{color:bgColor}]}>{isAssigned ? 'REMOVE' : 'ADD'}</Text>
                        </Pressable>
                      </View>
                    )
                  })}

                </View>
              )
            }}
            />
          )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Assignment;

const styles = StyleSheet.create({
  container: {
    //backgroundColor:"red",
    flex: 1,
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

  //MODAL
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
  listBox:{
    //backgroundColor:"red",
    marginBottom:20,
    width:"100%",
    paddingHorizontal:20,
    paddingVertical:10,
    borderWidth:3,
    borderRadius:10
  },
  listHeading:{
    //backgroundColor:"green",
    textAlign:"center",
    fontWeight:900,
    fontSize:20,
    marginBottom:20
  },
  subjectBox:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    marginBottom:20
  },
  subjectText:{
    //backgroundColor:"red",
    flexWrap:"wrap",
    width:"50%",
    fontWeight:900,
    fontSize:16
  }
});
