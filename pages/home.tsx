import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Switch, Button, Alert } from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import colors from "../components/colors";

export default function HomeScreen({ route }) {
  const { bleDevice } = route.params;
  const [isLightOn, setIsLightOn] = useState(false);
  const [redLightIntensity, setRedLightIntensity] = useState(0);
  const [sunlightIntensity, setSunlightIntensity] = useState(0);
  const navigation = useNavigation();

  const sendBLECommand = async (command) => {
    try {
      if (!bleDevice) throw new Error("No BLE device connected.");
      // First discover services (MUST DO THIS BEFORE WRITING)
      //await bleDevice.discoverAllServicesAndCharacteristics();

      // Then write to the characteristic
      await bleDevice.writeCharacteristicWithoutResponse(
        "00001234-0000-1000-8000-00805F9B34FB", // Your service UUID
        "00005678-0000-1000-8000-00805F9B34FB", // Your characteristic UUID
        command
      );
      Alert.alert("Success", "Command sent");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleLightSwitch = () => {
    const newState = !isLightOn;
    setIsLightOn(newState);
    if (!newState) {
      sendBLECommand("light_off");
    } else {
      // If light turns ON, send the current intensity values
      sendBLECommand(`R${redLightIntensity};S${sunlightIntensity}`);
    }
  };

  // Auto-update BLE when intensities change and light is ON.
  useEffect(() => {
    if (isLightOn) {
      sendBLECommand(`R${redLightIntensity};S${sunlightIntensity}`);
    }
  }, [redLightIntensity, sunlightIntensity]);

  const handleNavigateToScheduler = () => {
    navigation.navigate("Scheduler", {
      bleDevice,
      currentRedIntensity: redLightIntensity,
      currentSunlightIntensity: sunlightIntensity,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Light Control</Text>
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Light Switch</Text>
        <Switch
          value={isLightOn}
          onValueChange={handleLightSwitch}
          trackColor={{ false: colors.border, true: colors.buttonBackground }}
          thumbColor={isLightOn ? colors.buttonBackground : colors.border}
        />
      </View>
      {isLightOn && (
        <>
          <View style={styles.sliderContainer}>
            <Text style={styles.label}>Red Light Intensity</Text>
            <Slider
              value={redLightIntensity}
              onValueChange={setRedLightIntensity}
              minimumValue={0}
              maximumValue={100}
              step={1}
              style={styles.slider}
              minimumTrackTintColor={colors.buttonBackground}
              maximumTrackTintColor={colors.border}
            />
            <Text style={styles.intensityValue}>{redLightIntensity}%</Text>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={styles.label}>Sunlight Intensity</Text>
            <Slider
              value={sunlightIntensity}
              onValueChange={setSunlightIntensity}
              minimumValue={0}
              maximumValue={100}
              step={1}
              style={styles.slider}
              minimumTrackTintColor={colors.buttonBackground}
              maximumTrackTintColor={colors.border}
            />
            <Text style={styles.intensityValue}>{sunlightIntensity}%</Text>
          </View>
        </>
      )}
      <Button
        title="Go to Scheduler"
        onPress={handleNavigateToScheduler}
        color={colors.buttonBackground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.textPrimary,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginRight: 10,
    color: colors.textPrimary,
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  slider: {
    width: "100%",
  },
  intensityValue: {
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 5,
  },
});
