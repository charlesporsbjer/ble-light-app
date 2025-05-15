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
// Only import BleManager on mobile
import { Platform } from "react-native";
import { webBleSend } from "../components/webBleHelper"; // Import your web BLE send function

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
  // Check if running in React Native (mobile)
  const isMobileApp = Platform.OS === "ios" || Platform.OS === "android";
  // Check if running in browser
  const isWeb = typeof window !== "undefined" && !!window.navigator;

  // Only require BleManager and instantiate on mobile
  let manager = null;
  if (isMobileApp) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BleManager } = require("react-native-ble-plx");
    manager = new BleManager();
  }

  const {
    bleDevice,
    currentRedIntensity = 0,
    currentSunlightIntensity = 0,
  } = route.params || {};

  // Receive the current intensity as reference but do NOT override schedule

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
    // Cleanup BLE manager when the component unmounts (mobile only)
    return () => {
      if (isMobileApp && manager) {
        manager.destroy();
      }
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
      const timeNow = Math.floor(Date.now() / 1000);
      const daylightSavingsTime = new Date().getTimezoneOffset() < 0 ? 1 : 0;
      const timeZoneOffsetHrs = new Date().getTimezoneOffset() / -60;

      const payload = {
        ...schedule,
        ...assignedDays,
        timeNow,
        daylightSavingsTime,
        timeZoneOffsetHrs,
      };

      const payloadString = JSON.stringify(payload);
      console.log("Payload: ", payloadString);

      if (isWeb) {
        await webBleSend(payloadString);
        return;
      }

      if (!bleDevice) throw new Error("No BLE device connected.");
      if (!manager) throw new Error("BLE manager not initialized.");

      // Native BLE logic (as you already have)
      const connectedDevice = await manager.connectToDevice(bleDevice.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();

      const serviceUUID = "B00B";
      const characteristicUUID = "FEED";

      await connectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        Buffer.from(payloadString).toString("base64")
      );
      Alert.alert("Success", "Schedule sent to BLE device");
    } catch (error) {
      console.error("Failed to send schedule", error);
      Alert.alert("Error", error.message || String(error));
    }
  };

  const handleNavigateToHome = () => {
    navigation.navigate("Home", { bleDevice });
  };

  // Web time picker handler
  const handleWebTimeChange = (lightType, timeType, event) => {
    const time = event.target.value;
    setSchedule({
      ...schedule,
      [`${lightType}${timeType}`]: time,
    });
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
          {isMobileApp ? (
            <TouchableOpacity
              onPress={() => showDatePicker(lightType, "Start")}
            >
              <Text style={styles.timeText}>
                {schedule[`${lightType}Start`] || "Select Time"}
              </Text>
            </TouchableOpacity>
          ) : (
            <input
              type="time"
              value={schedule[`${lightType}Start`] || ""}
              onChange={(e) => handleWebTimeChange(lightType, "Start", e)}
              style={{
                marginBottom: 10,
                padding: 8,
                borderRadius: 5,
                border: `1px solid ${colors.border}`,
              }}
            />
          )}
          <Text style={styles.label}>
            {lightType.replace(/([A-Z])/g, " $1").trim()} End
          </Text>
          {isMobileApp ? (
            <TouchableOpacity onPress={() => showDatePicker(lightType, "End")}>
              <Text style={styles.timeText}>
                {schedule[`${lightType}End`] || "Select Time"}
              </Text>
            </TouchableOpacity>
          ) : (
            <input
              type="time"
              value={schedule[`${lightType}End`] || ""}
              onChange={(e) => handleWebTimeChange(lightType, "End", e)}
              style={{
                marginBottom: 10,
                padding: 8,
                borderRadius: 5,
                border: `1px solid ${colors.border}`,
              }}
            />
          )}
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
      {isMobileApp && (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="time"
          isDarkModeEnabled={true}
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      )}
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
