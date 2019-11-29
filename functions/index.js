const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const mailgun = require("mailgun.js");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.sendWaitlistEmail = functions.https.onRequest((request, response) => {
  return cors(request, response, async () => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
    }
    const API_KEY = "03799ad39f433781af697f39763c4f71-1df6ec32-de33fd38";
    const DOMAIN = "transmail.showmelove.co";

    const mg = mailgun.client({ username: "api", key: API_KEY });

    const { email, firstName } = request.body;

    if (!email || !firstName) {
      return response.status(404).send({ message: 'Email or FirstName missing', code: 'params-missing', error: true })
    }


    const data = {
      from: "Showmelove <team@showmelove.co>",
      to: `${firstName} ${email}`,
      subject: "Welcome to Showmelove!",
      template: "waitlist",
      "v:firstName": firstName
    };

    try {
      await db
        .collection("waitlist")
        .doc(email)
        .set({ email, firstName });
      const result = await mg.messages.create(DOMAIN, data);
      console.log(">>> Waitlist Email Sent: ", result);
      return response.status(200).send({ message: 'Message Sent Successfully', code: 'email-success', error: false, data: {} });
    } catch (error) {
      console.log(">>> Error In Sending Waitlist Email: ", error);
      return response.status(500).send({ message: 'Error Occurred', code: 'internal-error', error: true });
    }
  });
});
