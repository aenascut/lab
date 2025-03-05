/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const DATASTREAM_ID = "";
const ORG_ID = "";
const PROPERTY_TOKEN = "";
const BROWSER_ALLOY_SCRIPT_TAG = `
      !function(n,o){o.forEach(function(o){n[o]||((n.__alloyNS=n.__alloyNS||
      []).push(o),n[o]=function(){var u=arguments;return new Promise(
      function(i,l){n.setTimeout(function(){n[o].q.push([i,l,u])})})},n[o].q=[])})}
      (window,["alloy"]);
    `;
const BROWSER_ALLOY_SCRIPT_CONFIGURE_COMMAND = `
        alloy("configure", {
            datastreamId: "${DATASTREAM_ID}",
            orgId: "${ORG_ID}",
        });
`;
const PAGE_WIDE_SCOPE = "__view__";
const ALLOY_LIB_URL =
  "https://cdn1.adoberesources.net/alloy/2.25.0/alloy.min.js";

const ORIGIN_URL = "";

export {
  DATASTREAM_ID,
  ORG_ID,
  BROWSER_ALLOY_SCRIPT_TAG,
  BROWSER_ALLOY_SCRIPT_CONFIGURE_COMMAND,
  ALLOY_LIB_URL,
  PAGE_WIDE_SCOPE,
  PROPERTY_TOKEN,
  ORIGIN_URL,
};
