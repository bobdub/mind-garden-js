let notifiedStorageIssue = false;

const formatStorageMessage = () =>
  [
    "Storage access is blocked or unavailable in this browser.",
    "Enable site data or storage permissions to keep memories between visits.",
    "The app will continue without local memory until storage is allowed.",
  ].join(" ");

const notifyStorageUnavailable = (error?: unknown) => {
  if (typeof window === "undefined") {
    return;
  }
  if (notifiedStorageIssue) {
    return;
  }
  notifiedStorageIssue = true;
  if (error) {
    console.warn("[storage] local storage is unavailable", error);
  }
  window.alert(formatStorageMessage());
};

export const getLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    notifyStorageUnavailable(error);
    return null;
  }
};

export const canUseLocalStorage = (): boolean => {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }
  try {
    const probeKey = "__mind_garden_storage_probe__";
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    return true;
  } catch (error) {
    notifyStorageUnavailable(error);
    return false;
  }
};
