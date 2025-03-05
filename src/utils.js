/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { Cookies } from "cookies";
import {
  BROWSER_ALLOY_SCRIPT_CONFIGURE_COMMAND,
  BROWSER_ALLOY_SCRIPT_TAG,
  PAGE_WIDE_SCOPE,
  ALLOY_LIB_URL,
} from "./config.js";

const createClientRequest = (req) => {
  const address = `${req.scheme}://${req.host}${req.url}`;
  const cookies = new Cookies(req.getHeader("Cookie"));
  const ecid = cookies.get("X-ADOBE-ECID");

  const identityMap = ecid
    ? {
        ECID: [
          {
            id: ecid,
            authenticatedState: "ambiguous",
            primary: true,
          },
        ],
      }
    : undefined;

  return {
    meta: {
      configOverrides: {},
      state: {
        domain: req.host,
        cookiesEnabled: !ecid,
        entries: [],
      },
    },
    events: [
      {
        decisionScopes: [PAGE_WIDE_SCOPE, "sample-offer"],
        surfaces: [],
        xdm: {
          eventType: "decisioning.propositionDisplay",
          web: {
            webPageDetails: { URL: address },
            webReferrer: { URL: "" },
          },
          identityMap: {
            ...identityMap,
          },
          implementationDetails: {
            name: "server-side",
          },
        },
        requestHeaders: {
          Referer: address,
        },
      },
    ],
    query: {
      identity: {
        fetch: ["ECID"],
      },
    },
  };
};

const addAlloyJsLib = async (streamRewriter, httpRequest) => {
  const alloyResponse = await httpRequest(ALLOY_LIB_URL, {
    "X-SUBREQUEST": "true",
  });
  streamRewriter.onElement("head", (el) => {
    el.prepend(`<script>${BROWSER_ALLOY_SCRIPT_TAG}</script>`);
    el.append("<script>");
    el.append(alloyResponse.text());
    el.append("</script>");
    el.append(`<script>
                ${BROWSER_ALLOY_SCRIPT_CONFIGURE_COMMAND}
               </script>`);
  });
};

const persistEcidInCookie = (streamRewriter, responseWithConsequences) => {
  const ecidNamepace = responseWithConsequences.handle.find(
    (payload) =>
      payload.type === "identity:result" &&
      payload.payload[0].namespace.code === "ECID",
  );
  const ecidValue = ecidNamepace.payload[0].id;
  streamRewriter.onElement("body", (el) => {
    el.append(
      `<script> document.cookie = "X-ADOBE-ECID=${ecidValue};SameSite=None; Secure"; </script>`,
    );
  });
  return ecidValue;
};

export { createClientRequest, addAlloyJsLib, persistEcidInCookie };
