
package my1562geocoder

func GetAddressByID(id uint32) *Address {
	addr, ok := Addresses[id]
	if(ok) {
		return &addr
	}
	return nil
}