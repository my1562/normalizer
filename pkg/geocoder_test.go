package my1562geocoder

import (
	"reflect"
	"testing"
)

func TestGetAddressById(t *testing.T) {
	type args struct {
		id uint32
	}
	tests := []struct {
		name string
		args args
		want *Address
	}{
		{
			"Existing address",
			args{181901},
			&Address{
				ID: 181901,
				Lat: 49.9604596373,
				Lng: 36.3265315275,
				Number: 4,
				Suffix: "",
				Block: "",
				StreetID: 4453,
				Detail: "",
				DetailNumber: 0,
				Postcode: 61082,
			},
		},
		{
			"Non-existing address",
			args{666666},
			nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := GetAddressByID(tt.args.id); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetAddressById() = %v, want %v", got, tt.want)
			}
		})
	}
}
