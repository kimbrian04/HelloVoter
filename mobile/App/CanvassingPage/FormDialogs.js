import React, { Component } from 'react';
import { View } from 'react-native';
import { Text, H3, Button, Spinner } from 'native-base';

import { getEpoch } from '../common';

import { Dialog } from 'react-native-simple-dialogs';
import t from 'tcomb-form-native';
import _ from 'lodash';
import md5 from 'md5';

var Form = t.form.Form;

var formStreet = t.struct({
  'street': t.String,
});
var formCity = t.struct({
  'city': t.String,
});
var formState = t.struct({
  'state': t.String,
  'zip': t.String,
});
var unitForm = t.struct({
  'unit': t.String,
});

const formStyleRow = _.cloneDeep(t.form.Form.stylesheet);
formStyleRow.fieldset = {
  flexDirection: 'row'
};
formStyleRow.formGroup.normal.flex = 1;
formStyleRow.formGroup.error.flex = 1;

const formOptRow = {
  stylesheet: formStyleRow,
};

export class NewAddressDialog extends Component {

 constructor(props) {
   super(props);

   this.state = {
     refer: props.refer,
   }

   this.onChange = this.onChange.bind(this);
   //this.onUnitChange = this.onUnitChange.bind(this);
 }

  onChange(fAddress) {
    const { refer } = this.state;
    refer.setState({fAddress});
  }

  doConfirmAddress = async () => {
    const { refer } = this.state;
    const { myPosition, form, markers, UniqueID } = refer.state;
    let { fAddress } = refer.state;

    let jsonStreet = this.refs.formStreet.getValue();
    let jsonCity = this.refs.formCity.getValue();
    let jsonState = this.refs.formState.getValue();

    if (jsonStreet === null || jsonCity === null || jsonState === null) return;

    let epoch = getEpoch();

    fAddress.street = jsonStreet.street.trim();
    fAddress.city = jsonCity.city.trim();
    fAddress.state = jsonState.state.trim();
    fAddress.zip = jsonState.zip.trim();

    // search for dupes
    let marker;
    markers.forEach(m => {
      // change nulls to empty string
      ["street", "city", "state", "zip"].forEach(i => {if (!m.address[i]) m.address[i] = "";});

      if (m.address.street.toLowerCase() === fAddress.street.toLowerCase() &&
          m.address.city.toLowerCase() === fAddress.city.toLowerCase() &&
          m.address.state.toLowerCase() === fAddress.state.toLowerCase() &&
          m.address.zip.substring(0, 5) === fAddress.zip.substring(0, 5)) marker = m;
    });

    if (!marker) {
      marker = {
        people: [],
        units: [],
        address: {
          id: md5(fAddress.street.toLowerCase()+fAddress.city.toLowerCase()+fAddress.state.toLowerCase()+fAddress.zip.substring(0, 5)),
          longitude: fAddress.longitude,
          latitude: fAddress.latitude,
          street: fAddress.street,
          city: fAddress.city,
          state: fAddress.state,
          zip: fAddress.zip,
        },
      };

      let input = {
        deviceId: UniqueID,
        formId: form.id,
        timestamp: getEpoch(),
        longitude: fAddress.longitude,
        latitude: fAddress.latitude,
        street: marker.address.street,
        city: marker.address.city,
        state: marker.address.state,
        zip: marker.address.zip,
      };

      refer.sendData('/address/add/location', input);

      markers.push(marker);
    }

    refer.setState({ markers, fAddress, pAddress: fAddress, newAddressDialog: false });
    refer.doMarkerPress(marker);
  }

  render() {
    const { refer } = this.state;
    const { loading, newAddressDialog } = refer.state;

    return (
      <Dialog
      visible={newAddressDialog}
      animationType="fade"
      onTouchOutside={() => refer.setState({newAddressDialog: false})}>
        <View>
          {loading&&
          <View>
            <H3>Loading Address</H3>
            <Spinner />
          </View>
          ||
          <View>
            <Button block dark transparent>
              <H3>Confirm the Address</H3>
            </Button>
            <Form
             ref="formStreet"
             type={formStreet}
             onChange={this.onChange}
             value={refer.state.fAddress}
            />
            <Form
             ref="formCity"
             type={formCity}
             onChange={this.onChange}
             options={formOptRow}
             value={refer.state.fAddress}
            />
            <Form
             ref="formState"
             type={formState}
             onChange={this.onChange}
             options={formOptRow}
             value={refer.state.fAddress}
            />
            <Button block onPress={this.doConfirmAddress}>
              <Text>Add Address</Text>
            </Button>
          </View>
          }
        </View>
      </Dialog>
    );
  }
}

/*
  addUnit = async () => {
    let { form, myPosition, UniqueID } = this.state;

    let json = this.refs.unitForm.getValue();
    if (json == null) return;

    // search for dupes
    let dupe = false;
    this.state.currentMarker.units.forEach(u => {
      if (u.name.toLowerCase() === json.unit.toLowerCase()) dupe = true;
    });

    if (!dupe) {
      let input = {
        deviceId: UniqueID,
        formId: form.id,
        timestamp: getEpoch(),
        longitude: myPosition.longitude,
        latitude: myPosition.latitude,
        unit: json.unit,
        addressId: this.state.currentMarker.address.id,
      };

      this.sendData('/address/add/unit', input);
      this.state.currentMarker.units.push({name: json.unit, people: []});
    }

    this.setState({newUnitDialog: false, fUnit: {}});
  }

    onUnitChange(fUnit) {
      this.setState({fUnit});
    }

export const NewUnitDialog = (props) => (
  <Dialog
    visible={props.refer.state.newUnitDialog}
    animationType="fade"
    onTouchOutside={() => props.refer.setState({newUnitDialog: false})}>
    <View>
      <View style={{flex: 1, flexDirection: 'row', margin: 20, alignItems: 'center'}}>
        <Text>Recording a new unit for this address:</Text>
      </View>
      <Form
        ref="unitForm"
        type={unitForm}
        options={{fields: {unit: {autoFocus: true}}}}
        onChange={this.onUnitChange}
        value={this.state.fUnit}
      />
      <Button block onPress={this.addUnit}>
        <Text>Add Unit</Text>
      </Button>
    </View>
  </Dialog>
);

*/