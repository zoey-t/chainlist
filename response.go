package main

import (
	"fmt"
	"net/http"
	"time"
)

func main() {
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
