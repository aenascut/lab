import { logger } from "log";
import { crypto } from "crypto";
import { httpRequest } from "http-request";

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

const isPlainObject = (obj) => {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
};

const flattenObject = (obj, result = {}, keys = []) => {
  Object.keys(obj).forEach((key) => {
    if (isPlainObject(obj[key]) || Array.isArray(obj[key])) {
      flattenObject(obj[key], result, [...keys, key]);
    } else {
      result[[...keys, key].join(".")] = obj[key];
    }
  });

  return result;
};

const flatten = (obj) => {
  if (!isPlainObject(obj)) {
    return obj;
  }

  return flattenObject(obj);
};

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

const MESSAGES = {
  RULES_ENGINE: {
    FETCH_ERROR: "Failed to fetch rules",
    CREATE_ERROR: "Failed to create rules engine",
    EMPTY_RULES_ERROR: "Rules cannot be empty",
  },
  CONTAINER: {
    INSTANCE_ALREADY_REGISTERED: "Instance already registered",
    INSTANCE_NOT_FOUND: "Instance not found",
  },
  SEND_EVENT: {
    MULTIPLE_ECID: "Multiple ECIDs found in the request. Using the last one.",
    RULES_ENGINE_FAILED_EXECUTION: "Rules engine failed to execute",
  },
};

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

const TOKENS = {
  RNG: "RNG",
  LOGGER: "LOGGER",
  HTTP_CLIENT: "HTTP_CLIENT",
  MD5: "MD5",
};

const createRegistry = () => {
  const registry = {};
  const registerInstance = (name, instance) => {
    if (!registry[name]) {
      registry[name] = instance;
    }
  };

  const getInstance = (name) => {
    if (!registry[name]) {
      throw new Error(`${MESSAGES.CONTAINER.INSTANCE_NOT_FOUND}: ${name}`);
    }
    return registry[name];
  };

  return {
    registerInstance,
    getInstance,
  };
};

const Container = (() => {
  let singletonInstance;

  return () => {
    if (!singletonInstance) {
      singletonInstance = createRegistry();
    }
    return singletonInstance;
  };
})();

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

const join = (joiner, collection) => {
  if (!Array.isArray(collection)) {
    return "";
  }

  return collection.join("");
};
const createByteToHex = () => {
  const result = [];

  for (let i = 0; i < 256; i += 1) {
    result.push((i + 0x100).toString(16).substr(1));
  }

  return result;
};

const BYTE_TO_HEX = createByteToHex();

const stringify = (arr) => {
  const result = [];

  for (let i = 0; i < 16; i += 1) {
    // Convert array of 16 byte values to UUID string format of the form: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    if ([4, 6, 8, 10].includes(i)) {
      result.push("-");
    }
    result.push(BYTE_TO_HEX[arr[i]]);
  }

  return join("", result).toLowerCase();
};

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

const v4 = (rng) => {
  const buffer = rng();

  buffer[6] = (buffer[6] & 0x0f) | 0x40;
  buffer[8] = (buffer[8] & 0x3f) | 0x80;

  return stringify(buffer);
};

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

const uuid = () => {
  const rng = Container().getInstance(TOKENS.RNG);
  return v4(rng);
};

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

const createBigIntFromParts = (low, high) => {
  low = BigInt.asUintN(32, BigInt(low));
  high = BigInt.asUintN(32, BigInt(high));
  const combined = (high << 32n) | low;
  return BigInt.asIntN(64, combined);
};
const uuidFromString = (uuidString) => {
  const cleanedUuid = uuidString.replace(/-/g, "");
  let high32Bits = 0;
  let low32Bits = 0;

  for (let i = 0, offset = 24; i < 8; i += 2, offset -= 8) {
    high32Bits |= parseInt(cleanedUuid.substring(i, i + 2), 16) << offset;
  }

  for (let i = 8, offset = 24; i < 16; i += 2, offset -= 8) {
    low32Bits |= parseInt(cleanedUuid.substring(i, i + 2), 16) << offset;
  }

  const high64BigInt = createBigIntFromParts(low32Bits, high32Bits);

  high32Bits = 0;
  low32Bits = 0;

  for (let i = 16, offset = 24; i < 24; i += 2, offset -= 8) {
    high32Bits |= parseInt(cleanedUuid.substring(i, i + 2), 16) << offset;
  }

  for (let i = 24, offset = 24; i < 32; i += 2, offset -= 8) {
    low32Bits |= parseInt(cleanedUuid.substring(i, i + 2), 16) << offset;
  }

  const low64BigInt = createBigIntFromParts(low32Bits, high32Bits);
  return { low64BigInt, high64BigInt };
};

const generateECID = () => {
  const generatedUuid = uuid();
  const { low64BigInt, high64BigInt } = uuidFromString(generatedUuid);

  const positiveHigh = high64BigInt?.toString().replaceAll("-", "");
  const positiveLow = low64BigInt?.toString().replaceAll("-", "");

  return positiveHigh + positiveLow;
};

const generateEcidFromFpid = (orgId, fpid) => {
  const SECTION_LENGTH = 19;
  const md5 = Container().getInstance(TOKENS.MD5);
  const generatedUuid = md5(`${orgId}:${fpid}`);

  const { low64BigInt, high64BigInt } = uuidFromString(generatedUuid);
  const MAX_VALUE = BigInt("9223372036854775807"); // Long.MAX_VALUE from Java; gets rid of the negative sign, if number is negative

  const positiveHigh = (high64BigInt & MAX_VALUE)
    ?.toString()
    .replaceAll("-", "");

  const positiveLow = (low64BigInt & MAX_VALUE)?.toString().replaceAll("-", "");

  return (
    positiveHigh.padStart(SECTION_LENGTH, "0") +
    positiveLow.padStart(SECTION_LENGTH, "0")
  );
};

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

