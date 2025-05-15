// Web Bluetooth helper for sending a payload string to a BLE device

declare global {
  interface Navigator {
    bluetooth?: any;
  }
}

export async function webBleSend(payloadString: string): Promise<void> {
  try {
    const serviceUUID = "0000b00b-0000-1000-8000-00805f9b34fb";
    const characteristicUUID = "0000feed-0000-1000-8000-00805f9b34fb";

    if (!navigator.bluetooth) {
      alert("Web Bluetooth API is not supported in this browser.");
      return;
    }

    // Request device
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [serviceUUID] }],
      optionalServices: [serviceUUID],
    });

    // Connect to GATT server
    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService(serviceUUID);
    const characteristic = await service.getCharacteristic(characteristicUUID);

    // Encode payload as Uint8Array
    const encoder = new TextEncoder();
    const value = encoder.encode(payloadString);

    // Write value
    await characteristic.writeValue(value);

    alert("Schedule sent to BLE device (Web)");
  } catch (error: any) {
    console.error("Web BLE error:", error);
    alert("Web BLE error: " + (error?.message || error));
  }
}
