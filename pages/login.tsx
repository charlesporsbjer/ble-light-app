import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { BleManager } from "react-native-ble-plx";
import colors from "../components/colors";

let bleManager;

export default function LoginScreen() {
  const [deviceID, setDeviceID] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    // Load the deviceID from AsyncStorage when the component mounts
    const loadDeviceID = async () => {
      try {
        const storedDeviceID = await AsyncStorage.getItem("deviceID");
        if (storedDeviceID) {
          setDeviceID(storedDeviceID);
        }
      } catch (error) {
        console.error("Failed to load device ID", error);
      }
    };

    loadDeviceID();
  }, []);

  // Initialize BLE once on mount
  useEffect(() => {
    const initBle = async () => {
      bleManager = new BleManager();
    };
    initBle();
    return () => {
      bleManager.destroy();
    };
  }, []);

  const handleConnect = async () => {
    if (deviceID.trim() === "") {
      Alert.alert("Invalid Device ID", "Please enter a valid device ID.");
      return;
    }
    setIsConnecting(true);
    try {
      // const device = await bleManager.connectToDevice(deviceID);

      // for now let's just pretend we connected to a device
      const device = { id: deviceID, name: "Mock Device" };

      console.log("Connected to device:", device);
      await AsyncStorage.setItem("deviceID", deviceID);
      navigation.navigate("Home", { bleDevice: device });
    } catch (error) {
      console.error("Failed to connect to device", error);
      Alert.alert("Connection Error", "Failed to connect to the device.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleContainer}>Enter device ID</Text>
      </View>
      <View style={styles.titleContainer}>
        <TextInput
          placeholder="Unit ID"
          value={deviceID}
          onChangeText={setDeviceID}
          style={styles.titleContainer}
        />
      </View>
      <View style={styles.titleContainer}>
        <Button
          title="Login"
          onPress={handleConnect}
          color={colors.buttonBackground}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20, // Adds spacing from edges
    backgroundColor: colors.background,
  },
  titleContainer: {
    marginVertical: 8, // Adds spacing between elements
    flexDirection: "row",
    maxWidth: "70%", // Limit width to 80% of the screen
    minWidth: "45%", // Limit width to 80% of the screen
    minHeight: 50, // Set a minimum height
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Slight transparency for better contrast
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10, // Rounded corners
  },
  textColor: {
    color: colors.textPrimary,
    fontSize: 32, // Bigger text for readability
    fontWeight: "bold",
  },
  input: {
    height: 40,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    width: "100%",
  },
});

/*


*/
