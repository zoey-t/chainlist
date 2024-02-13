const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "./original_rpcs.json"); // from chainlist https://github.com/DefiLlama/chainlist/blob/main/generate-json.js
const outputPath = path.join(__dirname, "../rpc.json");
const axios = require("axios");

fs.readFile(filePath, "utf-8", (err, data1) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }
  try {
    // Parse the JSON data
    const jsonArray = JSON.parse(data1);
    //console.log("JSON object:", jsonArray);
    // Filter the fields for each object
    const filteredArray = jsonArray.map(({ name, chain, rpc, chainId }) => ({
      chain,
      chainId,
      rpc: rpc.map((rpcItem) => ({
        endpoint: rpcItem.url,
        tracking: rpcItem.tracking,
      })),
    }));

    //Let's take the ETH chain for example
    var ethinfo = filteredArray.filter(function (eth) {
      return eth["chainId"] == 1;
    });

    //Get the rpcs
    var rpcs = ethinfo[0].rpc;

    //Test the rpcs
    for (var i = 0; i < rpcs.length; i++) {
      var object = rpcs[i];
      for (var property in object) {
        if (property == "endpoint") {
          if (object[property].includes("wss://")) {
            let response = fetchWssChain(object[property]);

            console.log("The response time of " + object[property]);

            response.then(function (result) {
              console.log(" is " + result);
            });
          } else {
            let response = fetchChain(object[property]);

            console.log("The response time of " + object[property]);

            response.then(function (result) {
              if (result == null) {
                console.log("is " + result);
              } else {
                console.log("is " + result.latency);
              }
            });
          }
        }
      }
    }

    console.log("Eth info:", rpcs[0].endpoint);
    console.log("Eth info:", typeof rpcs[0].endpoint);

    // Convert the filtered array back to a JSON string
    const filteredJsonString = JSON.stringify(filteredArray, null, 2); // Beautify the JSON output
    //console.log("Filtered Json:", filteredJsonString);

    // Write the filtered JSON to a new file
    /*
    fs.writeFile(outputPath, filteredJsonString, "utf8", (err) => {
      if (err) {
        console.error("Error writing the file:", err);
        return;
      }
      console.log("Filtered JSON has been written to", outputPath);
    }); */
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
});

const rpcBody = JSON.stringify({
  jsonrpc: "2.0",
  method: "eth_getBlockByNumber",
  params: ["latest", false],
  id: 1,
});

const fetchChain = async (baseURL) => {
  if (baseURL.includes("API_KEY")) return null;
  try {
    let API = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    API.interceptors.request.use(function (request) {
      request.requestStart = Date.now();
      return request;
    });

    API.interceptors.response.use(
      function (response) {
        response.latency = Date.now() - response.config.requestStart;
        return response;
      },
      function (error) {
        if (error.response) {
          error.response.latency = null;
        }

        return Promise.reject(error);
      }
    );

    let { data, latency } = await API.post("", rpcBody);

    return { ...data, latency };
  } catch (error) {
    return null;
  }
};

function createPromise() {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  promise.resolve = resolve;
  promise.reject = reject;

  return promise;
}

const fetchWssChain = async (baseURL) => {
  try {
    // small hack to wait until socket connection opens to show loading indicator on table row
    const queryFn = createPromise();

    const socket = new WebSocket(baseURL);
    let requestStart;

    socket.onopen = function () {
      socket.send(rpcBody);
      requestStart = Date.now();
    };

    socket.onmessage = function (event) {
      const data = JSON.parse(event.data);

      const latency = Date.now() - requestStart;
      queryFn.resolve({ ...data, latency });
    };

    socket.onerror = function (e) {
      queryFn.reject(e);
    };

    return await queryFn;
  } catch (error) {
    return null;
  }
};
