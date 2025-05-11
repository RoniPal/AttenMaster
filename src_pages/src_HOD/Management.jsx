import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  FlatList,
  Alert,
  Keyboard,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { playClickSound } from '../sounds/playClickSound';

const Management = () => {
  //Theme baased style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';
  const btnText = isDarkMode ? 'black' : 'white';
  const btnBack = isDarkMode ? 'white' : 'black';
  const boxColor = isDarkMode ? '#2E2E32' : '#cfcfcf';

  const [teachers, setteachers] = useState([]);
  const [modalView, setmodalView] = useState(false);
  const [name, setName] = useState('');
  const [email, setemail] = useState('');
  const [regLoading, setregLoading] = useState(false);
  const [Loading, setLoading] = useState(true);
  const [Fetch, setFetch] = useState(false);


  const db = getFirestore();

  //Fetching Teachers...
  const teacherFetch = async () => {
    try {
      const teacherRef = collection(db, 'teachers');
      const teacherSnap = await getDocs(teacherRef);
      console.log(teacherSnap.docs);
      const teacherData = teacherSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      console.log(teacherData);
      setteachers(teacherData);
      setLoading(false)
      setFetch(true)
    } catch (error) {
      setFetch(false)
      console.log(error);
    }
  };
  useEffect(() => {
    teacherFetch();
  }, []);


  //Delete Button
  const handleDelete = async teacherID => {
    playClickSound()
    Alert.alert('Are You Sure?', 'This will permanently delete the teacher.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'OK',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'teachers', teacherID));
            //console.log(result)
            Alert.alert('Success', 'Teacher Removed');
            teacherFetch();
          } catch (error) {
            Alert.alert('Error', error.message);
            console.log(error);
          }
        },
      },
    ]);
  };


  //Add Function
  const handleSubmit = async () => {
    Keyboard.dismiss()
    playClickSound()
    setregLoading(true)

    //validate
    if(!name || !email || name === '' || email === ''){
      setregLoading(false)
      Alert.alert('Invalid Input', 'All fields are required!')
      return;
    }

    //databse handle
    try {
      const teacherRef = query(
        collection(db, 'teachers'),
        where('email', '==', email)
      )
      const teacherSnap = await getDocs(teacherRef)

      if(!teacherSnap.empty){
        setregLoading(false)
        Alert.alert('Exist', 'Teacher Already Registered');
        return;
      }

      const newTeacherDoc = doc(db, 'teachers', email)
      await setDoc(newTeacherDoc, {
        name: name,
        email: email
      }) 
      
      setregLoading(false)
      Alert.alert('Success', 'Teacher was Added');
      console.log(`Name : ${name}  Email: ${email}`)

    } catch (error) {
      setregLoading(false)
      console.log(error)
      Alert.alert('Error', 'Not Submitted! May Be Server Issue')
    }

    //Call again fetch teacher
    teacherFetch()

    //reset data
    setName('')
    setemail('')
    setmodalView(false)
  }


  //Cancel btn
  const handleCancel = () => {
    playClickSound()
    //reset data
    setName('')
    setemail('')
    setmodalView(false)
  }


  //Text Capital
  const capitalConvert = text => {
    setName(text.toUpperCase());
  };

  //Text Lower
  const lowerConvert = text => {
    setemail(text.toLowerCase());
  };


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
        Add or Remove Teachers
      </Text>

      <View style={styles.teacherListContainer}>
        <View style={styles.btnContainer}>
          <Pressable
          android_ripple={{color:bgColor}}
            style={[styles.btn, {backgroundColor: textC}]}
            onPress={() => {setmodalView(true); playClickSound()}}>
            <Text style={[styles.btnText, {color: bgColor}]}>Add Teacher</Text>
          </Pressable>
        </View>
        
        {Loading ? (
          <View style={{marginTop:100,}}>
            <ActivityIndicator size={40} color={textC} />
          </View>
        ): (Fetch ? (
          <FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={styles.listStyle}
          contentContainerStyle={{gap: 20, paddingBottom: 200}}
          data={teachers}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={[styles.detailBox, {borderColor: textC}]}>
              <Text
                style={{
                  width: '100%',
                  fontWeight: 700,
                  color: textC,
                  flexWrap: 'wrap',
                }}>
                {item.id}
              </Text>
              <View style={[styles.nameBox]}>
                <Text
                  style={{
                    color: textC,
                    fontWeight: 900,
                    fontSize: 16,
                    width: 190,
                    flexWrap: 'wrap',
                  }}>
                  {item.name}
                </Text>
                <Pressable
                android_ripple={{color:bgColor}}
                  style={{
                    width: 50,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 50,
                    borderWidth: 2,
                    borderRadius: 10,
                    borderColor: textC,
                  }}
                  onPress={() => handleDelete(item.id)}>
                  <Icon name="trash" size={20} color={textC} />
                </Pressable>
              </View>
            </View>
          )}
        />
        ) : (
          <View style={{margin:100}}>
            <Text style={{fontWeight:700,fontSize:16,color:textC, textAlign:"center"}}>No Data Found</Text>
          </View>
        ) )} 
      </View>

      {/* ADD Form */}
      <Modal
          animationType="slide"
          transparent={true}
          visible={modalView}
          onRequestClose={() => setmodalView(false)}>
          <View style={[styles.centeredView,{backgroundColor: 'rgba(187, 186, 186, 0.9)'}]}>
            <View
              style={[
                styles.modalView,
                {backgroundColor: boxColor, borderColor: btnBack},
              ]}>
              <Text style={[styles.modalText, {color: textC}]}>
                Fill in teacher details
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
                onChangeText={lowerConvert}
                value={email}
                placeholder="Email"
                keyboardType="email"
                placeholderTextColor={btnText}
              />
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
                    Adding...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContainer}>
                  <Pressable
                  android_ripple={{color:bgColor}}
                    style={[styles.button, styles.buttonClose]}
                    onPress={handleCancel}>
                    <Text style={[styles.textStyle, {color: btnText}]}>
                      CANCEL
                    </Text>
                  </Pressable>
                  <Pressable
                  android_ripple={{color:bgColor}}
                    style={[styles.button, {backgroundColor: btnBack}]}
                    onPress={() => handleSubmit()}>
                    <Text style={[styles.textStyle, {color: btnText}]}>
                      SUBMIT
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>
    </View>
  );
};

export default Management;

const styles = StyleSheet.create({
  container: {
    //backgroundColor:"red",
    flex: 1,
    width: '100%',
  },
  btnContainer: {
    // backgroundColor:"skyblue",
    width: '100%',
    alignItems: 'center',
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
  listStyle: {
    //backgroundColor:"blue",
    //paddingHorizontal:10,
    marginTop: 30,
    flex: 1,
  },
  detailBox: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: 270,
    borderWidth: 3,
    borderRadius: 10,
  },
  nameBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // backgroundColor:"green",
    alignItems: 'center',
    marginTop: 20,
    //marginBottom:10
  },
  teacherListContainer: {
    flex: 1,
    alignItems: 'center',
    //backgroundColor:"green"
  },


  // Modal Style
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
