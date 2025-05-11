import {StyleSheet, useColorScheme} from 'react-native';
import React, { useEffect } from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import Home from './src_pages/Home';
import Student from './src_pages/Student';
import Teacher from './src_pages/Teacher';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initClickSound, playClickSound, releaseClickSound } from './src_pages/sounds/playClickSound';

//Initialize navigation
const Tab = createBottomTabNavigator();

const App = () => {


    //Sound load
      useEffect(() => {
        initClickSound();
        return () => {
        releaseClickSound();
        }
      },[])
  
//color scheme tab
const theme = useColorScheme()
const isDarkMode = theme === 'dark';
const activeColor = isDarkMode ? "white" : "black"
const tabBack = isDarkMode ? "black" : "white"


  return (
    <NavigationContainer>
      <SafeAreaView style={{flex:1}}>
      {/* tab bar style and fuctionlity */}
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            height: 45,
            alignItems: 'center',
            justifyContent: 'center',
            //padding: 10,
            backgroundColor: tabBack,
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
          headerShown: false,
          tabBarIconStyle: {
            //marginTop: 7,
          },
          tabBarItemStyle:{
            marginTop:-5,
          }
        }}>
        {/* Home Nav */}
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({color}) => (
              <Icon name="home" size={20} color={color} />
            ),
            
          }}
          listeners={{
            tabPress: () => {
              playClickSound();
            },
          }}
        />

        {/* Student Nav */}
        <Tab.Screen
          name="Student"
          component={Student}
          options={{
            tabBarIcon: ({color}) => (
              <Icon name="user-graduate" size={20} color={color} />
            ),
            tabBarOnPress: () => {playClickSound()}
          }}
          listeners={{
            tabPress: () => {
              playClickSound();
            },
          }}
        />

        {/* Teacher Nav */}
        <Tab.Screen
          name="Admin"
          component={Teacher}
          options={{
            tabBarIcon: ({color}) => (
              <Icon name="user-cog" size={20} color={color} />
            ),
            tabBarOnPress: () => {playClickSound()}
          }}
          listeners={{
            tabPress: () => {
              playClickSound();
            },
          }}
        />
      </Tab.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({});
