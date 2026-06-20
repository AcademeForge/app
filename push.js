document.addEventListener("deviceready", initPush);

async function initPush() {
  try {

    const { PushNotifications } = Capacitor.Plugins;

    const permission =
      await PushNotifications.requestPermissions();

    if (permission.receive !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener(
      "registration",
      async (token) => {

        console.log("FCM TOKEN:", token.value);

        localStorage.setItem(
          "af_fcm_token",
          token.value
        );

        const studentId =
          localStorage.getItem("af_student_uuid");

        if (!studentId) return;

        try {

          await fetch(
            "YOUR_EDGE_FUNCTION_URL",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                student_id: studentId,
                fcm_token: token.value
              })
            }
          );

        } catch (e) {
          console.error(e);
        }

      }
    );

    PushNotifications.addListener(
      "pushNotificationReceived",
      notification => {

        console.log(
          "Notification:",
          notification
        );

      }
    );

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      action => {

        console.log(
          "Action:",
          action
        );

      }
    );

  } catch (e) {
    console.error(e);
  }
}
