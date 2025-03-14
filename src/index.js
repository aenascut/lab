import { Cookies } from "cookies";
import { createResponse } from "create-response";
import { httpRequest } from "http-request";
import { logger } from "log";
import { HtmlRewritingStream } from "html-rewriter";
import { Client } from "./lib.js";

export async function responseProvider(request, response) {
  logger.log("Starting Hello World EdgeWorker");

  try {
    logger.log("Creating response from the EdgeWorker");

    // Exercise 2. Create a new client instance
    const client = await Client({
      orgId: "906E3A095DC834230A495FD6@AdobeOrg",
      datastreamId: "",
      propertyToken: "",
      oddEnabled: true,
      edgeDomain: "abc.adobelab2025.com",
    });
    logger.log("Instantiating client ");

    // Exercise 3. Retrieve the Consequences based on the request
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

    // Exercise 10. Extract the ECID from the request cookie and if it's present add it to the request
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
    // }

    // const consequences = await client.sendEvent(event);
    logger.log("Received consequences ");

    // Exercise 4. Extract the decisions from the consequences and create a notification event
    const decisions = consequences.handle
      .filter((fragment) => fragment.type === "personalization:decisions")
      .flatMap((fragment) => fragment.payload);
    const propositions = decisions.map((decision) => {
      const { id, scope, scopeDetails } = decision;
      return { id, scope, scopeDetails };
    });
    logger.log("Number of propositions " + propositions.length);

    // Exercise 5. Apply the consequences to the origin stream
    const streamRewriter = new HtmlRewritingStream();
    const originResponse = await httpRequest(
      "https://origin.adobelab2025.test.edgekey-staging.net",
    );

    const consequenceItems = consequences.handle
      .filter((payload) => payload.type === "personalization:decisions")
      .map((consequence) => consequence.payload.map((payload) => payload.items))
      .flat(2);
    logger.log("Number of consequenceItems " + consequenceItems.length);

    streamRewriter.onElement("head", (el) => {
      const ODD_BROWSER_CONFIG = `window.oddServerSideConfig = {
                        preventAlloyImport: true,
                        timestamp: ${Date.now()}
                  };`;
      el.append(`<script>
                ${ODD_BROWSER_CONFIG}
               </script>`);
    });

    consequenceItems.forEach((item) => {
      switch (item.schema) {
        case "https://ns.adobe.com/personalization/json-content-item":
          const { content } = item.data;
          const { payload } = content;
          logger.log("Registering payload ");

          if (Array.isArray(payload)) {
            payload.forEach((proposition) => {
              logger.log(
                "Registering proposition " +
                  proposition.selector +
                  " " +
                  proposition.type,
              );
              // match the DOM element based on the CSS selector
              // streamRewriter.onElement(proposition.selector, (el) => {
              //     el.replaceWith(proposition.payload);
              //});
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
            console.log('Debug Info: ', debugInfo);
            </script>
            `;
      el.append(debugInfoInline);
    });

    // Exercise 10. Persist the ECID in a cookie in the browser
    // const ecidNamepace = responseWithConsequences.handle.find(
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
    //     "Powered-By": ["Akamai EdgeWorkers " + new Date().toString()],
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
