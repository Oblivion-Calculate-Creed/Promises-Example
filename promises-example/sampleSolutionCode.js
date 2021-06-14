const https = require("https");

// will need to be retrieved from Secrets Manager
// const secretName = process.env.secretName
// let secrets;
//     try {
//         secrets = await AWS.SecretsManager.getSecretValue(secretName);
//         if (!secrets) {
//             throw new Error('No Secrets')
//         }
//         secrets = JSON.parse(secrets);
//     } catch (error) {
//         console.error(error);
//     }


const CLIENT_ID = "test";
const CLIENT_SECRET = "test";

const defaultOptions = {
  host: "https://uswitchpartners.eu.auth0.com",
  port: 443,
  headers: {
    "Content-Type": "application/json",
  },
};

const post = (path, payload) => new Promise((resolve, reject) => {
    const options = { ...defaultOptions, path, method: "POST" };
    const req = http.request(options, (res) => {
      let buffer = "";
      res.on("data", (chunk) => (buffer += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(buffer)); // converts json to object
        } catch (error) {
          console.error(error);
        }
      });
    });
    req.on("error", (e) => reject(e.message));
    req.write(JSON.stringify(payload)); //data to post
    req.end();
  });

// HANDLER
exports.handler = async (event, context) =>
  await new Promise(async (resolve, reject) => {
    // Post request for token
    const token = await post("/oauth/token", {
      grant_type: "client_credentials",
      audience: "https://staging-api.partners.uswitch.com/energy",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    // Get request with access token

    token.then((bearer_obj) => {
      //console.log(bearer_obj.access_token);
      const options = {
        hostname: "https://staging-api.energy.uswitchsuppliers.com",  // staging, to be stored in Secrets Manager
        port: 443,
        path: "/switching/messages/unread",
        method: "GET",
        Authorization: "Bearer " + bearer_obj.access_token
      };
      // TODO: Acknowledge message received using /switching/messages/acknowledge
      const req = https.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);

        res.on("data", (d) => {
          // Process response data
          process.stdout.write(d);
        });
      });

      req.on("error", (error) => {
        console.error(error);
      });

      req.end();
    });
  });
