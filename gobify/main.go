package main

import (
	"bytes"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"io/ioutil"
)

func jsonToGobFile(jsonFile string, gobFile string, data interface{}) error {
	return jsonToGobFileTransform(jsonFile,
		gobFile,
		data,
		func(value interface{}) interface{} {
			return value
		},
	)
}
func jsonToGobFileTransform(jsonFile string, gobFile string, data interface{}, transform func(value interface{}) interface{}) error {
	jsonString, err := ioutil.ReadFile(jsonFile)
	if err != nil {
		return err
	}

	err = json.Unmarshal(jsonString, &data)
	if err != nil {
		return err
	}

	output := transform(data)

	gob.Register(output)

	var result bytes.Buffer
	enc := gob.NewEncoder(&result)
	err = enc.Encode(&output)
	if err != nil {
		return err
	}

	err = ioutil.WriteFile(gobFile, result.Bytes(), 0644)
	if err != nil {
		return err
	}

	fmt.Printf("%d bytes written to %s\n", result.Len(), gobFile)
	return nil
}

func main() {
	var err error

	err = jsonToGobFile("../data/addresses.json", "../gobs/addresses.gob", &AddressMap{})
	if err != nil {
		panic(err)
	}

	err = jsonToGobFile("../data/geo-index.json", "../gobs/geoIndex.gob", &GeoIndexWithResolution{})
	if err != nil {
		panic(err)
	}

	type streetsARJson struct {
		ByID StreetsARMap `json:"byId"`
	}
	err = jsonToGobFileTransform(
		"../data/streetsAR.json",
		"../gobs/streetsAR.gob",
		&streetsARJson{},
		func(value interface{}) interface{} {
			return value.(*streetsARJson).ByID
		},
	)
	if err != nil {
		panic(err)
	}

	type streets1562Json struct {
		ByID Streets1562Map `json:"byId"`
	}
	err = jsonToGobFileTransform(
		"../data/streets1562.json",
		"../gobs/streets1562.gob",
		&streets1562Json{},
		func(value interface{}) interface{} {
			return value.(*streets1562Json).ByID
		},
	)
	if err != nil {
		panic(err)
	}

	type mappingJSON struct {
		M1562ToAr IDToIDMap `json:"1562ToAR"`
		ArTo1562  IDToIDMap `json:"arTo1562"`
	}
	err = jsonToGobFileTransform(
		"../data/mapping.json",
		"../gobs/mapping1562ToAR.gob",
		&mappingJSON{},
		func(value interface{}) interface{} {
			return value.(*mappingJSON).M1562ToAr
		},
	)
	if err != nil {
		panic(err)
	}
	err = jsonToGobFileTransform(
		"../data/mapping.json",
		"../gobs/mappingArTo1562.gob",
		&mappingJSON{},
		func(value interface{}) interface{} {
			return value.(*mappingJSON).ArTo1562
		},
	)
	if err != nil {
		panic(err)
	}
}
