import { createResponse } from "create-response";
import { httpRequest } from "http-request";
import { logger } from "log";
import { HtmlRewritingStream } from "html-rewriter";
import { Client } from "./lib.js";
import { DATASTREAM_ID, ORG_ID, PROPERTY_TOKEN, ORIGIN_URL } from "./config.js";
import { rules } from "./rules.js";

export async function responseProvider(request, response) {
  logger.log("Starting Hello World EdgeWorker");

  try {
    logger.log("Creating response from the EdgeWorker");

    // Create a new client instance
    const client = await Client({
      orgId: ORG_ID,
      datastreamId: DATASTREAM_ID,
      oddEnabled: true,
      rules: rules,
      edgeDomain: "",
    });
    logger.log("Instantiating client ");

    // Retrieve the Consequences based on the request
    const address = `${request.scheme}://${request.host}${request.url}`;
    const event = {
      type: "decisioning.propositionFetch",
      personalization: {
        sendDisplayEvent: false,
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

    const consequences = await client.sendEvent(event);
    logger.log("Received consequences ");

    // Extract the decisions from the consequences and create a notification event
    const decisions = consequences.handle
      .filter((fragment) => fragment.type === "personalization:decisions")
      .flatMap((fragment) => fragment.payload);
    const propositions = decisions.map((decision) => {
      const { id, scope, scopeDetails } = decision;
      return { id, scope, scopeDetails };
    });
    logger.log("Number of propositions " + propositions.length);

    const propositionEvent = {
      events: [
        {
          xdm: {
            _experience: {
              decisioning: {
                propositions: [...propositions],
                propositionEventType: {
                  display: 1,
                },
              },
            },
            eventType: "decisioning.propositionDisplay",
            web: {
              webPageDetails: {
                URL: address,
              },
              webReferrer: {
                URL: "",
              },
            },
            timestamp: new Date().toISOString(),
            implementationDetails: {
              environment: "server-side",
            },
          },
        },
      ],
    };
    // client.sendNotification(propositionEvent);
    logger.log("Sending notification ");

    // Apply the consequences to the origin stream
    const streamRewriter = new HtmlRewritingStream();
    const originResponse = await httpRequest(ORIGIN_URL);

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
                "Registering proposition " + proposition.selector + " " + proposition.type,
              );
              streamRewriter.onElement(proposition.selector, (el) => {
                if (proposition.type === "outerHTML") {
                  el.replaceWith(proposition.payload);
                }
                if (proposition.type === "innerHTML") {
                  el.replaceChildren(proposition.payload);
                }
              });
            });
          }
          break;
      }
    });
    streamRewriter.onElement("body", (el) => {
      const debugInfoInline = `
            <script>
            const debugInfo = JSON.stringify({
                originUrl: '${ORIGIN_URL}',
                ecidCookie: 'not set',
                consequences: ${JSON.stringify(consequences)},
                event:  ${JSON.stringify(event)}, 
                propositionEvent:  ${JSON.stringify(propositionEvent)}, 
            });
            console.log('Debug Info: ', debugInfo);
            </script>
            `;
      el.append(debugInfoInline);
    });

    return createResponse(
      200,
      {
        "Powered-By": ["Akamai EdgeWorkers " + new Date().toString()],
      },
      originResponse.body.pipeThrough(streamRewriter),
    );
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    return createResponse(
      500,
      { "Powered-By": ["Akamai EdgeWorkers " + new Date().toString()] },
      `${request.method}: ${error.message}`,
    );
  }
}
