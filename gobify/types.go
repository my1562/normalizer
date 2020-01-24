package main

type GeoIndex map[string][]uint32
type GeoIndexWithResolution struct {
	Resolution uint32   `json:"resolution"`
	Index      GeoIndex `json:"index"`
}

type Address struct {
	ID           uint32  `json:"id,omitempty"`
	Lat          float64 `json:"lat,omitempty"`
	Lng          float64 `json:"lng,omitempty"`
	Number       uint16  `json:"number,omitempty"`
	Suffix       string  `json:"suffix,omitempty"`
	Block        string  `json:"block,omitempty"`
	StreetID     uint32  `json:"streetID,omitempty"`
	Detail       string  `json:"detail,omitempty"`
	DetailNumber uint32  `json:"detailNumber,omitempty"` //TODO check
	Postcode     uint32  `json:"postcode,omitempty"`
}

type AddressMap map[uint32]*Address

type StreetAR struct {
	ID     uint32 `json:"id,omitempty"`
	NameUk string `json:"name_ukr,omitempty"`
	NameRu string `json:"name_ru,omitempty"`
	TypeUk string `json:"typeUKR,omitempty"`
	TypeRu string `json:"typeRU,omitempty"`
}

type StreetsARMap map[uint32]*StreetAR

type Street1562 struct {
	ID   uint32 `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}

type Streets1562Map map[uint32]*Street1562

type IDToIDMap map[uint32]uint32
