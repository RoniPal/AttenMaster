import {Pressable, StyleSheet, Text, useColorScheme, View} from 'react-native';
import React from 'react';

const Checkbox = ({isChecked, onChange}) => {
//Theme Based Style
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? 'black' : 'white';
  const textC = isDarkMode ? 'white' : 'black';

  return (
    <Pressable style={{flexDirection: 'row', alignItems: 'center', gap: 10}} onPress={() => onChange(!isChecked)}>
      <View
        style={{
          width: 30,
          height: 30,
          borderWidth: 2,
          borderColor: textC,
          borderRadius: 5,
          justifyContent:"center",
          alignItems:"center"
        }}>
        {isChecked ? (
          <Text style={{textAlign: 'center', fontWeight: 900,fontSize:19, color:textC}}>✔</Text>
        ) : (
          <View></View>
        )}
      </View>
    </Pressable>
  );
};

export default Checkbox;

const styles = StyleSheet.create({});
