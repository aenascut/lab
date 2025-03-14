import { Cookies, SetCookie } from "cookies";
import { createResponse } from "create-response";
import { httpRequest } from "http-request";
import { logger } from "log";
import { HtmlRewritingStream } from "html-rewriter";
import { Client } from "./lib.js";
import { rules } from "./rules.js";

export async function responseProvider(request, response) {
  logger.log("Starting Hello World EdgeWorker");

  try {
    logger.log("Creating response from the EdgeWorker");

    // Exercise 2. Create a new client instance
    // const client = await Client({
    //   orgId: "82C94E025B2385B40A495E2C@AdobeOrg",
    //   datastreamId: "bdb5cb8a-4496-4abd-8afc-e9396c1b1c27",
    //   propertyToken: "",
    //   oddEnabled: true,
    //   edgeDomain: "abc.adobelab2025.com",
    // });
    logger.log("Instantiating client ");

    // Exercise 3. Create the event for the SDK Client
    const address = `${request.scheme}://${request.host}${request.url}`;
    const event = {
      type: "decisioning.propositionFetch",
      personalization: {
        sendDisplayEvent: true,
      },
      xdm: {
        web: {
          webPageDetails: {
            URL: address,
          },
        },
      },
    };
    logger.log("Created server side event");

    // Additional step: Exercise 9. Extract the ECID from the request cookie and if it's present add it to the request
    // const cookies = new Cookies(request.getHeader("Cookie"));
    // const ecid = cookies.get("X-ADOBE-ECID");
    // if (ecid) {
    //   event.xdm.identityMap = {
    //     ECID: [
    //       {
    //         id: ecid,
    //         authenticatedState: "ambiguous",
    //         primary: true,
    //       },
    //     ],
    //   }
    // }

    // Exercise 3. Retrieve the Consequences based on the request
    // const consequences = await client.sendEvent(event);
    logger.log("Received consequences");

    // Exercise 5. Apply the consequences to the origin stream
    // const streamRewriter = new HtmlRewritingStream();
    const originResponse = await httpRequest(
      "https://origin.adobelab2025.test.edgekey-staging.net",
    );

    // custom code that prevents alloy from the browser
    streamRewriter.onElement("head", (el) => {
      const ODD_BROWSER_CONFIG = `window.oddServerSideConfig = {
                        preventAlloyImport: true,
                        timestamp: ${Date.now()}
                  };`;
      el.append(`<script>
                ${ODD_BROWSER_CONFIG}
               </script>`);
    });

    const consequenceItems = consequences.handle
      .filter((payload) => payload.type === "personalization:decisions")
      .map((consequence) => consequence.payload.map((payload) => payload.items))
      .flat(2);
    logger.log("Number of consequenceItems " + consequenceItems.length);

    consequenceItems.forEach((item) => {
      switch (item.schema) {
        case "https://ns.adobe.com/personalization/json-content-item":
          const { content } = item.data;
          const { payload } = content;
          logger.log("Registering payload ");

          if (Array.isArray(payload)) {
            payload.forEach((proposition) => {
              logger.log("Registering proposition " + proposition.selector);
              // match the DOM element based on the CSS selector
              // streamRewriter.onElement(proposition.selector, (el) => {
              //     el.replaceWith(proposition.payload);
              // });
            });
          }
          break;
      }
    });

    // Additional debug info
    streamRewriter.onElement("body", (el) => {
      const debugInfoInline = `
            <script>
            const debugInfo = JSON.stringify({
                consequences: ${JSON.stringify(consequences)},
                event:  ${JSON.stringify(event)}
            });
            console.log('Debug Info: ', JSON.parse(debugInfo));
            </script>
            `;
      el.append(debugInfoInline);
    });

    // Additional step: Exercise 9. Persist the ECID in a cookie in the browser
    // const ecidNamepace = consequences.handle.find(
    //     (payload) =>
    //         payload.type === "identity:result" &&
    //         payload.payload[0].namespace.code === "ECID",
    // );
    // const ecidValue = ecidNamepace.payload[0].id;
    // streamRewriter.onElement("body", (el) => {
    //   el.append(
    //       `<script> document.cookie = "X-ADOBE-ECID=${ecidValue};SameSite=None; Secure"; </script>`,
    //   );
    // });

    // Exercise 6: Returning the processed response
    // return createResponse(
    //   200,
    //   {
    //     "Powered-By": ["Akamai EdgeWorkers " + new Date().toString()]
    //   },
    //   originResponse.body.pipeThrough(streamRewriter),
    // );
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    return createResponse(
      500,
      { "Powered-By": ["Akamai EdgeWorkers " + new Date().toString()] },
      `${request.method}: ${error.message}`,
    );
  }
}
