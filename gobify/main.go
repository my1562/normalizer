package main

import (
	"bytes"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"reflect"
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
	fmt.Println(reflect.ValueOf(output).String())

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

func readJson(jsonFile string, value interface{}) error {
	jsonString, err := ioutil.ReadFile(jsonFile)
	if err != nil {
		return err
	}

	err = json.Unmarshal(jsonString, &value)
	if err != nil {
		return err
	}
	return nil
}

func main() {
	var err error
	gob.RegisterName("*GeocoderData", &GeocoderData{})
	const gobFile = "../gobs/geocoder-data.gob"

	data := GeocoderData{
		Addresses:   AddressMap{},
		StreetsAR:   StreetsARMap{},
		Streets1562: Streets1562Map{},
	}

	if err = readJson("../data/addresses.json", &data.Addresses); err != nil {
		panic(err)
	}
	if err = readJson("../data/streetsAR.json", &data.StreetsAR); err != nil {
		panic(err)
	}
	if err = readJson("../data/streets1562.json", &data.Streets1562); err != nil {
		panic(err)
	}

	type mappingJSON struct {
		M1562ToAr IDToIDMap `json:"1562ToAR"`
		ArTo1562  IDToIDMap `json:"arTo1562"`
	}
	mapping := mappingJSON{}
	if err = readJson("../data/mapping.json", &mapping); err != nil {
		panic(err)
	}
	data.MappingArTo1562 = mapping.ArTo1562
	data.Mapping1562ToAr = mapping.M1562ToAr

	//--------
	var result bytes.Buffer
	enc := gob.NewEncoder(&result)
	if err = enc.Encode(&data); err != nil {
		panic(err)
	}

	if err = ioutil.WriteFile(gobFile, result.Bytes(), 0644); err != nil {
		panic(err)
	}

	fmt.Printf("%d bytes written to %s\n", result.Len(), gobFile)

	// err = jsonToGobFile("../data/addresses.json", "../gobs/addresses.gob", &AddressMap{})
	// if err != nil {
	// 	panic(err)
	// }

	// err = jsonToGobFile("../data/geo-index.json", "../gobs/geoIndex.gob", &GeoIndexWithResolution{})
	// if err != nil {
	// 	panic(err)
	// }

	// type streetsARJson struct {
	// 	ByID StreetsARMap `json:"byId"`
	// }
	// err = jsonToGobFileTransform(
	// 	"../data/streetsAR.json",
	// 	"../gobs/streetsAR.gob",
	// 	&streetsARJson{},
	// 	func(value interface{}) interface{} {
	// 		return value.(*streetsARJson).ByID
	// 	},
	// )
	// if err != nil {
	// 	panic(err)
	// }

	// type streets1562Json struct {
	// 	ByID Streets1562Map `json:"byId"`
	// }
	// err = jsonToGobFileTransform(
	// 	"../data/streets1562.json",
	// 	"../gobs/streets1562.gob",
	// 	&streets1562Json{},
	// 	func(value interface{}) interface{} {
	// 		return value.(*streets1562Json).ByID
	// 	},
	// )
	// if err != nil {
	// 	panic(err)
	// }

	// type mappingJSON struct {
	// 	M1562ToAr IDToIDMap `json:"1562ToAR"`
	// 	ArTo1562  IDToIDMap `json:"arTo1562"`
	// }
	// err = jsonToGobFileTransform(
	// 	"../data/mapping.json",
	// 	"../gobs/mapping1562ToAR.gob",
	// 	&mappingJSON{},
	// 	func(value interface{}) interface{} {
	// 		return value.(*mappingJSON).M1562ToAr
	// 	},
	// )
	// if err != nil {
	// 	panic(err)
	// }
	// err = jsonToGobFileTransform(
	// 	"../data/mapping.json",
	// 	"../gobs/mappingArTo1562.gob",
	// 	&mappingJSON{},
	// 	func(value interface{}) interface{} {
	// 		return value.(*mappingJSON).ArTo1562
	// 	},
	// )
	// if err != nil {
	// 	panic(err)
	// }
}
