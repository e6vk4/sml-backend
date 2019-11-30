const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const mailgun = require("mailgun.js");
const admin = require("firebase-admin");

/**
 * For Local emulation ensure your service account is in the directory
 const serviceAccount = require("./showmelove-service-account.json");
 admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://stoked-citizen-241512.firebaseio.com"
 });
 */

admin.initializeApp();
const db = admin.firestore();

exports.sendWaitlistEmail = functions.https.onRequest((request, response) => {
  return cors(request, response, async () => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
    }

    const { email, firstName } = request.body;
    console.log("Email or ", email, firstName);

    if (!email || !firstName) {
      return response.status(400).send({
        message: "Email or firstname missing",
        code: "invalid-request-error",
        error: true
      });
    }

    const API_KEY = "03799ad39f433781af697f39763c4f71-1df6ec32-de33fd38";
    const DOMAIN = "transmail.showmelove.co";

    const mg = mailgun.client({ username: "api", key: API_KEY });

    const data = {
      from: "Showmelove <team@showmelove.co>",
      to: `${firstName} ${email}`,
      subject: "Welcome to Showmelove!",
      template: "waitlist",
      "v:firstName": firstName
    };

    try {
      const waitlistRef = db.collection("waitlist").doc(email);
      const snapshot = await waitlistRef.get();
      if (!snapshot.exists) {
        await waitlistRef.set({ email, firstName });
        const result = await mg.messages.create(DOMAIN, data);
        console.log(">>> Waitlist Email Sent: ", result);
        return response.status(200).send({
          message: "Message Sent Successfully",
          code: "success",
          error: false,
          data: {}
        });
      } else {
        return response.status(402).send({
          message: "Email already added to waitlist",
          code: "request-failed-error",
          error: true
        });
      }
    } catch (error) {
      console.log(">>> Error In Sending Waitlist Email: ", error);
      return response.status(500).send({
        message: "Error Occurred",
        code: "api-error",
        error: true
      });
    }
  });
});