const getRequestIdentity = (namespaceCode) => {
  return (event) => {
    const namespace =
      event.xdm &&
      event.xdm.identityMap &&
      event.xdm.identityMap[namespaceCode];
    if (
      namespace === undefined ||
      namespace === null ||
      (namespace && namespace.length === 0)
    ) {
      return null;
    }
    return namespace;
  };
};
const getRequestEcidIdentity = getRequestIdentity("ECID");
const getRequestFpidIdentity = getRequestIdentity("FPID");

const createResponseIdentityPayload = (event) => {
  const payloads = Object.keys(event.xdm.identityMap).flatMap((namespace) => {
    return event.xdm.identityMap[namespace].map((identity) => {
      const result = {
        id: identity.id,
        namespace: {
          code: namespace,
        },
      };
      if (identity.authenticatedState) {
        result.authenticatedState = identity.authenticatedState;
      }
      if (identity.primary) {
        result.primary = identity.primary;
      }
      if (identity.xid) {
        result.xid = identity.xid;
      }
      return result;
    });
  });

  return {
    payload: payloads,
    type: "identity:result",
  };
};

/**
 * The SendEvent method that returns a decision
 * @param {import("../types/index.js").ClientOptions} clientOptions
 * @returns {import("../types/index.js").SendEvent}
 */
const sendEvent = async (clientOptions, requestBody) => {
  const logAdapterInstance = Container().getInstance(TOKENS.LOGGER);
  const { rulesEngine, orgId } = { ...clientOptions };
  const requestEcid = getRequestEcidIdentity(requestBody);

  let ecid = requestEcid || [{ id: "" }];

  if (!requestEcid) {
    const requestFpid = getRequestFpidIdentity(requestBody);
    ecid[0].id = requestFpid
      ? generateEcidFromFpid(orgId, requestFpid[0].id)
      : generateECID();
  }

  const event = {
    ...requestBody,
    xdm: {
      ...requestBody?.xdm,
      identityMap: {
        ...requestBody?.xdm?.identityMap,
        ECID: ecid,
      },
    },
  };

  const context = {
    ...event,
    ...flatten(event),
  };
  let rulesConsequences = [];
  try {
    rulesConsequences = rulesEngine.execute(context);
  } catch (e) {
    logAdapterInstance.log(
      MESSAGES.SEND_EVENT.RULES_ENGINE_FAILED_EXECUTION,
      e,
    );
    return [];
  }

  const decisions = {
    eventIndex: 0,
    type: "personalization:decisions",
    payload: rulesConsequences.flat(1).map((consequence) => consequence.detail),
  };

  return {
    requestId: uuid(),
    handle: [createResponseIdentityPayload(event), decisions],
  };
};

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

