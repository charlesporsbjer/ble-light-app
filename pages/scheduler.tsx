import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useNavigation } from "@react-navigation/native";
import colors from "../components/colors";
import { BleManager } from "react-native-ble-plx";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function SchedulerScreen({ route }) {
  const bleDevice = route.params?.bleDevice;
  const manager = new BleManager(); // Initialize BLE manager instance

  // Receive the current intensity as reference but do NOT override schedule
  const currentRedIntensity = route.params?.currentRedIntensity || 0;
  const currentSunlightIntensity = route.params?.currentSunlightIntensity || 0;

  const [schedule, setSchedule] = useState({
    redLightStart: null,
    redLightEnd: null,
    redLightIntensity: currentRedIntensity,
    sunlightStart: null,
    sunlightEnd: null,
    sunLightIntensity: currentSunlightIntensity,
  });

  const [assignedDays, setAssignedDays] = useState(
    daysOfWeek.reduce((acc, day) => {
      acc[day] = false;
      return acc;
    }, {})
  );

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [currentPicker, setCurrentPicker] = useState({
    lightType: "",
    timeType: "",
  });

  const navigation = useNavigation();

  useEffect(() => {
    // Cleanup BLE manager when the component unmounts
    return () => {
      manager.destroy();
    };
  }, []);

  const showDatePicker = (lightType, timeType) => {
    setCurrentPicker({ lightType, timeType });
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setSchedule({
      ...schedule,
      [`${currentPicker.lightType}${currentPicker.timeType}`]: time,
    });
    hideDatePicker();
  };

  const handleDayToggle = (day) => {
    setAssignedDays({
      ...assignedDays,
      [day]: !assignedDays[day],
    });
  };

  const handleSaveSchedule = async () => {
    try {
      if (!bleDevice) throw new Error("No BLE device connected.");

      const timeNow = Math.floor(Date.now() / 1000); // Example: 1711653475123
      const daylightSavingsTime = new Date().getTimezoneOffset() < 0 ? 1 : 0;
      const timeZoneOffsetHrs = new Date().getTimezoneOffset() / -60; // Example: -5 for EST

      setSchedule({ ...schedule });

      const payload = {
        ...schedule,
        ...assignedDays,
        timeNow,
        daylightSavingsTime,
        timeZoneOffsetHrs,
      };

      const payloadString = JSON.stringify(payload);
      console.log("Payload: ", payloadString);

      // Connect to the BLE device
      const connectedDevice = await manager.connectToDevice(bleDevice.id);
      console.log("Connected to device:", connectedDevice);

      // Discover services and characteristics (if needed)
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log("Discovered services and characteristics");

      // Write to the characteristic (replace with actual UUIDs)
      const serviceUUID = "B00B";
      const characteristicUUID = "FEED";

      await connectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        Buffer.from(payloadString).toString("base64") // Convert to base64
      );
      console.log("Payload sent to device");

      Alert.alert("Success", "Schedule sent to BLE device");
    } catch (error) {
      console.error("Failled to send scehdule", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleNavigateToHome = () => {
    navigation.navigate("Home", { bleDevice });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set Daily Schedule for Light</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.label}>Red Light Intensity</Text>
        <Slider
          value={schedule.redLightIntensity}
          onValueChange={(value) =>
            setSchedule({ ...schedule, redLightIntensity: value })
          }
          minimumValue={0}
          maximumValue={100}
          step={1}
          style={styles.slider}
          minimumTrackTintColor={colors.buttonBackground}
          maximumTrackTintColor={colors.border}
        />
        <Text style={styles.intensityValue}>{schedule.redLightIntensity}%</Text>
      </View>
      <View style={styles.sliderContainer}>
        <Text style={styles.label}>Sunlight Intensity</Text>
        <Slider
          value={schedule.sunLightIntensity}
          onValueChange={(value) =>
            setSchedule({ ...schedule, sunLightIntensity: value })
          }
          minimumValue={0}
          maximumValue={100}
          step={1}
          style={styles.slider}
          minimumTrackTintColor={colors.buttonBackground}
          maximumTrackTintColor={colors.border}
        />
        <Text style={styles.intensityValue}>{schedule.sunLightIntensity}%</Text>
      </View>
      {["redLight", "sunlight"].map((lightType) => (
        <View key={lightType} style={styles.inputContainer}>
          <Text style={styles.label}>
            {lightType.replace(/([A-Z])/g, " $1").trim()} Start
          </Text>
          <TouchableOpacity onPress={() => showDatePicker(lightType, "Start")}>
            <Text style={styles.timeText}>
              {schedule[`${lightType}Start`] || "Select Time"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.label}>
            {lightType.replace(/([A-Z])/g, " $1").trim()} End
          </Text>
          <TouchableOpacity onPress={() => showDatePicker(lightType, "End")}>
            <Text style={styles.timeText}>
              {schedule[`${lightType}End`] || "Select Time"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      <Text style={styles.title}>Assign Schedule to Days</Text>
      {daysOfWeek.map((day) => (
        <View key={day} style={styles.dayContainer}>
          <Text style={styles.dayTitle}>{day}</Text>
          <Switch
            value={assignedDays[day]}
            onValueChange={() => handleDayToggle(day)}
            trackColor={{ false: colors.border, true: colors.buttonBackground }}
            thumbColor={
              assignedDays[day] ? colors.buttonBackground : colors.border
            }
          />
        </View>
      ))}
      <Button
        title="Save Schedule"
        onPress={handleSaveSchedule}
        color={colors.buttonBackground}
      />
      <Button
        title="Back to Home"
        onPress={handleNavigateToHome}
        color={colors.buttonBackground}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="time"
        isDarkModeEnabled={true}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 16,
    color: colors.textPrimary,
    padding: 10,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 5,
    textAlign: "center",
  },
  dayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  dayTitle: {
    fontSize: 18,
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
