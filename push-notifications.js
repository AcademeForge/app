document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { PushNotifications } = Capacitor.Plugins;

    const permission = await PushNotifications.requestPermissions();

    if (permission.receive !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", (token) => {
      console.log("FCM TOKEN:", token.value);

      localStorage.setItem("af_fcm_token", token.value);

      // Yaha baad me Supabase save API call add karenge
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error", err);
    });

    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Notification received", notification);
      }
    );

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log("Notification clicked", notification);
      }
    );

  } catch (e) {
    console.error("Push init failed:", e);
  }
});
