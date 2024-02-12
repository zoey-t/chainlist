package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type Chainlists struct {
	Chainlists []Chainlist
}

// User struct which contains a name
// a type and a list of social links
type Chainlist struct {
	Name    string `json:"name"`
	Chain   string `json:"chain"`
	ChainId string `json:"chainId"`
	Icon    string `json:"icon"`
	RPCS    []RPC  `json:"rpc"`
}

// Social struct which contains a
// list of links
type RPC struct {
	Url      string `json:"url"`
	Tracking string `json:"tracking"`
}

func main() {
	// Open our json file
	jsonFile, err := os.Open("original_rpcs.json")

	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Successfully Opened users.json")
	// defer the closing of our jsonFile so that we can parse it later on
	defer jsonFile.Close()

	byteValue, _ := io.ReadAll(jsonFile)

	var chainlist interface{}

	json.Unmarshal(byteValue, &chainlist)

	//fmt.Println(chainlist)

	url := "https://mainnet.infura.io/v3/a1e8edaa30d6402e8e19546ad7a3fa8c"

	startTime := time.Now()

	response, err := http.Get(url)
	if err != nil {
		fmt.Println("Error in HTTP request:", err)
		return
	}
	defer response.Body.Close()

	responseTime := time.Since(startTime).Milliseconds()
	fmt.Printf("Response from %s: %d ms\n", url, responseTime)
}
