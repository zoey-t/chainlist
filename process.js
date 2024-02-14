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

    // First get all the chainIds
    let arrayChainIds = [];

    for (var i = 0; i < filteredArray.length; i++) {
      arrayChainIds[i] = filteredArray[i].chainId;
    }

    // Loop through every chainId
    for (var i = 0; i < 2; i++) {
      //Filter the current chainId
      var chainInfo = filteredArray.filter(function (eth) {
        return eth["chainId"] == arrayChainIds[i];
      });

      // Create an array that will have the rpcs and response times
      let myArray = [];

      //Get the rpcs
      var rpcs = chainInfo[0].rpc;

      //Test the rpcs
      for (var k = 0; k < rpcs.length; k++) {
        var object = rpcs[k];
        for (var property in object) {
          if (property == "endpoint") {
            if (object[property].includes("wss://")) {
              myArray[k] = getResponseWss(arrayChainIds[i], object[property]);
            } else {
              myArray[k] = getResponseHttp(arrayChainIds[i], object[property]);
            }
          }
        }
      }

      Promise.all(myArray).then((values) => {
        var sort = values.sort(
          (a, b) => (b[2] != null) - (a[2] != null) || a[2] - b[2]
        );
        console.log(sort[0]);
        const filteredJsonString = JSON.stringify(sort[0], null, 2); // Beautify the JSON output

        fs.writeFile(outputPath, filteredJsonString, "utf8", (err) => {
          if (err) {
            console.error("Error writing the file:", err);
            return;
          }
          console.log("Filtered JSON has been written to", outputPath);
        });
      });
    }

    //console.log("Eth info:", rpcs[0].endpoint);
    //console.log("Eth info:", typeof rpcs[0].endpoint);

    // Convert the filtered array back to a JSON string
    // const filteredJsonString = JSON.stringify(filteredArray, null, 2); // Beautify the JSON output
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

async function getResponseWss(chainId, baseURL) {
  var result = await fetchWssChain(baseURL);

  if (result == null) {
    return [chainId, baseURL, result];
  } else {
    return [chainId, baseURL, result.latency];
  }
}

async function getResponseHttp(chainId, baseURL) {
  var result = await fetchChain(baseURL);

  if (result == null) {
    return [chainId, baseURL, result];
  } else {
    return [chainId, baseURL, result.latency];
  }
}

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