const AEP_EDGE_DOMAIN = "edge.adobedc.net";
const EXP_EDGE_BASE_PATH_PROD = "ee";
const DEFAULT_REQUEST_HEADERS$1 = {
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "content-type": "text/plain; charset=UTF-8",
  pragma: "no-cache",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
  "sec-gpc": "1",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const getDomain$1 = (edgeDomain) => {
  if (undefined === edgeDomain || "" !== edgeDomain)
    return `https://${edgeDomain || AEP_EDGE_DOMAIN}`;
  return " ";
};

const edgeRequester = async (clientOptions, endpoint, requestBody) => {
  const httpRequestAdapterInstance = Container().getInstance(
    TOKENS.HTTP_CLIENT,
  );

  const requestId = uuid();
  const { edgeDomain, edgeBasePath, datastreamId } = clientOptions;

  const requestUrl = [
    getDomain$1(edgeDomain),
    edgeBasePath || EXP_EDGE_BASE_PATH_PROD,
    "irl1",
    "v2",
    `${endpoint}?dataStreamId=${datastreamId}&requestId=${requestId}`,
  ]
    .filter((elem) => elem.length > 0)
    .join("/")
    .trim();

  const headers = {
    ...DEFAULT_REQUEST_HEADERS$1,
  };

  return httpRequestAdapterInstance.makeRequest(requestUrl, {
    headers,
    body: JSON.stringify(requestBody),
    method: "POST",
  });
};

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

const remoteSendEvent = async (clientOptions, requestBody) => {
  const adaptedRequest = { event: requestBody };
  return await edgeRequester(clientOptions, "interact", adaptedRequest);
};

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

const sendNotification = async (clientOptions, requestBody) => {
  const adaptedRequest = { events: [requestBody] };
  return edgeRequester(clientOptions, "collect", adaptedRequest);
};

const ConditionType = {
  MATCHER: "matcher",
  GROUP: "group",
  HISTORICAL: "historical",
};
const MatcherType = {
  EQUALS: "eq",
  NOT_EQUALS: "ne",
  EXISTS: "ex",
  NOT_EXISTS: "nx",
  GREATER_THAN: "gt",
  GREATER_THAN_OR_EQUAL_TO: "ge",
  LESS_THAN: "lt",
  LESS_THAN_OR_EQUAL_TO: "le",
  CONTAINS: "co",
  NOT_CONTAINS: "nc",
  STARTS_WITH: "sw",
  ENDS_WITH: "ew",
};
const LogicType = {
  AND: "and",
  OR: "or",
};
const SearchType = {
  ORDERED: "ordered",
};

function isObjectOrUndefined(value) {
  return typeof value === "object" || typeof value === "undefined";
}

function createEquals() {
  return {
    matches: (context, key, values = []) => {
      if (isObjectOrUndefined(context[key])) {
        return false;
      }
      const contextValue = String(context[key]).toLowerCase();
      for (let i = 0; i < values.length; i += 1) {
        if (
          !isObjectOrUndefined(values[i]) &&
          contextValue === String(values[i]).toLowerCase()
        ) {
          return true;
        }
      }
      return false;
    },
  };
}

function createNotEquals() {
  return {
    matches: (context, key, values = []) => {
      if (isObjectOrUndefined(context[key])) {
        return false;
      }
      const contextValue = String(context[key]).toLowerCase();
      for (let i = 0; i < values.length; i += 1) {
        if (
          !isObjectOrUndefined(values[i]) &&
          contextValue === String(values[i]).toLowerCase()
        ) {
          return false;
        }
      }
      return true;
    },
  };
}

function createExists() {
  return {
    matches: (context, key) => {
      return typeof context[key] !== "undefined" && context[key] !== null;
    },
  };
}

function createNotExists() {
  return {
    matches: (context, key) => {
      return typeof context[key] === "undefined" || context[key] === null;
    },
  };
}

function isNumber(value) {
  return typeof value === "number";
}

function createGreaterThan() {
  return {
    matches: (context, key, values = []) => {
      const needle = context[key];
      if (!isNumber(needle)) {
        return false;
      }
      for (let i = 0; i < values.length; i += 1) {
        if (isNumber(values[i]) && needle > values[i]) {
          return true;
        }
      }
      return false;
    },
  };
}

function createGreaterThanEquals() {
  return {
    matches: (context, key, values = []) => {
      const needle = context[key];
      if (!isNumber(needle)) {
        return false;
      }
      for (let i = 0; i < values.length; i += 1) {
        if (isNumber(values[i]) && needle >= values[i]) {
          return true;
        }
      }
      return false;
    },
  };
}

function createLessThan() {
  return {
    matches: (context, key, values = []) => {
      const needle = context[key];
      if (!isNumber(needle)) {
        return false;
      }
      for (let i = 0; i < values.length; i += 1) {
        if (isNumber(values[i]) && needle < values[i]) {
          return true;
        }
      }
      return false;
    },
  };
}

function createLessThanEquals() {
  return {
    matches: (context, key, values = []) => {
      const needle = context[key];
      if (!isNumber(needle)) {
        return false;
      }
      for (let i = 0; i < values.length; i += 1) {
        if (isNumber(values[i]) && needle <= values[i]) {
          return true;
        }
      }
      return false;
    },
  };
}

function createContains() {
  return {
    matches: (context, key, values = []) => {
      if (isObjectOrUndefined(context[key])) {
        return false;
      }
      const contextValue = String(context[key]).toLowerCase();
      for (let i = 0; i < values.length; i += 1) {
        if (
          !isObjectOrUndefined(values[i]) &&
          contextValue.indexOf(String(values[i]).toLowerCase()) !== -1
        ) {
          return true;
        }
      }
      return false;
    },
  };
}

function createNotContains() {
  return {
    matches: (context, key, values = []) => {
      if (isObjectOrUndefined(context[key])) {
        return false;
      }
      const contextValue = String(context[key]).toLowerCase();
      for (let i = 0; i < values.length; i += 1) {
        if (
          !isObjectOrUndefined(values[i]) &&
          contextValue.indexOf(String(values[i]).toLowerCase()) !== -1
        ) {
          return false;
        }
      }
      return true;
    },
  };
}

function createStartsWith() {
  return {
    matches: (context, key, values = []) => {
      if (isObjectOrUndefined(context[key])) {
        return false;
      }
      const contextValue = String(context[key]).toLowerCase();
      for (let i = 0; i < values.length; i += 1) {
        if (
          !isObjectOrUndefined(values[i]) &&
          contextValue.startsWith(String(values[i]).toLowerCase())
        ) {
          return true;
        }
      }
      return false;
    },
  };
}

function createEndsWith() {
  return {
    matches: (context, key, values = []) => {
      if (isObjectOrUndefined(context[key])) {
        return false;
      }
      const contextValue = String(context[key]).toLowerCase();
      for (let i = 0; i < values.length; i += 1) {
        if (
          !isObjectOrUndefined(values[i]) &&
          contextValue.endsWith(values[i].toLowerCase())
        ) {
          return true;
        }
      }
      return false;
    },
  };
}

const MATCHERS = {
  [MatcherType.EQUALS]: createEquals(),
  [MatcherType.NOT_EQUALS]: createNotEquals(),
  [MatcherType.EXISTS]: createExists(),
  [MatcherType.NOT_EXISTS]: createNotExists(),
  [MatcherType.GREATER_THAN]: createGreaterThan(),
  [MatcherType.GREATER_THAN_OR_EQUAL_TO]: createGreaterThanEquals(),
  [MatcherType.LESS_THAN]: createLessThan(),
  [MatcherType.LESS_THAN_OR_EQUAL_TO]: createLessThanEquals(),
  [MatcherType.CONTAINS]: createContains(),
  [MatcherType.NOT_CONTAINS]: createNotContains(),
  [MatcherType.STARTS_WITH]: createStartsWith(),
  [MatcherType.ENDS_WITH]: createEndsWith(),
};
function getMatcher(key) {
  return MATCHERS[key];
}

function isUndefined(value) {
  return typeof value === "undefined";
}

function keys(value) {
  return Object.keys(value);
}

const IAM_ID = "iam.id";
const ID = "id";
const IAM_EVENT_TYPE = "iam.eventType";
const EVENT_TYPE = "eventType";
const TYPE = "type";
const VALID_EVENT_TYPES = [IAM_EVENT_TYPE, EVENT_TYPE, TYPE];
const VALID_EVENT_IDS = [IAM_ID, ID];
function checkForHistoricalMatcher(eventCount, matcherKey, value) {
  switch (matcherKey) {
    case MatcherType.GREATER_THAN:
      return eventCount > value;
    case MatcherType.GREATER_THAN_OR_EQUAL_TO:
      return eventCount >= value;
    case MatcherType.LESS_THAN:
      return eventCount < value;
    case MatcherType.LESS_THAN_OR_EQUAL_TO:
      return eventCount <= value;
    case MatcherType.EQUALS:
      return eventCount === value;
    case MatcherType.NOT_EQUALS:
      return eventCount !== value;
    default:
      return false;
  }
}
function oneOf(context, properties) {
  for (let i = 0; i < properties.length; i += 1) {
    if (!isUndefined(context[properties[i]])) {
      return context[properties[i]];
    }
  }
  return undefined;
}
function eventSatisfiesCondition(historicalEventCondition, eventContext) {
  const eventKeys = keys(historicalEventCondition);
  for (let i = 0; i < eventKeys.length; i += 1) {
    const key = eventKeys[i];
    const { event = {} } = eventContext;
    if (event[eventKeys[i]] !== historicalEventCondition[key]) {
      return false;
    }
  }
  return true;
}
function queryAndCountAnyEvent(events, context, from, to) {
  return events.reduce((countTotal, event) => {
    const eventType = oneOf(event, VALID_EVENT_TYPES);
    if (!eventType) {
      return countTotal;
    }
    const eventsOfType = context.events[eventType];
    if (!eventsOfType) {
      return countTotal;
    }
    const eventId = oneOf(event, VALID_EVENT_IDS);
    if (!eventId) {
      return countTotal;
    }
    const contextEvent = eventsOfType[eventId];
    if (!contextEvent) {
      return countTotal;
    }
    if (!eventSatisfiesCondition(event, contextEvent)) {
      return countTotal;
    }
    const { count: eventCount = 1 } = contextEvent;
    if (
      isUndefined(from) ||
      isUndefined(to) ||
      (contextEvent.timestamp >= from && contextEvent.timestamp <= to)
    ) {
      return countTotal + eventCount;
    }
    return countTotal;
  }, 0);
}
function queryAndCountOrderedEvent(events, context, from, to) {
  let previousEventTimestamp = from;
  const sameSequence = events.every((event) => {
    const eventType = oneOf(event, VALID_EVENT_TYPES);
    if (!eventType) {
      return false;
    }
    const eventsOfType = context.events[eventType];
    if (!eventsOfType) {
      return false;
    }
    const eventId = oneOf(event, VALID_EVENT_IDS);
    if (!eventId) {
      return false;
    }
    const contextEvent = eventsOfType[eventId];
    if (!eventSatisfiesCondition(event, contextEvent)) {
      return false;
    }
    if (
      contextEvent === null ||
      isUndefined(contextEvent) ||
      contextEvent.count === 0
    ) {
      return false;
    }
    const ordered =
      (isUndefined(previousEventTimestamp) ||
        contextEvent.timestamp >= previousEventTimestamp) &&
      (isUndefined(to) || contextEvent.timestamp <= to);
    previousEventTimestamp = contextEvent.timestamp;
    return ordered;
  });
  return sameSequence ? 1 : 0;
}

function evaluateAnd(context, conditions) {
  let result = true;
  for (let i = 0; i < conditions.length; i += 1) {
    result = result && conditions[i].evaluate(context);
  }
  return result;
}
function evaluateOr(context, conditions) {
  let result = false;
  for (let i = 0; i < conditions.length; i += 1) {
    result = result || conditions[i].evaluate(context);
    if (result) {
      return true;
    }
  }
  return false;
}
function createRules(version, rules, metadata) {
  return {
    version,
    rules,
    metadata,
  };
}
function createRule(condition, consequences, key) {
  return {
    key,
    execute: (context) => {
      if (condition.evaluate(context)) {
        return consequences;
      }
      return [];
    },
    toString: () => {
      return `Rule{condition=${condition}, consequences=${consequences}}`;
    },
  };
}
function createCondition(type, definition) {
  return {
    evaluate: (context) => {
      return definition.evaluate(context);
    },
    toString() {
      return `Condition{type=${type}, definition=${definition}}`;
    },
  };
}
function createConsequence(id, type, detail) {
  return {
    id,
    type,
    detail,
  };
}
function createGroupDefinition(logic, conditions) {
  return {
    evaluate: (context) => {
      if (LogicType.AND === logic) {
        return evaluateAnd(context, conditions);
      }
      if (LogicType.OR === logic) {
        return evaluateOr(context, conditions);
      }
      return false;
    },
  };
}
function createMatcherDefinition(key, matcherKey, values) {
  return {
    evaluate: (context) => {
      const matcher = getMatcher(matcherKey);
      if (!matcher) {
        return false;
      }
      return matcher.matches(context, key, values);
    },
  };
}
function createHistoricalDefinition(
  events,
  matcherKey,
  value,
  from,
  to,
  searchType,
) {
  return {
    evaluate: (context) => {
      let eventCount;
      if (SearchType.ORDERED === searchType) {
        eventCount = queryAndCountOrderedEvent(events, context, from, to);
      } else {
        eventCount = queryAndCountAnyEvent(events, context, from, to);
      }
      return checkForHistoricalMatcher(eventCount, matcherKey, value);
    },
  };
}

function assign(destination, value) {
  return Object.assign(destination, value);
}

function parseMatcherDefinition(definition) {
  const { key, matcher, values } = definition;
  return createMatcherDefinition(key, matcher, values);
}
function parseGroupDefinition(definition) {
  const { logic, conditions } = definition;
  return createGroupDefinition(logic, conditions.map(parseCondition));
}
function parseHistoricalDefinition(definition) {
  const { events, from, to, matcher, value, searchType } = definition;
  return createHistoricalDefinition(
    events,
    matcher,
    value,
    from,
    to,
    searchType,
  );
}
function parseCondition(condition) {
  const { type, definition } = condition;
  if (ConditionType.MATCHER === type) {
    const matchers = parseMatcherDefinition(definition);
    return createCondition(type, matchers);
  }
  if (ConditionType.GROUP === type) {
    const definitions = parseGroupDefinition(definition);
    return createCondition(type, definitions);
  }
  if (ConditionType.HISTORICAL === type) {
    const definitions = parseHistoricalDefinition(definition);
    return createCondition(type, definitions);
  }
  throw new Error("Can not parse condition");
}
function parseConsequence(consequence) {
  const { id, type, detail } = consequence;
  return createConsequence(id, type, detail);
}
function parseRule(rule) {
  const { condition, consequences, key } = rule;
  const parsedCondition = parseCondition(condition);
  const parsedConsequences = consequences.map(parseConsequence);
  return createRule(parsedCondition, parsedConsequences, key);
}
function parseMetadata(metadata) {
  if (!metadata) {
    return undefined;
  }
  const result = {
    provider: metadata.provider,
    providerData: assign({}, metadata.providerData),
  };
  return result;
}
function parseRules(ruleset) {
  const { version, rules, metadata } = ruleset;
  const parsedRules = rules.map(parseRule);
  const parsedMetadata = parseMetadata(metadata);
  return createRules(version, parsedRules, parsedMetadata);
}

const TARGET_PROVIDER = "TGT";
const DEFAULT_PROVIDER = "DEFAULT";

function createDefaultRulesExecutor(rules) {
  return {
    provider: DEFAULT_PROVIDER,
    execute: (context) =>
      rules
        .map((rule) => rule.execute(context))
        .filter((arr) => arr.length > 0),
  };
}

function validateMetadata(metadata) {
  const { providerData } = metadata;
  if (!providerData) {
    throw new Error("Provider data is missing in metadata");
  }
  const { identityTemplate, buckets } = providerData;
  if (!identityTemplate) {
    throw new Error("Identity template is missing in provider data");
  }
  if (!buckets) {
    throw new Error("Buckets is missing in provider data");
  }
}

const NAMESPACE = "ECID";
function extractIdentity(context) {
  const { xdm } = context;
  if (!xdm) {
    throw new Error("XDM object is missing in the context");
  }
  const { identityMap } = xdm;
  if (!identityMap) {
    throw new Error("Identity map is missing in the XDM object");
  }
  const identities = identityMap[NAMESPACE];
  if (!identities) {
    throw new Error("ECID identity namespace is missing in the identity map");
  }
  if (!Array.isArray(identities) || identities.length === 0) {
    throw new Error("ECID identities array is empty or not an array");
  }
  const result = identities[0].id;
  if (!result) {
    throw new Error("ECID identity is missing in the identities array");
  }
  return result;
}

const KEY_PATTERN = "<key>";
const IDENTITY_PATTERN = "<identity>";
function createId(identity, key, metadata) {
  const { providerData } = metadata;
  const { identityTemplate } = providerData;
  return identityTemplate
    .replace(KEY_PATTERN, key)
    .replace(IDENTITY_PATTERN, identity);
}

function isDefined(value) {
  return !isUndefined(value);
}

function memoize(func, keyResolverFunc = (arr) => arr[0]) {
  const memoizedValues = {};
  return function memoized(...funcArgs) {
    const key = keyResolverFunc(funcArgs);
    if (!isDefined(memoizedValues[key])) {
      memoizedValues[key] = func(...funcArgs);
    }
    return memoizedValues[key];
  };
}

function mul32(m, n) {
  const nlo = n & 0xffff;
  const nhi = n - nlo;
  return (((nhi * m) | 0) + ((nlo * m) | 0)) | 0;
}
function hashUnencodedCharsRaw(stringValue, seed = 0) {
  let k1;
  const len = stringValue.length;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let h1 = seed;
  const roundedEnd = len & -2;
  for (let i = 0; i < roundedEnd; i += 2) {
    k1 = stringValue.charCodeAt(i) | (stringValue.charCodeAt(i + 1) << 16);
    k1 = mul32(k1, c1);
    k1 = ((k1 & 0x1ffff) << 15) | (k1 >>> 17);
    k1 = mul32(k1, c2);
    h1 ^= k1;
    h1 = ((h1 & 0x7ffff) << 13) | (h1 >>> 19);
    h1 = (h1 * 5 + 0xe6546b64) | 0;
  }
  if (len % 2 === 1) {
    k1 = stringValue.charCodeAt(roundedEnd);
    k1 = mul32(k1, c1);
    k1 = ((k1 & 0x1ffff) << 15) | (k1 >>> 17);
    k1 = mul32(k1, c2);
    h1 ^= k1;
  }
  h1 ^= len << 1;
  h1 ^= h1 >>> 16;
  h1 = mul32(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = mul32(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  return h1;
}
const hashUnencodedChars = memoize(hashUnencodedCharsRaw, (arr) =>
  arr.join("-"),
);

const MAX_PERCENTAGE = 100;
function createAllocation(id, buckets) {
  const signedNumericHashValue = hashUnencodedChars(id);
  const hashFixedBucket = Math.abs(signedNumericHashValue) % buckets;
  const allocationValue = (hashFixedBucket / buckets) * MAX_PERCENTAGE;
  return Math.round(allocationValue * MAX_PERCENTAGE) / MAX_PERCENTAGE;
}
const createAllocationMemoized = memoize(createAllocation);
function createContext(id, buckets, context) {
  const allocation = createAllocationMemoized(id, buckets);
  return {
    allocation,
    ...context,
  };
}

function groupRules(rules) {
  const result = {};
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    if (!rule.key) {
      continue;
    }
    if (!result[rule.key]) {
      result[rule.key] = [];
    }
    result[rule.key].push(rule);
  }
  return result;
}
function evaluateRules(context, rules) {
  return rules
    .map((rule) => rule.execute(context))
    .filter((arr) => arr.length > 0);
}
function createTargetRulesExecutor(rules, metadata) {
  validateMetadata(metadata);
  const rulesNoKey = rules.filter((rule) => !rule.key);
  const rulesWithKeys = groupRules(rules);
  const { buckets } = metadata.providerData;
  return {
    provider: TARGET_PROVIDER,
    execute: (context) => {
      const identity = extractIdentity(context);
      const consequencesNoKey = evaluateRules(context, rulesNoKey);
      const rulesKeys = keys(rulesWithKeys);
      const consequencesWithKeys = [];
      for (let i = 0; i < rulesKeys.length; i += 1) {
        const key = rulesKeys[i];
        const rulesForKey = rulesWithKeys[key];
        const id = createId(identity, key, metadata);
        const contextForKey = createContext(id, buckets, context);
        const consequences = evaluateRules(contextForKey, rulesForKey);
        consequencesWithKeys.push(...consequences);
      }
      return [...consequencesNoKey, ...consequencesWithKeys];
    },
  };
}

function createExecutor(rules, metadata) {
  if (!metadata) {
    return createDefaultRulesExecutor(rules);
  }
  const { provider } = metadata;
  if (provider === TARGET_PROVIDER) {
    return createTargetRulesExecutor(rules, metadata);
  }
  return createDefaultRulesExecutor(rules);
}

function RulesEngine(ruleset) {
  const { rules, metadata } = parseRules(ruleset);
  return createExecutor(rules, metadata);
}

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

const RuleEngine = (options) => {
  const { rules } = options;
  let rulesEngine = {};

  try {
    rulesEngine = new RulesEngine(rules);
  } catch (e) {
    throw new Error(`${MESSAGES.RULES_ENGINE.CREATE_ERROR}, ${e}`);
  }
  return rulesEngine;
};

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

const TARGET_EDGE_DOMAIN = "assets.adobetarget.com";
const RULE_BASE_PATH_PROD = "aep-odd-rules";
const DEFAULT_REQUEST_HEADERS = {
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "content-type": "text/plain; charset=UTF-8",
  pragma: "no-cache",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
  "sec-gpc": "1",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const getDomain = (ruleDomain) => {
  if (undefined === ruleDomain || "" !== ruleDomain)
    return `https://${ruleDomain || TARGET_EDGE_DOMAIN}`;
  return " ";
};

const ruleRequester = async (clientOptions) => {
  const { ruleDomain, datastreamId, orgId, propertyToken, ruleBasePath } =
    clientOptions;
  const httpRequestAdapterInstance = Container().getInstance(
    TOKENS.HTTP_CLIENT,
  );
  const requestUrl = [
    getDomain(ruleDomain),
    ruleBasePath || RULE_BASE_PATH_PROD,
    orgId,
    "production",
    "v1",
    propertyToken || datastreamId,
    "rules.json",
  ]
    .filter((elem) => elem && elem.length > 0)
    .join("/")
    .trim();

  try {
    return await httpRequestAdapterInstance.makeRequest(requestUrl, {
      headers: DEFAULT_REQUEST_HEADERS,
    });
  } catch (e) {
    throw new Error(`${MESSAGES.RULES_ENGINE.FETCH_ERROR}, ${e}`);
  }
};

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

const eventNotificationAdaptor = (requestBody, response) => {
  const decisions = response.handle?.find(
    (handle) => handle.type === "personalization:decisions",
  );
  const propositions =
    decisions?.payload.map((proposition) => {
      const { id, scope, scopeDetails } = proposition;

      return {
        id,
        scope,
        scopeDetails,
      };
    }) || [];

  const displayEvent = {
    xdm: {
      ...requestBody.xdm,
      eventType: "decisioning.propositionDisplay",
      timestamp: new Date().toISOString(),
      _experience: {
        decisioning: {
          propositions: propositions,
          propositionEventType: {
            display: 1,
          },
        },
      },
    },
  };

  return displayEvent;
};

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

/**
 * The Client initialization method
 * @param {import("../types/index.js").ClientOptions} clientOptions
 * @returns {Promise<import("../types/index.js").ClientResponse>}
 */
async function BaseClient(clientOptions) {
  const options = { ...clientOptions };
  const sendEventFunc = options.oddEnabled ? sendEvent : remoteSendEvent;

  if (options.oddEnabled) {
    if (!options.rules) {
      const rules = await ruleRequester(options);
      if (!rules) {
        throw new Error(MESSAGES.RULES_ENGINE.EMPTY_RULES_ERROR);
      }
      options.rules = rules;
    }

    if (options.rulesPoolingInterval) {
      const intervalInMilliseconds = options.rulesPoolingInterval * 1000;
      setInterval(async () => {
        const rules = await ruleRequester(options);
        if (!rules) {
          throw new Error(MESSAGES.RULES_ENGINE.EMPTY_RULES_ERROR);
        }
        options.rules = rules;
        options.rulesEngine = RuleEngine(options);
      }, intervalInMilliseconds);
    }

    options.rulesEngine = RuleEngine(options);
  }

  return {
    sendEvent: async (requestBody) => {
      const response = await sendEventFunc(options, requestBody);
      if (requestBody?.personalization?.sendDisplayEvent) {
        const displayEvent = eventNotificationAdaptor(requestBody, response);
        if (displayEvent) {
          sendNotification(options, displayEvent);
        }
      }
      return response;
    },
    sendNotification: async (requestBody) => {
      return sendNotification(options, requestBody);
    },
  };
}

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

const rng = () => {
  const BUFFER = new Uint8Array(256);
  return crypto.getRandomValues(BUFFER);
};

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

const createHttpRequestAdapter = () => {
  const makeRequest = async (url, options) => {
    try {
      const response = await httpRequest(url, options);
      if (response.status === 204) {
        return null; // No content to return
      }
      if (response.ok) {
        return await response.json();
      }
      logger.log(
        `Failed to make request for ${url} with options ${JSON.stringify(options)}`,
      );
    } catch (error) {
      logger.log(
        `Failed to make request for ${url} with options ${JSON.stringify(options)}`,
        error,
      );
      throw error;
    }
  };

  return {
    makeRequest,
  };
};
const httpRequestAdapterInstance = createHttpRequestAdapter();

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

const md5 = function (data) {
  var r = M(V(Y(X(data), 8 * data.length)));
  return r.toLowerCase();
};
function M(d) {
  for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++)
    (_ = d.charCodeAt(r)), (f += m.charAt((_ >>> 4) & 15) + m.charAt(15 & _));
  return f;
}
function X(d) {
  for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++) _[m] = 0;
  for (m = 0; m < 8 * d.length; m += 8)
    _[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32;
  return _;
}
function V(d) {
  for (var _ = "", m = 0; m < 32 * d.length; m += 8)
    _ += String.fromCharCode((d[m >> 5] >>> m % 32) & 255);
  return _;
}
function Y(d, _) {
  (d[_ >> 5] |= 128 << _ % 32), (d[14 + (((_ + 64) >>> 9) << 4)] = _);
  for (
    var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0;
    n < d.length;
    n += 16
  ) {
    var h = m,
      t = f,
      g = r,
      e = i;
    (f = md5_ii(
      (f = md5_ii(
        (f = md5_ii(
          (f = md5_ii(
            (f = md5_hh(
              (f = md5_hh(
                (f = md5_hh(
                  (f = md5_hh(
                    (f = md5_gg(
                      (f = md5_gg(
                        (f = md5_gg(
                          (f = md5_gg(
                            (f = md5_ff(
                              (f = md5_ff(
                                (f = md5_ff(
                                  (f = md5_ff(
                                    f,
                                    (r = md5_ff(
                                      r,
                                      (i = md5_ff(
                                        i,
                                        (m = md5_ff(
                                          m,
                                          f,
                                          r,
                                          i,
                                          d[n + 0],
                                          7,
                                          -680876936,
                                        )),
                                        f,
                                        r,
                                        d[n + 1],
                                        12,
                                        -389564586,
                                      )),
                                      m,
                                      f,
                                      d[n + 2],
                                      17,
                                      606105819,
                                    )),
                                    i,
                                    m,
                                    d[n + 3],
                                    22,
                                    -1044525330,
                                  )),
                                  (r = md5_ff(
                                    r,
                                    (i = md5_ff(
                                      i,
                                      (m = md5_ff(
                                        m,
                                        f,
                                        r,
                                        i,
                                        d[n + 4],
                                        7,
                                        -176418897,
                                      )),
                                      f,
                                      r,
                                      d[n + 5],
                                      12,
                                      1200080426,
                                    )),
                                    m,
                                    f,
                                    d[n + 6],
                                    17,
                                    -1473231341,
                                  )),
                                  i,
                                  m,
                                  d[n + 7],
                                  22,
                                  -45705983,
                                )),
                                (r = md5_ff(
                                  r,
                                  (i = md5_ff(
                                    i,
                                    (m = md5_ff(
                                      m,
                                      f,
                                      r,
                                      i,
                                      d[n + 8],
                                      7,
                                      1770035416,
                                    )),
                                    f,
                                    r,
                                    d[n + 9],
                                    12,
                                    -1958414417,
                                  )),
                                  m,
                                  f,
                                  d[n + 10],
                                  17,
                                  -42063,
                                )),
                                i,
                                m,
                                d[n + 11],
                                22,
                                -1990404162,
                              )),
                              (r = md5_ff(
                                r,
                                (i = md5_ff(
                                  i,
                                  (m = md5_ff(
                                    m,
                                    f,
                                    r,
                                    i,
                                    d[n + 12],
                                    7,
                                    1804603682,
                                  )),
                                  f,
                                  r,
                                  d[n + 13],
                                  12,
                                  -40341101,
                                )),
                                m,
                                f,
                                d[n + 14],
                                17,
                                -1502002290,
                              )),
                              i,
                              m,
                              d[n + 15],
                              22,
                              1236535329,
                            )),
                            (r = md5_gg(
                              r,
                              (i = md5_gg(
                                i,
                                (m = md5_gg(
                                  m,
                                  f,
                                  r,
                                  i,
                                  d[n + 1],
                                  5,
                                  -165796510,
                                )),
                                f,
                                r,
                                d[n + 6],
                                9,
                                -1069501632,
                              )),
                              m,
                              f,
                              d[n + 11],
                              14,
                              643717713,
                            )),
                            i,
                            m,
                            d[n + 0],
                            20,
                            -373897302,
                          )),
                          (r = md5_gg(
                            r,
                            (i = md5_gg(
                              i,
                              (m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691)),
                              f,
                              r,
                              d[n + 10],
                              9,
                              38016083,
                            )),
                            m,
                            f,
                            d[n + 15],
                            14,
                            -660478335,
                          )),
                          i,
                          m,
                          d[n + 4],
                          20,
                          -405537848,
                        )),
                        (r = md5_gg(
                          r,
                          (i = md5_gg(
                            i,
                            (m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438)),
                            f,
                            r,
                            d[n + 14],
                            9,
                            -1019803690,
                          )),
                          m,
                          f,
                          d[n + 3],
                          14,
                          -187363961,
                        )),
                        i,
                        m,
                        d[n + 8],
                        20,
                        1163531501,
                      )),
                      (r = md5_gg(
                        r,
                        (i = md5_gg(
                          i,
                          (m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467)),
                          f,
                          r,
                          d[n + 2],
                          9,
                          -51403784,
                        )),
                        m,
                        f,
                        d[n + 7],
                        14,
                        1735328473,
                      )),
                      i,
                      m,
                      d[n + 12],
                      20,
                      -1926607734,
                    )),
                    (r = md5_hh(
                      r,
                      (i = md5_hh(
                        i,
                        (m = md5_hh(m, f, r, i, d[n + 5], 4, -378558)),
                        f,
                        r,
                        d[n + 8],
                        11,
                        -2022574463,
                      )),
                      m,
                      f,
                      d[n + 11],
                      16,
                      1839030562,
                    )),
                    i,
                    m,
                    d[n + 14],
                    23,
                    -35309556,
                  )),
                  (r = md5_hh(
                    r,
                    (i = md5_hh(
                      i,
                      (m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060)),
                      f,
                      r,
                      d[n + 4],
                      11,
                      1272893353,
                    )),
                    m,
                    f,
                    d[n + 7],
                    16,
                    -155497632,
                  )),
                  i,
                  m,
                  d[n + 10],
                  23,
                  -1094730640,
                )),
                (r = md5_hh(
                  r,
                  (i = md5_hh(
                    i,
                    (m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174)),
                    f,
                    r,
                    d[n + 0],
                    11,
                    -358537222,
                  )),
                  m,
                  f,
                  d[n + 3],
                  16,
                  -722521979,
                )),
                i,
                m,
                d[n + 6],
                23,
                76029189,
              )),
              (r = md5_hh(
                r,
                (i = md5_hh(
                  i,
                  (m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487)),
                  f,
                  r,
                  d[n + 12],
                  11,
                  -421815835,
                )),
                m,
                f,
                d[n + 15],
                16,
                530742520,
              )),
              i,
              m,
              d[n + 2],
              23,
              -995338651,
            )),
            (r = md5_ii(
              r,
              (i = md5_ii(
                i,
                (m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844)),
                f,
                r,
                d[n + 7],
                10,
                1126891415,
              )),
              m,
              f,
              d[n + 14],
              15,
              -1416354905,
            )),
            i,
            m,
            d[n + 5],
            21,
            -57434055,
          )),
          (r = md5_ii(
            r,
            (i = md5_ii(
              i,
              (m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571)),
              f,
              r,
              d[n + 3],
              10,
              -1894986606,
            )),
            m,
            f,
            d[n + 10],
            15,
            -1051523,
          )),
          i,
          m,
          d[n + 1],
          21,
          -2054922799,
        )),
        (r = md5_ii(
          r,
          (i = md5_ii(
            i,
            (m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359)),
            f,
            r,
            d[n + 15],
            10,
            -30611744,
          )),
          m,
          f,
          d[n + 6],
          15,
          -1560198380,
        )),
        i,
        m,
        d[n + 13],
        21,
        1309151649,
      )),
      (r = md5_ii(
        r,
        (i = md5_ii(
          i,
          (m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070)),
          f,
          r,
          d[n + 11],
          10,
          -1120210379,
        )),
        m,
        f,
        d[n + 2],
        15,
        718787259,
      )),
      i,
      m,
      d[n + 9],
      21,
      -343485551,
    )),
      (m = safe_add(m, h)),
      (f = safe_add(f, t)),
      (r = safe_add(r, g)),
      (i = safe_add(i, e));
  }
  return Array(m, f, r, i);
}
function md5_cmn(d, _, m, f, r, i) {
  return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m);
}
function md5_ff(d, _, m, f, r, i, n) {
  return md5_cmn((_ & m) | (~_ & f), d, _, r, i, n);
}
function md5_gg(d, _, m, f, r, i, n) {
  return md5_cmn((_ & f) | (m & ~f), d, _, r, i, n);
}
function md5_hh(d, _, m, f, r, i, n) {
  return md5_cmn(_ ^ m ^ f, d, _, r, i, n);
}
function md5_ii(d, _, m, f, r, i, n) {
  return md5_cmn(m ^ (_ | ~f), d, _, r, i, n);
}
function safe_add(d, _) {
  var m = (65535 & d) + (65535 & _);
  return (((d >> 16) + (_ >> 16) + (m >> 16)) << 16) | (65535 & m);
}
function bit_rol(d, _) {
  return (d << _) | (d >>> (32 - _));
}

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

/**
 * The Client initialization method
 * @param {import("@adobe/target-cdn-experimentation-core/types/").ClientOptions} clientOptions
 * @returns {Promise<import("@adobe/target-cdn-experimentation-core/types/").ClientResponse>}
 */
async function Client(clientOptions) {
  Container().registerInstance(TOKENS.RNG, rng);
  Container().registerInstance(TOKENS.HTTP_CLIENT, httpRequestAdapterInstance);
  Container().registerInstance(TOKENS.LOGGER, logger);
  Container().registerInstance(TOKENS.MD5, md5);
  return BaseClient(clientOptions);
}

export { Client };
