import * as Device from "expo-device";
import * as Network from "expo-network";
import * as Cellular from "expo-cellular";
import * as Location from "expo-location";
import Constants from "expo-constants";

export async function getDeviceModel(): Promise<string> {
  if (Device.modelName) {
    return Device.modelName;
  }

  if (Device.deviceName) {
    return Device.deviceName;
  }

  return Device.brand || "Unknown Device";
}

export async function getOsVersion(): Promise<string> {
  const osName = Device.osName || "Unknown OS";
  const osVersion = Device.osVersion || "Unknown Version";
  return `${osName} ${osVersion}`;
}

export async function getAppVersion(): Promise<string> {
  return Constants.expoConfig?.version ?? Constants.manifest?.version ?? "1.0.0";
}

export async function getNetworkType(): Promise<string> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected) {
      return "No Service";
    }

    switch (state.type) {
      case Network.NetworkStateType.CELLULAR:
      case "CELLULAR":
        return await getCellularGenerationLabel();
      case Network.NetworkStateType.WIFI:
      case "WIFI":
        return "Wi-Fi";
      case Network.NetworkStateType.ETHERNET:
      case "ETHERNET":
        return "Ethernet";
      case Network.NetworkStateType.UNKNOWN:
      case "UNKNOWN":
      default:
        return "Unknown";
    }
  } catch (error) {
    return "Unknown";
  }
}

async function getCellularGenerationLabel(): Promise<string> {
  try {
    const generation = await Cellular.getCellularGenerationAsync();
    switch (generation) {
      case Cellular.CellularGeneration._5G:
      case Cellular.CellularGeneration._5G_PLUS:
      case Cellular.CellularGeneration._5G_E:
        return "5G";
      case Cellular.CellularGeneration._4G:
      case Cellular.CellularGeneration._4G_LTE:
        return "4G LTE";
      case Cellular.CellularGeneration._3G:
        return "3G";
      case Cellular.CellularGeneration._2G:
        return "2G";
      default:
        return "Cellular";
    }
  } catch (error) {
    return "Cellular";
  }
}

export async function getOperatorName(): Promise<string | null> {
  try {
    const name = await Cellular.getCarrierNameAsync();
    return name || null;
  } catch (error) {
    return null;
  }
}

export async function getSignalStrength(): Promise<number | null> {
  try {
    const signal = await Cellular.getSignalStrengthAsync?.();
    if (typeof signal === "number") {
      return signal;
    }
  } catch (error) {
    // Some platforms do not support signal strength.
  }
  return null;
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({});
    if (!location?.coords) {
      return null;
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    return null;
  }
}

export async function getIpAddress(): Promise<string | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip || null;
  } catch (error) {
    return null;
  }
}
